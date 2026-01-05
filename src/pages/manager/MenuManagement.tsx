import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, UtensilsCrossed, CalendarPlus, Trash2, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { Building, Restaurant } from '../../types';
import { getAllRestaurantsApi } from '../../services/restaurantService';
import { getMenuSchedulesApi } from '../../services/restaurantMenuService';
import {
  DayOfWeek,
  DishCategory,
  MenuSchedule,
  MenuItemForm,
  MenuForm,
  MenuScheduleForm,
} from '../../types/menu';
import { DAY_LABEL } from '../../utils/constants';
import { getNextDay } from '../../utils/time';
import { getAllBuildingApi } from '../../services/buildingService';

const mockDishes: MenuItemForm[] = [
  {
    name: 'New York Tenderloin Steak',
    category: DishCategory.MAIN,
    price: 15,
    quantity: 1,
    description: 'Tender New York strip steak grilled to perfection, served with garlic butter.',
    image_urls: ['steak.jpg', 'steak2.jpg'],
  },
  {
    name: 'Garlic Mashed Potatoes',
    category: DishCategory.SIDE,
    price: 5,
    quantity: 1,
    description: 'Creamy mashed potatoes with roasted garlic and butter.',
    image_urls: ['potatoes.jpg', 'potatoes2.jpg'],
  },
  {
    name: 'Caesar Salad',
    category: DishCategory.SIDE,
    price: 6,
    quantity: 1,
    description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan.',
    image_urls: ['dish.jpg', 'dish2.jpg'],
  },
  {
    name: 'Chocolate Cake',
    category: DishCategory.DESSERT,
    price: 5,
    quantity: 1,
    description: 'Rich and moist chocolate cake with chocolate ganache.',
    image_urls: ['dish7.jpg', 'dish8.jpg'],
  },
];

export default function MenuManagement() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingMap, setBuildingMap] = useState<Record<string, string>>({});
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuSchedules, setMenuSchedules] = useState<MenuSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | ''>('');
  const [selectedItems, setSelectedItems] = useState<MenuItemForm[]>([]);
  const [dishQuery, setDishQuery] = useState('');
  const [showDishDropdown, setShowDishDropdown] = useState(false);
  const [menuForm, setMenuForm] = useState<MenuForm>({ schedules: [], images: [] });
  const [showNewDishForm, setShowNewDishForm] = useState(false);
  const [newDishForm, setNewDishForm] = useState<MenuItemForm>({
    name: '',
    category: DishCategory.MAIN,
    price: 0,
    quantity: 1,
    description: '',
    image_urls: [],
  });

  const isDishSelected = (dishName: string) =>
    selectedItems.some((item) => item.name.toLowerCase() === dishName.toLowerCase());
  const filteredDishes = mockDishes.filter(
    (dish) =>
      dish.name.toLowerCase().includes(dishQuery.toLowerCase()) && !isDishSelected(dish.name),
  );

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
      setBuildings(res.data.buildings);
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

  const fetchMenuSchedules = async () => {
    try {
      setLoading(true);
      const res = await getMenuSchedulesApi();
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setMenuSchedules(res.data);
    } catch {
      toast.error('Failed to load menu schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchBuildings();
  }, []);

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    await fetchMenuSchedules();
  };

  const handleAddExistingDish = (dish: MenuItemForm) => {
    if (isDishSelected(dish.name)) return;

    setSelectedItems((prev) => [...prev, dish]);
    setDishQuery('');
    setShowDishDropdown(false);
  };

  const handleRemoveDish = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = () => {
    if (!selectedDay || selectedItems.length === 0) {
      toast.error('Please select a day and at least one dish');

      return;
    }

    const scheduleForm: MenuScheduleForm = { id: selectedDay, items: selectedItems };
    setMenuForm((prev) => ({
      ...prev,
      schedules: [...prev.schedules, scheduleForm],
    }));

    toast.success(`Saved schedule for ${DAY_LABEL[selectedDay]}`);
    setSelectedItems([]);
    setSelectedDay('');
  };

  const handleSubmitForm = () => {};

  if (!selectedRestaurant) {
    const activeRestaurants = restaurants.filter((r) => r.status === 'active');
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
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Choose a restaurant to manage menu schedules
          </p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(groupedRestaurants).map(([buildingId, list]) => (
              <div key={buildingId} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Building title */}
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
                      onClick={() => handleSelectRestaurant(restaurant)}
                      style={{ cursor: 'pointer' }}
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
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              Floor {restaurant.floor}
                            </div>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setSelectedRestaurant(null)}>
          <ArrowLeft size={16} />
        </button>

        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>
            {selectedRestaurant.name} – Menu Management
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Create and manage menu schedules</p>
        </div>
      </div>

      <button
        onClick={() => setShowCreateForm((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          background: '#0ea5e9',
          color: '#fff',
          border: '1px solid #0ea5e9',
          width: 'fit-content',
        }}
      >
        <CalendarPlus size={16} />
        Create Menu Schedule
      </button>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Menu Schedule</CardTitle>
          </CardHeader>

          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Day of week</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
              >
                <option value="">Select day</option>
                {Object.values(DayOfWeek).map((day) => {
                  const isSaved = menuForm.schedules.some((s) => s.id === day);

                  return (
                    <option key={day} value={day} disabled={isSaved}>
                      {DAY_LABEL[day]} {isSaved ? '(Saved)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Add dish</label>
              <input
                value={dishQuery}
                onChange={(e) => {
                  setDishQuery(e.target.value);
                  setShowDishDropdown(true);
                }}
                onFocus={() => setShowDishDropdown(true)}
                placeholder="Search dish..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              />
              {showDishDropdown && filteredDishes.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    marginTop: 4,
                    zIndex: 10,
                  }}
                >
                  {filteredDishes.map((dish) => (
                    <div
                      key={dish.name}
                      onClick={() => handleAddExistingDish(dish)}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {dish.name}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowNewDishForm(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  marginTop: 4,
                }}
              >
                Add New Dish
              </button>
            </div>

            {selectedItems.map((item, idx) => (
              <Card key={idx}>
                <CardContent
                  style={{ padding: 12, display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      ${item.price} · Qty {item.quantity}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDish(idx)}
                    style={{ border: 'none', background: 'transparent', color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </CardContent>
              </Card>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={handleSaveSchedule}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Save Day
              </button>

              {selectedDay && getNextDay(selectedDay) && (
                <button
                  onClick={() => {
                    let next = getNextDay(selectedDay);
                    while (next && menuForm.schedules.some((s) => s.id === next)) {
                      next = getNextDay(next);
                    }

                    if (!next) return;

                    setSelectedDay(next);
                    setSelectedItems([]);
                    toast.success(`Ready for ${DAY_LABEL[next]}`);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  Add Next Day
                </button>
              )}

              <button
                onClick={handleSubmitForm}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#0ea5e9',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Submit Menu
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {showNewDishForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 50,
          }}
          onClick={() => setShowNewDishForm(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              minWidth: 360,
              maxWidth: 480,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Add New Dish</h2>

            <input
              placeholder="Dish Name"
              value={newDishForm.name}
              onChange={(e) => setNewDishForm({ ...newDishForm, name: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%' }}
            />

            <input
              type="number"
              placeholder="Price"
              value={newDishForm.price}
              onChange={(e) => setNewDishForm({ ...newDishForm, price: Number(e.target.value) })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%' }}
            />

            <textarea
              placeholder="Description"
              value={newDishForm.description}
              onChange={(e) => setNewDishForm({ ...newDishForm, description: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%' }}
              rows={3}
            />

            {/* Custom file input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                htmlFor="dishFiles"
                style={{
                  padding: '8px 12px',
                  background: '#3b82f6',
                  color: '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Choose Images
              </label>
              <input
                id="dishFiles"
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;

                  const urls = Array.from(files).map((f) => f.name);
                  setNewDishForm({ ...newDishForm, image_urls: urls });
                }}
              />
              {newDishForm.image_urls && (
                <div style={{ fontSize: 12, color: '#4b5563' }}>
                  Selected: {newDishForm.image_urls.join(', ')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                onClick={() => setShowNewDishForm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAddExistingDish(newDishForm);
                  setNewDishForm({
                    name: '',
                    category: DishCategory.MAIN,
                    price: 0,
                    quantity: 1,
                    description: '',
                    image_urls: [],
                  });
                  setShowNewDishForm(false);
                  toast.success(`Added new dish: ${newDishForm.name}`);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Add Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {menuForm.schedules.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Saved Schedules</h2>
          {menuForm.schedules.map((s, idx) => (
            <Card key={s.id}>
              <CardHeader
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <CardTitle>{DAY_LABEL[s.id]}</CardTitle>
                <button
                  onClick={() => {
                    setMenuForm((prev) => ({
                      ...prev,
                      schedules: prev.schedules.filter((_, i) => i !== idx),
                    }));
                    toast.success(`Removed schedule for ${DAY_LABEL[s.id]}`);
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </button>
              </CardHeader>
              <CardContent>
                {s.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 14 }}>
                    {item.name} - ${item.price} · Qty {item.quantity}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {menuSchedules.length === 0 ? (
        <Card>
          <CardContent style={{ textAlign: 'center', padding: 32 }}>
            <UtensilsCrossed size={36} />
            <p>No menu schedules yet</p>
          </CardContent>
        </Card>
      ) : (
        menuSchedules.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{DAY_LABEL[s.id]}</CardTitle>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}
