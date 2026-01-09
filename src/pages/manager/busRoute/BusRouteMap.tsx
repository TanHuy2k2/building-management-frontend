import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BusStop } from '../../../types';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (stops.length < 2) return;

    const sortedStops = [...stops].sort((a, b) => a.order - b.order);
    const coordinates = sortedStops
      .map((s) => {
        const [lng, lat] = s.location.split(',').map((v) => Number(v.trim()));
        // Validate coordinates
        if (isNaN(lng) || isNaN(lat)) {
          console.error('Invalid coordinates for stop:', s.stop_name, s.location);

          return null;
        }

        // ORS requires [longitude, latitude]
        return [lng, lat];
      })
      .filter((coord): coord is [number, number] => coord !== null); // Remove any null values

    if (coordinates.length < 2) {
      console.error('Not enough valid coordinates for routing');

      return;
    }

    const routeLayers: L.Layer[] = [];
    let legendControl: L.Control | null = null;
    const segmentColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

    async function fetchRoute() {
      for (let i = 0; i < coordinates.length - 1; i++) {
        const segmentCoords = [coordinates[i], coordinates[i + 1]];
        const color = segmentColors[i % segmentColors.length];

        try {
          const requestBody = {
            coordinates: segmentCoords,
            preference: 'recommended',
            units: 'km',
            language: 'en',
            geometry: true,
            instructions: false,
            radiuses: [1000, 1000],
          };

          const res = await fetch(
            'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
            {
              method: 'POST',
              headers: {
                Authorization: ENV.OPEN_ROUTE_KEY,
                'Content-Type': 'application/json; charset=utf-8',
                Accept:
                  'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
              },
              body: JSON.stringify(requestBody),
            },
          );

          const data = await res.json();
          if (!res.ok || data?.error || !data?.features?.length) {
            const lineCoordinates = (segmentCoords as [number, number][]).map(
              ([lng, lat]) => [lat, lng] as [number, number],
            );
            const polyline = L.polyline(lineCoordinates, {
              color: color,
              weight: 4,
              dashArray: '10, 10',
              opacity: 0.7,
            }).addTo(map);

            routeLayers.push(polyline);
          } else {
            const geometry = data.features[0].geometry;
            const geojson: GeoJSON.Feature = {
              type: 'Feature',
              geometry,
              properties: {},
            };
            const layer = L.geoJSON(geojson, {
              style: {
                color: color,
                weight: 5,
                opacity: 0.8,
              },
            }).addTo(map);

            routeLayers.push(layer);
          }
        } catch (error) {
          console.error(`Failed to fetch segment ${i + 1}:`, error);
        }
      }

      // Add legend
      const LegendControl = L.Control.extend({
        onAdd: function () {
          const div = L.DomUtil.create('div', 'route-legend');
          div.style.backgroundColor = 'white';
          div.style.padding = '10px';
          div.style.borderRadius = '8px';
          div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
          div.style.fontSize = '13px';
          div.style.lineHeight = '20px';

          let html = '<div style="font-weight: 600; margin-bottom: 8px;">Route Segments</div>';

          for (let i = 0; i < sortedStops.length - 1; i++) {
            const color = segmentColors[i % segmentColors.length];
            const fromStop = sortedStops[i].stop_name;
            const toStop = sortedStops[i + 1].stop_name;

            html += `
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 20px; height: 3px; background: ${color}; margin-right: 8px; border-radius: 2px;"></div>
                <span style="font-size: 12px;">${fromStop} → ${toStop}</span>
              </div>
            `;
          }

          div.innerHTML = html;
          return div;
        },
      });

      const legend = new LegendControl({ position: 'bottomright' });
      legend.addTo(map);
      legendControl = legend;
    }

    fetchRoute();

    return () => {
      // Clean up route layers
      routeLayers.forEach((layer) => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      // Clean up legend control
      if (legendControl) {
        map.removeControl(legendControl);
      }
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
