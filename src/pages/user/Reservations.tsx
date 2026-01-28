import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Calendar, Clock, Banknote, Search, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Facility,
  FacilityReservation,
  FacilityReservationForm,
  FacilityReservationStatus,
  FacilityStatus,
  FacilityType,
  GetFacilityParams,
  OrderDirection,
  ViewMode,
} from '../../types';
import { DEFAULT_ORDER_BY, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { getAllFacilityApi, getFacilityByIdApi } from '../../services/facilityService';
import toast from 'react-hot-toast';
import { formatVND } from '../../utils/currency';
import { getPaginationNumbers } from '../../utils/pagination';
import {
  createFacilityReservationApi,
  getReservationByUserApi,
} from '../../services/facilityReservationService';
import { durationHours } from '../../utils/time';

export default function UserReservations() {
  const [openReserve, setOpenReserve] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(1);
  const [filters, setFilters] = useState({
    building_id: 'all',
    searchTerm: '',
  });
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);
  const [order, setOrder] = useState<OrderDirection>(OrderDirection.DESCENDING);
  const initialForm: FacilityReservationForm = {
    facility_id: '',
    hour_duration: 1,
    points_used: 0,
  };
  const [form, setForm] = useState<FacilityReservationForm>(initialForm);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('reserve');
  const [myReservations, setMyReservations] = useState<FacilityReservation[]>([]);
  const [facilityMap, setFacilityMap] = useState<Record<string, Facility>>({});

  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchFacilities(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchFacilities();
  }, [page]);

  const fetchFacilities = async (p: number = page) => {
    try {
      setLoading(true);
      const effectiveOrder = filters.searchTerm ? OrderDirection.ASCENDING : order;
      const params: GetFacilityParams = {
        ...{ status: FacilityStatus.AVAILABLE },
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'reserve') {
      fetchFacilities(DEFAULT_PAGE);
    }

    const fetchHistory = async () => {
      try {
        const res = await getReservationByUserApi();
        if (!res.success) {
          toast.error(res.message);

          return;
        }

        setMyReservations(res.data);

        const facilityIds = [...new Set(res.data.map((r: FacilityReservation) => r.facility_id))];

        const facilityResponses = await Promise.all(
          facilityIds.map((id) => getFacilityByIdApi(String(id))),
        );
        const map: Record<string, Facility> = {};
        facilityResponses.forEach((fRes) => {
          if (fRes.success) {
            map[fRes.data.id] = fRes.data;
          }
        });

        setFacilityMap(map);
      } catch {
        toast.error('Cannot get facility reservation history!');
      }
    };

    fetchHistory();
  }, [viewMode]);

  const handleReserve = async () => {
    if (!selectedFacility) return;

    try {
      setLoading(true);

      const res = await createFacilityReservationApi({ ...form, facility_id: selectedFacility.id });
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Reservation created successfully');

      setOpenReserve(false);
      setForm(initialForm);
      setSelectedFacility(null);

      fetchFacilities();
    } catch (error) {
      toast.error('Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const RESERVATION_STATUS_CONFIG: Record<
    FacilityReservationStatus,
    { label: string; className: string }
  > = {
    [FacilityReservationStatus.PENDING]: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700',
    },

    [FacilityReservationStatus.RESERVED]: {
      label: 'Reserved',
      className: 'bg-green-100 text-green-700',
    },

    [FacilityReservationStatus.CANCELLED]: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700',
    },

    [FacilityReservationStatus.EXPIRED]: {
      label: 'Expired',
      className: 'bg-gray-100 text-gray-600',
    },
  };

  return (
    <div className="space-y-6">
      {/* Reserve Dialog */}
      <Dialog open={openReserve} onOpenChange={setOpenReserve}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reserve Facility</DialogTitle>
            <DialogDescription>{selectedFacility?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={form.start_date ? new Date(form.start_date).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: new Date(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (hours)</Label>
              <Input
                type="number"
                min={1}
                value={form.hour_duration}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    hour_duration: Number(e.target.value),
                  }))
                }
              />
            </div>

            {selectedFacility?.facility_type !== FacilityType.ROOM && (
              <div className="space-y-2">
                <Label>Points Used</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.points_used}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      points_used: Number(e.target.value),
                    }))
                  }
                />
              </div>
            )}

            {/* Note */}
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                marginBottom: 16,
                fontStyle: 'italic',
              }}
            >
              * If start time is not selected, the parking will start from tomorrow.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenReserve(false);
                  setSelectedFacility(null);
                }}
              >
                Cancel
              </Button>

              <Button onClick={handleReserve} disabled={loading}>
                {loading ? 'Reserving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facility Reservations</h1>
          <p className="text-muted-foreground">Book sports fields or meeting rooms</p>
        </div>

        <Button onClick={() => setViewMode((prev) => (prev === 'reserve' ? 'history' : 'reserve'))}>
          {viewMode === 'reserve' ? 'History' : 'Back to Reserve'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Input
          className="h-10 pl-10 pr-10"
          placeholder="Search facility..."
          value={filters.searchTerm}
          onChange={(e) => setFilters((p) => ({ ...p, searchTerm: e.target.value }))}
        />
        {/* Overlay icons */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
          <Search className="size-4 text-muted-foreground" />
        </div>
      </div>

      {viewMode === 'reserve' && (
        <div>
          {/* Facility List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((facility: Facility) => (
              <Card key={facility.id} className="relative">
                <span
                  className={`absolute right-4 mt-3 size-3 rounded-full bg-green-600`}
                  title={facility.status}
                />
                <CardHeader>
                  <CardTitle className="text-base">{facility.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{facility.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span>Book at least 1 day in advance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>Cancel at least 1 hour before</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    {facility.base_price ? (
                      <div className="flex items-center gap-2">
                        <Banknote className="size-4 text-muted-foreground" />
                        <span className="font-semibold">{`${formatVND(facility.base_price)}/hour`}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2"></div>
                    )}
                    <Button
                      disabled={facility.status !== 'available'}
                      onClick={() => {
                        setSelectedFacility(facility);
                        setForm((prev) => ({
                          ...prev,
                        }));
                        setOpenReserve(true);
                      }}
                    >
                      Reserve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
        </div>
      )}

      {viewMode === 'history' && (
        <div className="space-y-3">
          {myReservations.map((r) => {
            const facility = facilityMap[r.facility_id];
            const statusConfig = RESERVATION_STATUS_CONFIG[r.status];
            const location = facility.location ?? null;

            return (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{facility?.name || 'Unknown facility'}</p>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        statusConfig?.className ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusConfig?.label ?? r.status}
                    </span>
                  </div>

                  {/* Info */}
                  {location ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      Location: {location.area} - Floor {location.floor} (
                      {location.outdoor ? 'Outdoor' : 'Indoor'})
                    </div>
                  ) : (
                    ''
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {new Date(r.start_time).toLocaleString()}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Duration: {durationHours(r.start_time, r.end_time)} hours
                  </div>

                  {/* Price */}
                  {r.base_amount ? (
                    <p className="text-sm font-semibold pt-1">{formatVND(r.base_amount)}</p>
                  ) : (
                    ''
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Created:
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Reservation Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Reservations must be made at least 1 day in advance</p>
          <p>• Cancellations must be made at least 1 hour in advance for a refund</p>
        </CardContent>
      </Card>
    </div>
  );
}
