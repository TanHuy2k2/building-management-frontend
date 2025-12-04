import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { mockBusRoutes, mockBusSchedules } from '../../data/mockData';
import { Bus as BusIcon, MapPin, Clock, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export default function UserBus() {
  const [open, setOpen] = useState(false);
  const routes = mockBusRoutes;
  const schedules = mockBusSchedules;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Xe Buýt Nội Khu</h1>
          <p className="text-muted-foreground">Đặt chỗ xe buýt</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Đặt chỗ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đặt chỗ xe buýt</DialogTitle>
              <DialogDescription>Chọn tuyến và giờ khởi hành</DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Tuyến đường</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tuyến" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngày đi</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Giờ khởi hành</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07:00">07:00</SelectItem>
                    <SelectItem value="07:30">07:30</SelectItem>
                    <SelectItem value="17:30">17:30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số lượng chỗ</Label>
                <Input type="number" min="1" max="5" defaultValue="1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Xác nhận</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tuyến đường</h2>
        {routes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <CardTitle className="text-base">{route.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Điểm đi</p>
                      <p className="text-sm text-muted-foreground">{route.startPoint}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Điểm đến</p>
                      <p className="text-sm text-muted-foreground">{route.endPoint}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-sm">{route.duration} phút</span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{route.price.toLocaleString()} VNĐ</p>
                    <p className="text-sm text-muted-foreground">/ chuyến</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Trạm dừng:</p>
                <div className="flex flex-wrap gap-2">
                  {route.stops.map((stop, idx) => (
                    <Badge key={idx} variant="outline">
                      {idx + 1}. {stop}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => setOpen(true)}>
                Đặt chỗ ngay
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Lịch trình hôm nay</h2>
        <div className="grid gap-4">
          {schedules.map((schedule) => {
            const route = routes.find((r) => r.id === schedule.routeId);
            const availableSeats = schedule.capacity - schedule.bookedSeats;

            return (
              <Card key={schedule.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <BusIcon className="size-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{schedule.busNumber}</p>
                      <p className="text-sm text-muted-foreground">{route?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-sm">{schedule.departureTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {availableSeats}/{schedule.capacity} chỗ trống
                      </span>
                    </div>
                    <Button size="sm" onClick={() => setOpen(true)}>
                      Đặt chỗ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Lưu ý</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Đặt chỗ trước ít nhất 2 giờ</p>
          <p>• Hủy chỗ miễn phí trước 1 giờ khởi hành</p>
          <p>• Có mặt tại điểm đón trước 5 phút</p>
          <p>• Tích điểm: 1 điểm cho mỗi 20.000 VNĐ</p>
        </CardContent>
      </Card>
    </div>
  );
}
