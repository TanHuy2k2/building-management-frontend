import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Clock,
  ChefHat,
  Truck,
  CheckCircle,
  EyeOff,
  Eye,
  ClipboardList,
  UtensilsCrossed,
  Pencil,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  CreateOrderDto,
  MenuItem,
  Order,
  OrderDetail,
  OrderStatus,
  PickupMethod,
  Restaurant,
  UpdateOrderDto,
} from '../../types';
import { getRestaurantMenuApi } from '../../services/restaurantService';
import toast from 'react-hot-toast';
import RestaurantSelector from '../manager/restaurant/RestaurantSelector';
import { formatSnakeCase } from '../../utils/string';
import { formatVND } from '../../utils/currency';
import { DEFAULT_FOOD_IMG_URL, POINT_VALUE } from '../../utils/constants';
import { resolveFoodImageUrl } from '../../utils/image';
import { getChangedFields, removeEmptyFields } from '../../utils/updateFields';
import {
  createOrderApi,
  getCurrentOrdersApi,
  getOrderByIdApi,
  getOrderHistoryApi,
  updateOrderByIdApi,
} from '../../services/restaurantOrderService';

export default function UserOrders() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [erroredImages, setErroredImages] = useState<Record<string, boolean>>({});
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>(PickupMethod.DINE_IN);
  const [pointsUsed, setPointsUsed] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [orderHistoryTab, setOrderHistoryTab] = useState<'today' | 'history'>('today');
  const [orders, setOrders] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDialogMode, setOrderDialogMode] = useState<'create' | 'update'>('create');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [originalOrder, setOriginalOrder] = useState<Order | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<{
    building?: string;
    floor?: number;
    room?: string;
  }>({});
  const [deliveryInfo, setDeliveryInfo] = useState({
    contact_name: '',
    contact_phone: '',
    notes: '',
  });

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));
  const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
    const item = menuItems.find((i) => i.id === itemId);

    return { item, quantity };
  });
  const total = cartItems.reduce(
    (sum, { item, quantity }) => sum + (item?.price || 0) * quantity,
    0,
  );
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
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

  const loadMenu = async (restaurantId: string) => {
    try {
      setLoading(true);

      const res = await getRestaurantMenuApi(restaurantId);
      if (!res.success) {
        toast.error(res.message);
        setMenuItems([]);

        return;
      }

      setMenuItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayOrders = async () => {
    if (!currentRestaurant) return;

    try {
      setLoadingOrders(true);
      const res = await getCurrentOrdersApi(currentRestaurant.id);
      if (!res.success) {
        toast.error(res.message);
        setOrders([]);

        return;
      }

      setOrders(res.data);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadOrderHistory = async () => {
    if (!currentRestaurant) return;

    try {
      setLoadingOrders(true);
      const res = await getOrderHistoryApi(currentRestaurant.id);
      if (!res.success) {
        toast.error(res.message);
        setOrders([]);

        return;
      }

      setOrders(res.data);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleImageError = (key: string) => {
    setErroredImages((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const addToCart = (itemId: string) => {
    setCart({ ...cart, [itemId]: (cart[itemId] || 0) + 1 });
  };

  const removeFromCart = (itemId: string) => {
    if (cart[itemId] > 1) {
      setCart({ ...cart, [itemId]: cart[itemId] - 1 });
    } else {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    }
  };

  const resetOrderState = () => {
    setPickupMethod(PickupMethod.DINE_IN);
    setPointsUsed(0);
    setOrderNotes({});
    setDeliveryAddress({});
    setDeliveryInfo({
      contact_name: '',
      contact_phone: '',
      notes: '',
    });
  };

  const handleBack = () => {
    resetOrderState();
    setCurrentRestaurant(null);
  };

  const buildCreateOrderDto = (): CreateOrderDto => ({
    pickup_method: pickupMethod,
    points_used: pointsUsed || undefined,
    delivery_address: pickupMethod === PickupMethod.DELIVERY ? deliveryAddress : undefined,
    delivery_info: pickupMethod === PickupMethod.DELIVERY ? deliveryInfo : undefined,
    order_details: cartItems
      .filter(({ item }) => item)
      .map(({ item, quantity }) => ({
        name: item!.name,
        price: item!.price,
        quantity,
        notes: orderNotes[item!.id] || '',
      })),
  });

  const buildUpdateOrderDto = (): UpdateOrderDto => ({
    pickup_method: pickupMethod,
    delivery_address: pickupMethod === PickupMethod.DELIVERY ? deliveryAddress : undefined,
    delivery_info: pickupMethod === PickupMethod.DELIVERY ? deliveryInfo : undefined,
  });

  const handleCreateOrder = async () => {
    const payload = removeEmptyFields(buildCreateOrderDto());
    if (!payload.order_details.length) {
      toast.error('Cart is empty');

      return;
    }

    const res = await createOrderApi(currentRestaurant!.id, payload);
    if (!res.success) {
      toast.error(res.message);

      return;
    }

    toast.success('Order created successfully');
    resetOrderState();
    setCart({});
    setShowCreateOrder(false);
  };

  const handleViewDetails = async (orderId: string, userId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderDetails([]);

      return;
    }

    if (!currentRestaurant) return;

    setExpandedOrderId(orderId);
    setLoadingDetails(true);
    setOrderDetails([]);

    try {
      const res = await getOrderByIdApi(currentRestaurant!.id, orderId);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      setOrderDetails(res.data.order_details);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!currentRestaurant || !editingOrder || !originalOrder) return;

    try {
      setLoading(true);
      const payload = removeEmptyFields(
        getChangedFields(
          {
            pickup_method: originalOrder.pickup_method,
            delivery_address: originalOrder.delivery_address,
            delivery_info: originalOrder.delivery_info,
          },
          buildUpdateOrderDto(),
        ),
      );
      const res = await updateOrderByIdApi(currentRestaurant.id, editingOrder.id, payload);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      toast.success('Order updated successfully');
      loadTodayOrders();

      setShowCreateOrder(false);
      setEditingOrder(null);
      setOrderDialogMode('create');
      resetOrderState();
    } finally {
      setLoading(false);
    }
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

  const renderOrders = () => {
    if (loadingOrders) {
      return <p className="text-muted-foreground text-center py-6">Loading orders...</p>;
    }

    if (!orders.length) {
      return (
        <p className="text-muted-foreground text-center py-6">
          {orderHistoryTab === 'today' ? 'No orders today' : 'No order history'}
        </p>
      );
    }

    return (
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
                      disabled={order.status !== OrderStatus.PENDING}
                      onClick={() => {
                        setEditingOrder(order);
                        setOriginalOrder(order);
                        setOrderDialogMode('update');
                        setShowCreateOrder(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

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
    );
  };

  useEffect(() => {
    if (!currentRestaurant?.id) return;

    loadMenu(currentRestaurant.id);
  }, [currentRestaurant?.id]);

  useEffect(() => {
    if (!activeCategory && categories.length) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!showOrderHistory) return;

    if (orderHistoryTab === 'today') {
      loadTodayOrders();
    } else {
      loadOrderHistory();
    }
  }, [showOrderHistory, orderHistoryTab, currentRestaurant?.id]);

  useEffect(() => {
    if (orderDialogMode !== 'update' || !editingOrder) return;

    setPickupMethod(editingOrder.pickup_method);
    setDeliveryAddress(editingOrder.delivery_address || {});
    setDeliveryInfo({
      contact_name: editingOrder.delivery_info?.contact_name || '',
      contact_phone: editingOrder.delivery_info?.contact_phone || '',
      notes: editingOrder.delivery_info?.notes || '',
    });
  }, [orderDialogMode, editingOrder]);

  if (!currentRestaurant) {
    return <RestaurantSelector onSelect={setCurrentRestaurant} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => handleBack()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Food Order</h1>
            <p className="text-muted-foreground">Pick your favorite food for the day</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowOrderHistory((prev) => !prev)}
          >
            {showOrderHistory ? (
              <>
                <UtensilsCrossed className="size-4" />
                Order Food
              </>
            ) : (
              <>
                <ClipboardList className="size-4" />
                Your Orders
              </>
            )}
          </Button>
          <Button onClick={() => setShowCart(true)} className="relative">
            <ShoppingCart className="size-4 mr-2" />
            Cart
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 size-6 p-0 flex items-center justify-center">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {showOrderHistory ? (
        <>
          <Tabs
            value={orderHistoryTab}
            onValueChange={(v: string) => setOrderHistoryTab(v as 'today' | 'history')}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>

          {renderOrders()}
        </>
      ) : loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading menu...</div>
      ) : (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {formatSnakeCase(category)}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <Card key={item.id}>
                      <CardHeader className="p-0">
                        <img
                          src={
                            erroredImages[`${item.id}-0`]
                              ? DEFAULT_FOOD_IMG_URL
                              : resolveFoodImageUrl(item.image_urls?.[0])
                          }
                          alt={item.name}
                          className="w-full h-64 object-cover rounded-t-lg"
                          onError={() => handleImageError(`${item.id}-0`)}
                        />
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-lg">{formatVND(item.price)}</p>
                          {cart[item.id] ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="size-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{cart[item.id]}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => addToCart(item.id)}
                              >
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => addToCart(item.id)}>
                              <Plus className="size-4 mr-2" />
                              Add
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your order cart</DialogTitle>
            <DialogDescription>Review your cart before paying</DialogDescription>
          </DialogHeader>

          {!cartItems.length ? (
            <div className="py-8 text-center">
              <ShoppingCart className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Empty cart</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(({ item, quantity }) =>
                item ? (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          erroredImages[`${item.id}-0`]
                            ? DEFAULT_FOOD_IMG_URL
                            : resolveFoodImageUrl(item.image_urls?.[0])
                        }
                        alt={item.name}
                        className="size-10 aspect-square rounded-full object-cover shrink-0 block bg-muted"
                        onError={() => handleImageError(`${item.id}-0`)}
                      />

                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{formatVND(item.price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" onClick={() => removeFromCart(item.id)}>
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-8 text-center">{quantity}</span>
                      <Button size="icon" variant="outline" onClick={() => addToCart(item.id)}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : null,
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">{formatVND(total)}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowCart(false);
                    setOrderDialogMode('create');
                    setEditingOrder(null);
                    resetOrderState();
                    setShowCreateOrder(true);
                  }}
                >
                  Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Confirm Dialog */}
      <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
        <DialogContent
          style={{
            ...(orderDialogMode === 'update'
              ? { width: '600px', maxWidth: '95vw' }
              : { width: '90vw', maxWidth: '1200px' }),
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DialogTitle className="flex items-center gap-2">
            {orderDialogMode === 'create' ? (
              'Confirm order'
            ) : (
              <>
                Update order
                {editingOrder?.id && (
                  <span className="text-sm font-normal text-muted-foreground">
                    #{editingOrder.id}
                  </span>
                )}
              </>
            )}
          </DialogTitle>

          <DialogDescription>
            {orderDialogMode === 'create'
              ? 'Choose pickup method and enter order information'
              : 'Update pickup and delivery information'}
          </DialogDescription>

          {/* BODY */}
          <div
            className={`flex-1 grid gap-4 overflow-hidden ${
              orderDialogMode === 'update' ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Pickup method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pickup Method</label>
                <select
                  value={pickupMethod}
                  onChange={(e) => setPickupMethod(e.target.value as PickupMethod)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value={PickupMethod.DINE_IN}>Dine in</option>
                  <option value={PickupMethod.TAKEAWAY}>Takeaway</option>
                  <option value={PickupMethod.DELIVERY}>Delivery</option>
                </select>
              </div>

              {orderDialogMode === 'create' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Use Membership Points</label>

                  <input
                    type="number"
                    min={0}
                    value={pointsUsed}
                    onChange={(e) => setPointsUsed(Number(e.target.value) || 0)}
                    className="w-full border rounded-md px-3 py-2"
                  />

                  {pointsUsed > 0 && (
                    <p className="text-xs text-muted-foreground">
                      − {formatVND(pointsUsed * 1000)}
                    </p>
                  )}
                </div>
              )}

              {/* Delivery fields */}
              {pickupMethod === PickupMethod.DELIVERY && (
                <div className="space-y-3">
                  <div className="space-y-3">
                    {/* Section title */}
                    <p className="text-sm font-medium">Delivery Address</p>

                    {/* Building */}
                    <div className="flex items-center gap-3">
                      <input
                        placeholder="Building"
                        className="flex-1 border rounded-md px-3 py-2"
                        value={deliveryAddress.building}
                        onChange={(e) =>
                          setDeliveryAddress((p) => ({ ...p, building: e.target.value }))
                        }
                      />
                    </div>

                    {/* Floor & Room */}
                    <div className="flex gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <label className="w-28 text-sm">Floor: </label>
                        <input
                          type="number"
                          min={1}
                          className="flex-1 border rounded-md px-3 py-2"
                          value={deliveryAddress.floor ?? ''}
                          onChange={(e) =>
                            setDeliveryAddress((p) => ({
                              ...p,
                              floor: e.target.value ? Number(e.target.value) : undefined,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center gap-3 flex-1">
                        <label className="w-28 text-sm">Room: </label>
                        <input
                          className="flex-1 border rounded-md px-3 py-2"
                          value={deliveryAddress.room ?? ''}
                          onChange={(e) =>
                            setDeliveryAddress((p) => ({ ...p, room: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium">Delivery Info</p>

                  <input
                    placeholder="Contact name"
                    className="w-full border rounded-md px-3 py-2"
                    value={deliveryInfo.contact_name}
                    onChange={(e) =>
                      setDeliveryInfo((p) => ({ ...p, contact_name: e.target.value }))
                    }
                  />

                  <input
                    placeholder="Contact phone"
                    className="w-full border rounded-md px-3 py-2"
                    value={deliveryInfo.contact_phone}
                    onChange={(e) =>
                      setDeliveryInfo((p) => ({ ...p, contact_phone: e.target.value }))
                    }
                  />

                  <textarea
                    placeholder="Notes"
                    className="w-full border rounded-md px-3 py-2"
                    value={deliveryInfo.notes}
                    onChange={(e) => setDeliveryInfo((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {orderDialogMode === 'create' && (
              <div className="border rounded-md p-3 overflow-y-auto space-y-3 bg-muted/30">
                <p className="font-medium">Order Details</p>

                {cartItems.map(({ item, quantity }) =>
                  item ? (
                    <div key={item.id} className="space-y-2 rounded-md bg-background p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {item.name} × {quantity}
                        </span>
                        <span>{formatVND(item.price * quantity)}</span>
                      </div>

                      <textarea
                        placeholder="Notes for this item (optional)"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={orderNotes[item.id] || ''}
                        onChange={(e) =>
                          setOrderNotes((p) => ({ ...p, [item.id]: e.target.value }))
                        }
                      />
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateOrder(false);
                if (orderDialogMode === 'create') {
                  resetOrderState();
                }
                setEditingOrder(null);
                setOrderDialogMode('create');
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={orderDialogMode === 'create' ? handleCreateOrder : handleUpdateOrder}
              disabled={loading}
            >
              {orderDialogMode === 'create' ? 'Confirm order' : 'Update order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
