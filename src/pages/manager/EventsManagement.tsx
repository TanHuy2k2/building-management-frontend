import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar, MapPin, Users, Clock, Search } from 'lucide-react';
import { EventBookingStatus, EventBookingUI, GetEventParams, OrderDirection } from '../../types';
import { getAllEventApi, updateEventStatusApi } from '../../services/eventService';
import toast from 'react-hot-toast';
import {
  DEFAULT_ORDER_BY,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_TOTAL,
} from '../../utils/constants';
import { getPaginationNumbers } from '../../utils/pagination';
import { getUserById } from '../../services/userService';
import { getFacilityByIdApi } from '../../services/facilityService';
import { getReservationByIdApi } from '../../services/facilityReservationService';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export default function EventsManagement() {
  const [events, setEvents] = useState<EventBookingUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', event_title: '' });
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);
  const [order, setOrder] = useState<OrderDirection>(OrderDirection.DESCENDING);
  const userCache = new Map<string, string>();
  const facilityCache = new Map<string, string>();
  const reservationCache = new Map<string, string>();

  const fetchEvents = async (p: number = page) => {
    try {
      const effectiveOrder = filters.event_title ? OrderDirection.ASCENDING : order;
      const params: GetEventParams = {
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.event_title ? { event_title: filters.event_title } : {}),
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        ...(orderBy ? { order_by: orderBy } : {}),
        ...(effectiveOrder ? { order: effectiveOrder } : {}),
      };
      const res = await getAllEventApi(params);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      const enrichedEvents: EventBookingUI[] = await Promise.all(
        res.data.eventBookings.map(async (event: any) => {
          let creator_name = userCache.get(event.created_by);
          if (!creator_name) {
            try {
              const userRes = await getUserById(event.created_by);
              if (userRes?.success) {
                creator_name = userRes.data.full_name;
                userCache.set(event.created_by, creator_name ?? '');
              }
            } catch {}
          }

          let facility_name = '—';
          if (event.facility_reservation_id) {
            let facilityId = reservationCache.get(event.facility_reservation_id);
            if (!facilityId) {
              const reservationRes = await getReservationByIdApi(event.facility_reservation_id);
              if (reservationRes?.success) {
                facilityId = reservationRes.data.facility_id;
                reservationCache.set(event.facility_reservation_id, facilityId ?? '');
              }
            }

            if (facilityId) {
              const cachedFacility = facilityCache.get(facilityId);
              if (cachedFacility) {
                facility_name = cachedFacility;
              } else {
                const facilityRes = await getFacilityByIdApi(facilityId);
                if (facilityRes?.success) {
                  facility_name = facilityRes.data.name;
                  facilityCache.set(facilityId, facility_name);
                }
              }
            }
          }

          return {
            ...event,
            start_time: new Date(event.start_time),
            end_time: new Date(event.end_time),
            deadline: new Date(event.deadline),
            created_at: new Date(event.created_at),
            updated_at: event.updated_at ? new Date(event.updated_at) : undefined,
            creator_name: creator_name || '—',
            facility_name,
          };
        }),
      );

      setEvents(enrichedEvents);
      setTotalPage(res.data.pagination.total_page);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchEvents(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [page]);

  const getStatusBadge = (status: EventBookingStatus) => {
    const variants = {
      [EventBookingStatus.PENDING]: 'secondary',
      [EventBookingStatus.APPROVED]: 'default',
      [EventBookingStatus.REJECTED]: 'destructive',
      [EventBookingStatus.EXPIRED]: 'outline',
    } as const;

    const labels = {
      [EventBookingStatus.PENDING]: 'Pending',
      [EventBookingStatus.APPROVED]: 'Approved',
      [EventBookingStatus.REJECTED]: 'Rejected',
      [EventBookingStatus.EXPIRED]: 'Expired',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const handleUpdateStatus = async (eventId: string, status: EventBookingStatus) => {
    try {
      const res = await updateEventStatusApi(eventId, status);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Update status successfully');

      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status } : e)));
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Event Management</h1>
        <p className="text-muted-foreground">Review and manage community events</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          {/* Input */}
          <Input
            placeholder="Search by event title..."
            value={filters.event_title}
            className="h-10 pl-10 pr-10"
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                event_title: e.target.value,
              }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchEvents(1);
              }
            }}
          />

          {/* Overlay icons */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
            <Search className="size-4 text-muted-foreground" />
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
            <SelectItem value={EventBookingStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={EventBookingStatus.APPROVED}>Approved</SelectItem>
            <SelectItem value={EventBookingStatus.REJECTED}>Rejected</SelectItem>
            <SelectItem value={EventBookingStatus.EXPIRED}>Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{event.event_title}</CardTitle>
                {getStatusBadge(event.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {event.description && <p className="text-sm">{event.description}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span>Booked by: {event.creator_name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{event.location || event.facility_name || '—'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{event.start_time.toLocaleDateString('en-GB')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    {event.start_time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {event.end_time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span>
                    {event.current_participants}/{event.max_participants} participants
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(event.current_participants / event.max_participants) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {event.status === EventBookingStatus.PENDING && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(event.id, EventBookingStatus.APPROVED)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateStatus(event.id, EventBookingStatus.REJECTED)}
                  >
                    Reject
                  </Button>
                </div>
              )}
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
    </div>
  );
}
