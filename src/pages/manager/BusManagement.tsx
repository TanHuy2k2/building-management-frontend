import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Bus, BusStatus, GetBusParams, OrderDirection, User } from '../../types';
import { BusFront, Search, CheckSquare, XCircle, UserCircle } from 'lucide-react';
import { getAllBusApi, getAllBusStatsApi } from '../../services/busService';
import toast from 'react-hot-toast';
import { getUserById } from '../../services/userService';
import { DEFAULT_ORDER_BY, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { getPaginationNumbers } from '../../utils/pagination';
import { formatDateVN } from '../../utils/time';
import { Button } from '../../components/ui/button';

export default function BusManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [driverMap, setDriverMap] = useState<Record<string, string>>({});
  const [drivers, setDrivers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
  });
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // ================= FETCH STATS + DRIVERS =================
  const fetchStats = async () => {
    try {
      const res = await getAllBusStatsApi();
      if (!res.success) return toast.error(res.message);

      setStats(res.data);

      const driverIds = res.data.drivers || [];
      const results = await Promise.allSettled(driverIds.map((id: string) => getUserById(id)));
      const validDrivers = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value.data);

      setDrivers(validDrivers);

      const map: Record<string, string> = {};
      validDrivers.forEach((d) => (map[d.id] = d.full_name));

      setDriverMap(map);
    } catch {
      toast.error('Cannot load bus statistics');
    }
  };

  // ================= FETCH LIST =================
  const fetchBuses = async (p: number = page) => {
    if (loading) return;
    setLoading(true);

    try {
      const params: GetBusParams = {
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.searchTerm ? { plate_number: filters.searchTerm } : {}),
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        order_by: DEFAULT_ORDER_BY,
        order: OrderDirection.DESCENDING,
      };

      const res = await getAllBusApi(params);
      if (!res.success) return toast.error(res.message);

      const buses = res.data?.buses ?? [];
      const pagination = res.data?.pagination;

      setBuses(buses);
      setTotalPage(pagination?.total_page ?? 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= EFFECTS =================
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchBuses(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchBuses();
  }, [page]);

  // ================= STATUS BADGE =================
  const getStatusBadge = (status: BusStatus) => {
    const config = {
      active: {
        label: 'Active',
        icon: CheckSquare,
        color: 'bg-green-100 text-green-700',
      },
      inactive: {
        label: 'Inactive',
        icon: XCircle,
        color: 'bg-red-100 text-red-700',
      },
      maintenance: {
        label: 'Maintenance',
        icon: XCircle,
        color: 'bg-yellow-100 text-yellow-700',
      },
    }[status];

    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-xs`} variant="outline">
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // ================= UI =================
  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Bus Management 🚍</h1>
        <p className="text-muted-foreground">Bus list overview</p>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by plate number..."
            value={filters.searchTerm}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value: BusStatus) => setFilters((prev) => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* LIST */}
      <div className="grid gap-4">
        {buses.map((bus) => (
          <Card key={bus.id} className="hover:shadow-lg transition">
            <CardContent className="flex justify-between p-6">
              {/* LEFT */}
              <div className="flex gap-4">
                <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BusFront className="size-6 text-indigo-600" />
                </div>

                <div className="space-y-1">
                  {/* LINE 1: plate + status */}
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{bus.plate_number}</CardTitle>
                    {getStatusBadge(bus.status)}
                  </div>

                  {/* LINE 2: type + model */}
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Type:</span> {bus.type_name} ·
                    <span className="font-medium ml-1">Model:</span> {bus.model}
                  </p>

                  {/* LINE 3: number + capacity + seats */}
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Bus No:</span> {bus.number}
                    <span className="font-medium ml-1">Capacity:</span> {bus.capacity}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="text-right flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                    <UserCircle className="size-4" />
                    Driver
                  </p>
                  <p className="font-semibold text-indigo-600">
                    {driverMap[bus.driver_id ?? ''] ?? 'Unassigned'}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {formatDateVN(bus.updated_at ?? bus.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-4 gap-2">
        {/* Prev */}
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>

        {/* Numbers */}
        <div className="flex gap-2">
          {getPaginationNumbers(page, totalPage).map((item, idx) => {
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
                onClick={() => setPage(Number(item))}
                style={{
                  backgroundColor: page === item ? 'black' : 'white',
                  color: page === item ? 'white' : 'black',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s',
                }}
                className={page === item ? '' : 'hover:bg-gray-100'}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          disabled={page === totalPage}
          onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
        >
          Next
        </Button>
      </div>

      {/* EMPTY */}
      {buses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No buses found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
