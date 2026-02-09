import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { Calendar, MapPin, Users, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getAllEventApi } from '../../../services/eventService';
import {
  EventBookingStatus,
  EventBookingUI,
  EventRegistrationStatus,
  OrderDirection,
} from '../../../types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, ENV } from '../../../utils/constants';
import { getPaginationNumbers } from '../../../utils/pagination';
import { formatDateVN, formatTimeVN } from '../../../utils/time';
import { Input } from '../../../components/ui/input';
import {
  getEventRegistrationByUserApi,
  registerEventApi,
} from '../../../services/eventRegistration';

export default function UpcomingEvents() {
  const [events, setEvents] = useState<EventBookingUI[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    event_title: '',
  });

  const fetchEvents = async (p: number = page) => {
    try {
      setLoading(true);

      const params = {
        ...(filters.event_title ? { event_title: filters.event_title } : {}),
        status: EventBookingStatus.APPROVED,
        page: p,
        page_size: DEFAULT_PAGE_SIZE,
        order_by: 'start_time',
        order: OrderDirection.ASCENDING,
      };
      const [eventRes, regRes] = await Promise.all([
        getAllEventApi(params),
        getEventRegistrationByUserApi(),
      ]);
      const registrations = regRes.data;
      const registeredIds = registrations
        .filter((r: any) => r.status === EventRegistrationStatus.REGISTERED)
        .map((r: any) => r.event_booking_id);
      const allEvents = eventRes.data.eventBookings;
      const filteredEvents = allEvents.filter((e: EventBookingUI) => !registeredIds.includes(e.id));
      setEvents(filteredEvents);
      setTotalPage(filteredEvents.length);
    } catch (err) {
      toast.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(DEFAULT_PAGE);
    fetchEvents(DEFAULT_PAGE);
  }, [filters]);

  useEffect(() => {
    fetchEvents(page);
  }, [page]);

  const handleRegister = async (eventId: string) => {
    try {
      const res = await registerEventApi(eventId);
      if (!res.success) {
        toast.error(res.message || 'Register failed');

        return;
      }

      toast.success('Registered successfully 🎉');

      fetchEvents(page);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Community Events</h1>
          <p className="text-muted-foreground">Join community activities</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <Input
          className="h-10 pl-10 pr-10"
          placeholder="Search facility..."
          value={filters.event_title}
          onChange={(e) => setFilters((p) => ({ ...p, event_title: e.target.value }))}
        />
        {/* Overlay icons */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
          <Search className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-muted-foreground">Loading events...</p>
      ) : (
        /* Events List */
        <div className="grid gap-6">
          {events.map((event) => {
            const spotsLeft = event.max_participants - event.current_participants;
            const percentFull = (event.current_participants / event.max_participants) * 100;

            return (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{event.event_title}</CardTitle>
                    <Badge className="bg-green-50 text-green-700" variant="outline">
                      Approved
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {event.image_url && (
                    <ImageWithFallback
                      src={`${ENV.BE_URL}/${event.image_url}`}
                      alt={event.event_title}
                      className="w-full max-h-[300px] sm:max-h-[180px] object-contain rounded-lg"
                    />
                  )}

                  <p className="text-muted-foreground">{event.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-4 text-muted-foreground" />
                      <span>{event.location || '—'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span>{formatDateVN(event.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>
                        {formatTimeVN(event.start_time)} - {formatTimeVN(event.end_time)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="size-4 text-muted-foreground" />
                      <span>
                        {event.current_participants}/{event.max_participants} participants
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          percentFull >= 90 ? 'bg-red-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percentFull}%` }}
                      />
                    </div>

                    {spotsLeft > 0 ? (
                      <p className="text-sm text-muted-foreground">{spotsLeft} spots left</p>
                    ) : (
                      <p className="text-sm text-red-600">Fully booked</p>
                    )}

                    <Button
                      className="w-full"
                      disabled={spotsLeft === 0}
                      onClick={() => handleRegister(event.id)}
                    >
                      {spotsLeft > 0 ? 'Register' : 'Full'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events available</p>
          </CardContent>
        </Card>
      )}

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
  );
}
