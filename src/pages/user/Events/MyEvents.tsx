import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock, Ban, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Building,
  EventBookingStatus,
  EventBookingUI,
  EventCardType,
  EventRegistration,
  EventRegistrationStatus,
  FacilityReservation,
} from '../../../types';
import { cancelEventApi, getEventRegistrationByUserApi } from '../../../services/eventRegistration';
import { createEventApi, getAllEventApi, getEventByIdApi } from '../../../services/eventService';
import { formatTimeVN } from '../../../utils/time';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { getReservationByUserApi } from '../../../services/facilityReservationService';
import { getFacilityByIdApi } from '../../../services/facilityService';
import toast from 'react-hot-toast';
import { getBuildingByIdApi } from '../../../services/buildingService';

export default function MyEvents() {
  const { currentUser } = useAuth();
  const [eventMap, setEventMap] = useState<Record<string, EventBookingUI>>({});
  const [joinedEvents, setJoinedEvents] = useState<EventBookingUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<EventBookingUI[]>([]);
  const [registrationMap, setRegistrationMap] = useState<Record<string, EventRegistration>>({});
  const [openCreate, setOpenCreate] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    event_title: '',
    description: '',
    location: '',
    facility_reservation_id: '',
    max_participants: 10,
    start_time: '',
    end_time: '',
    deadline: '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reservations, setReservations] = useState<FacilityReservation[]>([]);
  const [facilities, setFacilities] = useState<Record<string, any>>({});
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [buildings, setBuildings] = useState<Record<string, Building>>({});

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

  const LoadingView = () => (
    <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
      <Loader2 className="size-5 animate-spin" />
      <span>Loading events...</span>
    </div>
  );

  const fetchFacilities = async () => {
    try {
      setLoadingFacilities(true);

      const res = await getReservationByUserApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      const reservationsData = res.data;
      setReservations(reservationsData);

      const facilityIds = [
        ...new Set(reservationsData.map((r: FacilityReservation) => r.facility_id)),
      ];
      const facilityResults = await Promise.all(
        facilityIds.map((id: any) => getFacilityByIdApi(id)),
      );
      const facilityMap = Object.fromEntries(
        facilityResults.filter((r) => r.success).map((r) => [r.data.id, r.data]),
      );

      setFacilities(facilityMap);

      const buildingIds = [
        ...new Set(facilityResults.filter((r) => r.success).map((r) => r.data.building_id)),
      ];
      const buildingResults = await Promise.all(buildingIds.map((id) => getBuildingByIdApi(id)));
      const buildingMap = Object.fromEntries(
        buildingResults.filter((r) => r.success).map((r) => [r.data.id, r.data]),
      );

      setBuildings(buildingMap);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load facilities');
    } finally {
      setLoadingFacilities(false);
    }
  };

  const handleCreateEvent = async () => {
    let location = formData.location;
    if (formData.facility_reservation_id) {
      const reservation = reservations.find((r) => r.id === formData.facility_reservation_id);
      if (reservation) {
        const facility = facilities[reservation.facility_id];
        const building = buildings[facility?.building_id];
        if (facility) {
          location = `${facility.name} (${building.name})`;
        }
      }
    }

    const data = new FormData();
    if (selectedFile) data.append('event-images', selectedFile);
    data.append('event_title', formData.event_title);
    data.append('description', formData.description || '');
    data.append('location', location || '');
    data.append('facility_reservation_id', formData.facility_reservation_id || '');
    data.append('max_participants', String(formData.max_participants));
    data.append('start_time', formData.start_time);
    data.append('end_time', formData.end_time);
    data.append('deadline', formData.deadline);

    const res = await createEventApi(data);
    if (!res.success) {
      toast.error(res.message || 'Create event failed');

      return;
    }

    toast.success('Event created successfully');
    setFormData({
      image_url: '',
      event_title: '',
      description: '',
      location: '',
      facility_reservation_id: '',
      max_participants: 10,
      start_time: '',
      end_time: '',
      deadline: '',
    });
    setOpenCreate(false);
    fetchCreatedEvents();
  };

  useEffect(() => {
    if (openCreate) {
      fetchFacilities();
    }
  }, [openCreate]);

  return (
    <div className="space-y-6">
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent
          style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>
              Fill in the information below to create a new event.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Event Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setSelectedFile(file);

                    const preview = URL.createObjectURL(file);
                    setPreviewImage(preview);
                  }}
                />
              </div>
              {previewImage && (
                <img
                  src={previewImage}
                  alt="preview"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginTop: '8px',
                    border: '1px solid #ddd',
                  }}
                />
              )}

              <div className="space-y-1">
                <Label>Event Title *</Label>
                <Input
                  value={formData.event_title}
                  onChange={(e) => setFormData({ ...formData, event_title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {!formData.facility_reservation_id && (
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              {!formData.location && (
                <div className="space-y-1">
                  <Label>Facility</Label>
                  <Select
                    value={formData.facility_reservation_id}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        facility_reservation_id: value === 'none' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="none">-- None --</SelectItem>
                      {loadingFacilities && (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}

                      {reservations.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {facilities[r.facility_id]?.name}
                          {` (${buildings[facilities[r.facility_id]?.building_id]?.name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  step={5}
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({ ...formData, max_participants: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Events</h1>
          <p className="text-muted-foreground">Manage events you joined or created</p>
        </div>

        <Button disabled={loading} onClick={() => setOpenCreate(true)}>
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create
        </Button>
      </div>

      <Tabs defaultValue="joined">
        <TabsList className="grid w-[300px] grid-cols-2">
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
        </TabsList>

        <TabsContent value="joined">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {loading ? (
              <LoadingView />
            ) : joinedEvents.length ? (
              joinedEvents.map((e) => renderEventCard(e, 'joined'))
            ) : (
              <p className="text-muted-foreground">You haven’t joined any events yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="created">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {loading ? (
              <LoadingView />
            ) : createdEvents.length ? (
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
