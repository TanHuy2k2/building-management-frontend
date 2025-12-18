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
  BuildingForm,
  BuildingStatus,
  GetBuildingParams,
  OrderDirection,
  User,
} from '../../types';
// Icons
import {
  Building2,
  Search,
  Wrench,
  CheckSquare,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Home,
} from 'lucide-react';
import {
  createBuildingApi,
  getAllBuildingApi,
  getAllBuildingStatsApi,
  getBuildingByIdApi,
  updateBuildingApi,
  updateBuildingStatusApi,
} from '../../services/buildingService';
import toast from 'react-hot-toast';
import { getManagers, getUserById } from '../../services/userService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  DEFAULT_ORDER_BY,
  DEFAULT_PAGE,
  DEFAULT_PAGE_TOTAL,
  DEFAULT_PAGE_SIZE,
} from '../../utils/constants';
import { getPaginationNumbers } from '../../utils/pagination';
import { getChangedFields, removeEmptyFields } from '../../utils/updateFields';
import { formatDateVN } from '../../utils/time';

export default function BuildingManagement() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [managerMap, setManagerMap] = useState<Record<string, string>>({});
  const [buildingStats, setBuildingStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [originalForm, setOriginalForm] = useState<BuildingForm | null>(null);
  const [form, setForm] = useState<BuildingForm>({
    name: '',
    code: '',
    address: '',
    manager_id: '',
  });
  const [formUpdate, setFormUpdate] = useState<BuildingForm>({
    id: '',
    name: '',
    code: '',
    address: '',
    manager_id: '',
  });
  const [managers, setManagers] = useState<User[]>([]);
  const [filters, setFilters] = useState({ status: 'all', searchTerm: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);
  const [order, setOrder] = useState<OrderDirection>(OrderDirection.DESCENDING);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const buildingStatRes = await getAllBuildingStatsApi();
        if (!buildingStatRes.success) {
          toast.error(buildingStatRes.message);
          return;
        }

        setBuildingStats(buildingStatRes.data);

        const managerIds = buildingStatRes.data.managers || [];
        const managersData = await Promise.allSettled(
          managerIds.map((id: string) => getUserById(id)),
        );
        const validManagers = managersData.map(
          (result) => (result as PromiseFulfilledResult<any>).value.data,
        );

        setManagers(validManagers);

        const map: Record<string, string> = {};
        validManagers.forEach((manager) => {
          map[manager.id] = manager.full_name;
        });

        setManagerMap(map);
      } catch (error) {
        toast.error('Cannot get stats!');
      }
    };

    fetchData();
  }, []);

  const fetchBuildings = async (p: number = page) => {
    if (loading) return;
    setLoading(true);

    try {
      const effectiveOrder = filters.searchTerm ? OrderDirection.ASCENDING : order;
      const params: GetBuildingParams = {
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.searchTerm ? { name: filters.searchTerm } : {}),
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        ...(orderBy ? { order_by: orderBy } : {}),
        ...(effectiveOrder ? { order: effectiveOrder } : {}),
      };

      const res = await getAllBuildingApi(params);
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      setBuildings(res.data.buildings);
      setTotalPage(res.data.pagination.total_page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchBuildings(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchBuildings();
  }, [page]);

  const createBuilding = async (form: BuildingForm) => {
    const res = await createBuildingApi(removeEmptyFields(form));
    if (!res.success) {
      toast.error(res.message);

      return;
    }

    const buildingId = res.data.id;
    const detailRes = await getBuildingByIdApi(buildingId);
    if (!detailRes.success) {
      toast.error('Created but failed to load building info');
      return;
    }

    const newBuilding = detailRes.data as Building;
    setBuildings((prev) => [newBuilding, ...(prev ?? [])]);
    if (newBuilding.manager_id) {
      const user = await getUserById(newBuilding.manager_id);
      if (user.success) {
        setManagerMap((prev) => ({
          ...prev,
          [newBuilding.manager_id]: user.data.full_name,
        }));
      }
    }

    toast.success('Add building successfully');
    setOpen(false);
  };

  const updateBuildingStatus = async (id: string, status: BuildingStatus) => {
    const res = await updateBuildingStatusApi(id, status);
    const buildingId = res.data.id;
    const detailRes = await getBuildingByIdApi(buildingId);
    if (!detailRes.success) {
      toast.error(detailRes.message);

      return;
    }

    const newBuilding = detailRes.data as Building;
    setBuildings((prev) => {
      if (!prev) return [newBuilding];

      return prev.map((b) => (b.id === newBuilding.id ? newBuilding : b));
    });

    toast.success('Update building status successfully');
    setOpen(false);
  };

  const updateBuilding = async (id: string, form: BuildingForm) => {
    if (!originalForm) return;

    const payload = removeEmptyFields(getChangedFields(originalForm, form));
    const res = await updateBuildingApi(id, payload);
    if (!res.success) {
      toast.error(res.message);

      return;
    }

    const buildingId = res.data.id;
    const detailRes = await getBuildingByIdApi(buildingId);
    if (!detailRes.success) {
      toast.error('Created but failed to load building info');

      return;
    }

    const updatedBuilding = detailRes.data as Building;
    setBuildings((prev) => {
      if (!prev) return [updatedBuilding];

      return prev.map((b) => (b.id === updatedBuilding.id ? updatedBuilding : b));
    });

    if (updatedBuilding.manager_id) {
      const user = await getUserById(updatedBuilding.manager_id);
      if (user.success) {
        setManagerMap((prev) => ({
          ...prev,
          [updatedBuilding.manager_id]: user.data.full_name,
        }));
      }
    }

    toast.success('Update building status successfully');
    setOpen(false);
  };

  // Function to render Status Badge
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

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-xs font-semibold`} variant="outline">
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header and Controls */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Add New Building' : 'Edit Building'}</DialogTitle>
            <DialogDescription>Fill in the information below</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <Input
              placeholder="Building Name"
              value={mode === 'create' ? form.name : formUpdate.name}
              onChange={(e) => {
                const value = e.target.value;
                if (mode === 'create') {
                  setForm((prev) => ({ ...prev, name: value }));
                } else {
                  setFormUpdate((prev) => ({ ...prev, name: value }));
                }
              }}
            />

            {/* Code */}
            <Input
              placeholder="Code"
              value={mode === 'create' ? form.code : formUpdate.code}
              onChange={(e) => {
                const value = e.target.value;
                if (mode === 'create') {
                  setForm((prev) => ({ ...prev, code: value }));
                } else {
                  setFormUpdate((prev) => ({ ...prev, code: value }));
                }
              }}
            />

            {/* Address */}
            <Input
              placeholder="Address"
              value={mode === 'create' ? form.address : formUpdate.address}
              onChange={(e) => {
                const value = e.target.value;
                if (mode === 'create') {
                  setForm((prev) => ({ ...prev, address: value }));
                } else {
                  setFormUpdate((prev) => ({ ...prev, address: value }));
                }
              }}
            />

            {/* Manager */}
            <Select
              value={mode === 'create' ? form.manager_id : formUpdate.manager_id}
              onValueChange={(value: any) => {
                if (mode === 'create') {
                  setForm((prev) => ({ ...prev, manager_id: value }));
                } else {
                  setFormUpdate((prev) => ({ ...prev, manager_id: value }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>

              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (mode === 'create') {
                  createBuilding(form);
                } else {
                  const { id, ...data } = formUpdate;
                  updateBuilding(String(id), data);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Building Management 🏢</h1>
          <p className="text-muted-foreground mt-1">Overview and list of property assets</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-green-600  hover:bg-green-700"
            onClick={() => {
              setMode('create');
              setOpen(true);
            }}
          >
            <Plus className="size-4 mr-2" /> Add New Building
          </Button>

          <Select
            value={filters.status}
            onValueChange={(value: BuildingStatus | 'all') => {
              setFilters((prev) => ({
                ...prev,
                status: value,
              }));
            }}
          >
            <SelectTrigger className="w-[180px] h-10 border-gray-300 shadow-sm">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, code, or address..."
          className="pl-10 h-10 border-gray-300 shadow-sm"
          value={filters.searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setFilters((prev) => ({
              ...prev,
              searchTerm: value,
            }));
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition duration-200 border-l-4 border-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{buildingStats.total}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition duration-200 border-l-4 border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{buildingStats.active}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition duration-200 border-l-4 border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{buildingStats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Building List (Cards) */}
      <div className="grid gap-4">
        {buildings.map((building, index) => (
          <Card
            key={`${building.id}-${index}`}
            className="shadow-md hover:shadow-xl transition duration-300"
          >
            <CardContent className="flex items-center justify-between p-6">
              {/* LEFT SIDE - INFO */}
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <CardTitle className="text-lg font-bold text-gray-800">
                      {building.name}
                    </CardTitle>
                    {getStatusBadge(building.status)}
                    <Badge variant="secondary" className="text-xs text-gray-600">
                      Code: {building.code}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Home className="size-4 text-gray-400" />
                    {building.address}
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE - MANAGER & ACTIONS (ALIGNED) */}
              <div className="flex items-center justify-end gap-6 w-[360px] shrink-0">
                {/* Manager Column */}
                <div className="w-[180px] text-right pr-4 border-r border-gray-100 flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground">Manager:</p>
                  <p className="font-semibold text-indigo-600">
                    {managerMap[building.manager_id] ?? 'No manager'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {' '}
                    {building.updated_at
                      ? `Updated: ${formatDateVN(building.updated_at)}`
                      : `Created: ${formatDateVN(building.created_at)}`}
                  </p>
                </div>

                {/* Action Column - FIXED WIDTH W-[120px] */}
                <div className="flex flex-col gap-2 w-[150px] items-end justify-center">
                  <div className="w-[180px] h-[36px]">
                    {building.status === 'inactive' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-[150px] h-[36px] flex items-center justify-center gap-1 text-green-600"
                        onClick={() => updateBuildingStatus(building.id, BuildingStatus.ACTIVE)}
                      >
                        <CheckSquare className="size-4" />
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-[150px] h-[36px] flex items-center justify-center gap-1 text-yellow-600"
                        onClick={() => updateBuildingStatus(building.id, BuildingStatus.INACTIVE)}
                      >
                        <Wrench className="size-4" />
                        Inactive
                      </Button>
                    )}
                  </div>

                  {/* CRUD Buttons */}
                  <div className="flex gap-2 w-full justify-end">
                    <Button
                      size="icon"
                      variant="secondary"
                      title="Edit"
                      className="w-9 h-9"
                      onClick={() => {
                        setMode('edit');
                        setOriginalForm(building);
                        setFormUpdate({
                          id: building.id,
                          name: building.name,
                          code: building.code,
                          address: building.address,
                          manager_id: building.manager_id,
                        });
                        setOpen(true);
                      }}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      title="Delete"
                      className="w-9 h-9"
                      // onClick={() => deleteBuilding(building.id)}
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

      {/* No data */}
      {buildings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No buildings found matching the search or filter criteria.
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setFilters({
                  status: 'all',
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
