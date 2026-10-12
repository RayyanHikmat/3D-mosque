// Demo sensors with simulated readings.
// To use real data, replace `nextValue` with values fetched from your own API
// (for example a Next.js route handler that reads your IoT platform).

export type Sensor = {
  id: string;
  name: string;
  unit: string;
  /** Tag position as a fraction of the model radius: east, north, up from its center */
  e: number;
  n: number;
  u: number;
  start: number;
  min: number;
  max: number;
  /** Largest random change per second */
  step: number;
  digits: number;
};

export const SENSORS: Sensor[] = [
  { id: "temp", name: "Temperature", unit: "°C", e: -0.3, n: 0.25, u: 0.4, start: 27, min: 22, max: 34, step: 0.6, digits: 1 },
  { id: "humidity", name: "Humidity", unit: "%", e: 0.35, n: 0.1, u: 0.35, start: 45, min: 30, max: 65, step: 1.5, digits: 0 },
  { id: "occupancy", name: "Occupancy", unit: "people", e: 0, n: -0.3, u: 0.3, start: 60, min: 0, max: 250, step: 12, digits: 0 },
  { id: "power", name: "Power", unit: "kW", e: 0.2, n: 0.35, u: 0.45, start: 12, min: 6, max: 20, step: 0.8, digits: 1 },
];

export const initialReadings = (): number[] => SENSORS.map((s) => s.start);

export const nextValue = (sensor: Sensor, current: number): number => {
  const moved = current + (Math.random() - 0.5) * sensor.step;
  return Math.min(sensor.max, Math.max(sensor.min, moved));
};

export const formatReading = (sensor: Sensor, value: number): string =>
  `${value.toFixed(sensor.digits)} ${sensor.unit}`;
