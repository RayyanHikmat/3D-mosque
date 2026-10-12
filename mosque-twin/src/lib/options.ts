export type Options = {
  /** Model opacity, 0 (invisible) to 100 (solid) */
  opacity: number;
  /** How much of the tint color is mixed into the photo textures, 0 to 100 */
  tintStrength: number;
  tintColor: string;
  wireframe: boolean;
  orbit: boolean;
  reverse: boolean;
  /** Orbit speed in degrees per frame */
  speed: number;
  /** Camera distance as a multiple of the model radius */
  distance: number;
  /** Camera pitch in degrees: -90 looks straight down, -5 is nearly level */
  angle: number;
  sensors: boolean;
  basemap: boolean;
  streetView: boolean;
  /** Ground imagery brightness in percent */
  mapBrightness: number;
};

export const DEFAULT_OPTIONS: Options = {
  opacity: 100,
  tintStrength: 35,
  tintColor: "#7fdcff",
  wireframe: false,
  orbit: true,
  reverse: false,
  speed: 0.3,
  distance: 2.5,
  angle: -35,
  sensors: true,
  basemap: true,
  streetView: false,
  mapBrightness: 45,
};
