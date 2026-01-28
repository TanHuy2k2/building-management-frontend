import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, Truck, EyeOff, Eye, Loader2, ChefHat } from 'lucide-react';
import {
  Order,
  OrderDetail,
  OrderStatus,
  OrderDirection,
  GetOrdersParams,
  PickupMethod,
  User,
} from '../../types';
import { Restaurant } from '../../types/restaurant';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_TOTAL,
  POINT_VALUE,
} from '../../utils/constants';
import {
  getOrderByIdApi,
  getRestaurantOrdersApi,
  updateOrderStatusApi,
} from '../../services/restaurantOrderService';
import RestaurantSelector from './restaurant/RestaurantSelector';
import toast from 'react-hot-toast';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getUserById } from '../../services/userService';
import { getPaginationNumbers } from '../../utils/pagination';

export default function OrdersManagement() {
  const { currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderUser, setOrderUser] = useState<User>();
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [totalPage, setTotalPage] = useState(DEFAULT_PAGE_TOTAL);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<GetOrdersParams>({
    date: new Date().toISOString().slice(0, 10),
    status: undefined,
    pickup_method: undefined,
    page: DEFAULT_PAGE,
    page_size: DEFAULT_PAGE_SIZE,
    order: OrderDirection.DESCENDING,
  });
  const isFiltering = !!params.status || !!params.pickup_method;
  const statusMap: Record<
    OrderStatus,
    {
      label: string;
      icon: React.ElementType;
      className: string;
    }
  > = {
    [OrderStatus.PENDING]: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200',
    },
    [OrderStatus.PREPARING]: {
      label: 'Preparing',
      icon: ChefHat,
      className: 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200',
    },
    [OrderStatus.DELIVERING]: {
      label: 'Delivering',
      icon: Truck,
      className: 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200',
    },
    [OrderStatus.COMPLETED]: {
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200',
    },
  };
  const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.PENDING]: OrderStatus.PREPARING,
    [OrderStatus.PREPARING]: OrderStatus.DELIVERING,
    [OrderStatus.DELIVERING]: OrderStatus.COMPLETED,
  };

  const getStatusBadge = (status: OrderStatus) => {
    const cfg = statusMap[status];
    const Icon = cfg.icon;

    return (
      <Badge className={`h-9 px-3 flex items-center gap-1 ${cfg.className}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
    );
  };

  const loadOrders = async () => {
    if (!currentRestaurant) return;

    setLoading(true);
    try {
      const res = await getRestaurantOrdersApi(currentRestaurant.id, params);
      if (!res.success) {
        toast.error(res.message);
        setOrders([]);
        setTotalPage(DEFAULT_PAGE_TOTAL);

        return;
      }

      setOrders(res.data.orders);
      setTotalPage(res.data.pagination.total_page);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string, userId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderDetails([]);
      setOrderUser(undefined);

      return;
    }

    if (!currentRestaurant) return;

    setExpandedOrderId(orderId);
    setLoadingDetails(true);
    setOrderDetails([]);

    try {
      const [orderRes, userRes] = await Promise.all([
        getOrderByIdApi(currentRestaurant!.id, orderId),
        getUserById(userId),
      ]);

      if (!orderRes.success) {
        toast.error(orderRes.message);

        return;
      }

      if (!userRes.success) {
        toast.error(userRes.message);

        return;
      }

      setOrderDetails(orderRes.data.order_details);
      setOrderUser(userRes.data);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleNextStatus = async (order: Order) => {
    const nextStatus = nextStatusMap[order.status];
    if (!nextStatus || !currentRestaurant) return;

    setUpdatingOrderId(order.id);
    try {
      const res = await updateOrderStatusApi(currentRestaurant.id, order.id, nextStatus);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success(`Order moved to ${statusMap[nextStatus].label}`);

      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /* ===================== EFFECTS ===================== */
  useEffect(() => {
    loadOrders();
  }, [currentRestaurant, params]);

  /* ===================== SELECT RESTAURANT ===================== */
  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setCurrentRestaurant(restaurant);
    setOrders([]);
    setParams((p) => ({ ...p, page: DEFAULT_PAGE }));
  };

  if (!currentRestaurant) {
    return <RestaurantSelector onSelect={handleSelectRestaurant} />;
  }

  /* ===================== RENDER ===================== */
  return (
    <div className="flex flex-col gap-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentRestaurant(null)}
            className="p-2 rounded border bg-white hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentRestaurant.name} – Orders</h1>
            <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status */}
        <select
          className="border rounded px-3 py-2 text-sm min-w-[160px]"
          value={params.status ?? ''}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: DEFAULT_PAGE,
              status: e.target.value ? (e.target.value as OrderStatus) : undefined,
            }))
          }
        >
          <option value="">All status</option>
          {Object.values(OrderStatus).map((s) => (
            <option key={s} value={s}>
              {statusMap[s].label}
            </option>
          ))}
        </select>

        {/* Pickup method */}
        <select
          className="border rounded px-3 py-2 text-sm min-w-[160px]"
          value={params.pickup_method ?? ''}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: DEFAULT_PAGE,
              pickup_method: e.target.value ? (e.target.value as PickupMethod) : undefined,
            }))
          }
        >
          <option value="">All pickup methods</option>
          <option value={PickupMethod.DINE_IN}>Dine in</option>
          <option value={PickupMethod.TAKEAWAY}>Takeaway</option>
          <option value={PickupMethod.DELIVERY}>Delivery</option>
        </select>

        {/* Date */}
        <input
          type="date"
          className="border rounded px-3 py-2 text-sm"
          value={params.date}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              page: DEFAULT_PAGE,
              date: e.target.value,
            }))
          }
        />

        <Button
          variant="outline"
          style={{
            background: 'transparent',
            boxShadow: 'none',
          }}
          className="border rounded px-3 py-2 text-sm"
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
          {params.order === OrderDirection.ASCENDING ? 'Oldest ▲' : 'Newest ▼'}
        </Button>
      </div>

      {/* ===== ORDERS LIST ===== */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-10">Loading orders...</CardContent>
        </Card>
      ) : !orders.length ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 pt-4 pb-14">
              {isFiltering ? (
                <EyeOff className="h-10 w-10 text-muted-foreground" />
              ) : (
                <ChefHat className="h-10 w-10 text-muted-foreground" />
              )}

              <p className="text-base font-medium text-foreground text-center">
                {isFiltering ? 'No orders match your filters' : 'No orders yet'}
              </p>

              {isFiltering && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setParams((p) => ({
                      ...p,
                      status: undefined,
                      pickup_method: undefined,
                      page: DEFAULT_PAGE,
                    }))
                  }
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order) => {
            const discountAmount = (order.discount || 0) + (order.points_used || 0) * POINT_VALUE;

            return (
              <Card key={order.id}>
                <CardHeader className="pb-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base">Order #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}

                      {order.status !== OrderStatus.COMPLETED && nextStatusMap[order.status] && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleNextStatus(order)}
                          title={`Edit status → ${statusMap[nextStatusMap[order.status]!].label}`}
                        >
                          {(() => {
                            const nextStatus = nextStatusMap[order.status];
                            if (!nextStatus) return null;

                            const NextIcon = statusMap[nextStatus].icon;

                            return updatingOrderId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <NextIcon className="w-4 h-4" />
                            );
                          })()}
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleViewDetails(order.id, order.user_id)}
                      >
                        {expandedOrderId === order.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {expandedOrderId === order.id && (
                    <>
                      {loadingDetails ? (
                        <p className="text-sm text-muted-foreground">Loading order details...</p>
                      ) : (
                        <div className="space-y-2">
                          {/* ===== USER INFO ===== */}
                          {orderUser && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">User:</span>{' '}
                              <span className="font-medium">
                                {orderUser.full_name || orderUser.email}
                              </span>
                            </p>
                          )}

                          {/* ===== ORDER DETAILS ===== */}
                          {orderDetails.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span>{(item.price * item.quantity).toLocaleString()} VNĐ</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* ===== PAYMENT SUMMARY ===== */}
                  <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{order.base_amount.toLocaleString()} VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT</span>
                      <span>{order.vat_charge.toLocaleString()} VNĐ</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{discountAmount.toLocaleString()} VNĐ</span>
                      </div>
                    )}

                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>{order.total_amount.toLocaleString()} VNĐ</span>
                    </div>
                  </div>

                  {/* ===== PICKUP / DELIVERY INFO ===== */}
                  <div className="border-t pt-3 text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Method:</span>{' '}
                      <span className="font-medium capitalize">
                        {order.pickup_method.replace('_', ' ')}
                      </span>
                    </p>

                    {order.pickup_method === PickupMethod.DELIVERY && order.delivery_address && (
                      <p>
                        <span className="text-muted-foreground">Address:</span>{' '}
                        {[
                          order.delivery_address.building,
                          order.delivery_address.floor && `Floor ${order.delivery_address.floor}`,
                          order.delivery_address.room && `Room ${order.delivery_address.room}`,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}

                    {order.pickup_method === PickupMethod.DELIVERY &&
                      order.delivery_info?.contact_name && (
                        <p>
                          <span className="text-muted-foreground">Receiver:</span>{' '}
                          {order.delivery_info.contact_name}
                          {order.delivery_info.contact_phone &&
                            ` • ${order.delivery_info.contact_phone}`}
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex justify-center mt-4 gap-2">
        {/* Prev */}
        <Button
          variant="outline"
          disabled={params.page === 1}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Math.max(1, (p.page ?? 1) - 1),
            }))
          }
        >
          Prev
        </Button>

        {/* Numbers */}
        <div className="flex gap-2">
          {getPaginationNumbers(params.page ?? 1, totalPage).map((item, idx) => {
            if (item === '...') {
              return (
                <div key={idx} className="px-3 py-1 border rounded-lg text-gray-500">
                  ...
                </div>
              );
            }

            return (
              <button
                key={idx}
                onClick={() =>
                  setParams((p) => ({
                    ...p,
                    page: Number(item),
                  }))
                }
                style={{
                  backgroundColor: params.page === item ? 'black' : 'white',
                  color: params.page === item ? 'white' : 'black',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s',
                }}
                className={params.page === item ? '' : 'hover:bg-gray-100'}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          disabled={params.page === totalPage}
          onClick={() =>
            setParams((p) => ({
              ...p,
              page: Math.min(totalPage, (p.page ?? 1) + 1),
            }))
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
