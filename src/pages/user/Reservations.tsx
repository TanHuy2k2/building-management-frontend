import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar, Clock, Banknote, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Facility, FacilityStatus, GetFacilityParams, OrderDirection } from '../../types';
import { DEFAULT_ORDER_BY, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { getAllFacilityApi } from '../../services/facilityService';
import toast from 'react-hot-toast';
import { formatVND } from '../../utils/currency';
import { getPaginationNumbers } from '../../utils/pagination';

export default function UserReservations() {
  const [open, setOpen] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(1);
  const [filters, setFilters] = useState({ building_id: 'all', searchTerm: '' });
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);
  const [order, setOrder] = useState<OrderDirection>(OrderDirection.DESCENDING);

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

  const bookingHistory = [
    {
      id: 1,
      name: 'Tennis Court A',
      date: '2026-01-20',
      time: '08:00 - 10:00',
      base_price: 240000,
      status: 'Completed',
    },
    {
      id: 2,
      name: 'Meeting Room A',
      date: '2026-01-18',
      time: '13:00 - 15:00',
      base_price: 300000,
      status: 'Cancelled',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reservation History</DialogTitle>
            <DialogDescription>Your past facility reservations</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {bookingHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                No reservation history found
              </p>
            ) : (
              bookingHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{item.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {item.date} • {item.time}
                  </p>

                  <p className="text-sm font-semibold">{item.base_price.toLocaleString()} VND</p>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facility Reservations</h1>
          <p className="text-muted-foreground">Book sports fields or meeting rooms</p>
        </div>

        <Button onClick={() => setOpen(true)}>History</Button>
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search facility..."
          value={filters.searchTerm}
          onChange={(e) => setFilters((p) => ({ ...p, searchTerm: e.target.value }))}
        />
      </div>

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
                <Button onClick={() => setOpen(true)}>Reserve</Button>
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
