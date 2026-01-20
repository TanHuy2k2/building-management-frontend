import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ParkingCircle, ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Building,
  GetParkingParams,
  OrderDirection,
  ParkingSpace,
  ParkingSpaceStatus,
  ParkingSpaceType,
} from '../../types';
import { getAllBuildingApi } from '../../services/buildingService';
import { getAllParkingApi } from '../../services/parkingSpaceService';
import { formatVND } from '../../utils/currency';

export default function UserParking() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFloor, setActiveFloor] = useState<number | null>(null);

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

  /* ================= SELECT BUILDING ================= */
  const handleSelectBuilding = async (building: Building) => {
    setSelectedBuilding(building);
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

      setParkingSpaces(res.data);
    } catch {
      toast.error('Failed to load parking spaces');
    } finally {
      setLoading(false);
    }
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

  /* ================= UI ================= */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
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

                        return (
                          <Card
                            key={space.id}
                            style={{
                              background: available ? '#bbf7d0' : reserved ? '#fecaca' : '#e5e7eb',
                              textAlign: 'center',
                            }}
                          >
                            <CardContent style={{ padding: 12 }}>
                              <ParkingCircle
                                style={{
                                  width: 24,
                                  height: 24,
                                  margin: '0 auto 6px',
                                  color: available ? '#16a34a' : reserved ? '#dc2626' : '#6b7280',
                                }}
                              />
                              <div style={{ fontWeight: 600 }}>{space.code}</div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: '#6b7280',
                                }}
                              >
                                {space.type === ParkingSpaceType.CAR ? '🚗 Car' : '🛵 Motorbike'}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}
                              >
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
