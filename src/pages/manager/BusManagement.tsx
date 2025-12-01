import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { mockBusRoutes, mockBusSchedules, mockBusBookings } from '../../data/mockData';
import { Bus, MapPin, Clock, Users } from 'lucide-react';

export default function BusManagement() {
  const routes = mockBusRoutes;
  const schedules = mockBusSchedules;
  const bookings = mockBusBookings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quản lý Xe buýt</h1>
        <p className="text-muted-foreground">Quản lý tuyến đường và lịch trình xe buýt</p>
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
                    <MapPin className="size-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Điểm đi</p>
                      <p className="text-sm text-muted-foreground">{route.startPoint}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-red-600 mt-1" />
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {route.price.toLocaleString()} VNĐ/chuyến
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Các trạm dừng:</p>
                <div className="flex flex-wrap gap-2">
                  {route.stops.map((stop, idx) => (
                    <Badge key={idx} variant="outline">
                      {stop}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Lịch trình hôm nay</h2>
        {schedules.map((schedule) => {
          const route = routes.find((r) => r.id === schedule.routeId);
          const occupancyRate = (schedule.bookedSeats / schedule.capacity) * 100;

          return (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bus className="size-5" />
                      {schedule.busNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{route?.name}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {schedule.departureTime}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tài xế</p>
                  <p className="text-sm font-medium">{schedule.driver}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="size-4" />
                      Chỗ ngồi
                    </span>
                    <span>
                      {schedule.bookedSeats}/{schedule.capacity}
                    </span>
                  </div>
                  <Progress value={occupancyRate} />
                  <p className="text-xs text-muted-foreground">
                    {occupancyRate.toFixed(0)}% đã đặt
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Đặt chỗ gần đây</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{booking.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.routeName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.date).toLocaleDateString('vi-VN')} •{' '}
                      {booking.departureTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {booking.seats} chỗ
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      {booking.price.toLocaleString()} VNĐ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
