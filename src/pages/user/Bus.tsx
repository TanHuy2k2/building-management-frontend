import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { MapPin, Clock, Info, LucideTableRowsSplit, DivideCircleIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Bus, BusRoute, BusSeat, BusSeatStatus, BusSubscriptionForm } from '../../types';
import { getAllBusRouteApi } from '../../services/busRouteService';
import toast from 'react-hot-toast';
import { formatVND } from '../../utils/currency';
import { getBusByIdApi } from '../../services/busService';
import RouteMap from '../manager/busRoute/BusRouteMap';
import { createBusSubscriptionApi } from '../../services/busSubscription';

export default function UserBus() {
  const [open, setOpen] = useState(false);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(routes[0]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailBuses, setDetailBuses] = useState<Bus[]>([]);
  const [detailBusId, setDetailBusId] = useState<string>('');
  const [form, setForm] = useState<BusSubscriptionForm>({
    route_id: '',
    bus_id: '',
    start_time: undefined,
    month_duration: 1,
    base_amount: 0,
    seat_number: '',
    points_used: 0,
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      setForm((prev) => ({
        ...prev,
        route_id: selectedRoute.id,
        bus_id: selectedRoute.bus_id?.[0] ?? '',
        base_amount: selectedRoute.base_price,
      }));
    }
  }, [selectedRoute]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await getAllBusRouteApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setRoutes(res.data);
    } catch (error: any) {
      toast.error('Fetch bus routes error: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = async (route: BusRoute) => {
    setSelectedRoute(route);
    setOpen(true);
    setSelectedSeat(null);
    setSelectedBusId('');
    setBuses([]);

    if (!route.bus_id || !route.bus_id.length) return;

    const results = await Promise.all(route.bus_id.map((id) => getBusByIdApi(id)));
    const busList = results.filter((r) => r.success).map((r) => r.data);
    setBuses(busList);

    if (busList.length) {
      setSelectedBusId(busList[0].id);
    }
  };

  // ================= SEATS =================
  const SeatItem = ({
    seat,
    selectedSeat,
    onSelect,
  }: {
    seat: BusSeat;
    selectedSeat: string | null;
    onSelect: (seat: BusSeat) => void;
  }) => {
    if (!seat) return <div style={{ width: 36, height: 36 }} />;

    const isReserved = seat.status === BusSeatStatus.RESERVED;
    const isSelected = selectedSeat === seat.seat_number;
    const style = {
      backgroundColor: isReserved ? '#ef4444' : isSelected ? '#3b82f6' : '#22c55e',
      color: '#fff',
      cursor: isReserved ? 'not-allowed' : 'pointer',
      opacity: isReserved ? 0.6 : 1,
    };

    return (
      <div
        onClick={() => {
          if (isReserved) return;

          onSelect(seat);
        }}
        style={{
          ...style,
          width: 36,
          height: 36,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          position: 'relative',
        }}
        title={`Seat ${seat.seat_number} - ${seat.status}`}
      >
        {isSelected ? '✓' : seat.seat_number}
      </div>
    );
  };

  const SeatLegend = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontSize: 14,
        marginTop: 24,
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: '#22c55e',
            display: 'inline-block',
          }}
        />
        <span>Available</span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: '#ef4444',
            display: 'inline-block',
          }}
        />
        <span>Reserved</span>
      </div>
    </div>
  );

  const SeatGrid = ({
    seats,
    selectedSeat,
    onSelectSeat,
  }: {
    seats: BusSeat[];
    selectedSeat: string | null;
    onSelectSeat: (seat: BusSeat) => void;
  }) => {
    if (seats.length < 12) {
      const rows: BusSeat[][] = [];
      for (let i = 0; i < seats.length; i += 2) {
        rows.push(seats.slice(i, i + 2));
      }

      return (
        <div style={{ marginTop: 12 }}>
          {rows.map((row, rowIndex) => {
            const isLastSingle = row.length === 1;

            return (
              <div
                key={rowIndex}
                style={{
                  display: 'flex',
                  justifyContent: isLastSingle ? 'center' : 'space-between',
                  width: 120,
                  margin: '0 auto 8px',
                }}
              >
                {row[0] && (
                  <SeatItem seat={row[0]} selectedSeat={selectedSeat} onSelect={onSelectSeat} />
                )}

                {!isLastSingle && row[1] && (
                  <SeatItem seat={row[1]} selectedSeat={selectedSeat} onSelect={onSelectSeat} />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    const rows: BusSeat[][] = [];
    for (let i = 0; i < seats.length; i += 4) {
      rows.push(seats.slice(i, i + 4));
    }

    return (
      <div style={{ marginTop: 12 }}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 2 }}>
              {row
                .slice(0, 2)
                .map(
                  (seat) =>
                    seat && (
                      <SeatItem
                        key={seat.seat_number}
                        seat={seat}
                        selectedSeat={selectedSeat}
                        onSelect={onSelectSeat}
                      />
                    ),
                )}
            </div>
            <div style={{ width: 24 }} />
            <div style={{ display: 'flex', gap: 2 }}>
              {row
                .slice(2, 4)
                .map(
                  (seat) =>
                    seat && (
                      <SeatItem
                        key={seat.seat_number}
                        seat={seat}
                        selectedSeat={selectedSeat}
                        onSelect={onSelectSeat}
                      />
                    ),
                )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const BusSeatLayout = ({
    seats,
    selectedSeat,
    onSelectSeat,
  }: {
    seats: BusSeat[];
    capacity: number;
    selectedSeat: string | null;
    onSelectSeat: (seat: BusSeat) => void;
  }) => (
    <div className="border rounded-xl p-4 bg-background">
      <div className="text-xs font-medium mb-2 flex items-center gap-2">🧑 Driver</div>
      <SeatGrid seats={seats} selectedSeat={selectedSeat} onSelectSeat={onSelectSeat} />
    </div>
  );

  const renderReadonlySeats = (seats: BusSeat[]) => {
    const rows: BusSeat[][] = [];

    if (seats.length < 12) {
      for (let i = 0; i < seats.length; i += 2) {
        rows.push(seats.slice(i, i + 2));
      }
    } else {
      for (let i = 0; i < seats.length; i += 4) {
        rows.push(seats.slice(i, i + 4));
      }
    }

    return rows.map((row, idx) => {
      if (row.length === 2) {
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: 120,
              marginBottom: 8,
            }}
          >
            {row.map((seat) => renderSeatBox(seat))}
          </div>
        );
      }

      return (
        <div
          key={idx}
          style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}
        >
          <div style={{ display: 'flex', gap: 2 }}>
            {row.slice(0, 2).map((seat) => renderSeatBox(seat))}
          </div>
          <div style={{ width: 24 }} />
          <div style={{ display: 'flex', gap: 2 }}>
            {row.slice(2, 4).map((seat) => renderSeatBox(seat))}
          </div>
        </div>
      );
    });
  };

  const renderSeatBox = (seat: BusSeat) => (
    <div
      key={seat.seat_number}
      style={{
        width: 36,
        height: 36,
        borderRadius: 6,
        backgroundColor: seat.status === BusSeatStatus.AVAILABLE ? '#22c55e' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
      }}
      title={`Seat ${seat.seat_number} - ${seat.status}`}
    >
      {seat.seat_number}
    </div>
  );

  const selectedBus = buses.find((b) => b.id === selectedBusId);

  const handleSubmit = async () => {
    if (!form.route_id || !form.bus_id || !form.seat_number || !form.start_time) {
      toast.error('Please fill all required fields');

      return;
    }

    try {
      const res = await createBusSubscriptionApi(form);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Subscription created');

      setOpen(false);
      setForm({
        route_id: '',
        bus_id: '',
        start_time: undefined,
        month_duration: 1,
        base_amount: 0,
        seat_number: '',
      });
    } catch (err) {
      toast.error('Create failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Dialog booking */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bus Reservation</DialogTitle>
            <DialogDescription>Select seat and confirm information</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* ================= LEFT : SEATS ================= */}
            <div>
              {selectedBus && (
                <>
                  <BusSeatLayout
                    seats={selectedBus.seats || []}
                    capacity={selectedBus.capacity}
                    selectedSeat={selectedSeat}
                    onSelectSeat={(seat) => {
                      setSelectedSeat(seat.seat_number);
                      setForm((prev) => ({
                        ...prev,
                        seat_number: String(seat.seat_number),
                      }));
                    }}
                  />
                  <SeatLegend />
                </>
              )}
            </div>

            {/* ================= RIGHT : INFO FORM ================= */}
            <div className="space-y-4">
              <div>
                <Label>Route</Label>
                <Input disabled value={selectedRoute?.route_name || ''} />
              </div>

              <div>
                <Label>Departure Time</Label>
                <Input
                  disabled
                  value={
                    selectedRoute?.departure_time
                      ? new Date(selectedRoute.departure_time).toLocaleTimeString()
                      : ''
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Bus</Label>
                <Select
                  value={selectedBusId}
                  onValueChange={(value: string) => {
                    setSelectedBusId(value);
                    setSelectedSeat(null);
                    setForm((prev) => ({
                      ...prev,
                      bus_id: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id}>
                        {bus.type_name} - {bus.plate_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Seat Number</Label>
                <Input
                  disabled
                  type="number"
                  min={0}
                  value={selectedSeat ? String(selectedSeat) : 0}
                />
              </div>

              {/* Start time */}
              <div>
                <Label>Start time</Label>
                <Input
                  type="date"
                  value={form.start_time ? form.start_time.toISOString().slice(0, 10) : ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      start_time: new Date(e.target.value),
                    }))
                  }
                />
              </div>

              {/* Month month_duration */}
              <div>
                <Label>Month Duration</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 1, 3, 6"
                  value={form.month_duration}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      month_duration: Number(e.target.value),
                      base_amount: form.base_amount * Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog detail */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent style={{ maxWidth: 1200 }}>
          <DialogHeader>
            <DialogTitle>Route Detail</DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', gap: 16, height: 520 }}>
            {/* LEFT MAP */}
            <div
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                overflow: 'auto',
              }}
            >
              <h4>🗺 Map</h4>
              <div style={{ flex: 1, height: 420 }}>
                <RouteMap stops={selectedRoute?.stops || []} />
              </div>
            </div>

            {/* CENTER INFO */}
            <div
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                overflow: 'auto',
              }}
            >
              <h4 style={{ marginBottom: 6 }}>🚌 Route Info</h4>
              <p style={{ marginBottom: 6 }}>
                <b>Name:</b> {selectedRoute?.route_name}
              </p>
              <p style={{ marginBottom: 6 }}>
                <b>Code:</b> {selectedRoute?.route_code}
              </p>
              <p style={{ marginBottom: 6 }}>
                <b>Departure:</b>{' '}
                {selectedRoute && new Date(selectedRoute.departure_time).toLocaleTimeString()}
              </p>
              <p style={{ marginBottom: 6 }}>
                <b>Duration:</b> {selectedRoute?.estimated_duration} minutes
              </p>
              <p>
                <b>Price:</b> {formatVND(selectedRoute?.base_price || 0)}/month
              </p>

              <div style={{ marginTop: 12 }}>
                <b style={{ marginBottom: 6 }}>Stops:</b>
                <ul>
                  {selectedRoute?.stops?.map((stop) => (
                    <li key={stop.stop_id}>
                      {stop.order}. {stop.stop_name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* SELECT BUS */}
              <div style={{ marginTop: 16 }}>
                <b>Select Bus:</b>
                <select
                  style={{
                    marginTop: 8,
                    width: '100%',
                    padding: 6,
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                  }}
                  value={detailBusId}
                  onChange={(e) => setDetailBusId(e.target.value)}
                >
                  {detailBuses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.type_name} - {bus.plate_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RIGHT SEATS (READ ONLY) */}
            <div
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                overflow: 'auto',
              }}
            >
              {detailBuses.length > 0 && (
                <>
                  <div style={{ marginBottom: 8 }}>🧑 Driver</div>

                  {renderReadonlySeats(detailBuses.find((b) => b.id === detailBusId)?.seats || [])}

                  {/* legend */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 16, height: 16, background: '#22c55e' }} />
                      Available
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 16, height: 16, background: '#ef4444' }} />
                      Reserved
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Component */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bus Reservation</h1>
          <p className="text-muted-foreground">Book a bus seat</p>
        </div>
        <Button
          onClick={() => {
            setSelectedSeat(null);
            setOpen(true);
          }}
        >
          History
        </Button>
      </div>

      {/* Routes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Routes</h2>
        {loading ? (
          <p>Loading routes...</p>
        ) : (
          routes.map((route) => {
            const startStop = route.stops?.[0];
            const endStop = route.stops?.[route.stops.length - 1];

            return (
              <Card key={route.id} className="relative">
                {/* Info */}
                <button
                  onClick={async () => {
                    setSelectedRoute(route);
                    setOpenDetail(true);

                    if (!route.bus_id?.length) return;

                    const results = await Promise.all(route.bus_id.map((id) => getBusByIdApi(id)));
                    const busList = results.filter((r) => r.success).map((r) => r.data);
                    setDetailBuses(busList);

                    if (busList.length) setDetailBusId(busList[0].id);
                  }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  title="View detail"
                >
                  <Info size={20} color="#6b7280" />
                </button>

                <CardHeader>
                  <CardTitle className="text-base">{route.route_name}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="size-4 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Start Point</p>
                          <p className="text-sm text-muted-foreground">{startStop?.stop_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="size-4 text-red-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">End Point</p>
                          <p className="text-sm text-muted-foreground">{endStop?.stop_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <span className="text-sm">{route.estimated_duration} minutes</span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{formatVND(route.base_price)}/month</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Stops:</p>
                    <div className="flex flex-wrap gap-2">
                      {route.stops?.map((stop) => (
                        <Badge key={stop.stop_id} variant="outline">
                          {stop.order}. {stop.stop_name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      onClick={() => {
                        setOpen(true);
                        handleBookNow(route);
                      }}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Book at least 2 hours in advance</p>
          <p>• Free cancellation up to 1 hour before departure</p>
          <p>• Arrive at pickup point 5 minutes early</p>
        </CardContent>
      </Card>
    </div>
  );
}
