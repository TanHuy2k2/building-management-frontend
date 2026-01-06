import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Bus,
  BusForm,
  BusSeat,
  BusSeatStatus,
  BusStatus,
  GetBusParams,
  OrderDirection,
  User,
  UserRole,
} from '../../types';
import {
  BusFront,
  Search,
  CheckSquare,
  XCircle,
  UserCircle,
  Plus,
  Wrench,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  createBusApi,
  getAllBusApi,
  getAllBusStatsApi,
  getBusByIdApi,
  updateBusApi,
  updateBusStatusApi,
} from '../../services/busService';
import toast from 'react-hot-toast';
import { getUserById, getUsers } from '../../services/userService';
import { DEFAULT_ORDER_BY, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { getPaginationNumbers } from '../../utils/pagination';
import { formatDateVN } from '../../utils/time';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { getChangedFields, removeEmptyFields } from '../../utils/updateFields';

export default function BusManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [driverMap, setDriverMap] = useState<Record<string, string>>({});
  const [drivers, setDrivers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
  });
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [originalForm, setOriginalForm] = useState<BusForm | null>(null);
  const emptyBusForm: BusForm = {
    type_name: '',
    number: 0,
    plate_number: '',
    capacity: 0,
    model: '',
    description: '',
    driver_id: undefined,
    features: [],
  };
  const [form, setForm] = useState<BusForm>(emptyBusForm);
  const [openSeat, setOpenSeat] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const STATUS_CONFIG = {
    active: {
      label: 'Active',
      icon: CheckSquare,
      color: 'bg-green-100 text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-300',
    },
    inactive: {
      label: 'Inactive',
      icon: XCircle,
      color: 'bg-red-100 text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-300',
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      color: 'bg-yellow-100 text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
    },
  };

  // ================= FETCH STATS + DRIVERS =================
  const fetchStats = async () => {
    try {
      const res = await getAllBusStatsApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setStats(res.data);

      const userResponse = await getUsers({ role: UserRole.MANAGER });
      if (!userResponse.success) {
        toast.error(userResponse.message);

        return;
      }

      const drivers = userResponse.data.users;
      setDrivers(drivers);

      const map: Record<string, string> = {};
      drivers.forEach((d: any) => {
        map[d.id] = d.full_name;
      });

      setDriverMap(map);
    } catch (error) {
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
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
      <Badge
        variant="outline"
        className={`${config.color} text-xs px-2 py-0.5 flex items-center gap-1`}
      >
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  const updateBusStatus = async (busId: string, status: BusStatus) => {
    try {
      setUpdatingId(busId);

      const res = await updateBusStatusApi(busId, status);
      if (!res.success) return toast.error(res.message);

      toast.success('Status updated');

      fetchStats();
      fetchBuses();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openCreate = () => {
    setMode('create');
    setForm(emptyBusForm);
    setUpdatingId(null);
    setFeaturesText('');
    setOpen(true);
  };

  const openEdit = (bus: Bus) => {
    setMode('edit');
    setUpdatingId(bus.id);
    setForm({
      type_name: bus.type_name,
      number: bus.number,
      plate_number: bus.plate_number,
      capacity: bus.capacity,
      model: bus.model,
      description: bus.description,
      driver_id: bus.driver_id,
      features: bus.features ?? [],
    });
    setFeaturesText((bus.features ?? []).join(', '));
    setOpen(true);
  };

  const createBus = async (data: BusForm) => {
    const res = await createBusApi(data);
    if (!res.success) {
      toast.error(res.message);

      return;
    }

    await fetchStats();
    await fetchBuses(DEFAULT_PAGE);

    toast.success('Add building successfully');
    setOpen(false);
  };

  const updateBus = async (id: string, form: BusForm) => {
    if (!originalForm) return;

    const payload = removeEmptyFields(getChangedFields(originalForm, form));
    if (Object.keys(payload).length === 0) {
      toast.success('No changes detected');
      return;
    }

    const res = await updateBusApi(id, payload);
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const busId = res.data.id;
    const detailRes = await getBusByIdApi(busId);
    if (!detailRes.success) {
      toast.error('Updated but failed to load bus info');
      return;
    }

    const updatedBus = detailRes.data as Bus;
    setBuses((prev) => {
      if (!prev) return [updatedBus];

      return prev.map((b) => (b.id === updatedBus.id ? updatedBus : b));
    });

    if (updatedBus.driver_id) {
      const driver = await getUserById(updatedBus.driver_id);
      if (driver.success) {
        setDriverMap((prev) => ({
          ...prev,
          [updatedBus.driver_id as string]: driver.data.full_name,
        }));
      }
    }

    toast.success('Update bus successfully');
    setOpen(false);
  };

  // ================= SEATS =================
  const SeatItem = ({ seat }: { seat: BusSeat }) => {
    if (!seat) {
      return <div style={{ width: 36, height: 36 }} />;
    }

    const style =
      seat.status === BusSeatStatus.AVAILABLE
        ? { backgroundColor: '#22c55e', color: '#fff' }
        : { backgroundColor: '#ef4444', color: '#fff' };

    return (
      <div
        style={{
          ...style,
          width: 36,
          height: 36,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
        }}
        title={`Seat ${seat.seat_number} - ${seat.status}`}
      >
        {seat.seat_number}
      </div>
    );
  };

  const SeatLegend = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontSize: 14,
        marginTop: 24,
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: '#22c55e', // green-500
            display: 'inline-block',
          }}
        />
        <span>Available</span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: '#ef4444', // red-500
            display: 'inline-block',
          }}
        />
        <span>Reserved</span>
      </div>
    </div>
  );

  const SeatGrid = ({ seats, capacity }: { seats: BusSeat[]; capacity: number }) => {
    const gridCols = capacity < 9 ? 'grid-cols-2' : 'grid-cols-3';

    return (
      <div className={`grid ${gridCols} gap-2 mt-3`}>
        {seats.map((seat) => (seat ? <SeatItem key={seat.seat_number} seat={seat} /> : null))}
      </div>
    );
  };

  const BusSeatLayout = ({ seats, capacity }: { seats: BusSeat[]; capacity: number }) => (
    <div className="border rounded-xl p-4 bg-background">
      <div className="text-xs font-medium mb-2 flex items-center gap-2">🧑 Driver</div>

      <SeatGrid seats={seats} capacity={capacity} />
    </div>
  );

  // ================= UI =================
  return (
    <div className="space-y-6 p-6">
      {/* ================= DIALOG CREATE/UPDATE ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Add New Bus' : 'Edit Bus'}</DialogTitle>
          </DialogHeader>
          <DialogDescription>Enter the detailed information for the bus</DialogDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Plate */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Plate Number</label>
                <Input
                  placeholder="e.g. 51A-12345"
                  value={form.plate_number}
                  disabled={mode === 'edit'}
                  onChange={(e) => setForm((p) => ({ ...p, plate_number: e.target.value }))}
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Bus Type</label>
                <Input
                  placeholder="Mini Bus / Coach Bus"
                  value={form.type_name}
                  onChange={(e) => setForm((p) => ({ ...p, type_name: e.target.value }))}
                />
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Model</label>
                <Input
                  placeholder="Ford Transit, Hyundai County..."
                  value={form.model}
                  onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                />
              </div>

              {/* Number + Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Bus Number</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.number}
                    onChange={(e) => setForm((p) => ({ ...p, number: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {/* Driver */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Driver</label>
                <Select
                  value={form.driver_id}
                  onValueChange={(v: string) => setForm((p) => ({ ...p, driver_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  rows={5}
                  placeholder="Optional notes about this bus"
                  value={form.description ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Features */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Features</label>
                <Textarea
                  rows={4}
                  placeholder="AC, GPS, Camera, WiFi"
                  value={featuresText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFeaturesText(value);

                    setForm((p) => ({
                      ...p,
                      features: value
                        .split(',')
                        .map((f) => f.trim())
                        .filter(Boolean),
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">Separate by comma (,)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={() => (mode === 'create' ? createBus(form) : updateBus(updatingId!, form))}
            >
              {mode === 'create' ? 'Create Bus' : 'Update Bus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DIALOG SEAT ================= */}
      <Dialog open={openSeat} onOpenChange={setOpenSeat}>
        <DialogContent className="w-[420px] max-w-full">
          <DialogHeader>
            <DialogTitle>Bus {selectedBus?.plate_number}</DialogTitle>
            <DialogDescription>Seat layout & availability</DialogDescription>
          </DialogHeader>

          {selectedBus?.seats?.length ? (
            <>
              <div className="flex gap-6 items-center">
                <BusSeatLayout seats={selectedBus.seats} capacity={selectedBus.capacity} />
                <SeatLegend />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No seat data available</p>
          )}
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold">Bus Management 🚍</h1>
          <p className="text-muted-foreground">Bus list overview</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-green-600  hover:bg-green-700"
            onClick={() => {
              setMode('create');
              setOpen(true);
              openCreate();
            }}
          >
            <Plus className="size-4 mr-2" /> Add New Bus
          </Button>

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
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      </div>
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>
      {/* LIST */}
      <div className="grid gap-4">
        {buses.map((bus) => (
          <Card
            key={bus.id}
            className="hover:shadow-lg transition"
            onClick={() => {
              setSelectedBus(bus);
              setOpenSeat(true);
            }}
          >
            <CardContent className="flex justify-between p-6">
              {/* LEFT */}
              <div className="flex gap-5">
                <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BusFront className="size-6 text-indigo-600" />
                </div>

                <div className="space-y-2">
                  {/* LINE 1: plate + status */}
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{bus.plate_number}</CardTitle>
                    {getStatusBadge(bus.status)}
                  </div>

                  {/* LINE 2: type + model */}
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Type:</span> {bus.type_name} -
                    <span className="font-medium ml-1">Model:</span> {bus.model}
                  </p>

                  {/* LINE 3: number + capacity + seats */}
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Bus No:</span> {bus.number} -
                    <span className="font-medium ml-1">Capacity:</span> {bus.capacity}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-stretch justify-end w-[360px] shrink-0 gap-4">
                {/* Driver info */}
                <div className="flex flex-col items-end text-right justify-center pr-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserCircle className="size-4" />
                    Driver
                  </p>

                  <p className="font-semibold text-indigo-600 leading-tight">
                    {driverMap[bus.driver_id ?? ''] ?? 'Unassigned'}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {bus.updated_at
                      ? `Updated: ${formatDateVN(bus.updated_at)}`
                      : `Created: ${formatDateVN(bus.created_at)}`}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  {/* Status */}
                  <Select
                    value={bus.status}
                    disabled={updatingId === bus.id}
                    onValueChange={(value: BusStatus) => {
                      if (bus.status === value) return;

                      const ok = window.confirm(
                        `Are you sure to change status ${bus.plate_number}: ${bus.status} → ${value}`,
                      );
                      if (!ok) return;

                      updateBusStatus(bus.id, value);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[130px] px-2">
                      {getStatusBadge(bus.status)}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        className="flex items-center justify-center gap-1 text-green-600"
                        value="active"
                      >
                        Active
                      </SelectItem>
                      <SelectItem
                        className="flex items-center justify-center gap-1 text-red-600"
                        value="inactive"
                      >
                        Inactive
                      </SelectItem>
                      <SelectItem
                        className="flex items-center justify-center gap-1 text-yellow-600"
                        value="maintenance"
                      >
                        Maintenance
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      title="Edit Bus"
                      className="w-9 h-9"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        openEdit(bus);
                        setOriginalForm(bus);
                      }}
                    >
                      <Edit className="size-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="destructive"
                      title="Delete Bus"
                      className="w-9 h-9"
                      onClick={(e: any) => {
                        e.stopPropagation();
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
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
