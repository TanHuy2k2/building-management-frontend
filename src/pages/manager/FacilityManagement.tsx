import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Facility,
  FacilityForm,
  FacilityStatus,
  FacilityType,
  GetFacilityParams,
  OrderDirection,
  Building,
  ResponseInterface,
} from '../../types';
import {
  Home,
  Trees,
  Search,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Landmark,
  CheckCircle2,
} from 'lucide-react';
import {
  createFacilityApi,
  getAllFacilityApi,
  getAllFacilityStatsApi,
  updateFacilityApi,
  updateFacilityStatusApi,
} from '../../services/facilityService';
import { getBuildingByIdApi } from '../../services/buildingService';
import toast from 'react-hot-toast';
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

const facilityIconMap: Record<FacilityType, any> = {
  room: Home,
  field: Trees,
};

export default function FacilityManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingMap, setBuildingMap] = useState<Record<string, string>>({});
  const [facilityStats, setFacilityStats] = useState({
    total: 0,
    available: 0,
    maintenance: 0,
    reserved: 0,
  });
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [originalForm, setOriginalForm] = useState<FacilityForm | null>(null);
  const [form, setForm] = useState<FacilityForm>({
    name: '',
    facility_type: FacilityType.ROOM,
    description: '',
    location: { floor: '', outdoor: false, area: '' },
    capacity: 0,
    building_id: '',
    base_price: 0,
    service_charge: 0,
  });
  const [formUpdate, setFormUpdate] = useState<FacilityForm & { id?: string }>({
    id: '',
    name: '',
    facility_type: FacilityType.ROOM,
    description: '',
    location: { floor: '', outdoor: false, area: '' },
    capacity: 0,
    building_id: '',
    base_price: 0,
    service_charge: 0,
  });
  const [filters, setFilters] = useState({ building_id: 'all', status: 'all', searchTerm: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);
  const [order, setOrder] = useState<OrderDirection>(OrderDirection.DESCENDING);

  const fetchFacilityStats = async () => {
    try {
      const facilityStatRes = await getAllFacilityStatsApi();
      if (!facilityStatRes.success) {
        toast.error(facilityStatRes.message);
        return;
      }

      setFacilityStats(facilityStatRes.data);

      const buildingIds = facilityStatRes.data.buildings || [];
      const buildingData = await Promise.allSettled(
        buildingIds.map((id: string) => getBuildingByIdApi(id)),
      );
      const validBuildings = buildingData.map(
        (result) => (result as PromiseFulfilledResult<any>).value.data,
      );

      setBuildings(validBuildings);

      const map: Record<string, string> = {};
      validBuildings.forEach((building) => {
        map[building.id] = building.name;
      });

      setBuildingMap(map);
    } catch (error) {
      toast.error('Cannot get stats!');
    }
  };

  const fetchFacilities = async (p: number = page) => {
    if (loading) return;
    setLoading(true);

    try {
      const effectiveOrder = filters.searchTerm ? OrderDirection.ASCENDING : order;
      const params: GetFacilityParams = {
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.building_id !== 'all' ? { building_id: filters.building_id } : {}),
        ...(filters.searchTerm ? { name: filters.searchTerm } : {}),
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        ...(orderBy ? { order_by: orderBy } : {}),
        ...(effectiveOrder ? { order: effectiveOrder } : {}),
      };

      const res = await getAllFacilityApi(params);
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      setFacilities(res.data.facilities);
      setTotalPage(res.data.pagination.total_page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilityStats();
  }, []);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchFacilities(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchFacilities();
  }, [page]);

  const handleSave = async () => {
    let res: ResponseInterface;

    try {
      if (mode === 'edit') {
        if (!formUpdate.id || !originalForm) return;

        const { id, building_id, ...data } = formUpdate;
        const payload = removeEmptyFields(getChangedFields(originalForm, data));
        if (Object.keys(payload).length === 0) {
          setOpen(false);

          return;
        }

        res = await updateFacilityApi(id, payload);
      } else {
        res = await createFacilityApi(removeEmptyFields(form));
      }

      if (!res.success) {
        toast.error(res.message);

        return;
      }

      await fetchFacilities(DEFAULT_PAGE);

      toast.success(mode === 'edit' ? 'Updated successfully' : 'Created successfully');

      setOpen(false);
    } catch (error) {
      toast.error('Cannot create or update facility');
    }
  };

  const toggleStatus = async (facility: Facility) => {
    if (facility.status === FacilityStatus.RESERVED) {
      toast.error('This facility is already reserved!');

      return;
    }

    const newStatus =
      facility.status === FacilityStatus.AVAILABLE
        ? FacilityStatus.MAINTENANCE
        : FacilityStatus.AVAILABLE;

    const res = await updateFacilityStatusApi(facility.id, newStatus);
    if (!res.success) {
      toast.error(res.message);

      return;
    }

    await fetchFacilities(DEFAULT_PAGE);

    toast.success('Status updated successfully');
  };

  const getStatusBadge = (status: FacilityStatus) => {
    const config = {
      available: {
        label: 'Available',
        style: {
          backgroundColor: '#22C55E',
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
      maintenance: {
        label: 'Maintenance',
        style: {
          backgroundColor: '#ea580c',
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
      reserved: {
        label: 'Reserved',
        style: {
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
    }[status];

    return (
      <Badge style={config.style} className="text-xs font-semibold">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {mode === 'edit' ? 'Edit Facility' : 'Add New Facility'}
            </DialogTitle>
            <DialogDescription>Enter the detailed information for the facility</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label>Facility Name</Label>
              <Input
                value={mode === 'edit' ? formUpdate.name : form.name}
                onChange={(e) =>
                  mode === 'edit'
                    ? setFormUpdate({ ...formUpdate, name: e.target.value })
                    : setForm({ ...form, name: e.target.value })
                }
                placeholder="E.g.: Conference Room A"
              />
            </div>

            {/* Type + Building */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Facility Type</Label>
                <Select
                  value={mode === 'edit' ? formUpdate.facility_type : form.facility_type}
                  onValueChange={(value: any) =>
                    mode === 'edit'
                      ? setFormUpdate({ ...formUpdate, facility_type: value })
                      : setForm({ ...form, facility_type: value })
                  }
                  disabled={mode === 'edit'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FacilityType.ROOM}>Room</SelectItem>
                    <SelectItem value={FacilityType.FIELD}>Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Building</Label>
                <Select
                  value={mode === 'edit' ? formUpdate.building_id : form.building_id}
                  onValueChange={(value: string) =>
                    mode === 'create' && setForm({ ...form, building_id: value })
                  }
                  disabled={mode === 'edit'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={mode === 'edit' ? formUpdate.description : form.description}
                onChange={(e) =>
                  mode === 'edit'
                    ? setFormUpdate({ ...formUpdate, description: e.target.value })
                    : setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Capacity + Prices */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={mode === 'edit' ? formUpdate.capacity : form.capacity}
                  onChange={(e) =>
                    mode === 'edit'
                      ? setFormUpdate({
                          ...formUpdate,
                          capacity: Number(e.target.value) || 0,
                        })
                      : setForm({
                          ...form,
                          capacity: Number(e.target.value) || 0,
                        })
                  }
                />
              </div>

              {(mode === 'edit' ? formUpdate.facility_type : form.facility_type) ===
                FacilityType.FIELD && (
                <>
                  <div className="grid gap-2">
                    <Label>Base Price</Label>
                    <Input
                      type="number"
                      value={mode === 'edit' ? formUpdate.base_price : form.base_price}
                      onChange={(e) =>
                        mode === 'edit'
                          ? setFormUpdate({
                              ...formUpdate,
                              base_price: Number(e.target.value) || 0,
                            })
                          : setForm({
                              ...form,
                              base_price: Number(e.target.value) || 0,
                            })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Service Charge</Label>
                    <Input
                      type="number"
                      value={mode === 'edit' ? formUpdate.service_charge : form.service_charge}
                      onChange={(e) =>
                        mode === 'edit'
                          ? setFormUpdate({
                              ...formUpdate,
                              service_charge: Number(e.target.value) || 0,
                            })
                          : setForm({
                              ...form,
                              service_charge: Number(e.target.value) || 0,
                            })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Area</Label>
                <Input
                  value={mode === 'edit' ? formUpdate.location.area : form.location.area}
                  onChange={(e) =>
                    mode === 'edit'
                      ? setFormUpdate({
                          ...formUpdate,
                          location: {
                            ...formUpdate.location,
                            area: e.target.value,
                          },
                        })
                      : setForm({
                          ...form,
                          location: {
                            ...form.location,
                            area: e.target.value,
                          },
                        })
                  }
                  placeholder="A"
                  disabled={mode === 'edit'}
                />
              </div>

              <div className="grid gap-2">
                <Label>Floor</Label>
                <Input
                  value={mode === 'edit' ? formUpdate.location.floor : form.location.floor}
                  onChange={(e) =>
                    mode === 'edit'
                      ? setFormUpdate({
                          ...formUpdate,
                          location: {
                            ...formUpdate.location,
                            floor: e.target.value,
                          },
                        })
                      : setForm({
                          ...form,
                          location: {
                            ...form.location,
                            floor: e.target.value,
                          },
                        })
                  }
                  placeholder="3"
                  disabled={mode === 'edit'}
                />
              </div>

              <div className="grid gap-2">
                <Label>Outdoor</Label>
                <Select
                  value={
                    (mode === 'edit' ? formUpdate.location.outdoor : form.location.outdoor)
                      ? 'true'
                      : 'false'
                  }
                  onValueChange={(value: string) =>
                    mode === 'edit'
                      ? setFormUpdate({
                          ...formUpdate,
                          location: {
                            ...formUpdate.location,
                            outdoor: value === 'true',
                          },
                        })
                      : setForm({
                          ...form,
                          location: {
                            ...form.location,
                            outdoor: value === 'true',
                          },
                        })
                  }
                  disabled={mode === 'edit'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {mode === 'edit' ? 'Update' : 'Add New'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Facility Management 🏟️</h1>
          <p className="text-muted-foreground">Manage rooms and fields</p>
        </div>
        <Button
          variant="outline"
          className="text-green-600  hover:bg-green-700"
          onClick={() => {
            setMode('create');
            setOpen(true);
          }}
        >
          <Plus className="size-4 mr-2" /> Add New Facility
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={filters.building_id}
          onValueChange={(v: string) => setFilters((p) => ({ ...p, building_id: v }))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v: any) => setFilters((p) => ({ ...p, status: v }))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value={FacilityStatus.AVAILABLE}>Available</SelectItem>
            <SelectItem value={FacilityStatus.MAINTENANCE}>Maintenance</SelectItem>
            <SelectItem value={FacilityStatus.RESERVED}>Reserved</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search facility..."
            value={filters.searchTerm}
            onChange={(e) => setFilters((p) => ({ ...p, searchTerm: e.target.value }))}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{facilityStats.total}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">
            {facilityStats.available}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-yellow-600">
            {facilityStats.maintenance}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reserved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">
            {facilityStats.reserved}
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {facilities.map((f) => {
          const Icon = facilityIconMap[f.facility_type];
          return (
            <Card key={f.id} className="hover:shadow-lg transition">
              <CardContent className="flex justify-between p-6">
                <div className="flex gap-4">
                  <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Icon className="size-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{f.name}</CardTitle>
                      {getStatusBadge(f.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {buildingMap[f.building_id]} • Capacity {f.capacity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.updated_at
                        ? `Updated: ${formatDateVN(f.updated_at)}`
                        : `Created: ${formatDateVN(f.created_at)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                    {f.status !== FacilityStatus.RESERVED && (
                      <button
                        onClick={() => toggleStatus(f)}
                        style={{
                          background: f.status === FacilityStatus.AVAILABLE ? '#ea580c' : '#16a34a',
                          color: 'white',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          cursor: 'pointer',
                        }}
                      >
                        {f.status === FacilityStatus.AVAILABLE ? (
                          <CheckCircle2 style={{ width: 14, height: 14 }} />
                        ) : (
                          <Wrench style={{ width: 14, height: 14 }} />
                        )}
                        {f.status === FacilityStatus.AVAILABLE
                          ? FacilityStatus.MAINTENANCE
                          : FacilityStatus.AVAILABLE}
                      </button>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      setMode('edit');
                      setOriginalForm(f);
                      setFormUpdate({ ...f });
                      setOpen(true);
                    }}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button size="icon" variant="destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
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
      {facilities.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Landmark className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No facilities found matching the search or filter criteria.
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setFilters({ building_id: 'all', status: 'all', searchTerm: '' });
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
