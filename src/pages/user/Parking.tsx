import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ParkingCircle, ArrowLeft, Building2, User } from 'lucide-react';
import {
  Building,
  GetParkingParams,
  OrderDirection,
  ParkingSubscriptionForm,
  ParkingSpace,
  ParkingSpaceStatus,
  ParkingSpaceType,
  ParkingSubscription,
  ParkingSubscriptionStatus,
} from '../../types';
import { getAllBuildingApi } from '../../services/buildingService';
import { getAllParkingApi } from '../../services/parkingSpaceService';
import { formatVND } from '../../utils/currency';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  createParkingSubscriptionApi,
  getParkingSubscriptionsApi,
} from '../../services/parkingSubscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function UserParking() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFloor, setActiveFloor] = useState<number | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [form, setForm] = useState<ParkingSubscriptionForm>({
    month_duration: 1,
    base_amount: 0,
  });
  const { currentUser } = useAuth();
  const [parkingSubscriptionMap, setParkingSubscriptionMap] = useState<
    Record<string, ParkingSubscription[]>
  >({});
  const [selectedMySubscription, setSelectedMySubscription] = useState<ParkingSubscription | null>(
    null,
  );

  /* ================= FETCH BUILDINGS ================= */
  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const res = await getAllBuildingApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setBuildings(res.data.buildings);
    } catch {
      toast.error('Failed to load buildings');
    }
  };

  const fetchParkingSpaces = async (building: Building) => {
    setLoading(true);
    try {
      const params: GetParkingParams = {
        building_id: building.id,
        order_by: 'code',
        order: OrderDirection.ASCENDING,
      };
      const res = await getAllParkingApi(params);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      const spaces = res.data;
      setParkingSpaces(spaces);

      const results = await Promise.all(
        spaces.map(async (space: ParkingSpace) => {
          const r = await getParkingSubscriptionsApi(String(space.id));
          if (!r.success) return [];

          return {
            spaceId: String(space.id),
            sub: r.data,
          };
        }),
      );

      const map: Record<string, ParkingSubscription[]> = {};
      results.forEach(({ spaceId, sub }) => {
        map[spaceId] = sub;
      });
      setParkingSubscriptionMap(map);
    } catch {
      toast.error('Failed to load parking spaces');
    } finally {
      setLoading(false);
    }
  };

  /* ================= SELECT BUILDING ================= */
  const handleSelectBuilding = async (building: Building) => {
    setSelectedBuilding(building);
    setLoading(true);
    fetchParkingSpaces(building);
  };

  /* ================= GROUP BY FLOOR -> AREA ================= */
  const groupedByFloor = useMemo(() => {
    const result: Record<number, Record<string, ParkingSpace[]>> = {};
    parkingSpaces.forEach((space) => {
      const floor = space.location.floor;
      const area = space.location.area;
      if (!result[floor]) result[floor] = {};

      if (!result[floor][area]) result[floor][area] = [];

      result[floor][area].push(space);
    });

    return result;
  }, [parkingSpaces]);

  const floors = useMemo(
    () =>
      Object.keys(groupedByFloor)
        .map(Number)
        .sort((a, b) => a - b),
    [groupedByFloor],
  );

  useEffect(() => {
    if (floors.length && activeFloor === null) {
      setActiveFloor(floors[0]);
    }
  }, [floors, activeFloor]);

  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
        fontSize: 14,
      }}
    >
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    marginBottom: 4,
    color: '#6b7280',
  };

  const inputStyle = {
    width: '100%',
    height: 36,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  };

  const handleSubmit = async () => {
    if (!selectedSpace) return;

    if (!form.month_duration || form.month_duration < 1) {
      toast.error('month_duration must be at least 1 month');

      return;
    }

    try {
      const res = await createParkingSubscriptionApi(String(selectedSpace.id), form);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Parking registered successfully');

      setSelectedSpace(null);
      setForm({ month_duration: 1, base_amount: 0 });
      if (selectedBuilding) {
        await fetchParkingSpaces(selectedBuilding);
      }
    } catch {
      toast.error('Failed to register parking');
    }
  };

  /* ================= UI ================= */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/** DIALOG */}
      <Dialog open={!!selectedSpace} onOpenChange={() => setSelectedSpace(null)}>
        <DialogContent style={{ maxWidth: 760 }}>
          <DialogHeader>
            <DialogTitle>Parking Space Registration</DialogTitle>
          </DialogHeader>

          {selectedSpace && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr',
                gap: 24,
              }}
            >
              {/* ================= LEFT: PARKING INFO ================= */}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Parking Information</h3>

                <InfoRow label="Code" value={selectedSpace.code} />
                <InfoRow label="Type" value={selectedSpace.type} />
                <InfoRow label="Floor" value={selectedSpace.location.floor} />
                <InfoRow label="Area" value={selectedSpace.location.area} />
                <InfoRow label="Price" value={`${formatVND(selectedSpace.base_price)}/month`} />
                <InfoRow label="Status" value={selectedSpace.status} />
              </div>

              {selectedMySubscription ? (
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Parking Invoice</h3>

                  <InfoRow label="Customer" value={currentUser?.full_name} />
                  <InfoRow
                    label="Start time"
                    value={new Date(selectedMySubscription.start_time).toLocaleDateString()}
                  />
                  <InfoRow
                    label="End time"
                    value={new Date(selectedMySubscription.end_time).toLocaleDateString()}
                  />

                  <hr style={{ margin: '12px 0' }} />

                  <InfoRow
                    label="Base amount"
                    value={formatVND(selectedMySubscription.base_amount)}
                  />
                  <InfoRow label="VAT" value={formatVND(selectedMySubscription.vat_charge)} />
                  <InfoRow
                    label="Discount"
                    value={`${formatVND(selectedMySubscription.discount)}`}
                  />
                  <InfoRow label="Points used" value={`${selectedMySubscription.points_used}`} />

                  <hr style={{ margin: '12px 0' }} />

                  <InfoRow
                    label="Total"
                    value={
                      <span style={{ fontSize: 16, fontWeight: 600 }}>
                        {formatVND(selectedMySubscription.total_amount)}
                      </span>
                    }
                  />

                  <InfoRow label="Points earned" value={selectedMySubscription.points_earned} />

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: '#6b7280',
                      textAlign: 'right',
                    }}
                  >
                    Created at:{' '}
                    {new Date(String(selectedMySubscription.created_at)).toLocaleString()}
                  </div>
                </div>
              ) : (
                /* ================= RIGHT: REGISTER ================= */
                <div
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Registration</h3>

                  {/* Start time */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Start time</label>
                    <input
                      type="date"
                      style={inputStyle}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          ['start_time']: e.target.value ? new Date(e.target.value) : undefined,
                        }));
                      }}
                    />
                  </div>

                  {/* Month month_duration */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Month</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 1, 3, 6"
                      style={inputStyle}
                      defaultValue={1}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          ['month_duration']: Number(e.target.value),
                        }));
                      }}
                    />
                  </div>

                  {/* Points */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Points used</label>
                    <input
                      type="number"
                      min={0}
                      defaultValue={0}
                      style={inputStyle}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          ['points_used']: Number(e.target.value),
                        }));
                      }}
                    />
                  </div>

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

                  <Button style={{ width: '100%' }} onClick={() => handleSubmit()}>
                    Register Parking
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= SELECT BUILDING ================= */}
      {!selectedBuilding && (
        <>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Select Building</h1>
            <p style={{ fontSize: 14, color: '#6b7280' }}>Choose a building to manage parking</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {buildings.map((building) => (
              <Card
                key={building.id}
                onClick={() => handleSelectBuilding(building)}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                }}
              >
                <CardContent style={{ padding: 16, display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Building2 size={20} color="#2563eb" />
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{building.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{building.address}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ================= PARKING ================= */}
      {selectedBuilding && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setSelectedBuilding(null);
                setParkingSpaces([]);
                setActiveFloor(null);
              }}
            >
              <ArrowLeft size={20} />
            </Button>

            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600 }}>{selectedBuilding.name}</h1>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Choose an available parking space</p>
            </div>
          </div>

          {/* ================= FLOOR TABS ================= */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 8,
            }}
          >
            {/* Previous */}
            {(() => {
              const isFirst = floors.indexOf(activeFloor!) === 0;

              return (
                <button
                  disabled={isFirst}
                  onClick={() => {
                    if (!isFirst) {
                      const index = floors.indexOf(activeFloor!);
                      setActiveFloor(floors[index - 1]);
                    }
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: isFirst ? '#f3f4f6' : '#fff',
                    opacity: isFirst ? 0.4 : 1,
                    cursor: isFirst ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  ‹
                </button>
              );
            })()}

            {/* Current floor */}
            <div
              style={{
                minWidth: 120,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Floor {activeFloor} / {floors.length}
            </div>

            {/* Next */}
            {(() => {
              const isLast = floors.indexOf(activeFloor!) === floors.length - 1;

              return (
                <button
                  disabled={isLast}
                  onClick={() => {
                    if (!isLast) {
                      const index = floors.indexOf(activeFloor!);
                      setActiveFloor(floors[index + 1]);
                    }
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: isLast ? '#f3f4f6' : '#fff',
                    opacity: isLast ? 0.4 : 1,
                    cursor: isLast ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  ›
                </button>
              );
            })()}
          </div>

          {/* ================= FLOOR CONTENT ================= */}
          {loading ? (
            <p style={{ color: '#6b7280' }}>Loading parking spaces...</p>
          ) : (
            activeFloor !== null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {Object.entries(groupedByFloor[activeFloor]).map(([area, spaces]) => (
                  <div key={area}>
                    {/* Area title */}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: 8,
                      }}
                    >
                      Area {area}
                    </div>

                    {/* Slots */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                        gap: 12,
                      }}
                    >
                      {spaces.map((space) => {
                        const available = space.status === ParkingSpaceStatus.AVAILABLE;
                        const reserved = space.status === ParkingSpaceStatus.RESERVED;
                        const subscriptions = parkingSubscriptionMap[String(space.id)] ?? [];
                        const mySubscription = subscriptions.find(
                          (sub) =>
                            sub.status === ParkingSubscriptionStatus.RESERVED &&
                            sub.user_id === currentUser?.id,
                        );
                        const isMine =
                          !!currentUser &&
                          subscriptions.some(
                            (sub) =>
                              sub.status === ParkingSubscriptionStatus.RESERVED &&
                              sub.user_id === currentUser.id,
                          );

                        return (
                          <Card
                            key={space.id}
                            onClick={() => {
                              if (isMine && mySubscription) {
                                setSelectedSpace(space);
                                setSelectedMySubscription(mySubscription);

                                return;
                              }

                              if (!available) return;

                              setForm((prev) => ({
                                ...prev,
                                base_amount: space.base_price,
                              }));
                              setSelectedSpace(space);
                            }}
                            style={{
                              background: available ? '#bbf7d0' : reserved ? '#fecaca' : '#e5e7eb',
                              textAlign: 'center',
                              cursor: available && !isMine ? 'pointer' : 'default',
                              position: 'relative',
                            }}
                          >
                            <CardContent style={{ padding: 12 }}>
                              {isMine && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 6,
                                    right: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    background: '#2563eb',
                                    color: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: 999,
                                    fontWeight: 500,
                                  }}
                                >
                                  <User size={12} />
                                  You
                                </div>
                              )}

                              <ParkingCircle
                                style={{
                                  width: 24,
                                  height: 24,
                                  margin: '0 auto 6px',
                                  color: available ? '#16a34a' : reserved ? '#dc2626' : '#6b7280',
                                }}
                              />
                              <div style={{ fontWeight: 600 }}>{space.code}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>
                                {space.type === ParkingSpaceType.CAR ? '🚗 Car' : '🛵 Motorbike'}
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>
                                {formatVND(space.base_price)}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
