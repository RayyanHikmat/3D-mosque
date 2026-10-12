"use client";

import { useId, useState } from "react";
import type { Options } from "@/lib/options";

type Props = {
  options: Options;
  onChange: (patch: Partial<Options>) => void;
  onReset: () => void;
};

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
};

function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{format(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const percent = (v: number) => `${Math.round(v)}%`;

export default function OptionsPanel({ options, onChange, onReset }: Props) {
  const [open, setOpen] = useState(true);
  const colorId = useId();

  return (
    <section className="panel panel-right" aria-label="Display options">
      <div className="panel-bar">
        <h2 className="panel-title">Options</h2>
        <button type="button" className="btn btn-quiet" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          <fieldset>
            <legend>Model</legend>
            <Slider
              label="Opacity"
              value={options.opacity}
              min={0}
              max={100}
              step={1}
              format={percent}
              onChange={(opacity) => onChange({ opacity })}
            />
            <Slider
              label="Tint strength"
              value={options.tintStrength}
              min={0}
              max={100}
              step={1}
              format={percent}
              onChange={(tintStrength) => onChange({ tintStrength })}
            />
            <div className="field field-inline">
              <label htmlFor={colorId}>Tint color</label>
              <input
                id={colorId}
                type="color"
                value={options.tintColor}
                onChange={(e) => onChange({ tintColor: e.target.value })}
              />
            </div>
            <Toggle label="Wireframe" checked={options.wireframe} onChange={(wireframe) => onChange({ wireframe })} />
          </fieldset>

          <fieldset>
            <legend>Camera</legend>
            <Toggle label="Auto orbit" checked={options.orbit} onChange={(orbit) => onChange({ orbit })} />
            <Toggle label="Reverse direction" checked={options.reverse} onChange={(reverse) => onChange({ reverse })} />
            <Slider
              label="Orbit speed"
              value={options.speed}
              min={0}
              max={2}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(speed) => onChange({ speed })}
            />
            <Slider
              label="Distance"
              value={options.distance}
              min={0.5}
              max={6}
              step={0.1}
              format={(v) => `${v.toFixed(1)}x`}
              onChange={(distance) => onChange({ distance })}
            />
            <Slider
              label="Angle"
              value={options.angle}
              min={-90}
              max={-5}
              step={1}
              format={(v) => `${Math.abs(v)}°`}
              onChange={(angle) => onChange({ angle })}
            />
          </fieldset>

          <fieldset>
            <legend>Scene</legend>
            <Toggle label="Sensor tags" checked={options.sensors} onChange={(sensors) => onChange({ sensors })} />
            <Toggle label="Base map and terrain" checked={options.basemap} onChange={(basemap) => onChange({ basemap })} />
            <Toggle label="Street view window" checked={options.streetView} onChange={(streetView) => onChange({ streetView })} />
            <Slider
              label="Map brightness"
              value={options.mapBrightness}
              min={0}
              max={200}
              step={1}
              format={percent}
              onChange={(mapBrightness) => onChange({ mapBrightness })}
            />
          </fieldset>

          <button type="button" className="btn btn-block" onClick={onReset}>
            Reset all options
          </button>
          <p className="hint">Double-click the scene to pause or resume the orbit.</p>
        </>
      )}
    </section>
  );
}
