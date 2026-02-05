import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  EventBookingStatus,
  EventBookingUI,
  EventCardType,
  EventRegistration,
  EventRegistrationStatus,
} from '../../../types';
import { toast } from 'sonner';
import { cancelEventApi, getEventRegistrationByUserApi } from '../../../services/eventRegistration';
import { getAllEventApi, getEventByIdApi } from '../../../services/eventService';
import { formatTimeVN } from '../../../utils/time';
import { useAuth } from '../../../contexts/AuthContext';

export default function MyEvents() {
  const { currentUser } = useAuth();
  const [eventMap, setEventMap] = useState<Record<string, EventBookingUI>>({});
  const [joinedEvents, setJoinedEvents] = useState<EventBookingUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<EventBookingUI[]>([]);
  const [registrationMap, setRegistrationMap] = useState<Record<string, EventRegistration>>({});

  const fetchJoinedEvents = async () => {
    try {
      setLoading(true);

      const regRes = await getEventRegistrationByUserApi();
      if (!regRes.success) {
        toast.error(regRes.message);

        return;
      }

      const registrations = regRes.data;
      const eventIds = registrations.map((r: any) => r.event_booking_id);
      const missingIds = eventIds.filter((id: string) => !eventMap[id]);
      let newEvents: EventBookingUI[] = [];
      if (missingIds.length) {
        const eventResults = await Promise.all(missingIds.map((id: string) => getEventByIdApi(id)));
        newEvents = eventResults.filter((res) => res.success).map((res) => res.data);
      }

      const updatedMap = {
        ...eventMap,
        ...Object.fromEntries(newEvents.map((e) => [e.id, e])),
      };
      setEventMap(updatedMap);

      const regMap = Object.fromEntries(
        registrations.map((r: EventRegistration) => [r.event_booking_id, r]),
      );
      setRegistrationMap(regMap);

      const joined = eventIds.map((id: string) => updatedMap[id]).filter(Boolean);
      setJoinedEvents(joined);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch joined events');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatedEvents = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);

      const params = {
        created_by: currentUser?.id,
      };
      const res = await getAllEventApi(params);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setCreatedEvents(res.data.eventBookings);
    } catch (err) {
      toast.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchJoinedEvents();
    fetchCreatedEvents();
  }, [currentUser]);

  const eventStatusConfig: Record<
    EventBookingStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    [EventBookingStatus.PENDING]: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: <Clock className="size-3.5" />,
    },
    [EventBookingStatus.APPROVED]: {
      label: 'Approved',
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle className="size-3.5" />,
    },
    [EventBookingStatus.REJECTED]: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: <XCircle className="size-3.5" />,
    },
    [EventBookingStatus.EXPIRED]: {
      label: 'Expired',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: <Ban className="size-3.5" />,
    },
  };

  const handleCancelEvent = async (event_registration_id: string, event_booking_id: string) => {
    const ok = confirm('Are you sure you want to cancel this event?');
    if (!ok) return;

    try {
      const res = await cancelEventApi(event_registration_id, event_booking_id);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Event cancelled successfully');

      fetchJoinedEvents();
      fetchCreatedEvents();
    } catch (error) {
      toast.error('Cancel failed');
    }
  };

  const renderEventCard = (event: EventBookingUI, type: EventCardType) => {
    const status = eventStatusConfig[event.status];
    const eventRegistration = type === 'joined' ? registrationMap[event.id] : undefined;
    const isCancelled =
      type === 'joined' && eventRegistration?.status === EventRegistrationStatus.CANCELLED;

    return (
      <Card
        key={event.id}
        className={`transition rounded-xl border ${
          isCancelled ? 'opacity-60 bg-gray-200' : 'hover:shadow-lg'
        }`}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{event.event_title}</CardTitle>
            <p className="text-xs text-muted-foreground">{event.description}</p>
          </div>

          <Badge className={status.className}>
            {status.icon}
            {status.label}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>
              {formatTimeVN(event.start_time)} - {formatTimeVN(event.end_time)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span>{event.location || '-'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="size-4" />
            <span>
              {event.current_participants}/{event.max_participants}
            </span>
          </div>

          {/* Registered time chỉ show cho joined */}
          {type === 'joined' && eventRegistration && (
            <div className="flex items-center gap-2">
              <Clock className="size-4" />

              {!isCancelled ? (
                <span>
                  Registered at: {new Date(eventRegistration.created_at).toLocaleString('vi-VN')}
                </span>
              ) : (
                <span className="text-gray-600 font-semibold">
                  Canceled at: {new Date(eventRegistration.updated_at).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end items-center gap-2 pt-3 border-t">
            {/* JOINED TAB */}
            {type === 'joined' && (
              <>
                {event.status === EventBookingStatus.APPROVED &&
                  eventRegistration &&
                  !isCancelled && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancelEvent(eventRegistration.id, event.id)}
                    >
                      Cancel
                    </Button>
                  )}

                {isCancelled && (
                  <span className="text-xs text-gray-500 italic font-semibold">
                    You cancelled this event
                  </span>
                )}
              </>
            )}

            {/* CREATED TAB */}
            {type === 'created' && (
              <>
                {event.status === EventBookingStatus.PENDING && (
                  <Button size="sm" variant="secondary" disabled>
                    Waiting approval
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Events</h1>
          <p className="text-muted-foreground">Manage events you joined or created</p>
        </div>

        <Button>Create</Button>
      </div>

      <Tabs defaultValue="joined">
        <TabsList className="grid w-[300px] grid-cols-2">
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
        </TabsList>

        <TabsContent value="joined">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {joinedEvents.length ? (
              joinedEvents.map((e) => renderEventCard(e, 'joined'))
            ) : (
              <p className="text-muted-foreground">You haven’t joined any events yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="created">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {createdEvents.length ? (
              createdEvents.map((e) => renderEventCard(e, 'created'))
            ) : (
              <p className="text-muted-foreground">You haven’t created any events yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
