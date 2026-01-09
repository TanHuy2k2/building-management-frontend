import { useState, Suspense, useEffect } from 'react';
import RouteMap from './BusRouteMap';
import { BusRoute, ActiveStatus, BusStop } from '../../../types';
import { WEEK_DAYS } from '../../../utils/constants';
import toast from 'react-hot-toast';
import { getAllBusRouteApi } from '../../../services/busRouteService';
import { getBusByIdApi } from '../../../services/busService';
import CreateRouteDialog from './CreateBusRouteDialog';
import { Button } from '../../../components/ui/button';
import { Edit } from 'lucide-react';

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
    width: 30,
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
    backgroundColor: '#2563eb',
    color: '#ffffff',
    boxShadow: '0 4px 8px rgba(37, 99, 235, 0.35)',
  },
  inactiveDay: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
  },
};

export default function BusRouteManagement() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(routes[0]);
  const [busPlateNumbers, setBusPlateNumbers] = useState<Record<string, string>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchRoutes = async () => {
    try {
      const res = await getAllBusRouteApi();
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      setRoutes(res.data);

      // Collect all unique bus IDs
      const allBusIds = new Set<string>();
      res.data.forEach((route: BusRoute) => {
        if (route.bus_id && route.bus_id.length > 0) {
          route.bus_id.forEach((id: string) => allBusIds.add(id));
        }
      });

      // Fetch bus details once for all unique IDs
      const busDetailsMap: Record<string, string> = {};
      await Promise.all(
        Array.from(allBusIds).map(async (busId) => {
          try {
            const busRes = await getBusByIdApi(busId);
            if (!busRes.success) {
              toast.error(busRes.message);

              return;
            }

            busDetailsMap[busId] = busRes.data.plate_number;
          } catch (error: any) {
            toast.error(`Error fetching bus ${busId}:`, error);
          }
        }),
      );

      // Map plate numbers to routes
      const plateNumberMap: Record<string, string> = {};
      res.data.forEach((route: BusRoute) => {
        if (route.bus_id && !route.bus_id.length) {
          const plateNumbers = route.bus_id
            .map((id: string) => busDetailsMap[id])
            .filter(Boolean)
            .join(', ');
          plateNumberMap[route.id] = plateNumbers;
        }
      });

      setBusPlateNumbers(plateNumberMap);
    } catch (error) {
      toast.error('Cannot load bus statistics');
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">🚌 Routes</h2>
          <button className="text-sm text-blue-600" onClick={() => setIsCreateDialogOpen(true)}>
            + Add
          </button>
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

                <Button size="icon" variant="secondary" title="Edit Bus Route" className="w-9 h-9">
                  <Edit className="size-4" />
                </Button>
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

              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="text-sm text-gray-500">🚌 Assigned Buses</div>
                <div className="font-semibold text-lg">
                  {busPlateNumbers[selectedRoute.id] || 'No buses assigned'}
                </div>
              </div>
            </div>

            {/* Operating Days */}
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
        {/* Dialog */}
        <CreateRouteDialog
          open={isCreateDialogOpen}
          onOpenChange={() => setIsCreateDialogOpen(false)}
          onSuccess={() => {
            fetchRoutes();
          }}
        />
      </main>
    </div>
  );
}
