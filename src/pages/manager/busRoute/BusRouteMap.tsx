import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BusStop } from '../../../types';
import { useEffect, useRef } from 'react';
import { ENV } from '../../../utils/constants';

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

function ORSRoute({ stops }: { stops: BusStop[] }) {
  const map = useMap();
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const legendRef = useRef<L.Control | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (stops.length < 2) return;

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (routeGroupRef.current) {
      routeGroupRef.current.clearLayers();
      map.removeLayer(routeGroupRef.current);
    }

    if (legendRef.current) {
      map.removeControl(legendRef.current);
      legendRef.current = null;
    }

    const routeGroup = L.layerGroup().addTo(map);
    routeGroupRef.current = routeGroup;

    const sortedStops = [...stops].sort((a, b) => a.order - b.order);
    const coordinates = sortedStops
      .map((s) => {
        const [lng, lat] = s.location.split(',').map(Number);
        return isNaN(lng) || isNaN(lat) ? null : [lng, lat];
      })
      .filter(Boolean) as [number, number][];

    const segmentColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

    async function fetchRoute() {
      for (let i = 0; i < coordinates.length - 1; i++) {
        if (requestIdRef.current !== requestId) return;

        try {
          const res = await fetch(
            'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
            {
              method: 'POST',
              headers: {
                Authorization: ENV.OPEN_ROUTE_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                coordinates: [coordinates[i], coordinates[i + 1]],
              }),
            },
          );

          const data = await res.json();
          if (data?.features?.length) {
            L.geoJSON(data.features[0], {
              style: {
                color: segmentColors[i % segmentColors.length],
                weight: 5,
                opacity: 0.8,
              },
            }).addTo(routeGroup);
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (requestIdRef.current !== requestId) return;

      const Legend = L.Control.extend({
        onAdd() {
          const div = L.DomUtil.create('div');
          div.style.background = 'white';
          div.style.padding = '10px';
          div.style.borderRadius = '8px';

          div.innerHTML = sortedStops
            .slice(0, -1)
            .map((s, i) => {
              const color = segmentColors[i % segmentColors.length];
              return `
                <div style="display:flex;align-items:center">
                  <span style="width:20px;height:3px;background:${color};margin-right:6px"></span>
                  ${s.stop_name} → ${sortedStops[i + 1].stop_name}
                </div>
              `;
            })
            .join('');

          return div;
        },
      });

      const legend = new Legend({ position: 'bottomright' });
      legend.addTo(map);
      legendRef.current = legend;
    }

    fetchRoute();

    return () => {
      routeGroup.clearLayers();
      map.removeLayer(routeGroup);
    };
  }, [map, stops]);

  return null;
}

export default function RouteMap({ stops }: Props) {
  const positions: [number, number][] = stops
    .map((s) => {
      const [lng, lat] = s.location.split(',').map((v) => Number(v.trim()));
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

        {/* MARKERS */}
        {positions.map((pos, idx) => (
          <Marker key={idx} position={pos}>
            <Popup>
              <b>{stops[idx].stop_name}</b>
              <br />
              ETA: {stops[idx].estimated_arrival} min
            </Popup>
          </Marker>
        ))}

        {/* ORS ROUTE */}
        <ORSRoute stops={stops} />
      </MapContainer>
    </div>
  );
}
