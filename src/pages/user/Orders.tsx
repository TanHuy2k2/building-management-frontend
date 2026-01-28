import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { mockMenuItems } from '../../data/mockData';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { CreateOrderDto, MenuItem, PickupMethod, Restaurant } from '../../types';
import { getRestaurantMenuApi } from '../../services/restaurantService';
import toast from 'react-hot-toast';
import RestaurantSelector from '../manager/restaurant/RestaurantSelector';
import { formatSnakeCase } from '../../utils/string';
import { formatVND } from '../../utils/currency';
import { DEFAULT_FOOD_IMG_URL } from '../../utils/constants';
import { resolveFoodImageUrl } from '../../utils/image';
import { removeEmptyFields } from '../../utils/updateFields';
import { createOrderApi } from '../../services/restaurantOrderService';

export default function UserOrders() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [erroredImages, setErroredImages] = useState<Record<string, boolean>>({});
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>(PickupMethod.DINE_IN);
  const [pointsUsed, setPointsUsed] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
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
    setCart({});
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
    setShowCreateOrder(false);
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

  if (!currentRestaurant) {
    return <RestaurantSelector onSelect={setCurrentRestaurant} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Food Order</h1>
          <p className="text-muted-foreground">Pick your favorite food for the day</p>
        </div>
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

      {loading ? (
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

      <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
        <DialogContent
          style={{
            width: '90vw',
            maxWidth: '1200px',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DialogHeader>
            <DialogTitle>Confirm order</DialogTitle>
            <DialogDescription>Choose pickup method and enter order information</DialogDescription>
          </DialogHeader>

          {/* BODY */}
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            {/* LEFT – Order info */}
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
                  <p className="text-xs text-muted-foreground">− {formatVND(pointsUsed * 1000)}</p>
                )}
              </div>

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

            {/* RIGHT – Order items */}
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
                      onChange={(e) => setOrderNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                    />
                  </div>
                ) : null,
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateOrder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={loading}>
              Confirm order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
