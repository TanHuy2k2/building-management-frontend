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
import { Building, BuildingStatus, CreateBuildingDto, User } from '../../types';
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
import { createBuildingApi, getAllBuildingApi, getBuildingByIdApi } from '../../services/building';
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

export default function BuildingManagement() {
  const [buildings, setBuildings] = useState<Building[]>();
  const [filter, setFilter] = useState<BuildingStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [managerMap, setManagerMap] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateBuildingDto>({
    name: '',
    code: '',
    address: '',
    manager_id: '',
  });
  const [managers, setManagers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [buildingRes, managerRes] = await Promise.all([getAllBuildingApi(), getManagers()]);
      if (buildingRes && !buildingRes.success) {
        toast.error(buildingRes.message);
        return;
      }

      const dataBuildings = (buildingRes.data ?? []) as Building[];
      setBuildings(dataBuildings);

      if (managerRes.success) {
        setManagers(managerRes.data);
      }

      const managerMap: Record<string, string> = {};
      if (managerRes.success) {
        managerRes.data.forEach((m: any) => {
          managerMap[m.id] = m.full_name;
        });
      }

      setManagerMap(managerMap);
    };

    fetchData();
  }, []);

  const createBuilding = async () => {
    const res = await createBuildingApi(form);
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

  // Filter and search logic
  const filteredBuildings =
    buildings?.filter((building) => {
      const matchesFilter = filter === 'all' || building.status === filter;

      const name = (building.name ?? '').toLowerCase();
      const code = (building.code ?? '').toLowerCase();
      const address = (building.address ?? '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(search) || code.includes(search) || address.includes(search);

      return matchesFilter && matchesSearch;
    }) || [];

  // Stats calculation
  const totalBuildings = buildings?.length || 0;
  const activeCount = buildings?.filter((b) => b.status === 'active').length || 0;
  const inactiveCount = buildings?.filter((b) => b.status === 'inactive').length || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Building Management 🏢</h1>
          <p className="text-muted-foreground mt-1">Overview and list of property assets</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-green-600  hover:bg-green-700"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4 mr-2" /> Add New Building
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Building</DialogTitle>
                <DialogDescription>Fill in the information below</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  placeholder="Building Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <Input
                  placeholder="Code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />

                <Input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />

                <Select
                  value={form.manager_id}
                  onValueChange={(value: string) => setForm({ ...form, manager_id: value })}
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
                    createBuilding();
                    setOpen(false);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Select
            value={filter}
            onValueChange={(value: BuildingStatus | 'all') => setFilter(value)}
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition duration-200 border-l-4 border-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{totalBuildings}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition duration-200 border-l-4 border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition duration-200 border-l-4 border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Building List (Cards) */}
      <div className="grid gap-4">
        {filteredBuildings.map((building) => (
          <Card key={building.id} className="shadow-md hover:shadow-xl transition duration-300">
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
                    Updated: {building.updated_at ? String(building.updated_at) : null}
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
                      >
                        <CheckSquare className="size-4" />
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-[150px] h-[36px] flex items-center justify-center gap-1 text-yellow-600"
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
                      onClick={() => alert(`Edit ${building.id}`)}
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

      {/* No data */}
      {filteredBuildings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No buildings found matching the search or filter criteria.
            </p>
            <Button variant="link" className="mt-2" onClick={() => setFilter('all')}>
              View All
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
