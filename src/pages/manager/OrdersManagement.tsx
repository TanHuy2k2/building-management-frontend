import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { mockOrders } from '../../data/mockData';
import { OrderStatus } from '../../types';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

export default function OrdersManagement() {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', variant: 'secondary' as const, icon: Clock },
      preparing: { label: 'Đang chuẩn bị', variant: 'default' as const, icon: Package },
      ready: { label: 'Sẵn sàng', variant: 'default' as const, icon: CheckCircle },
      delivered: { label: 'Đã giao', variant: 'default' as const, icon: Truck },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const, icon: XCircle },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="size-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
    );
  };

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý Đơn hàng</h1>
          <p className="text-muted-foreground">Theo dõi và xử lý đơn hàng</p>
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả đơn</SelectItem>
            <SelectItem value="pending">Chờ xác nhận</SelectItem>
            <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
            <SelectItem value="ready">Sẵn sàng</SelectItem>
            <SelectItem value="delivered">Đã giao</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Đơn hàng #{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.userName} • {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span>{(item.menuItem.price * item.quantity).toLocaleString()} VNĐ</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Tổng cộng:</span>
                  <span>{order.total.toLocaleString()} VNĐ</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{order.discount.toLocaleString()} VNĐ</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Thành tiền:</span>
                  <span>{order.finalAmount.toLocaleString()} VNĐ</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Hình thức:</span>{' '}
                  {order.deliveryType === 'delivery' ? 'Giao hàng' : 'Lấy tại quầy'}
                </p>
                {order.deliveryAddress && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Địa chỉ:</span>{' '}
                    {order.deliveryAddress}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="flex gap-2 pt-2">
                  {order.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        Xác nhận đơn
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        Hủy đơn
                      </Button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                    >
                      Sẵn sàng
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                    >
                      Đã giao hàng
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Không có đơn hàng nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
