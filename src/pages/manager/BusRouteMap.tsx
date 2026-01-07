import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BusStop } from '../../types';
import { useEffect } from 'react';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  stops: BusStop[];
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: 420,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
};

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    map.fitBounds(positions, { padding: [40, 40] });
  }, [map, positions]);

  return null;
}

export default function RouteMap({ stops }: Props) {
  const positions: [number, number][] = stops
    .map((s) => {
      const [lat, lng] = s.location.split(',').map((v) => Number(v.trim()));
      if (isNaN(lat) || isNaN(lng)) return null;
      return [lat, lng];
    })
    .filter(Boolean) as [number, number][];

  if (!positions.length) {
    return <div style={{ padding: 16 }}>Invalid stop locations</div>;
  }

  return (
    <div style={styles.container}>
      <MapContainer center={positions[0]} zoom={13} scrollWheelZoom={false} style={styles.map}>
        <FitBounds positions={positions} />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {positions.map((pos, idx) => (
          <Marker key={idx} position={pos}>
            <Popup>
              <b>{stops[idx].stop_name}</b>
              <br />
              ETA: {stops[idx].estimated_arrival} min
            </Popup>
          </Marker>
        ))}

        <Polyline positions={positions} />
      </MapContainer>
    </div>
  );
}
