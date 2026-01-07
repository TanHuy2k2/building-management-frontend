import { useState, Suspense } from 'react';
import RouteMap from './BusRouteMap';
import { BusRoute, ActiveStatus, BusStop, DayOfWeek } from '../../types';
import { WEEK_DAYS } from '../../utils/constants';

const MOCK_ROUTES: BusRoute[] = [
  {
    id: 'route-001',
    route_name: 'Terminal → City Center',
    route_code: 'BX01',
    description: 'Main route during peak hours',
    bus_id: ['bus-01', 'bus-02'],
    departure_time: new Date('2025-01-01T06:00:00'),
    estimated_duration: 45,
    status: ActiveStatus.ACTIVE,
    operating_dates: [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ],
    created_by: 'admin',
    stops: [
      {
        stop_id: 'stop-001',
        stop_name: 'Bus Terminal',
        order: 1,
        estimated_arrival: 0,
        location: '10.762622,106.660172',
      },
      {
        stop_id: 'stop-002',
        stop_name: 'Central Park',
        order: 2,
        estimated_arrival: 15,
        location: '10.770000,106.670000',
      },
      {
        stop_id: 'stop-003',
        stop_name: 'City Center',
        order: 3,
        estimated_arrival: 30,
        location: '10.776500,106.700000',
      },
    ],
  },
  {
    id: 'route-002',
    route_name: 'University → Industrial Zone',
    route_code: 'UNI05',
    departure_time: new Date(),
    estimated_duration: 60,
    status: ActiveStatus.ACTIVE,
    operating_dates: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
    created_by: 'admin',
    stops: [
      {
        stop_id: 'stop-101',
        stop_name: 'University Gate',
        order: 1,
        estimated_arrival: 0,
        location: '10.870000,106.800000',
      },
      {
        stop_id: 'stop-102',
        stop_name: 'Industrial Zone',
        order: 2,
        estimated_arrival: 60,
        location: '10.900000,106.820000',
      },
    ],
  },
];

const styles = {
  title: {
    fontWeight: 600,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  daysWrapper: {
    display: 'flex',
    gap: 4,
  },
  day: {
    width: 80,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  activeDay: {
    backgroundColor: '#2563eb', // blue-600
    color: '#ffffff',
    boxShadow: '0 4px 8px rgba(37, 99, 235, 0.35)',
  },
  inactiveDay: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
  },
};

export default function BusRouteManagement() {
  const [routes] = useState(MOCK_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(routes[0]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">🚌 Routes</h2>
          <button className="text-sm text-blue-600">+ Add</button>
        </div>

        <div className="space-y-1">
          {routes.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRoute(r)}
              className={`p-3 rounded cursor-pointer ${
                selectedRoute?.id === r.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{r.route_code}</div>
              <div className="text-sm opacity-80">{r.route_name}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        {!selectedRoute ? (
          <div className="text-gray-500 text-lg">Select a route to view details 🚍</div>
        ) : (
          <div className="max-w-6xl bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-semibold">
                  {selectedRoute.route_name}{' '}
                  <span className="text-gray-400 text-base">({selectedRoute.route_code})</span>
                </h1>
                {selectedRoute.description && (
                  <p className="text-gray-500 mt-1">{selectedRoute.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRoute.status === ActiveStatus.ACTIVE
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedRoute.status.toUpperCase()}
                </span>

                <button className="px-3 py-1 bg-blue-600 text-white rounded">✏️ Edit</button>
              </div>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-semibold text-lg">{selectedRoute.estimated_duration} min</div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="text-sm text-gray-500">Stops</div>
                <div className="font-semibold text-lg">
                  {selectedRoute.stops ? selectedRoute.stops.length : null}
                </div>
              </div>

              <section>
                <h3 style={styles.title}>📅 Operating days</h3>

                <div style={styles.daysWrapper}>
                  {WEEK_DAYS.map((day) => {
                    const active = selectedRoute.operating_dates
                      ?.map((d) => d.toLowerCase())
                      .includes(day.key);

                    return (
                      <div
                        key={day.key}
                        style={{
                          ...styles.day,
                          ...(active ? styles.activeDay : styles.inactiveDay),
                        }}
                      >
                        {day.label}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Stops + Map */}
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2">
                <h3 className="font-semibold mb-3">🛑 Stops</h3>
                <div className="space-y-2">
                  {(selectedRoute.stops ?? []).map((s: BusStop) => (
                    <div key={s.stop_id} className="p-3 border rounded hover:bg-gray-50">
                      <div className="font-medium">
                        {s.order}. {s.stop_name}
                      </div>
                      <div className="text-xs text-gray-500">ETA: {s.estimated_arrival} min</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-3">
                <h3 className="font-semibold mb-3">🗺 Route map</h3>
                <Suspense fallback={<div>Loading map...</div>}>
                  <RouteMap stops={selectedRoute.stops ?? []} />
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
