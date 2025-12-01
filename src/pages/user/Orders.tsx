import { useState } from 'react';
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

export default function UserOrders() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);

  const menuItems = mockMenuItems;
  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

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

  const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
    const item = menuItems.find((i) => i.id === itemId);
    return { item, quantity };
  });

  const total = cartItems.reduce(
    (sum, { item, quantity }) => sum + (item?.price || 0) * quantity,
    0
  );

  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Đặt Món Ăn</h1>
          <p className="text-muted-foreground">Chọn món ăn yêu thích</p>
        </div>
        <Button onClick={() => setShowCart(true)} className="relative">
          <ShoppingCart className="size-4 mr-2" />
          Giỏ hàng
          {cartCount > 0 && (
            <Badge className="absolute -top-2 -right-2 size-6 p-0 flex items-center justify-center">
              {cartCount}
            </Badge>
          )}
        </Button>
      </div>

      <Tabs defaultValue={categories[0]} className="space-y-4">
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
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
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-lg">
                          {item.price.toLocaleString()} VNĐ
                        </p>
                        {cart[item.id] ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="size-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {cart[item.id]}
                            </span>
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
                            Thêm
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

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giỏ hàng của bạn</DialogTitle>
            <DialogDescription>
              Xem lại đơn hàng trước khi thanh toán
            </DialogDescription>
          </DialogHeader>

          {cartItems.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Giỏ hàng trống</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(({ item, quantity }) =>
                item ? (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="size-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.price.toLocaleString()} VNĐ
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-8 text-center">{quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => addToCart(item.id)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : null
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Tổng cộng:</span>
                  <span className="font-semibold">{total.toLocaleString()} VNĐ</span>
                </div>
                <Button className="w-full">Đặt hàng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
