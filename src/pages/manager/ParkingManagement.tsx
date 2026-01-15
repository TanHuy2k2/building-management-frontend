import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Building2, ParkingCircle, ArrowLeft } from 'lucide-react';
import { Building, GetParkingParams, ParkingSpace, User } from '../../types';
import toast from 'react-hot-toast';
import { getAllBuildingApi } from '../../services/buildingService';
import { getAllParkingApi, getAllParkingSpaceStatsApi } from '../../services/parkingSpaceService';
import { ParkingSubscription } from '../../types/parkingSubscription';
import {
  getCurrentParkingSubscriptionApi,
  getParkingSubscriptionsApi,
} from '../../services/parkingSubscriptionService';
import { getUserById } from '../../services/userService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { formatVND } from '../../utils/currency';

export default function ParkingManagement() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(false);
  const [parkingSlots, setParkingSlots] = useState<ParkingSpace[]>([]);
  const [parkingStats, setParkingStats] = useState({
    total: 0,
    available: 0,
    maintenance: 0,
    reserved: 0,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSpace | null>(null);
  const [subscription, setSubscription] = useState<ParkingSubscription | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ParkingSubscription[]>([]);
  const isReserved = selectedSlot?.status === 'reserved';

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const res = await getAllBuildingApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setBuildings(res.data.buildings);
    } catch (err) {
      toast.error('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBuilding = async (building: Building) => {
    setSelectedBuilding(building);
    await Promise.all([fetchParkingByBuilding(building.id), fetchParkingStats(building.id)]);
  };

  const fetchParkingStats = async (buildingId: string) => {
    try {
      const params: GetParkingParams = {
        building_id: buildingId,
      };
      const parkingStatRes = await getAllParkingSpaceStatsApi(params);
      if (!parkingStatRes.success) {
        toast.error(parkingStatRes.message);

        return;
      }

      setParkingStats(parkingStatRes.data);
    } catch (error) {
      toast.error('Failed to load parking statistics');
    }
  };

  const fetchParkingByBuilding = async (buildingId: string) => {
    try {
      const params: GetParkingParams = {
        building_id: buildingId,
      };
      const res = await getAllParkingApi(params);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setParkingSlots(res.data);
    } catch (error) {
      toast.error('Failed to load parking data');
    }
  };

  /* =======================
   * SELECT BUILDING VIEW
   ======================= */
  if (!selectedBuilding) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Select Building
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            Choose a building to manage parking
          </p>
        </div>

        {loading ? (
          <p
            style={{
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            Loading buildings...
          </p>
        ) : (
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
                  height: '100%',
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <CardContent
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      width: '100%',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={20} color="#2563eb" />
                    </div>

                    {/* Text */}
                    <div
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {building.name}
                      </div>

                      {building.address && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#6b7280',
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {building.address}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const parkingStatusUI = {
    available: {
      borderColor: '#16a34a',
      backgroundColor: '#dcfce7',
      iconColor: '#002b10ff',
    },
    reserved: {
      borderColor: '#dc2626',
      backgroundColor: '#fee2e2',
      iconColor: '#b91c1c',
    },
    maintenance: {
      borderColor: '#ca8a04',
      backgroundColor: '#fef9c3',
      iconColor: '#a16207',
    },
    DEFAULT: {
      borderColor: '#d1d5db',
      backgroundColor: '#ffffff',
      iconColor: '#6b7280',
    },
  } as const;

  const handleSelectSlot = async (slot: ParkingSpace) => {
    setSelectedSlot(slot);
    setSubscription(null);
    setUser(null);
    setOpenDialog(true);

    if (slot.status !== 'reserved') return;

    try {
      const subRes = await getCurrentParkingSubscriptionApi(String(slot.id));
      if (!subRes.success || !subRes.data) {
        toast.error(subRes.message);

        return;
      }

      const subscription = subRes.data[0];
      setSubscription(subscription);

      const userRes = await getUserById(subscription.user_id);
      if (!userRes.success) {
        toast.error(userRes.message);

        return;
      }

      setUser(userRes.data);
    } catch (err) {
      toast.error('Failed to load reservation detail');
    }
  };

  const InfoRow = ({ label, value }: { label: string; value?: string }) => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          marginBottom: 8,
        }}
      >
        <span style={{ color: '#6b7280' }}>{label}</span>
        <span style={{ fontWeight: 500 }}>{value ?? '-'}</span>
      </div>
    );
  };

  const ParkingInfo = ({ slot }: { slot: ParkingSpace }) => {
    return (
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Parking Information</h3>
        <InfoRow label="Code" value={slot.code} />
        <InfoRow label="Area" value={slot.location.area} />
        <InfoRow label="Floor" value={String(slot.location.floor)} />
        <InfoRow label="Price" value={`${formatVND(slot.base_price)}/month`} />
        <InfoRow label="Status" value={slot.status} />
      </div>
    );
  };

  const SubscriptionInfo = ({ subscription }: { subscription: ParkingSubscription }) => {
    return (
      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Subscription Information
        </h3>

        <InfoRow label="Status" value={subscription.status} />
        <InfoRow
          label="Start Time"
          value={new Date(subscription.start_time).toLocaleString('vi-VN')}
        />
        <InfoRow label="End Time" value={new Date(subscription.end_time).toLocaleString('vi-VN')} />
        <InfoRow label="Base Amount" value={`${subscription.base_amount}`} />
        <InfoRow label="Discount" value={`${subscription.discount}`} />
        <InfoRow label="Total Amount" value={`${subscription.total_amount}`} />
      </div>
    );
  };

  const UserInfo = ({ user }: { user: User | null }) => {
    if (!user) {
      return <div>No user information</div>;
    }

    return (
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>User Information</h3>

        <InfoRow label="Name" value={user.full_name} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Phone" value={user.phone} />
      </div>
    );
  };

  function HistoryPanel({
    history,
    onClose,
  }: {
    history: ParkingSubscription[];
    onClose: () => void;
  }) {
    return (
      <div
        style={{
          borderLeft: '1px solid #e5e7eb',
          paddingLeft: 16,
          maxHeight: 500,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Subscription History</h3>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            Close
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : history.length === 0 ? (
          <p style={{ fontSize: 13, color: '#6b7280' }}>No subscription history</p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                marginBottom: 8,
                fontSize: 13,
              }}
            >
              <InfoRow label="Status" value={item.status} />
              <InfoRow
                label="Time"
                value={`${new Date(item.start_time).toLocaleDateString()} → ${new Date(
                  item.end_time,
                ).toLocaleDateString()}`}
              />
              <InfoRow label="Total" value={`${item.total_amount}`} />
            </div>
          ))
        )}
      </div>
    );
  }

  const handleViewHistory = async () => {
    if (!selectedSlot) return;

    try {
      setShowHistory(true);

      const res = await getParkingSubscriptionsApi(String(selectedSlot.id));
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setHistory(res.data);
    } catch (err) {
      toast.error('Failed to load subscription history');
    }
  };

  /* =======================
   * PARKING VIEW
   ======================= */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setSelectedBuilding(null)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
        >
          <ArrowLeft size={16} />
        </button>

        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>
            Parking Management – {selectedBuilding?.name}
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Parking overview and active registrations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Total Spaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{parkingStats.total ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#15803d' }}>
              {parkingStats.available ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#b91c1c' }}>
              {parkingStats.reserved ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#a16207' }}>
              {parkingStats.maintenance ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parking Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Parking Layout</CardTitle>

          {/* Legend */}
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 12,
            }}
          >
            {[
              { label: 'Available', color: '#16a34a' },
              { label: 'Reserved', color: '#dc2626' },
              { label: 'Maintenance', color: '#ca8a04' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: '#374151' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 16,
            }}
          >
            {parkingSlots.map((slot: ParkingSpace) => {
              const ui = parkingStatusUI[slot.status] ?? parkingStatusUI.DEFAULT;

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSelectSlot(slot)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `2px solid ${ui.borderColor}`,
                    backgroundColor: ui.backgroundColor,
                    textAlign: 'center',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Icon */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ParkingCircle size={16} color={ui.iconColor} />
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 600 }}>{slot.code}</div>

                  <div
                    style={{
                      height: 1,
                      backgroundColor: '#e5e7eb',
                      margin: '8px 0',
                    }}
                  />

                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Area{' '}
                    <span style={{ fontWeight: 500, color: '#111827' }}>{slot.location.area}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Floor{' '}
                    <span style={{ fontWeight: 500, color: '#111827' }}>{slot.location.floor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent
          style={{
            maxWidth: showHistory && isReserved ? 1100 : showHistory ? 700 : isReserved ? 800 : 420,
            transition: 'max-width 0.2s ease',
          }}
        >
          <DialogTitle>Parking Detail</DialogTitle>
          <DialogDescription>
            View parking space details and subscription information
          </DialogDescription>
          {!selectedSlot ? (
            <p>Loading...</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: showHistory
                  ? isReserved
                    ? '1fr 1.3fr 1fr'
                    : '1.3fr 1fr'
                  : isReserved
                    ? '1fr 1.3fr'
                    : '1fr',
                gap: 24,
              }}
            >
              {/* USER */}
              {isReserved && (
                <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: 16 }}>
                  <UserInfo user={user} />
                </div>
              )}

              <div>
                <ParkingInfo slot={selectedSlot} />

                {subscription && <SubscriptionInfo subscription={subscription} />}

                <div style={{ marginTop: 16 }}>
                  <div style={{ height: 1, background: '#e5e7eb', marginBottom: 12 }} />

                  <button
                    onClick={handleViewHistory}
                    style={{
                      fontSize: 13,
                      color: '#2563eb',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  >
                    View subscription history →
                  </button>
                </div>
              </div>

              {showHistory && (
                <HistoryPanel history={history} onClose={() => setShowHistory(false)} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
