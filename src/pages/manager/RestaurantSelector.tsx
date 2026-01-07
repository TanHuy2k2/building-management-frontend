import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { Building, Restaurant, RestaurantSelectorProps, RestaurantStatus } from '../../types';
import { getAllRestaurantsApi } from '../../services/restaurantService';
import { getAllBuildingApi } from '../../services/buildingService';

export default function RestaurantSelector({ onSelect }: RestaurantSelectorProps) {
  const [buildingMap, setBuildingMap] = useState<Record<string, string>>({});
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBuildings = async () => {
    try {
      const res = await getAllBuildingApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      const map: Record<string, string> = {};
      res.data.buildings.forEach((b: Building) => {
        map[b.id] = b.name;
      });
      setBuildingMap(map);
    } catch {
      toast.error('Failed to load buildings');
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await getAllRestaurantsApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setRestaurants(res.data.restaurants);
    } catch {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchBuildings();
  }, []);

  const activeRestaurants = restaurants.filter((r) => r.status === RestaurantStatus.ACTIVE);
  const groupedRestaurants = activeRestaurants.reduce<Record<string, Restaurant[]>>((acc, r) => {
    const key = r.building_id;
    if (!acc[key]) acc[key] = [];

    acc[key].push(r);

    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Select Restaurant</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Choose a restaurant to manage...</p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(groupedRestaurants).map(([buildingId, list]) => (
            <div key={buildingId} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{buildingMap[buildingId]}</h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 16,
                }}
              >
                {list.map((restaurant) => (
                  <Card
                    key={restaurant.id}
                    onClick={() => onSelect(restaurant)}
                    style={{ cursor: 'pointer' }}
                  >
                    <CardContent
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: 16,
                      }}
                    >
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
                        <Store size={20} color="#2563eb" />
                      </div>

                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {restaurant.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#6b7280',
                            marginTop: 2,
                          }}
                        >
                          Floor {restaurant.floor}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
