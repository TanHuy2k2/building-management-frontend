import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Clock, Package, CheckCircle, Truck, EyeOff, Eye } from 'lucide-react';
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
import { getOrderByIdApi, getRestaurantOrdersApi } from '../../services/restaurantOrderService';
import RestaurantSelector from './restaurant/RestaurantSelector';
import toast from 'react-hot-toast';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getUserById } from '../../services/userService';

export default function OrdersManagement() {
  const { currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderUser, setOrderUser] = useState<User>();
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
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
  const statusMap = {
    [OrderStatus.PENDING]: { label: 'Pending', icon: Clock, variant: 'secondary' },
    [OrderStatus.PREPARING]: { label: 'Preparing', icon: Package, variant: 'badge' },
    [OrderStatus.DELIVERING]: { label: 'Delivering', icon: CheckCircle, variant: 'outline' },
    [OrderStatus.COMPLETED]: { label: 'Completed', icon: Truck, variant: 'secondary' },
  };

  const getStatusBadge = (status: OrderStatus) => {
    const cfg = statusMap[status];
    const Icon = cfg.icon;

    return (
      <Badge variant={cfg.variant} className="h-9 px-3 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
    );
  };

  /* ===================== LOAD ORDERS ===================== */
  const loadOrders = async () => {
    if (!currentRestaurant) return;

    setLoading(true);
    try {
      const res = await getRestaurantOrdersApi(currentRestaurant.id, params);
      if (!res.success) {
        toast.error(res.message);

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
      </div>

      {/* ===== ORDERS LIST ===== */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-10">Loading orders...</CardContent>
        </Card>
      ) : !orders.length ? (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground">
            No orders found
          </CardContent>
        </Card>
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
    </div>
  );
}
