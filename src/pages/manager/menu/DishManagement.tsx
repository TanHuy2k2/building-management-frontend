import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Pencil,
  ArrowLeft as PrevIcon,
  ArrowRight as NextIcon,
  XCircle,
  CheckSquare,
} from 'lucide-react';
import {
  Dish,
  DishCategory,
  GetDishesParams,
  DishOrderBy,
  OrderDirection,
  DishForm,
  ActiveStatus,
} from '../../../types';
import { useRestaurant } from '../../../contexts/RestaurantContext';
import {
  getRestaurantDishesApi,
  createRestaurantDishApi,
  updateRestaurantDishApi,
} from '../../../services/restaurantDishService';
import { getImageUrls, resolveFoodImageUrl } from '../../../utils/image';
import { DEFAULT_FOOD_IMG_URL, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../../utils/constants';
import { formatVND } from '../../../utils/currency';
import RestaurantSelector from '../restaurant/RestaurantSelector';
import RestaurantDishForm from './RestaurantDishForm';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { getChangedFields, removeEmptyFields } from '../../../utils/updateFields';

export default function DishManagement() {
  const { currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [imageIndexMap, setImageIndexMap] = useState<Record<string, number>>({});
  const [params, setParams] = useState<GetDishesParams>({
    page: DEFAULT_PAGE,
    page_size: DEFAULT_PAGE_SIZE,
    order_by: 'created_at',
    order: OrderDirection.DESCENDING,
  });
  const [totalPage, setTotalPage] = useState(1);
  const statusConfig = {
    active: {
      label: 'Active',
      icon: CheckSquare,
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
    inactive: {
      label: 'Inactive',
      icon: XCircle,
      color: 'bg-red-100 text-red-700 hover:bg-red-200',
    },
  };

  const loadDishes = async (restaurantId: string, p: GetDishesParams) => {
    try {
      setLoading(true);

      const res = await getRestaurantDishesApi(restaurantId, p);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setDishes(res.data.dishes);
      setTotalPage(res.data.pagination.total_page);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildDishFormData = (payload: Record<string, any>, images: File[] = []) => {
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
    images.forEach((file) => formData.append('dish-images', file));

    return formData;
  };

  const handleCreateDish = async (dish: Partial<DishForm>, images: File[]) => {
    if (!currentRestaurant) {
      toast.error('Missing restaurant!');

      return;
    }

    const { image_urls, ...data } = dish;
    const payload = removeEmptyFields(data);
    if (!Object.keys(payload).length && !images.length) {
      toast.error('Please enter dish information');

      return;
    }

    const formData = buildDishFormData(payload, images);
    try {
      setLoading(true);
      const res = await createRestaurantDishApi(currentRestaurant.id, formData);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Dish created');
      setShowDishModal(false);
      loadDishes(currentRestaurant.id, {
        ...params,
        page: DEFAULT_PAGE,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDish = async (newDish: Partial<DishForm>, images: File[]) => {
    if (!currentRestaurant || !editingDish) return;

    const normalizedDish = {
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

      const formData = buildDishFormData(changedFields, images);
      const res = await updateRestaurantDishApi(currentRestaurant.id, editingDish.id, formData);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Dish updated');
      setEditingDish(null);
      setShowDishModal(false);
      loadDishes(currentRestaurant.id, params);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ActiveStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-xs font-semibold`} variant="outline">
        <Icon className="size-3 mr-1" /> {config.label}
      </Badge>
    );
  };

  const normalizeDishParams = (p: GetDishesParams): GetDishesParams => {
    if (p.name && p.order_by && p.order_by !== 'name') {
      return {
        ...p,
        order_by: 'name',
        order: OrderDirection.ASCENDING,
      };
    }

    return p;
  };

  useEffect(() => {
    if (!currentRestaurant?.id) return;

    const normalized = normalizeDishParams(params);
    if (normalized !== params) {
      setParams(normalized);

      return;
    }

    loadDishes(currentRestaurant.id, normalized);
  }, [currentRestaurant?.id, params]);

  if (!currentRestaurant) {
    return <RestaurantSelector onSelect={setCurrentRestaurant} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ===== HEADER ===== */}
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
              {currentRestaurant.name} – Available Dishes
            </h1>
            <p className="text-muted-foreground mt-1">Manage all dishes for this restaurant</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-green-600 hover:bg-green-700 hover:text-white"
            onClick={() => setShowDishModal(true)}
            disabled={loading}
          >
            <Plus className="size-4 mr-2" />
            Add Dish
          </Button>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="border rounded px-3 py-2 text-sm min-w-[140px]"
          value={params.status ?? ''}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: DEFAULT_PAGE,
              status: e.target.value ? (e.target.value as ActiveStatus) : undefined,
            }))
          }
        >
          <option value="">All status</option>
          <option value={ActiveStatus.ACTIVE}>Active</option>
          <option value={ActiveStatus.INACTIVE}>Inactive</option>
        </select>

        <input
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[240px]"
          placeholder={
            params.order_by !== 'name'
              ? 'Search only available when sorting by name'
              : 'Search dish name...'
          }
          value={params.name ?? ''}
          disabled={params.order_by !== 'name'}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: DEFAULT_PAGE,
              name: e.target.value || undefined,
            }))
          }
        />

        <select
          className="border rounded px-3 py-2 text-sm"
          value={params.order_by}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: DEFAULT_PAGE,
              name: undefined,
              order_by: e.target.value as DishOrderBy,
            }))
          }
        >
          <option value="created_at">Created date</option>
          <option value="price">Price</option>
          <option value="name">Name</option>
          <option value="category">Category</option>
        </select>

        <Button
          variant="outline"
          style={{
            background: 'transparent',
            boxShadow: 'none',
          }}
          size="icon"
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: DEFAULT_PAGE,
              order:
                p.order === OrderDirection.ASCENDING
                  ? OrderDirection.DESCENDING
                  : OrderDirection.ASCENDING,
            }))
          }
        >
          {params.order === OrderDirection.ASCENDING ? '▲' : '▼'}
        </Button>
      </div>

      {/* ===== GRID ===== */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-10">Loading dishes...</CardContent>
        </Card>
      ) : !dishes.length ? (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground">
            No dishes available
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dishes.map((dish) => {
            const images = dish.image_urls?.length ? dish.image_urls : [DEFAULT_FOOD_IMG_URL];
            const index = imageIndexMap[dish.id] ?? 0;

            return (
              <Card key={dish.id} className="relative overflow-hidden">
                <div className="relative aspect-[4/3] bg-gray-100" style={{ height: 220 }}>
                  <img
                    src={resolveFoodImageUrl(images[index])}
                    className="w-full h-full object-cover"
                  />

                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 10,
                      backgroundColor: 'white',
                      borderRadius: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {getStatusBadge(dish.status)}
                  </div>

                  {images.length > 1 && (
                    <>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        style={{ marginLeft: 6 }}
                        onClick={() =>
                          setImageIndexMap((p) => ({
                            ...p,
                            [dish.id]: (index - 1 + images.length) % images.length,
                          }))
                        }
                      >
                        <PrevIcon size={18} />
                      </Button>

                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() =>
                          setImageIndexMap((p) => ({
                            ...p,
                            [dish.id]: (index + 1) % images.length,
                          }))
                        }
                      >
                        <NextIcon size={18} />
                      </Button>
                    </>
                  )}
                </div>

                <div className="absolute right-2 flex gap-1" style={{ marginTop: 6 }}>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      setEditingDish(dish);
                      setShowDishModal(true);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                </div>

                <CardContent className="p-4 space-y-1">
                  <p className="font-semibold truncate">{dish.name}</p>
                  <p className="text-sm text-muted-foreground">{dish.category as DishCategory}</p>
                  <p className="font-medium">{formatVND(dish.price)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ===== PAGINATION ===== */}
      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          disabled={params.page === 1}
          onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
        >
          Prev
        </Button>

        <span className="px-4 py-2 text-sm">
          Page {params.page} / {totalPage}
        </span>

        <Button
          variant="outline"
          disabled={params.page === totalPage}
          onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
        >
          Next
        </Button>
      </div>

      {/* ===== DISH FORM ===== */}
      <RestaurantDishForm
        open={showDishModal}
        loading={loading}
        mode={editingDish ? 'edit' : 'create'}
        module="dish"
        initialData={editingDish ?? undefined}
        onClose={() => {
          setShowDishModal(false);
          setEditingDish(null);
        }}
        onSubmit={(dish, images) => {
          if (editingDish) handleUpdateDish(dish, images);
          else handleCreateDish(dish, images);
        }}
      />
    </div>
  );
}
