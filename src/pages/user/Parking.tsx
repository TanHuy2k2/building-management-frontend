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
  PaymentReferenceType,
  VATRate,
  PaymentStatus,
} from '../../types';
import { useLocation } from 'react-router-dom';
import { getAllBuildingApi } from '../../services/buildingService';
import { getAllParkingApi } from '../../services/parkingSpaceService';
import { calculatePayment, formatVND } from '../../utils/currency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  createParkingSubscriptionApi,
  getParkingSubscriptionsApi,
} from '../../services/parkingSubscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import PaymentMethodSelector from '../PaymentMethod';
import { calcMonthDuration } from '../../utils/time';

export default function UserParking() {
  const location = useLocation();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFloor, setActiveFloor] = useState<number | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [form, setForm] = useState<ParkingSubscriptionForm>({
    month_duration: 1,
    points_used: 0,
  });
  const { currentUser } = useAuth();
  const [parkingSubscriptionMap, setParkingSubscriptionMap] = useState<
    Record<string, ParkingSubscription[]>
  >({});
  const [selectedMySubscription, setSelectedMySubscription] = useState<ParkingSubscription | null>(
    null,
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [createdSubscription, setCreatedSubscription] = useState<{
    id: string;
    finalAmount: number;
  } | null>(null);
  const [open, setOpen] = useState(false);

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

      setCreatedSubscription({ id: res.data.id, finalAmount: res.data.finalAmount });
      setStep(2);
    } catch {
      toast.error('Failed to register parking');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const buildingId = params.get('buildingId');
    if (buildingId) {
      const foundBuilding = buildings.find((b) => b.id === buildingId);
      if (foundBuilding) {
        setSelectedBuilding(foundBuilding);
        fetchParkingSpaces(foundBuilding);
      }
    }

    if (paymentStatus === 'success') {
      toast.success('Payment successful!');
      setForm({ month_duration: 1, points_used: 0 });
      setStep(1);
      setCreatedSubscription({ id: '', finalAmount: 0 });
    } else if (paymentStatus === 'failed') {
      toast.error('Payment failed!');
    }

    if (paymentStatus) {
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, buildings]);

  const url = new URL(window.location.origin + location.pathname);
  if (selectedBuilding && selectedSpace) {
    url.searchParams.set('buildingId', selectedBuilding.id);
    url.searchParams.set('parkingId', selectedSpace.id);
  }
  const returnUrl = url.toString();

  const pricing = useMemo(() => {
    if (!selectedSpace) return null;

    const userPoints = currentUser?.points || 0;
    const amount = selectedSpace.base_price * form.month_duration;
    const { finalAmount, discount, pointsEarned, maxPointsUsed, finalPointsUsed, vatCharge } =
      calculatePayment(amount, currentUser?.rank, form.points_used, VATRate.DEFAULT);
    const maxPointsUsable = Math.min(userPoints, maxPointsUsed);

    return {
      amount,
      userPoints,
      finalAmount,
      discount,
      vatCharge,
      pointsEarned,
      finalPointsUsed,
      maxPointsUsable,
    };
  }, [selectedSpace, form.month_duration, form.points_used, currentUser]);

  /* ================= UI ================= */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/** DIALOG */}
      <Dialog
        open={open}
        onOpenChange={() => {
          setSelectedSpace(null);
          setForm({ id: '', month_duration: 1, points_used: 0 });
          setStep(1);
          setCreatedSubscription({ id: '', finalAmount: 0 });
          if (selectedBuilding) {
            fetchParkingSpaces(selectedBuilding);
          }
          setOpen(false);
          setSelectedMySubscription(null);
        }}
      >
        <DialogContent style={{ maxWidth: 760 }}>
          <DialogHeader>
            <DialogTitle>Parking Space Registration</DialogTitle>
            <DialogDescription>Complete form</DialogDescription>
          </DialogHeader>

          {/* STEP 1: RESERVATION FORM */}
          {step === 1 && selectedSpace && (
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
                    value={new Date(selectedMySubscription.start_date).toLocaleDateString()}
                  />
                  <InfoRow
                    label="End time"
                    value={new Date(selectedMySubscription.end_date).toLocaleDateString()}
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

                  {selectedMySubscription &&
                    selectedMySubscription.payment_status === PaymentStatus.PENDING && (
                      <>
                        <p className="text-sm text-yellow-600 mt-3">
                          You haven't paid for this invoice yet.
                        </p>
                        <div className="pt-1 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSpace(selectedSpace);
                              setForm({
                                id: selectedMySubscription.id,
                                start_date: selectedMySubscription.start_date,
                                month_duration: calcMonthDuration(
                                  selectedMySubscription.start_date,
                                  selectedMySubscription.end_date,
                                ),
                                points_used: selectedMySubscription.points_used,
                              });
                              setCreatedSubscription({
                                id: selectedMySubscription.id,
                                finalAmount: selectedMySubscription.total_amount,
                              });
                              setOpen(true);
                              setStep(2);
                            }}
                          >
                            Pay Now
                          </Button>
                        </div>
                      </>
                    )}
                </div>
              ) : (
                pricing &&
                (() => {
                  const userPoints = pricing.userPoints;
                  const maxPointsUsable = pricing.maxPointsUsable;
                  const pointsUsed = form.points_used;

                  return (
                    /* ================= RIGHT: REGISTER ================= */
                    <div
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Registration</h3>

                      <p className="text-xs text-muted-foreground">
                        You have: <span className="font-semibold">{userPoints}</span> points
                      </p>

                      {/* Start time */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>Start time</label>
                        <input
                          type="datetime-local"
                          style={inputStyle}
                          value={
                            form.start_date
                              ? new Date(form.start_date).toISOString().slice(0, 16)
                              : ''
                          }
                          onChange={(e) => {
                            setForm((prev) => ({
                              ...prev,
                              start_date: new Date(e.target.value) || undefined,
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
                              month_duration: Number(e.target.value),
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
                          max={maxPointsUsable}
                          style={inputStyle}
                          value={form.points_used}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            if (value > maxPointsUsable) {
                              setForm((prev) => ({
                                ...prev,
                                points_used: maxPointsUsable,
                              }));
                            } else if (value < 0) {
                              setForm((prev) => ({
                                ...prev,
                                points_used: 0,
                              }));
                            } else {
                              setForm((prev) => ({
                                ...prev,
                                points_used: Number(e.target.value),
                              }));
                            }
                          }}
                        />
                      </div>

                      {pointsUsed > 0 && pointsUsed <= maxPointsUsable && (
                        <p className="text-xs text-green-600">− {formatVND(pointsUsed * 1000)}</p>
                      )}

                      {pricing && (
                        <div className="border-t pt-3 space-y-2 text-sm pb-3">
                          <div className="flex justify-between text-red-500">
                            <span>Subtotal</span>
                            <span>{formatVND(pricing.amount)}</span>
                          </div>

                          <div className="flex justify-between text-red-500">
                            <span>Ranks discount</span>
                            <span>-{formatVND(pricing.discount)}</span>
                          </div>

                          <div className="flex justify-between text-red-500">
                            <span>VAT</span>
                            <span>+{formatVND(pricing.vatCharge)}</span>
                          </div>

                          {pricing?.finalPointsUsed > 0 && (
                            <div className="flex justify-between text-red-500">
                              <span>Membership points</span>
                              <span>-{formatVND(pricing?.finalPointsUsed * 1000)}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-semibold text-base pt-2 border-t">
                            <span>Estimated total</span>
                            <span>{formatVND(pricing?.finalAmount)}</span>
                          </div>

                          <div className="flex justify-between text-base pt-2 border-t">
                            <span>Points earned</span>
                            <span>{pricing.pointsEarned}</span>
                          </div>
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

                      <Button style={{ width: '100%' }} onClick={() => handleSubmit()}>
                        Continue to Payment
                      </Button>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 2 && createdSubscription && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="border rounded-lg p-4 bg-gray-50 space-y-1 text-sm">
                <p>
                  <b>Space:</b> {selectedSpace?.code}
                </p>
                <p>
                  <b>Start:</b> {form.start_date?.toLocaleString('vi-VN')}
                </p>
                <p>
                  <b>Duration:</b> {form.month_duration} months
                </p>
                <p>
                  <b>Total:</b> {formatVND(createdSubscription.finalAmount)}
                </p>
              </div>

              {/* Payment Method */}
              <PaymentMethodSelector
                amount={createdSubscription.finalAmount}
                reference_id={createdSubscription.id}
                reference_type={PaymentReferenceType.PARKING_SUBSCRIPTION}
                returnUrl={returnUrl}
              />
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
                                setOpen(true);

                                return;
                              }

                              if (!available) return;

                              setSelectedSpace(space);
                              setSelectedMySubscription(null);
                              setOpen(true);
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
