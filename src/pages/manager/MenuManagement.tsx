import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  ArrowLeft,
  UtensilsCrossed,
  CalendarPlus,
  Trash2,
  Edit,
  Eye,
  Plus,
  Pencil,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Restaurant } from '../../types';
import { createMenuScheduleApi, getMenuSchedulesApi } from '../../services/restaurantMenuService';
import {
  DayOfWeek,
  DishCategory,
  MenuSchedule,
  MenuItemForm,
  MenuForm,
  MenuScheduleForm,
} from '../../types/menu';
import { DAY_LABEL, DEFAULT_FOOD_IMG_URL, ENV, HTTP_PREFIX } from '../../utils/constants';
import { getNextDay } from '../../utils/time';
import { useRestaurant } from '../../contexts/RestaurantContext';
import RestaurantSelector from './RestaurantSelector';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';

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
  const { currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const [menuSchedules, setMenuSchedules] = useState<MenuSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | ''>('');
  const [selectedItems, setSelectedItems] = useState<MenuItemForm[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
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
  const [activeSchedule, setActiveSchedule] = useState<MenuSchedule | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
  const [imageIndexMap, setImageIndexMap] = useState<Record<string, number>>({});
  const [erroredImages, setErroredImages] = useState<Record<string, boolean>>({});

  const resolveImageUrl = (url?: string) => {
    if (!url) return DEFAULT_FOOD_IMG_URL;

    return url.startsWith(HTTP_PREFIX) ? url : `${ENV.BE_URL}/${url}`;
  };

  const handleImageError = (itemId: string) => {
    setErroredImages((prev) => ({ ...prev, [itemId]: true }));
  };

  const isDishSelected = (dishName: string) =>
    selectedItems.some((item) => item.name.toLowerCase() === dishName.toLowerCase());
  const filteredDishes = mockDishes.filter(
    (dish) =>
      dish.name.toLowerCase().includes(dishQuery.toLowerCase()) && !isDishSelected(dish.name),
  );

  const loadMenuSchedules = async (restaurantId: string) => {
    try {
      setLoading(true);
      const res = await getMenuSchedulesApi(restaurantId);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      const schedules = res.data.schedules.filter((s: MenuSchedule) => s.items?.length);
      setMenuSchedules(schedules);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    setCurrentRestaurant(restaurant);
    loadMenuSchedules(restaurant.id);
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
    if (!selectedDay || !selectedItems.length) {
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

  const handleSubmitForm = async () => {
    if (!currentRestaurant) {
      toast.error('Please select a restaurant first');

      return;
    }

    if (!menuForm.schedules.length) {
      toast.error('Please add at least one schedule before submitting');

      return;
    }

    const formData = new FormData();
    selectedImages.forEach((file) => formData.append('menu-images', file));
    formData.append('schedules', JSON.stringify(menuForm.schedules));
    try {
      setLoading(true);

      const res = await createMenuScheduleApi(currentRestaurant.id, formData);
      if (!res.success) {
        toast.error(res.message || 'Failed to submit menu');

        return;
      }

      toast.success('Menu submitted successfully!');
      setMenuForm({ schedules: [], images: [] });
      setSelectedImages([]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadMenuSchedules(currentRestaurant.id);
    }
  }, [currentRestaurant?.id]);

  useEffect(() => {
    if (activeSchedule) {
      const newMap: Record<string, number> = {};
      activeSchedule.items.forEach((item) => {
        newMap[item.id] = 0;
      });
      setImageIndexMap(newMap);
    }
  }, [activeSchedule]);

  if (!currentRestaurant) {
    return <RestaurantSelector onSelect={handleSelectRestaurant} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setCurrentRestaurant(null)}>
          <ArrowLeft size={16} />
        </button>

        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>
            {currentRestaurant.name} – Menu Management
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Create and manage menu schedules</p>
        </div>
      </div>

      <button
        onClick={() => setShowCreateForm((prev) => !prev)}
        disabled={loading}
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

              {showDishDropdown && filteredDishes.length && (
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
                disabled={loading}
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
                disabled={loading}
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
              minWidth: 600,
              maxWidth: 800,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Add New Dish</h2>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Dish Name</label>
                  <input
                    placeholder="Enter dish name"
                    value={newDishForm.name}
                    onChange={(e) => setNewDishForm({ ...newDishForm, name: e.target.value })}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #ccc',
                      width: '100%',
                    }}
                  />
                </div>

                {/* Price */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Price</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Enter price"
                    value={newDishForm.price}
                    onChange={(e) =>
                      setNewDishForm({ ...newDishForm, price: Number(e.target.value) })
                    }
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #ccc',
                      width: '100%',
                    }}
                  />
                </div>

                {/* Quantity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Quantity</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Enter quantity"
                    value={newDishForm.quantity}
                    onChange={(e) =>
                      setNewDishForm({ ...newDishForm, quantity: Number(e.target.value) })
                    }
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #ccc',
                      width: '100%',
                    }}
                  />
                </div>

                {/* Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Category</label>
                  <select
                    value={newDishForm.category}
                    onChange={(e) =>
                      setNewDishForm({ ...newDishForm, category: e.target.value as DishCategory })
                    }
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
                  >
                    {Object.values(DishCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Description</label>
                  <textarea
                    placeholder="Enter description"
                    value={newDishForm.description}
                    onChange={(e) =>
                      setNewDishForm({ ...newDishForm, description: e.target.value })
                    }
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #ccc',
                      width: '100%',
                    }}
                    rows={5}
                  />
                </div>

                {/* Images */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontWeight: 600, fontSize: 14 }}>Images</label>
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

                      setSelectedImages((prev) => [...prev, ...Array.from(files)]);
                      const urls = Array.from(files).map((f) => f.name);
                      setNewDishForm((prev) => ({ ...prev, image_urls: urls }));
                    }}
                  />
                  {newDishForm.image_urls && (
                    <div style={{ fontSize: 12, color: '#4b5563' }}>
                      Selected: {newDishForm.image_urls.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
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

      {!!menuForm.schedules.length && (
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
      {loading ? (
        <Card>
          <CardContent style={{ textAlign: 'center', padding: 32 }}>
            Loading menu schedules...
          </CardContent>
        </Card>
      ) : !menuSchedules.length ? (
        <Card>
          <CardContent style={{ textAlign: 'center', padding: 32 }}>
            <UtensilsCrossed size={36} />
            <p>No menu schedules yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuSchedules.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{DAY_LABEL[s.id]}</CardTitle>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    title="View menu"
                    className="w-9 h-9"
                    onClick={() => {
                      setActiveSchedule(s);
                      setModalMode('view');
                    }}
                  >
                    <Eye className="size-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="secondary"
                    title="Edit menu"
                    className="w-9 h-9"
                    onClick={() => {
                      setActiveSchedule(s);
                      setModalMode('edit');
                    }}
                  >
                    <Edit className="size-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {s.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 14,
                      padding: '6px 0',
                      borderBottom: i < s.items.length - 1 ? '1px solid #e5e7eb' : undefined,
                    }}
                  >
                    <strong>{item.name}</strong> — ${item.price} · Qty {item.quantity}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!activeSchedule}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSchedule(null);
            setModalMode('view');
          }
        }}
      >
        <DialogContent
          style={{
            maxWidth: 1000,
            width: '100%',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {activeSchedule && (
            <>
              {/* ===== HEADER ===== */}
              <DialogHeader className="px-6 py-4 border-b shrink-0">
                <div>
                  <DialogTitle className="text-xl">
                    {DAY_LABEL[activeSchedule.id]} – {activeSchedule.items.length} dishes
                  </DialogTitle>
                  <DialogDescription>
                    Manage page for {DAY_LABEL[activeSchedule.id]} menu
                  </DialogDescription>
                </div>
              </DialogHeader>

              {/* ===== BODY ===== */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px',
                  minHeight: 0,
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeSchedule.items.map((item) => {
                    const images =
                      item.image_urls && item.image_urls.length
                        ? item.image_urls
                        : [DEFAULT_FOOD_IMG_URL];
                    const currentIndex = imageIndexMap[item.id] ?? 0;
                    const currentImage = images[currentIndex];

                    return (
                      <Card
                        key={item.id}
                        className="relative overflow-hidden hover:shadow-md transition flex flex-col"
                      >
                        <div
                          className="relative flex-shrink-0 group"
                          style={{
                            width: '100%',
                            aspectRatio: '4/3',
                            overflow: 'hidden',
                            background: '#f3f4f6',
                          }}
                        >
                          <img
                            key={currentImage}
                            src={
                              erroredImages[`${item.id}-${currentImage}`]
                                ? DEFAULT_FOOD_IMG_URL
                                : resolveImageUrl(currentImage)
                            }
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                            onError={() => handleImageError(`${item.id}-${currentImage}`)}
                          />

                          {images.length > 1 && (
                            <>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-1/2 h-8 w-8 rounded-md bg-white hover:bg-gray-100 shadow-md transition z-20"
                                style={{ left: 8, transform: 'translateY(-50%)' }}
                                onClick={() =>
                                  setImageIndexMap((prev) => ({
                                    ...prev,
                                    [item.id]: (currentIndex - 1 + images.length) % images.length,
                                  }))
                                }
                              >
                                <ArrowLeft
                                  style={{ width: 24, height: 24 }}
                                  className="text-black"
                                />
                              </Button>

                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-1/2 h-8 w-8 rounded-md bg-white hover:bg-gray-100 shadow-md transition z-20"
                                style={{ right: 8, transform: 'translateY(-50%)' }}
                                onClick={() =>
                                  setImageIndexMap((prev) => ({
                                    ...prev,
                                    [item.id]: (currentIndex + 1) % images.length,
                                  }))
                                }
                              >
                                <ArrowRight
                                  style={{ width: 24, height: 24 }}
                                  className="text-black"
                                />
                              </Button>
                            </>
                          )}
                        </div>

                        {modalMode === 'edit' && (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute h-8 w-8 rounded-md bg-gray-200 hover:bg-gray-300 shadow-md transition z-30"
                            style={{ top: 8, right: 8 }}
                            onClick={() => toast('Edit clicked')}
                          >
                            <Pencil style={{ width: 20, height: 20 }} className="text-black" />
                          </Button>
                        )}

                        <CardContent className="p-4 space-y-1 flex-1">
                          <p className="font-semibold line-clamp-1">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="font-medium">${item.price}</p>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {modalMode === 'edit' && (
                    <button
                      onClick={() => toast('Add clicked')}
                      className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition min-h-[220px]"
                    >
                      <Plus className="size-8 mb-2" />
                      <span className="text-sm">Add dish</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ===== FOOTER ===== */}
              <DialogFooter className="px-6 py-4 border-t shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveSchedule(null);
                    setModalMode('view');
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
