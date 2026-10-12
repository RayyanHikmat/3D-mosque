import { MOSQUE } from "@/lib/location";

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "";

// Opens Street View at the mosque in a new tab (needs no API key)
const OPEN_URL = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${MOSQUE.lat},${MOSQUE.lon}`;

type Props = {
  onClose: () => void;
};

export default function StreetViewPanel({ onClose }: Props) {
  const embedUrl = KEY
    ? `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(KEY)}&location=${MOSQUE.lat},${MOSQUE.lon}&heading=0&pitch=0&fov=90`
    : "";

  return (
    <section className="panel panel-street" aria-label="Street view">
      <div className="panel-bar">
        <h2 className="panel-title">Street view</h2>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Close
        </button>
      </div>

      {embedUrl ? (
        <iframe
          className="street-frame"
          title="Street view of Abu Bakar Mosque"
          src={embedUrl}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <p className="hint">
          Add NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY to .env.local to show Street View inside the app.
        </p>
      )}

      <a className="street-link" href={OPEN_URL} target="_blank" rel="noopener noreferrer">
        Open in Google Maps
      </a>
    </section>
  );
}
