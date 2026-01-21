import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
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
import {
  addMenuItemApi,
  createMenuScheduleApi,
  getMenuSchedulesApi,
  updateMenuItemApi,
} from '../../../services/restaurantMenuService';
import {
  Restaurant,
  DayOfWeek,
  DishCategory,
  MenuSchedule,
  MenuItemForm,
  MenuForm,
  MenuScheduleForm,
  Dish,
} from '../../../types';
import { DAY_LABEL, DEFAULT_FOOD_IMG_URL } from '../../../utils/constants';
import { getImageUrls, resolveFoodImageUrl } from '../../../utils/image';
import { getChangedFields, removeEmptyFields } from '../../../utils/updateFields';
import { useRestaurant } from '../../../contexts/RestaurantContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../../components/ui/dialog';
import RestaurantDishForm from './RestaurantDishForm';
import RestaurantDishSelector from './RestaurantDishSelector';
import RestaurantSelector from '../restaurant/RestaurantSelector';
import { formatVND } from '../../../utils/currency';
import { getRestaurantDishesApi } from '../../../services/restaurantDishService';

export default function MenuManagement() {
  const scrollContainer = useRef<HTMLDivElement>(null);
  const { currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const [menuSchedules, setMenuSchedules] = useState<MenuSchedule[]>([]);
  const [dishList, setDishList] = useState<Dish[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<MenuItemForm | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<MenuItemForm[]>([]);
  const [selectedItems, setSelectedItems] = useState<MenuItemForm[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | ''>('');
  const [menuForm, setMenuForm] = useState<MenuForm>({ schedules: [], images: [] });
  const [activeSchedule, setActiveSchedule] = useState<MenuSchedule | null>(null);
  const [imageIndexMap, setImageIndexMap] = useState<Record<string, number>>({});
  const [erroredImages, setErroredImages] = useState<Record<string, boolean>>({});
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showNewDishForm, setShowNewDishForm] = useState(false);
  const [showDishPicker, setShowDishPicker] = useState(false);
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageError = (itemId: string) => {
    setErroredImages((prev) => ({ ...prev, [itemId]: true }));
  };

  const allDishes = [
    ...dishList,
    ...selectedItems.filter((s) => !dishList.some((d) => d.name === s.name)),
  ];

  const isDayTaken = (day: DayOfWeek) =>
    menuForm.schedules.some((s) => s.id === day) || menuSchedules.some((s) => s.id === day);
  const allDaysCreated = Object.values(DayOfWeek).every(isDayTaken);

  const loadDishes = async (restaurantId: string) => {
    try {
      setLoading(true);

      const res = await getRestaurantDishesApi(restaurantId);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setDishList(res.data.dishes);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      if (activeSchedule) {
        const updatedSchedule = schedules.find((s: MenuSchedule) => s.id === activeSchedule.id);
        if (updatedSchedule) setActiveSchedule(updatedSchedule);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    setCurrentRestaurant(restaurant);
    setMenuForm({ schedules: [], images: [] });
    setSelectedDay('');
    setSelectedItems([]);
    setSelectedImages([]);
    setShowCreateForm(false);
    setShowNewDishForm(false);

    await loadMenuSchedules(restaurant.id);
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

    const schedules = removeEmptyFields(menuForm.schedules);
    if (!schedules.length) {
      toast.error('Please add at least one schedule before submitting');

      return;
    }

    const formData = new FormData();
    selectedImages.forEach((file) => formData.append('menu-images', file));
    formData.append('schedules', JSON.stringify(schedules));
    try {
      setLoading(true);

      const res = await createMenuScheduleApi(currentRestaurant.id, formData);
      if (!res.success) {
        toast.error(res.message || 'Failed to submit menu');

        return;
      }

      const createdDays = res.data?.created_ids.map((id: DayOfWeek) => DAY_LABEL[id]).join(', ');
      toast.success(`${res.message}: ${createdDays}`);

      await loadMenuSchedules(currentRestaurant.id);
      setMenuForm({ schedules: [], images: [] });
      setSelectedImages([]);
      setShowCreateForm(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildMenuItemFormData = (payload: Record<string, any>, images: File[] = []) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (!value.length) {
          formData.append(`${key}[]`, '');
        } else {
          value.forEach((v) => formData.append(`${key}[]`, v));
        }
      } else {
        formData.append(key, value);
      }
    });
    images.forEach((file) => formData.append('menu-images', file));

    return formData;
  };

  const handleAddMenuItem = async (dish: MenuItemForm, images: File[] = []) => {
    if (!currentRestaurant || !activeSchedule) {
      toast.error('Missing restaurant or menu');

      return;
    }

    const payload = removeEmptyFields(dish);
    if (!Object.keys(payload).length && !images.length) {
      toast.error('Please enter dish information');

      return;
    }

    const formData = buildMenuItemFormData(payload, images);
    try {
      setLoading(true);

      const res = await addMenuItemApi(currentRestaurant.id, activeSchedule.id, formData);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success(res.message);
      await loadMenuSchedules(currentRestaurant.id);
      setShowAddDishModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMenuItem = async (newDish: MenuItemForm, images: File[]) => {
    if (!currentRestaurant || !activeSchedule || !editingId || !editingDish) return;

    const normalizedDish: MenuItemForm = {
      ...newDish,
      image_urls: getImageUrls(newDish.image_urls),
    };
    const nextImages = normalizedDish.image_urls ?? [];
    const prevImages = editingDish.image_urls ?? [];
    const isImageChanged =
      prevImages.length !== nextImages.length || prevImages.some((url, i) => url !== nextImages[i]);
    const changedFields = removeEmptyFields(getChangedFields(editingDish, normalizedDish));
    if (isImageChanged) changedFields.image_urls = nextImages;

    if (!Object.keys(changedFields).length && !images.length) {
      toast('No changes detected');

      return;
    }

    try {
      setLoading(true);

      const formData = buildMenuItemFormData(changedFields, images);
      const res = await updateMenuItemApi(
        currentRestaurant.id,
        activeSchedule.id,
        editingId,
        formData,
      );
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Dish updated');
      await loadMenuSchedules(currentRestaurant.id);

      setShowAddDishModal(false);
      setEditingDish(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadDishes(currentRestaurant.id);
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
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentRestaurant(null)}
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
            <h1 className="text-3xl font-bold text-gray-900">
              {currentRestaurant.name} – Menu Management
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage menu schedules</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!allDaysCreated && (
            <Button
              variant="outline"
              className="text-green-600 hover:bg-green-700 hover:text-white"
              onClick={() => setShowCreateForm((prev) => !prev)}
              disabled={loading}
            >
              <CalendarPlus className="size-4 mr-2" />
              Create Schedule
            </Button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          {/*  LEFT – CREATE FORM  */}
          <div style={{ flex: '0 0 30%', maxWidth: '30%' }}>
            <Card>
              <CardHeader>
                <CardTitle>Menu Schedule Form</CardTitle>
              </CardHeader>

              <CardContent
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  maxWidth: 480,
                }}
              >
                {/* Day of week */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Day of week</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                    style={{
                      width: '100%',
                      padding: 8,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <option value="">Select day</option>
                    {Object.values(DayOfWeek).map((day) => {
                      const taken = isDayTaken(day);

                      return (
                        <option key={day} value={day} disabled={taken}>
                          {DAY_LABEL[day]} {taken ? '(Saved)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ position: 'relative', width: '100%' }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Add dish</label>
                  <RestaurantDishSelector
                    dishes={allDishes}
                    disabledNames={selectedItems.map((i) => i.name)}
                    value={selectedItems}
                    onChange={(items) => setSelectedItems(items)}
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 border-dashed"
                    onClick={() => setShowNewDishForm(true)}
                    disabled={loading}
                  >
                    New Dish
                  </Button>

                  <Button
                    variant="secondary"
                    className="flex-1 h-9"
                    onClick={handleSaveSchedule}
                    disabled={loading}
                  >
                    Save Day
                  </Button>

                  <Button className="flex-1 h-9" onClick={handleSubmitForm} disabled={loading}>
                    Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <RestaurantDishForm
            open={showNewDishForm}
            loading={loading}
            onClose={() => setShowNewDishForm(false)}
            onSubmit={(dish, images) => {
              setSelectedItems((prev) => [...prev, dish]);
              setSelectedImages((prev) => [...prev, ...Array.from(images)]);
              setShowNewDishForm(false);

              toast.success(`Added new dish: ${dish.name}`);
            }}
          />

          {/* RIGHT – SAVED SCHEDULES */}
          <div style={{ flex: '0 0 65%', minWidth: 0, position: 'relative' }}>
            {!!menuForm.schedules.length && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Saved Schedules</h2>

                <button
                  onClick={() =>
                    scrollContainer.current?.scrollBy({ left: -300, behavior: 'smooth' })
                  }
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 24,
                  }}
                >
                  ‹
                </button>

                <button
                  onClick={() =>
                    scrollContainer.current?.scrollBy({ left: 300, behavior: 'smooth' })
                  }
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 24,
                  }}
                >
                  ›
                </button>

                <div
                  ref={scrollContainer}
                  style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap: 16,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    padding: '0 40px',
                    scrollbarWidth: 'thin',
                  }}
                >
                  {menuForm.schedules.map((s, idx) => (
                    <Card
                      key={s.id}
                      style={{
                        flex: '0 0 300px',
                        minWidth: 300,
                        display: 'flex',
                        flexDirection: 'column',
                        height: 320,
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        background: '#fff',
                        overflow: 'hidden',
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <CardHeader
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <CardTitle style={{ fontSize: 15, fontWeight: 600 }}>
                          {DAY_LABEL[s.id]}
                        </CardTitle>
                        <button
                          onClick={() =>
                            setMenuForm((prev) => ({
                              ...prev,
                              schedules: prev.schedules.filter((_, i) => i !== idx),
                            }))
                          }
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </CardHeader>

                      <CardContent
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          overflowY: 'auto',
                        }}
                      >
                        {s.items.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: 14,
                              lineHeight: '1.4',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            {/* LEFT */}
                            <span style={{ fontWeight: 500 }}>{item.name}</span>

                            {/* RIGHT */}
                            <span style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 600 }}>{formatVND(item.price)}</div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                Qty {item.quantity}
                              </div>
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
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

              <CardContent className="pt-2">
                <div className="space-y-2">
                  {s.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b last:border-b-0 pb-2 text-sm"
                    >
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex flex-col items-end text-right">
                        <span className="font-semibold">{formatVND(item.price)}</span>

                        <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                  {modalMode === 'edit' && (
                    <button
                      onClick={() => setShowDishPicker(true)}
                      className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition min-h-[220px]"
                    >
                      <Plus className="size-8 mb-2" />
                      <span className="text-sm">Add dish</span>
                    </button>
                  )}

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
                                : resolveFoodImageUrl(currentImage)
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
                            onClick={() => {
                              setEditingId(item.id);

                              setEditingDish({
                                name: item.name,
                                category: item.category as DishCategory,
                                price: item.price,
                                quantity: item.quantity,
                                description: item.description ?? '',
                                image_urls: item.image_urls ?? [],
                              });

                              setShowAddDishModal(true);
                            }}
                          >
                            <Pencil style={{ width: 20, height: 20 }} className="text-black" />
                          </Button>
                        )}

                        <CardContent className="p-4 space-y-1 flex-1">
                          <p className="font-semibold line-clamp-1">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="font-medium">{formatVND(item.price)}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
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

      {activeSchedule && (
        <Dialog open={showDishPicker} onOpenChange={setShowDishPicker}>
          <DialogContent
            style={{
              maxWidth: 520,
              height: '50vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ===== HEADER ===== */}
            <DialogHeader className="shrink-0">
              <DialogTitle>Choose new or existing dish to add</DialogTitle>
            </DialogHeader>

            {/* ===== ACTION TOP ===== */}
            <div className="shrink-0 text-left">
              <Button
                variant="link"
                className="px-0 text-sm"
                onClick={() => {
                  setShowDishPicker(false);
                  setShowAddDishModal(true);
                }}
              >
                + Add new dish
              </Button>
            </div>

            <RestaurantDishSelector
              dishes={dishList}
              disabledNames={activeSchedule.items.map((i) => i.name)}
              value={selectedDishes}
              onChange={(items) => setSelectedDishes(items)}
            />

            <DialogFooter className="shrink-0 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDishes([]);
                  setShowDishPicker(false);
                }}
              >
                Cancel
              </Button>

              <Button
                disabled={!selectedDishes.length}
                onClick={() => {
                  if (!selectedDishes.length) return;
                  selectedDishes.forEach((dish) => handleAddMenuItem(dish, []));
                  setSelectedDishes([]);
                  setShowDishPicker(false);
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ===== DISH FORM ===== */}
      <RestaurantDishForm
        open={showAddDishModal}
        loading={loading}
        mode={editingDish ? 'edit' : 'create'}
        initialData={editingDish ?? undefined}
        onClose={() => {
          setShowAddDishModal(false);
          setEditingDish(null);
        }}
        onSubmit={(dish, images) => {
          if (editingDish) {
            handleUpdateMenuItem(dish, images);
          } else {
            handleAddMenuItem(dish, images);
          }
        }}
      />
    </div>
  );
}
