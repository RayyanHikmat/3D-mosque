"use client";

import { useEffect, useRef, useState } from "react";
import type * as CesiumNS from "cesium";
import { DEFAULT_OPTIONS, type Options } from "@/lib/options";
import { SENSORS, formatReading, initialReadings, nextValue } from "@/lib/sensors";
import OptionsPanel from "./OptionsPanel";
import SensorPanel from "./SensorPanel";
import StreetViewPanel from "./StreetViewPanel";

type CesiumModule = typeof CesiumNS;
type Status = "loading" | "ready" | "error";

const ION_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? "";
const ASSET_ID = Number(process.env.NEXT_PUBLIC_ION_ASSET_ID) || 3581036;
const START_HEADING_DEG = 154.38; // heading from the Google Maps view of the mosque

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as { statusCode?: number; message?: string };
    if (e.statusCode === 401) return "Cesium ion rejected the token (HTTP 401). Create a new token and update .env.local.";
    if (e.statusCode === 404) return "Asset not found (HTTP 404). Check NEXT_PUBLIC_ION_ASSET_ID and the token's asset access.";
    if (e.statusCode) return `The request failed (HTTP ${e.statusCode}). Check the token and the asset ID.`;
    if (e.message) return e.message;
  }
  return "Unknown error. Open the browser console for details.";
}

export default function TwinViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const viewerRef = useRef<CesiumNS.Viewer | null>(null);
  const tilesetRef = useRef<CesiumNS.Cesium3DTileset | null>(null);
  const baseLayerRef = useRef<CesiumNS.ImageryLayer | null>(null);
  const sensorEntitiesRef = useRef<CesiumNS.Entity[]>([]);
  const centerRef = useRef<CesiumNS.Cartesian3 | null>(null);
  const radiusRef = useRef(1);
  const headingRef = useRef(0); // radians
  const orbitStartedRef = useRef(false);

  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [readings, setReadings] = useState<number[]>(initialReadings);
  const readingsRef = useRef<number[]>(readings);
  const [clock, setClock] = useState("");

  // ---- Create the viewer and load the model (runs once) ----
  useEffect(() => {
    let cancelled = false;
    let viewer: CesiumNS.Viewer | undefined;

    const init = async () => {
      if (!ION_TOKEN) {
        setErrorMessage("No Cesium ion token found. Add NEXT_PUBLIC_CESIUM_ION_TOKEN to .env.local and restart the dev server.");
        setStatus("error");
        return;
      }

      try {
        // Must be set before Cesium loads so it can find its workers and assets
        (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
        const Cesium = await import("cesium");
        if (cancelled || !containerRef.current) return;

        Cesium.Ion.defaultAccessToken = ION_TOKEN;

        const v = new Cesium.Viewer(containerRef.current, {
          terrain: Cesium.Terrain.fromWorldTerrain(),
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
        });
        viewer = v;
        v.scene.globe.depthTestAgainstTerrain = true;

        // Dark control-room scene
        const scene = v.scene;
        scene.backgroundColor = Cesium.Color.fromCssColorString("#050a14");
        if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
        if (scene.skyBox) scene.skyBox.show = false;
        if (scene.sun) scene.sun.show = false;
        if (scene.moon) scene.moon.show = false;
        scene.globe.showGroundAtmosphere = false;
        scene.globe.baseColor = Cesium.Color.fromCssColorString("#06101f");
        const baseLayer = v.imageryLayers.get(0);
        baseLayer.contrast = 1.2;
        baseLayer.saturation = 0.25;
        baseLayerRef.current = baseLayer;

        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(ASSET_ID);
        if (cancelled) return;
        scene.primitives.add(tileset);
        await v.zoomTo(tileset);
        if (cancelled) return;

        const center = tileset.boundingSphere.center;
        const radius = tileset.boundingSphere.radius;
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const at = (e: number, n: number, u: number) =>
          Cesium.Matrix4.multiplyByPoint(
            enu,
            new Cesium.Cartesian3(e * radius, n * radius, u * radius),
            new Cesium.Cartesian3()
          );

        // Floating sensor tags
        const entities = SENSORS.map((sensor, i) =>
          v.entities.add({
            position: at(sensor.e, sensor.n, sensor.u),
            point: {
              pixelSize: new Cesium.CallbackProperty(() => 9 + 4 * Math.sin(Date.now() / 300), false),
              color: Cesium.Color.CYAN,
              outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
              outlineWidth: 1,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            label: {
              text: new Cesium.CallbackProperty(
                () => `${sensor.name}: ${formatReading(sensor, readingsRef.current[i] ?? sensor.start)}`,
                false
              ),
              font: "13px Segoe UI, Arial, sans-serif",
              fillColor: Cesium.Color.CYAN,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString("#050f1e").withAlpha(0.75),
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(14, -4),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            polyline: {
              positions: [at(sensor.e, sensor.n, sensor.u), at(sensor.e, sensor.n, sensor.u - 0.5)],
              width: 1.5,
              material: Cesium.Color.CYAN.withAlpha(0.6),
            },
          })
        );

        // Orbit loop: reads the latest options on every frame
        headingRef.current = Cesium.Math.toRadians(START_HEADING_DEG);
        v.clock.onTick.addEventListener(() => {
          const o = optionsRef.current;
          if (!o.orbit) return;
          headingRef.current += Cesium.Math.toRadians(o.speed * (o.reverse ? -1 : 1));
          v.camera.lookAt(
            center,
            new Cesium.HeadingPitchRange(
              headingRef.current,
              Cesium.Math.toRadians(o.angle),
              radius * o.distance
            )
          );
        });

        // Double-click pauses or resumes the orbit
        v.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        v.screenSpaceEventHandler.setInputAction(() => {
          setOptions((o) => ({ ...o, orbit: !o.orbit }));
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        cesiumRef.current = Cesium;
        viewerRef.current = v;
        tilesetRef.current = tileset;
        sensorEntitiesRef.current = entities;
        centerRef.current = center;
        radiusRef.current = radius;
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Digital twin failed to load:", error);
        setErrorMessage(describeError(error));
        setStatus("error");
      }
    };

    init();

    return () => {
      cancelled = true;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      tilesetRef.current = null;
      baseLayerRef.current = null;
      sensorEntitiesRef.current = [];
      cesiumRef.current = null;
      orbitStartedRef.current = false;
    };
  }, []);

  // ---- Model look: opacity and tint color (style) ----
  useEffect(() => {
    const Cesium = cesiumRef.current;
    const tileset = tilesetRef.current;
    if (status !== "ready" || !Cesium || !tileset) return;
    tileset.style = new Cesium.Cesium3DTileStyle({
      color: `color('${options.tintColor}', ${options.opacity / 100})`,
    });
  }, [status, options.opacity, options.tintColor]);

  // ---- Model look: tint strength and wireframe ----
  useEffect(() => {
    const Cesium = cesiumRef.current;
    const tileset = tilesetRef.current;
    if (status !== "ready" || !Cesium || !tileset) return;
    tileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.MIX;
    tileset.colorBlendAmount = options.tintStrength / 100;
    tileset.debugWireframe = options.wireframe;
  }, [status, options.tintStrength, options.wireframe]);

  // ---- Scene: base map, brightness, sensor tags ----
  useEffect(() => {
    const viewer = viewerRef.current;
    if (status !== "ready" || !viewer) return;
    viewer.scene.globe.show = options.basemap;
    if (baseLayerRef.current) baseLayerRef.current.brightness = options.mapBrightness / 100;
    sensorEntitiesRef.current.forEach((entity) => {
      entity.show = options.sensors;
    });
  }, [status, options.basemap, options.mapBrightness, options.sensors]);

  // ---- Orbit on/off: free the camera when paused, continue from its heading when resumed ----
  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (status !== "ready" || !Cesium || !viewer) return;
    if (options.orbit) {
      if (orbitStartedRef.current) headingRef.current = viewer.camera.heading;
      orbitStartedRef.current = true;
    } else {
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
  }, [status, options.orbit]);

  // ---- Distance and angle while paused (while orbiting, the loop applies them) ----
  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    const center = centerRef.current;
    if (status !== "ready" || !Cesium || !viewer || !center || optionsRef.current.orbit) return;
    headingRef.current = viewer.camera.heading;
    viewer.camera.lookAt(
      center,
      new Cesium.HeadingPitchRange(
        headingRef.current,
        Cesium.Math.toRadians(options.angle),
        radiusRef.current * options.distance
      )
    );
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }, [status, options.distance, options.angle]);

  // ---- Simulated sensor readings, once per second ----
  useEffect(() => {
    const tick = () => {
      const next = readingsRef.current.map((value, i) => nextValue(SENSORS[i], value));
      readingsRef.current = next;
      setReadings(next);
      setClock(new Date().toLocaleTimeString());
    };
    setClock(new Date().toLocaleTimeString());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="stage">
      <div ref={containerRef} className="viewer" />

      {status === "loading" && (
        <div className="overlay" role="status">
          Loading the 3D model…
        </div>
      )}
      {status === "error" && (
        <div className="overlay overlay-error" role="alert">
          <strong>The model could not load</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      <SensorPanel readings={readings} clock={clock} />
      {options.streetView && <StreetViewPanel onClose={() => setOptions((o) => ({ ...o, streetView: false }))} />}
      <OptionsPanel
        options={options}
        onChange={(patch) => setOptions((o) => ({ ...o, ...patch }))}
        onReset={() => setOptions(DEFAULT_OPTIONS)}
      />
    </div>
  );
}
