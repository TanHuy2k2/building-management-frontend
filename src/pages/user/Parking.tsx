import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { mockParkingSlots } from '../../data/mockData';
import { ParkingCircle, CheckCircle, XCircle } from 'lucide-react';

export default function UserParking() {
  const slots = mockParkingSlots;
  const availableSlots = slots.filter((s) => !s.occupied);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bãi Đậu Xe</h1>
        <p className="text-muted-foreground">Đăng ký chỗ đậu xe</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Tổng số chỗ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{slots.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Còn trống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{availableSlots.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Giá thuê tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">1.2M VNĐ</div>
          </CardContent>
        </Card>
      </div>

      {/* Parking Areas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Khu A</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {slots
            .filter((s) => s.area === 'Khu A')
            .map((slot) => (
              <Card
                key={slot.id}
                className={slot.occupied ? 'opacity-50' : 'hover:shadow-md cursor-pointer'}
              >
                <CardContent className="p-4 text-center">
                  <ParkingCircle
                    className={`size-8 mx-auto mb-2 ${
                      slot.occupied ? 'text-gray-400' : 'text-green-600'
                    }`}
                  />
                  <div className="font-semibold">{slot.slotNumber}</div>
                  <Badge
                    variant={slot.occupied ? 'destructive' : 'outline'}
                    className="mt-2 text-xs"
                  >
                    {slot.occupied ? (
                      <>
                        <XCircle className="size-3 mr-1" />
                        Đã đặt
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-3 mr-1" />
                        Trống
                      </>
                    )}
                  </Badge>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Khu B</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {slots
            .filter((s) => s.area === 'Khu B')
            .map((slot) => (
              <Card
                key={slot.id}
                className={slot.occupied ? 'opacity-50' : 'hover:shadow-md cursor-pointer'}
              >
                <CardContent className="p-4 text-center">
                  <ParkingCircle
                    className={`size-8 mx-auto mb-2 ${
                      slot.occupied ? 'text-gray-400' : 'text-green-600'
                    }`}
                  />
                  <div className="font-semibold">{slot.slotNumber}</div>
                  <Badge
                    variant={slot.occupied ? 'destructive' : 'outline'}
                    className="mt-2 text-xs"
                  >
                    {slot.occupied ? (
                      <>
                        <XCircle className="size-3 mr-1" />
                        Đã đặt
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-3 mr-1" />
                        Trống
                      </>
                    )}
                  </Badge>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Pricing Info */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Đăng ký theo tháng</p>
              <p className="text-sm text-muted-foreground">Ưu đãi cho cư dân thường xuyên</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">1.200.000 VNĐ</p>
              <Button className="mt-2" size="sm">
                Đăng ký
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Đăng ký theo ngày</p>
              <p className="text-sm text-muted-foreground">Phù hợp cho khách thăm</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">50.000 VNĐ</p>
              <Button className="mt-2" size="sm">
                Đăng ký
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
