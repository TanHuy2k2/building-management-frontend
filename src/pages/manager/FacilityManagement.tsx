import { JSX, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Building, Trees, Plus, Pencil, Trash2, CheckCircle2, Wrench, Search } from 'lucide-react';
import {
  Facility,
  FacilityStatus,
  FacilityType,
  Building as BuildingInterface,
  FacilityForm,
  ResponseInterface,
} from '../../types';
import {
  createFacilityApi,
  getAllFacilityApi,
  getFacilityByIdApi,
  updateFacilityApi,
  updateFacilityStatusApi,
} from '../../services/facilityService';
import toast from 'react-hot-toast';
import { getAllBuildingApi, getBuildingByIdApi } from '../../services/buildingService';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { getPaginationNumbers } from '../../utils/pagination';
import { getChangedFields, removeEmptyFields } from '../../utils/updateFields';

const facilityIcons: Record<FacilityType, JSX.Element> = {
  room: <Building className="w-5 h-5" />,
  field: <Trees className="w-5 h-5" />,
};

const initialFormData: FacilityForm = {
  name: '',
  facility_type: FacilityType.ROOM,
  description: '',
  location: { floor: '', outdoor: false, area: '' },
  capacity: 0,
  building_id: '',
  base_price: 0,
  service_charge: 0,
};

export default function FacilityPage() {
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [buildings, setBuildings] = useState<BuildingInterface[]>([]);
  const [buildingMap, setBuildingMap] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [originalForm, setOriginalForm] = useState<FacilityForm | null>(null);
  const [formData, setFormData] = useState<FacilityForm>(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [facilityRes, buildingRes] = await Promise.all([
      getAllFacilityApi(),
      getAllBuildingApi(),
    ]);

    if (facilityRes && !facilityRes.success) {
      toast.error(facilityRes.message);
      return;
    }

    setFacilities((facilityRes.data ?? []) as Facility[]);

    if (buildingRes.success) {
      setBuildings(buildingRes.data);
      const map = buildingRes.data.reduce((acc: Record<string, string>, b: any) => {
        acc[b.id] = b.name;

        return acc;
      }, {});
      setBuildingMap(map);
    }
  };

  const uniqueBuildings = [...new Set(facilities.map((f) => f.building_id))].map((id) => ({
    id,
    name: buildingMap[id],
  }));

  const filteredFacilities = facilities.filter((f) => {
    const matchBuilding = buildingFilter === 'all' || f.building_id === buildingFilter;
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchSearch =
      !searchTerm.trim() ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buildingMap[f.building_id]?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchBuilding && matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredFacilities.length / DEFAULT_PAGE_SIZE);

  const paginatedFacilities = filteredFacilities.slice(
    (currentPage - 1) * DEFAULT_PAGE_SIZE,
    currentPage * DEFAULT_PAGE_SIZE,
  );

  const handleAdd = () => {
    setEditingFacility(null);
    setFormData({ ...initialFormData, building_id: buildings[0]?.id || '' });
    setDialogOpen(true);
  };

  const handleEdit = (facility: Facility) => {
    if (facility.status === FacilityStatus.RESERVED) {
      toast.error('This facility is already reserved! Cannot update!');

      return;
    }

    setEditingFacility(facility);
    const { status, created_by, created_at, updated_at, updated_by, ...data } = facility;
    setFormData(data);
    setDialogOpen(true);
  };

  const refreshFacility = async (facilityId: string) => {
    const facilityRes = await getFacilityByIdApi(facilityId);
    if (!facilityRes.success) {
      toast.error(facilityRes.message || 'Cannot get facility');

      return null;
    }

    const updatedFacility = facilityRes.data as Facility;
    setFacilities((prev) => prev.map((f) => (f.id === updatedFacility.id ? updatedFacility : f)));

    if (updatedFacility.building_id) {
      const building = await getBuildingByIdApi(updatedFacility.building_id);
      if (building.success) {
        setBuildingMap((prev) => ({ ...prev, [updatedFacility.building_id]: building.data.name }));
      }
    }

    return updatedFacility;
  };

  const handleSave = async () => {
    let res: ResponseInterface;
    if (editingFacility) {
      const { id, building_id, ...data } = formData;
      if (!originalForm) return;

      const payload = removeEmptyFields(getChangedFields(originalForm, data));
      res = await updateFacilityApi(formData.id!, payload);
    } else {
      res = await createFacilityApi(removeEmptyFields(formData));
    }

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    const updated = await refreshFacility(res.data.id);
    if (updated) {
      if (!editingFacility) setFacilities((prev) => [updated, ...prev]);

      toast.success(editingFacility ? 'Updated successfully' : 'Created successfully');
    }

    setDialogOpen(false);
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
    await refreshFacility(res.data.id);
    toast.success('Status updated successfully');
  };

  const formatCurrency = (amount: number) => amount?.toLocaleString('vi-VN') + '₫';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 border-b pb-4">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Facility Management</h1>
          <p className="text-slate-600">Manage and track all physical facilities and amenities</p>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by name or building..."
              className="pl-10 py-6 rounded-xl shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4 bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buildings</SelectItem>
                  {uniqueBuildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={FacilityStatus.AVAILABLE}>Available</SelectItem>
                  <SelectItem value={FacilityStatus.MAINTENANCE}>Maintenance</SelectItem>
                  <SelectItem value={FacilityStatus.RESERVED}>Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Facility
            </Button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
          }}
        >
          {paginatedFacilities.map((item) => (
            <Card
              key={item.id}
              style={{
                transition: 'all 0.3s',
                border: '0',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                minHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardHeader
                style={{
                  background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
                  paddingBottom: '1rem',
                  flexShrink: 0,
                }}
              >
                <CardTitle
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        padding: '0.5rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                    >
                      {facilityIcons[item.facility_type]}
                    </div>
                    <span
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent
                style={{
                  paddingTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#475569',
                    marginBottom: '1rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    minHeight: '40px',
                  }}
                >
                  {item.description}
                </p>

                <div
                  style={{
                    marginBottom: '1rem',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>Capacity:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {item.capacity} people
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>Building:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {buildingMap[item.building_id]}
                    </span>
                  </div>

                  {item.base_price ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.875rem',
                      }}
                    >
                      <span style={{ color: '#64748b' }}>Base Price:</span>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {formatCurrency(item.base_price)}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        visibility: 'hidden',
                        height: '1.25rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      placeholder
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
                  <button
                    onClick={() => toggleStatus(item)}
                    style={{
                      background: item.status === FacilityStatus.AVAILABLE ? '#16a34a' : '#ea580c',
                      color: 'white',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    {item.status === FacilityStatus.AVAILABLE ? (
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Wrench style={{ width: '14px', height: '14px' }} />
                    )}
                    {item.status}
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #f1f5f9',
                    marginTop: 'auto',
                  }}
                >
                  <Button
                    onClick={() => {
                      handleEdit(item);
                      setOriginalForm(item);
                    }}
                    variant="outline"
                    size="sm"
                    style={{
                      flex: 1,
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <Pencil style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    style={{
                      flex: 1,
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                    Delete
                  </Button>
                </div>

                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    flexShrink: 0,
                  }}
                >
                  {item.updated_at ? (
                    <>Updated: {String(item.updated_at)}</>
                  ) : (
                    <>Created: {String(item.created_at)}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFacilities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No facilities found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {getPaginationNumbers(currentPage, totalPages).map((item, idx) => {
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
                    onClick={() => setCurrentPage(Number(item))}
                    style={{
                      backgroundColor: currentPage === item ? 'black' : 'white',
                      color: currentPage === item ? 'white' : 'black',
                      padding: '0.25rem 0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      transition: 'all 0.2s',
                    }}
                    className={currentPage === item ? '' : 'hover:bg-gray-100'}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingFacility ? 'Edit Facility' : 'Add New Facility'}
              </DialogTitle>
              <DialogDescription>Enter the detailed information for the facility</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Facility Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g.: Conference Room A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Facility Type</Label>
                  <Select
                    value={formData.facility_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, facility_type: value })
                    }
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
                    value={formData.building_id}
                    onValueChange={(value: string) =>
                      !editingFacility && setFormData({ ...formData, building_id: value })
                    }
                    disabled={!!editingFacility}
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

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                {formData.facility_type === FacilityType.FIELD && (
                  <>
                    <div className="grid gap-2">
                      <Label>Base Price</Label>
                      <Input
                        type="number"
                        value={formData.base_price}
                        onChange={(e) =>
                          setFormData({ ...formData, base_price: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Service Charge</Label>
                      <Input
                        type="number"
                        value={formData.service_charge}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            service_charge: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Area</Label>
                  <Input
                    value={formData.location.area}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, area: e.target.value },
                      })
                    }
                    placeholder="Zone A"
                    disabled={!!editingFacility}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Floor</Label>
                  <Input
                    value={formData.location.floor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, floor: e.target.value },
                      })
                    }
                    placeholder="2"
                    disabled={!!editingFacility}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Outdoor</Label>
                  <Select
                    value={formData.location.outdoor ? 'true' : 'false'}
                    onValueChange={(value: any) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          outdoor: value === 'true',
                        },
                      })
                    }
                    disabled={!!editingFacility}
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                {editingFacility ? 'Update' : 'Add New'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
