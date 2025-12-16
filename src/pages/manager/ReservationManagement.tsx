import { useEffect, useMemo, useState } from 'react';
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
import { Search, Calendar, Clock, MapPin } from 'lucide-react';
import {
  FacilityReservation,
  FacilityReservationStatus,
  ReservationView,
} from '../../types/facilityReservation';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import { getAllFacilityReservationApi } from '../../services/facilityReservationService';
import toast from 'react-hot-toast';
import { Building, FacilityType, ResponseInterface } from '../../types';
import { getUserById } from '../../services/userService';
import { getFacilityByIdApi } from '../../services/facilityService';
import { durationHours, formatDateVN, formatTimeVN } from '../../utils/time';
import { getBuildingByIdApi } from '../../services/buildingService';

export default function ReservationManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FacilityReservationStatus>('all');
  const [buildingMap, setBuildingMap] = useState<Map<string, Building>>(new Map());
  const [buildingFilter, setBuildingFilter] = useState<'all' | string>('all');
  const [reservations, setReservations] = useState<ReservationView[]>();
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    const reservationRes: ResponseInterface = await getAllFacilityReservationApi();
    if (reservationRes && !reservationRes.success) {
      toast.error(reservationRes.message);
      return;
    }

    const reservationData = (reservationRes.data ?? []) as FacilityReservation[];
    const userIds = [...new Set(reservationData.map((r) => r.user_id).filter(Boolean))];
    const facilityIds = [...new Set(reservationData.map((r) => r.facility_id).filter(Boolean))];
    const [users, facilities] = await Promise.all([
      Promise.all(userIds.map((id) => getUserById(id))),
      Promise.all(facilityIds.map((id) => getFacilityByIdApi(id))),
    ]);
    const userMap = new Map(users.filter((r) => r?.success).map((r) => [r.data.id, r.data]));
    const newFacilityMap = new Map(
      facilities.filter((r) => r?.success).map((r) => [r.data.id, r.data]),
    );
    const buildingIds = [
      ...new Set(
        Array.from(newFacilityMap.values())
          .map((f) => f.building_id)
          .filter(Boolean),
      ),
    ];
    const buildings = await Promise.all(buildingIds.map((id) => getBuildingByIdApi(id)));
    const newBuildingMap = new Map(
      buildings.filter((r) => r?.success).map((r) => [r.data.id, r.data]),
    );

    setBuildingMap(newBuildingMap);

    setReservations(
      reservationData.map((r) => {
        const facility = newFacilityMap.get(r.facility_id);
        return {
          ...r,
          user: userMap.get(r.user_id),
          facility,
          building: facility ? newBuildingMap.get(facility.building_id) : undefined,
        };
      }),
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ===================== FILTER + SEARCH ===================== */
  const filteredReservations = (reservations ?? []).filter((r) => {
    const matchSearch =
      r.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.building?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.facility?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchBuilding = buildingFilter === 'all' || r.building?.id === buildingFilter;

    return matchSearch && matchStatus && matchBuilding;
  });

  /* ===================== PAGINATION ===================== */
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReservations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReservations, currentPage]);

  /* ===================== HELPERS ===================== */
  const statusStyles = {
    pending: {
      badge: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0',
      },
      headerBg: 'linear-gradient(to right, #ecfdf5, #dcfce7)',
    },
    reserved: {
      badge: {
        backgroundColor: '#ffedd5',
        color: '#9a3412',
        border: '1px solid #fed7aa',
      },
      headerBg: 'linear-gradient(to right, #fff7ed, #ffedd5)',
    },
    cancelled: {
      badge: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
      },
      headerBg: 'linear-gradient(to right, #fef2f2, #fee2e2)',
    },
  } as const;

  const getStatusBadge = (status: FacilityReservationStatus) => {
    const labelMap = {
      pending: 'Pending',
      reserved: 'Reserved',
      cancelled: 'Cancelled',
    };

    return (
      <Badge
        variant="outline"
        style={{
          ...statusStyles[status].badge,
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        {labelMap[status]}
      </Badge>
    );
  };

  const buildingOptions = useMemo(() => Array.from(buildingMap.values()), [buildingMap]);

  /* ===================== RENDER ===================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ===================== HEADER ===================== */}
        <div className="mb-4 border-b pb-4">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Reservation Management</h1>
          <p className="text-slate-600">Manage and track all facility reservations</p>
        </div>

        {/* ===================== SEARCH + FILTER ===================== */}
        <div className="mb-4 bg-white rounded-xl shadow-sm p-6">
          {/* SEARCH */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by user or facility..."
                className="pl-10 py-6 rounded-xl shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={FacilityReservationStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={FacilityReservationStatus.RESERVED}>Reserved</SelectItem>
                <SelectItem value={FacilityReservationStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Facility filter */}
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by Building" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildingOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ===================== CARD GRID ===================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
          }}
        >
          {paginatedReservations.map((r: ReservationView) => {
            const hours = durationHours(new Date(r.start_time), new Date(r.end_time));

            return (
              <Card key={r.id} style={{ border: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <CardHeader
                  style={{
                    background: statusStyles[r.status].headerBg,
                    paddingBottom: '1rem',
                  }}
                >
                  <CardTitle
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                    >
                      {r.facility?.name}
                    </span>

                    {getStatusBadge(r.status)}
                  </CardTitle>
                </CardHeader>

                {/* ===== CARD CONTENT ===== */}
                <CardContent
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    paddingTop: '1rem',
                  }}
                >
                  <p className="text-sm text-slate-600 mb-4">
                    User ID: <strong>{r.user?.full_name}</strong>
                  </p>

                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>
                        {formatDateVN(r.start_time)}
                        {new Date(r.start_time).toDateString() !==
                          new Date(r.end_time).toDateString() && ` - ${formatDateVN(r.end_time)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {formatTimeVN(r.start_time)} – {formatTimeVN(r.end_time)} ({hours}h)
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {r.building?.name}
                    </div>
                  </div>

                  {r.facility?.facility_type !== FacilityType.ROOM && (
                    <div className="border-t pt-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Base amount</span>
                        <span>{r.base_amount} VND</span>
                      </div>

                      <div className="flex justify-between">
                        <span>VAT</span>
                        <span>{r.vat_charge} VND</span>
                      </div>

                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{r.total_amount} VND</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ===================== EMPTY ===================== */}
        {filteredReservations.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-lg">No reservations found</div>
        )}

        {/* ===================== PAGINATION ===================== */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-4 py-1 border rounded-lg bg-white">
              Page {currentPage} / {totalPages}
            </span>
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
      </div>
    </div>
  );
}
