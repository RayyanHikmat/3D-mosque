import { SENSORS, formatReading } from "@/lib/sensors";

type Props = {
  readings: number[];
  clock: string;
};

export default function SensorPanel({ readings, clock }: Props) {
  return (
    <section className="panel panel-left" aria-label="Sensor readings">
      <p className="kicker">Digital twin</p>
      <h1 className="title">Abu Bakar Mosque</h1>
      <p className="status">
        <span className="dot" aria-hidden="true" />
        Simulated live data
        <time className="clock">{clock}</time>
      </p>
      <dl className="readings">
        {SENSORS.map((sensor, i) => (
          <div className="reading" key={sensor.id}>
            <dt>{sensor.name}</dt>
            <dd>{formatReading(sensor, readings[i] ?? sensor.start)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
