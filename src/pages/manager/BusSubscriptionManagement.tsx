import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { MapPin, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getAllBusSubscriptionApi } from '../../services/busSubscription';
import { getAllBusRouteApi } from '../../services/busRouteService';
import { getBusByIdApi } from '../../services/busService';
import {
  BusRoute,
  BusSubscription,
  BusSubscriptionStatus,
  GetBusSubscriptionParams,
} from '../../types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { getUserById } from '../../services/userService';
import { Button } from '../../components/ui/button';
import { getPaginationNumbers } from '../../utils/pagination';

/* ================= COMPONENT ================= */
export default function BusSubscriptionManagement() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [subscriptions, setSubscriptions] = useState<BusSubscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [busPlateNumbers, setBusPlateNumbers] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [subPage, setSubPage] = useState(1);
  const [subTotalPage, setSubTotalPage] = useState(1);

  /* ================= FETCH ROUTES ================= */
  const fetchRoutes = async () => {
    try {
      const res = await getAllBusRouteApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      const routesData: BusRoute[] = res.data;
      setRoutes(routesData);

      /* collect unique bus ids */
      const busIds = new Set<string>();
      routesData.forEach((r) => r.bus_id?.forEach((id) => busIds.add(id)));

      const plateMap: Record<string, string> = {};
      await Promise.all(
        Array.from(busIds).map(async (busId) => {
          const busRes = await getBusByIdApi(busId);
          if (busRes.success) {
            plateMap[busId] = busRes.data.plate_number;
          }
        }),
      );

      /* map route -> plates */
      const routePlateMap: Record<string, string> = {};
      routesData.forEach((r) => {
        routePlateMap[r.id] =
          r.bus_id
            ?.map((id) => plateMap[id])
            .filter(Boolean)
            .join(', ') ?? '';
      });

      setBusPlateNumbers(routePlateMap);
    } catch {
      toast.error('Cannot load routes');
    }
  };

  /* ================= FETCH SUBSCRIPTIONS BY ROUTE ================= */
  const fetchSubscriptionsByRoute = async (routeId: string, page = DEFAULT_PAGE) => {
    try {
      setLoadingSubs(true);

      const params: GetBusSubscriptionParams = {
        route_id: routeId,
        page,
        page_size: DEFAULT_PAGE_SIZE,
      };
      const res = await getAllBusSubscriptionApi(params);
      if (!res.success) return toast.error(res.message);

      const subs: BusSubscription[] = res.data.busSubscription ?? [];
      setSubscriptions(subs);
      setSubPage(res.data.pagination?.page ?? 1);
      setSubTotalPage(res.data.pagination?.total_page ?? 1);

      /* Fetch user names (only missing ones) */
      const missingUserIds = Array.from(new Set(subs.map((s) => s.user_id))).filter(
        (id) => !userNames[id],
      );

      await Promise.all(
        missingUserIds.map(async (userId) => {
          const userRes = await getUserById(userId);
          if (userRes.success) {
            setUserNames((prev) => ({
              ...prev,
              [userId]: userRes.data.full_name,
            }));
          }
        }),
      );
    } catch {
      toast.error('Cannot load subscriptions');
    } finally {
      setLoadingSubs(false);
    }
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    const route = routes[selectedIndex];
    if (route) {
      setSubPage(DEFAULT_PAGE);
      fetchSubscriptionsByRoute(route.id, DEFAULT_PAGE);
    }
  }, [routes, selectedIndex]);

  /* ================= DERIVED ================= */
  const confirmedSubs = subscriptions.filter((s) => s.status === BusSubscriptionStatus.RESERVED);
  const currentRoute = routes[selectedIndex];
  if (!currentRoute) {
    return <p className="text-muted-foreground">No routes available</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Bus Subscription Management</h1>
        <p className="text-muted-foreground">Manage subscriptions by route</p>
      </div>

      {/* Route Switch */}
      <div className="flex items-center justify-between">
        <button
          disabled={selectedIndex === 0}
          onClick={() => setSelectedIndex((i) => i - 1)}
          className="p-2 border rounded disabled:opacity-50"
        >
          <ChevronLeft />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold">{currentRoute.route_name}</h2>
          <p className="text-sm text-muted-foreground">
            Bus: {busPlateNumbers[currentRoute.id] || '—'}
          </p>
        </div>

        <button
          disabled={selectedIndex === routes.length - 1}
          onClick={() => setSelectedIndex((i) => i + 1)}
          className="p-2 border rounded disabled:opacity-50"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Route Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Route details</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stops */}
          <div className="space-y-2">
            {currentRoute.stops?.map((stop) => (
              <div key={stop.stop_id} className="flex gap-2">
                <MapPin className="size-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {stop.order}. {stop.stop_name}
                  </p>
                  <p className="text-xs text-muted-foreground">ETA {stop.estimated_arrival} min</p>
                </div>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span className="text-sm">{currentRoute.estimated_duration} minutes</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="size-4" />
              <span className="text-sm">{confirmedSubs.length} active subscriptions</span>
            </div>

            <Progress value={Math.min(confirmedSubs.length * 10, 100)} />
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Subscriptions</h2>

        <Card>
          <CardContent className="p-0">
            {loadingSubs ? (
              <p className="p-4 text-center text-muted-foreground">Loading...</p>
            ) : subscriptions.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground">No have subscriptions</p>
            ) : (
              <>
                <div className="divide-y">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">User: {userNames[sub.user_id] ?? sub.user_id}</p>
                        <p className="text-sm text-muted-foreground">Seat {sub.seat_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.start_time).toLocaleDateString()} →{' '}
                          {new Date(sub.end_time).toLocaleDateString()}
                        </p>
                      </div>

                      <Badge
                        className={
                          sub.status === BusSubscriptionStatus.RESERVED
                            ? 'bg-green-100 text-green-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* PAGINATION */}
                <div className="flex justify-center mt-4 gap-2">
                  {/* Prev */}
                  <Button
                    variant="outline"
                    disabled={subPage === 1}
                    onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>

                  {/* Numbers */}
                  <div className="flex gap-2">
                    {getPaginationNumbers(subPage, subTotalPage).map((item, idx) => {
                      if (item === '...') {
                        return (
                          <div key={idx} className="px-3 py-1 border rounded-lg text-gray-500">
                            ...
                          </div>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => setSubPage(Number(item))}
                          style={{
                            backgroundColor: subPage === item ? 'black' : 'white',
                            color: subPage === item ? 'white' : 'black',
                            padding: '0.25rem 0.75rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s',
                          }}
                          className={subPage === item ? '' : 'hover:bg-gray-100'}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next */}
                  <Button
                    variant="outline"
                    disabled={subPage === subTotalPage}
                    onClick={() => setSubPage((p) => Math.min(subTotalPage, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
