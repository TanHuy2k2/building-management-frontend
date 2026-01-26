import { useEffect, useRef, useState } from 'react';
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
import { Search, Calendar, Clock, MapPin, Info } from 'lucide-react';
import {
  FacilityReservation,
  FacilityReservationStatus,
  ReservationView,
} from '../../types/facilityReservation';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import {
  getAllFacilityReservationApi,
  getReservationByIdApi,
} from '../../services/facilityReservationService';
import toast from 'react-hot-toast';
import { FacilityType, ResponseInterface } from '../../types';
import { getUserById } from '../../services/userService';
import { getFacilityByIdApi } from '../../services/facilityService';
import { durationHours, formatDateVN, formatTimeVN } from '../../utils/time';
import { getPaginationNumbers } from '../../utils/pagination';
import { getBuildingByIdApi } from '../../services/buildingService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

export default function ReservationManagement() {
  /* ===================== STATE ===================== */
  const [reservations, setReservations] = useState<ReservationView[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ status: 'all' | FacilityReservationStatus }>({
    status: 'all',
  });
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(1);
  /* Search */
  const [searchText, setSearchText] = useState('');
  /* ===================== CACHE =================== */
  const userCache = useRef<Map<string, any>>(new Map());
  const facilityCache = useRef<Map<string, any>>(new Map());
  const buildingCache = useRef<Map<string, any>>(new Map());
  /* ===================== DETAIL =================== */
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationView | null>(null);
  /* ===================== MAP RELATIONS ===================== */
  const mapReservationRelations = async (
    data: FacilityReservation[],
  ): Promise<ReservationView[]> => {
    if (!data.length) return [];

    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
    const facilityIds = [...new Set(data.map((r) => r.facility_id).filter(Boolean))];
    /* ===== USERS ===== */
    const missingUserIds = userIds.filter((id) => !userCache.current.has(id));
    if (missingUserIds.length) {
      const users = await Promise.all(missingUserIds.map((id) => getUserById(id)));
      users.forEach((res) => {
        if (res?.success) userCache.current.set(res.data.id, res.data);
      });
    }

    /* ===== FACILITIES ===== */
    const missingFacilityIds = facilityIds.filter((id) => !facilityCache.current.has(id));
    if (missingFacilityIds.length) {
      const facilities = await Promise.all(missingFacilityIds.map((id) => getFacilityByIdApi(id)));
      facilities.forEach((res) => {
        if (res?.success) facilityCache.current.set(res.data.id, res.data);
      });
    }

    /* ===== BUILDINGS ===== */
    const buildingIds = [
      ...new Set(
        facilityIds.map((id) => facilityCache.current.get(id)?.building_id).filter(Boolean),
      ),
    ];
    const missingBuildingIds = buildingIds.filter((id) => !buildingCache.current.has(id));
    if (missingBuildingIds.length) {
      const buildings = await Promise.all(missingBuildingIds.map((id) => getBuildingByIdApi(id)));
      buildings.forEach((res) => {
        if (res?.success) buildingCache.current.set(res.data.id, res.data);
      });
    }

    /* ===== FINAL MAP ===== */
    return data.map((r) => {
      const facility = facilityCache.current.get(r.facility_id);
      return {
        ...r,
        user: userCache.current.get(r.user_id),
        facility,
        building: facility ? buildingCache.current.get(facility.building_id) : undefined,
      };
    });
  };

  /* ===================== FETCH ===================== */
  const fetchReservations = async (p: number) => {
    if (loading) return;
    setLoading(true);

    try {
      const res: ResponseInterface = await getAllFacilityReservationApi({
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      const data = res.data.facilityReservations as FacilityReservation[];
      setTotalPage(res.data.pagination.total_page);

      const mapped = await mapReservationRelations(data);
      setReservations(mapped);
    } catch (e: any) {
      toast.error(e.message || 'Cannot load reservations');
    } finally {
      setLoading(false);
    }
  };

  /* ===================== EFFECT ===================== */
  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchReservations(page);
  }, [page, filters]);

  /* ===================== UI HELPERS ===================== */
  const statusConfig = {
    pending: { label: 'Pending', color: '#16a34a', bg: '#dcfce7' },
    reserved: { label: 'Reserved', color: '#9a3412', bg: '#ffedd5' },
    cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fee2e2' },
    expired: { label: 'Expired', color: '#6b7280', bg: '#f3f4f6' },
  } as const;

  const getStatusBadge = (status: FacilityReservationStatus) => (
    <Badge
      style={{
        backgroundColor: statusConfig[status].bg,
        color: statusConfig[status].color,
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {statusConfig[status].label}
    </Badge>
  );

  /* ===================== SEARCH ===================== */
  const handleSearchById = async () => {
    if (!searchText.trim()) {
      setPage(DEFAULT_PAGE);
      fetchReservations(DEFAULT_PAGE);
      return;
    }

    setLoading(true);
    try {
      const res = await getReservationByIdApi(searchText.trim());
      if (!res.success) {
        toast.error(res.message || 'Reservation not found');
        setReservations([]);
        setTotalPage(1);
        return;
      }

      const [mapped] = await mapReservationRelations([res.data]);
      setReservations([mapped]);
      setPage(1);
      setTotalPage(1);
    } catch (e: any) {
      toast.error(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Reservation Management</h1>
        <p className="text-muted-foreground">Manage and track reservations</p>
      </div>
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          {/* Input */}
          <Input
            placeholder="Search reservation ID..."
            value={searchText}
            className="h-10 pl-10 pr-10"
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchById();
            }}
          />
          {/* Overlay icons */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
            {/* Left icon */} <Search className="size-4 text-muted-foreground" />
          </div>
        </div>
        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(v: any) => setFilters((p) => ({ ...p, status: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value={FacilityReservationStatus.RESERVED}>Reserved</SelectItem>
            <SelectItem value={FacilityReservationStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-6">
        {reservations.map((r) => {
          const hours = durationHours(new Date(r.start_time), new Date(r.end_time));
          return (
            <Card key={r.id}>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>{r.facility?.name}</CardTitle>

                <div className="flex items-center gap-2">
                  {getStatusBadge(r.status)}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedReservation(r);
                      setOpenDetail(true);
                    }}
                  >
                    <Info className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  User: <strong>{r.user?.full_name}</strong>
                </p>
                <div className="flex gap-2 items-center">
                  <Calendar className="size-4" /> {formatDateVN(r.start_time)}
                </div>
                <div className="flex gap-2 items-center">
                  <Clock className="size-4" /> {formatTimeVN(r.start_time)} –
                  {formatTimeVN(r.end_time)} ({hours}h)
                </div>
                <div className="flex gap-2 items-center">
                  <MapPin className="size-4" /> {r.building?.name}
                </div>
                {r.facility?.facility_type !== FacilityType.ROOM && (
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Total</span> <strong>{r.total_amount} VND</strong>
                    </div>
                  </div>
                )}
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
      {reservations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No reservations found matching the search or filter criteria.
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setFilters({ status: 'all' });
              }}
            >
              View All
            </Button>
          </CardContent>
        </Card>
      )}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reservation Detail</DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Reservation ID:</strong> {selectedReservation.id}
              </p>

              <p>
                <strong>User:</strong> {selectedReservation.user?.full_name}
              </p>

              <p>
                <strong>Facility:</strong> {selectedReservation.facility?.name}
              </p>

              <p>
                <strong>Building:</strong> {selectedReservation.building?.name}
              </p>

              <p>
                <strong>Status:</strong> {statusConfig[selectedReservation.status].label}
              </p>

              <div className="flex gap-2 items-center">
                <Calendar className="size-4" />
                {formatDateVN(selectedReservation.start_time)}
              </div>

              <div className="flex gap-2 items-center">
                <Clock className="size-4" />
                {formatTimeVN(selectedReservation.start_time)} –{' '}
                {formatTimeVN(selectedReservation.end_time)}
              </div>

              {selectedReservation.facility?.facility_type !== FacilityType.ROOM && (
                <p>
                  <strong>Total:</strong> {selectedReservation.total_amount} VND
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
