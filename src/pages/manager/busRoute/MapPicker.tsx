import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import { v4 as uuid } from 'uuid';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import { BusStop } from '../../../types';
import { calcEstimatedArrival } from '../../../utils/time';

type Props = {
  value?: BusStop[];
  onChange: (stops: BusStop[]) => void;
};

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SearchControl({ onPick }: { onPick: (lat: number, lng: number, name: string) => void }) {
  const map = useMap();

  useEffect(() => {
    const geocoder = (L.Control as any)
      .geocoder({
        defaultMarkGeocode: false,
      })
      .on('markgeocode', (e: any) => {
        const { lat, lng } = e.geocode.center;
        const name = e.geocode.name;

        map.setView([lat, lng], 17);
        onPick(lat, lng, name);
      })
      .addTo(map);

    return () => {
      map.removeControl(geocoder);
    };
  }, [map, onPick]);

  return null;
}

// ================= MAIN =================
export default function MapPicker({ value = [], onChange }: Props) {
  const [stops, setStops] = useState<BusStop[]>(value);

  useEffect(() => {
    setStops(value);
  }, [value]);

  const center: [number, number] = stops.length
    ? (stops[stops.length - 1].location.split(',').map(Number) as [number, number])
    : [10.776, 106.698];

  // ➕ Add stop
  const addStop = (lat: number, lng: number, name?: string) => {
    const nextRaw: BusStop[] = [
      ...stops,
      {
        stop_id: uuid(),
        stop_name: name?.split(',')[0] || `Stop ${stops.length + 1}`,
        building_id: null,
        order: stops.length + 1,
        estimated_arrival: 0,
        location: `${lat},${lng}`,
      },
    ];

    const next = calcEstimatedArrival(nextRaw);
    setStops(next);
    onChange(next);
  };

  // ❌ Remove stop
  const removeStop = (id: string) => {
    const filtered = stops
      .filter((s) => s.stop_id !== id)
      .map((s, idx) => ({
        ...s,
        order: idx + 1,
      }));

    const next = calcEstimatedArrival(filtered);
    setStops(next);
    onChange(next);
  };

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{
        height: '30rem',
        width: '50rem',
        borderRadius: '0.5rem',
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <SearchControl onPick={addStop} />
      <ClickHandler onPick={addStop} />

      {stops.map((s) => {
        const [lat, lng] = s.location.split(',').map(Number);

        return (
          <Marker key={s.stop_id} position={[lat, lng]}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 600 }}>
                  {s.order}. {s.stop_name}
                </div>

                <div style={{ fontSize: 12, color: '#555' }}>
                  ETA: {s.estimated_arrival} minutes
                </div>

                <div style={{ fontSize: 11, color: '#777' }}>
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </div>

                <button
                  style={{
                    marginTop: 8,
                    color: '#dc2626',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStop(s.stop_id);
                  }}
                >
                  ❌ Delete
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
