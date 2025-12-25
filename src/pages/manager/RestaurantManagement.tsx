import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Building,
  BuildingStatus,
  GetRestaurantsParams,
  OrderDirection,
  Restaurant,
  RestaurantForm,
  RestaurantStatus,
} from '../../types';
import {
  Utensils,
  Search,
  Wrench,
  CheckSquare,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Home,
  ChevronDown,
} from 'lucide-react';
import { getBuildingByIdApi } from '../../services/buildingService';
import {
  getAllRestaurantsApi,
  getRestaurantByIdApi,
  createRestaurantApi,
  updateRestaurantApi,
  updateRestaurantStatusApi,
  getAllRestaurantsStatsApi,
} from '../../services/restaurantService';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { getChangedFields, removeEmptyFields } from '../../utils/updateFields';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Command, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { Check } from 'lucide-react';
import {
  DEFAULT_ORDER_BY,
  DEFAULT_PAGE,
  DEFAULT_PAGE_TOTAL,
  DEFAULT_PAGE_SIZE,
} from '../../utils/constants';
import { getPaginationNumbers } from '../../utils/pagination';

export default function RestaurantManagement() {
  const [buildings, setBuildings] = useState<Building[]>();
  const [buildingMap, setBuildingMap] = useState<Record<string, string>>({});
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantStats, setRestaurantStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [originalForm, setOriginalForm] = useState<RestaurantForm | null>(null);
  const [form, setForm] = useState<RestaurantForm>({
    id: '',
    building_id: '',
    floor: 1,
    name: '',
    description: '',
    operating_hours: {
      open: '',
      close: '',
      days: [],
    },
    contact: {
      phone: '',
      email: '',
      facebook: '',
      zalo: '',
    },
  });
  const [filters, setFilters] = useState({ status: 'all', building_id: '', searchTerm: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);
  const [order, setOrder] = useState<OrderDirection>(OrderDirection.DESCENDING);
  const selectedBuildingName = filters.building_id
    ? buildings?.find((b) => b.id === filters.building_id)?.name
    : 'All buildings';

  const fetchData = async () => {
    const restaurantStatRes = await getAllRestaurantsStatsApi();
    if (!restaurantStatRes.success) {
      toast.error(restaurantStatRes.message);
      return;
    }

    setRestaurantStats(restaurantStatRes.data);

    const buildingIds = restaurantStatRes.data.building_ids;
    if (!buildingIds?.length) return;

    const buildingResults = await Promise.all(
      buildingIds.map((id: string) => getBuildingByIdApi(id)),
    );

    const { buildings, map } = buildingResults.reduce<{
      buildings: Building[];
      map: Record<string, string>;
    }>(
      (acc, res) => {
        if (res?.success && res.data) {
          const b = res.data;
          acc.buildings.push(b);
          acc.map[b.id] = b.name;
        }
        return acc;
      },
      { buildings: [], map: {} },
    );

    setBuildings(buildings);
    setBuildingMap(map);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchRestaurants = async (p: number = page) => {
    if (loading) return;
    setLoading(true);

    try {
      const effectiveOrder = filters.searchTerm ? OrderDirection.ASCENDING : order;
      const params: GetRestaurantsParams = {
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.building_id ? { building_id: filters.building_id } : {}),
        ...(filters.searchTerm ? { name: filters.searchTerm } : {}),
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        ...(orderBy ? { order_by: orderBy } : {}),
        ...(effectiveOrder ? { order: effectiveOrder } : {}),
      };

      const res = await getAllRestaurantsApi(params);
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      setRestaurants(res.data.restaurants);
      setTotalPage(res.data.pagination.total_page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH RESTAURANTS WHEN FILTER/SEARCH CHANGES =================
  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchRestaurants(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchRestaurants();
  }, [page]);

  const validateForm = (form: RestaurantForm) => {
    if (!form.name || !form.building_id || !form.floor) {
      toast.error('Please fill all required fields.');
      return false;
    }

    if (!form.operating_hours?.open || !form.operating_hours?.close) {
      toast.error('Please select operating hours.');
      return false;
    }

    if (!form.operating_hours?.days?.length) {
      toast.error('Please select working days.');
      return false;
    }

    return true;
  };

  // ================= CREATE RESTAURANT =================
  const createRestaurant = async (form: RestaurantForm) => {
    const res = await createRestaurantApi(removeEmptyFields(form));
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const detail = await getRestaurantByIdApi(res.data.id);
    if (!detail.success) {
      toast.error('Created but failed to load restaurant info');
      return;
    }

    setFilters({ status: 'all', building_id: '', searchTerm: '' });
    setPage(DEFAULT_PAGE);
    await fetchData();
    await fetchRestaurants(DEFAULT_PAGE);
    toast.success('Add restaurant successfully');
    setOpen(false);
  };

  // ================= UPDATE RESTAURANT =================
  const updateRestaurant = async (id: string, form: RestaurantForm) => {
    if (!originalForm) return;

    const payload = removeEmptyFields(getChangedFields(originalForm, form));
    delete payload.building_id;
    delete payload.floor;
    const res = await updateRestaurantApi(id, payload);
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const detail = await getRestaurantByIdApi(res.data.id);
    if (!detail.success) {
      toast.error('Updated but failed to load restaurant info');
      return;
    }

    const updated = detail.data as Restaurant;
    setRestaurants((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
    toast.success('Update restaurant successfully');
    setOpen(false);
  };

  // ================= UPDATE RESTAURANT STATUS =================
  const updateRestaurantStatus = async (id: string, status: RestaurantStatus) => {
    const res = await updateRestaurantStatusApi(id, { status });
    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const detail = await getRestaurantByIdApi(res.data.id);
    if (!detail.success) {
      toast.error(detail.message);
      return;
    }

    const updated = detail.data as Restaurant;
    setRestaurants((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
    toast.success('Update status successfully');
    fetchData();
  };

  // ================= STATUS BADGE =================
  const getStatusBadge = (status: BuildingStatus) => {
    const statusConfig = {
      active: {
        label: 'Active',
        icon: CheckSquare,
        color: 'bg-green-100 text-green-700 hover:bg-green-200',
      },
      inactive: {
        label: 'Inactive',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 hover:bg-red-200',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-xs font-semibold`} variant="outline">
        <Icon className="size-3 mr-1" /> {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* DIALOG for Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ width: '60vw', maxWidth: '1200px' }}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Add New Restaurant' : 'Edit Restaurant'}
            </DialogTitle>
            <DialogDescription>Fill in the information below</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* ---------- Input Fields ---------- */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Restaurant Information</label>

              <Input
                placeholder="Restaurant Name"
                value={form.name}
                onChange={(e) => setForm((p: RestaurantForm) => ({ ...p, name: e.target.value }))}
              />

              <Input
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm((p: RestaurantForm) => ({ ...p, description: e.target.value }))
                }
              />

              {/* Contact Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Information</label>
                <Input
                  placeholder="Phone"
                  value={form.contact?.phone ?? ''}
                  onChange={(e) =>
                    setForm((p: RestaurantForm) => ({
                      ...p,
                      contact: { ...p.contact, phone: e.target.value },
                    }))
                  }
                />
                <Input
                  placeholder="Email"
                  value={form.contact?.email ?? ''}
                  onChange={(e) =>
                    setForm((p: RestaurantForm) => ({
                      ...p,
                      contact: { ...p.contact, email: e.target.value },
                    }))
                  }
                />
                <Input
                  placeholder="Facebook URL"
                  value={form.contact?.facebook ?? ''}
                  onChange={(e) =>
                    setForm((p: RestaurantForm) => ({
                      ...p,
                      contact: { ...p.contact, facebook: e.target.value },
                    }))
                  }
                />
                <Input
                  placeholder="Zalo"
                  value={form.contact?.zalo ?? ''}
                  onChange={(e) =>
                    setForm((p: RestaurantForm) => ({
                      ...p,
                      contact: { ...p.contact, zalo: e.target.value },
                    }))
                  }
                />
              </div>
            </div>

            {/* ---------- Select & Operating ---------- */}
            <div className="space-y-4">
              {/* Building select */}
              <label className="text-sm font-medium">Building</label>
              <Select
                value={form.building_id}
                onValueChange={(v: string) =>
                  mode === 'create' && setForm((p: RestaurantForm) => ({ ...p, building_id: v }))
                }
              >
                <SelectTrigger disabled={mode === 'edit'}>
                  <SelectValue placeholder="Select Building" />
                </SelectTrigger>

                <SelectContent>
                  {(buildings ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Floor */}
              <label className="text-sm font-medium">Floor</label>
              <Input
                type="number"
                placeholder="Floor"
                min={1}
                disabled={mode === 'edit'}
                value={String(form.floor ?? '')}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setForm((p: RestaurantForm) => ({ ...p, floor: value > 0 ? value : 1 }));
                }}
              />

              {/* Operating Days */}
              <div>
                <label className="text-sm font-medium">Operating Days</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                    <label
                      key={day}
                      className="flex items-center gap-2 border rounded-lg px-3 py-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.operating_hours?.days?.includes(day) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev: any) => {
                            const currentDays = prev.operating_hours?.days ?? [];
                            return {
                              ...prev,
                              operating_hours: {
                                ...prev.operating_hours,
                                days: checked
                                  ? [...currentDays, day]
                                  : currentDays.filter((d: string) => d !== day),
                              },
                            };
                          });
                        }}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Operating Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Open</label>
                  <Input
                    type="time"
                    value={form.operating_hours?.open ?? ''}
                    onChange={(e) =>
                      setForm((p: any) => ({
                        ...p,
                        operating_hours: { ...p.operating_hours, open: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Close</label>
                  <Input
                    type="time"
                    value={form.operating_hours?.close ?? ''}
                    onChange={(e) =>
                      setForm((p: any) => ({
                        ...p,
                        operating_hours: { ...p.operating_hours, close: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!validateForm(form)) return;

                if (mode === 'edit' && originalForm) {
                  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);
                  if (!hasChanges) {
                    toast('No changes detected');
                    return;
                  }
                }

                mode === 'create'
                  ? createRestaurant(form as RestaurantForm)
                  : updateRestaurant(String(form.id), form as RestaurantForm);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Management 🍽️</h1>
          <p className="text-muted-foreground mt-1">List and manage restaurants</p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-green-600 hover:bg-green-700 hover:text-white"
            onClick={() => {
              setMode('create');
              setForm({
                id: '',
                building_id: '',
                floor: 1,
                name: '',
                description: '',
                operating_hours: { open: '', close: '', days: [] },
                contact: { phone: '', email: '', facebook: '', zalo: '' },
              });
              setOpen(true);
            }}
          >
            <Plus className="size-4 mr-2" /> Add New Restaurant
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Popover>
          <PopoverTrigger className="w-[200px]">
            <button
              className="
                flex w-[200px] items-center justify-between
                rounded-md
                px-3 py-1.5 text-sm
                bg-gray-100
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              "
            >
              <span className="truncate">{selectedBuildingName}</span>
              <ChevronDown
                style={{
                  transform: 'scale(0.7) translateY(1px)',
                  opacity: 0.3,
                }}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-[240px] p-0">
            <Command>
              <CommandInput placeholder="Search building..." />
              <CommandList>
                <CommandItem
                  onSelect={() => {
                    setFilters((prev) => ({
                      ...prev,
                      building_id: '',
                    }));
                  }}
                >
                  <Check
                    className="mr-2 h-4 w-4"
                    style={{
                      opacity: filters.building_id === '' ? 1 : 0,
                    }}
                  />
                  All buildings
                </CommandItem>

                {(buildings ?? []).map((b) => (
                  <CommandItem
                    key={b.id}
                    onSelect={() => {
                      setFilters((prev) => ({
                        ...prev,
                        building_id: b.id,
                      }));
                    }}
                  >
                    <Check
                      className="mr-2 h-4 w-4"
                      style={{
                        opacity: filters.building_id === b.id ? 1 : 0,
                      }}
                    />
                    {b.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select
          value={filters.status}
          onValueChange={(v: any) => setFilters((p) => ({ ...p, status: v }))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search restaurant..."
            value={filters.searchTerm}
            onChange={(e) => setFilters((p) => ({ ...p, searchTerm: e.target.value }))}
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition duration-200 border-l-4 border-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{restaurantStats.total}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition duration-200 border-l-4 border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{restaurantStats.active}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition duration-200 border-l-4 border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {restaurantStats.total - restaurantStats.active}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RESTAURANT LIST */}
      <div className="grid gap-4">
        {restaurants.map((r, index) => (
          <Card
            key={`${r.id}-${index}`}
            className="shadow-md hover:shadow-xl transition duration-300"
          >
            <CardContent className="flex items-center justify-between p-6">
              {/* LEFT - INFO */}
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Utensils className="size-6" />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <CardTitle className="text-lg font-bold text-gray-800">{r.name}</CardTitle>
                    {getStatusBadge(r.status as any)}
                    <Badge variant="secondary" className="text-xs text-gray-600">
                      Building: {buildingMap[r.building_id] ?? 'Unknown'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Home className="size-4 text-gray-400" />
                    Floor: {r.floor}
                  </p>

                  {r.description && (
                    <p className="text-sm text-muted-foreground mt-2">{r.description}</p>
                  )}
                </div>
              </div>

              {/* RIGHT - ACTIONS */}
              <div className="flex items-center justify-end gap-6 w-[360px] shrink-0">
                <div className="flex flex-col gap-2 w-[150px] items-end justify-center">
                  {r.status === 'inactive' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-[150px] h-[36px] flex items-center justify-center gap-1 text-green-600"
                      onClick={() => updateRestaurantStatus(r.id, 'active' as any)}
                    >
                      <CheckSquare className="size-4" /> Activate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-[150px] h-[36px] flex items-center justify-center gap-1 text-yellow-600"
                      onClick={() => updateRestaurantStatus(r.id, 'inactive' as any)}
                    >
                      <Wrench className="size-4" /> Inactive
                    </Button>
                  )}

                  <div className="flex gap-2 w-full justify-end">
                    <Button
                      size="icon"
                      variant="secondary"
                      title="Edit"
                      className="w-9 h-9"
                      onClick={async () => {
                        const detail = await getRestaurantByIdApi(r.id);
                        if (!detail.success) return toast.error(detail.message);

                        setForm(detail.data);
                        setOriginalForm(detail.data);
                        setMode('edit');
                        setOpen(true);
                      }}
                    >
                      <Edit className="size-4" />
                    </Button>

                    <Button size="icon" variant="destructive" title="Delete" className="w-9 h-9">
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

      {/* =================== LOADING INDICATOR =================== */}
      {loading && <div className="flex justify-center mt-6 text-gray-500">Loading...</div>}

      {restaurants.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No restaurants found.</p>
            <Button
              variant="link"
              onClick={() => {
                setFilters({
                  status: 'all',
                  building_id: '',
                  searchTerm: '',
                });
              }}
            >
              View All
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
