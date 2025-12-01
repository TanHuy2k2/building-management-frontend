import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { mockParkingSlots, mockParkingRegistrations } from '../../data/mockData';
import { ParkingCircle, Car, CheckCircle } from 'lucide-react';

export default function ParkingManagement() {
  const slots = mockParkingSlots;
  const registrations = mockParkingRegistrations;

  const occupiedSlots = slots.filter((s) => s.occupied).length;
  const availableSlots = slots.filter((s) => !s.occupied).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quản lý Bãi đậu xe</h1>
        <p className="text-muted-foreground">Quản lý chỗ đậu xe và đăng ký</p>
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
            <CardTitle className="text-sm">Đã sử dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{occupiedSlots}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Còn trống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {availableSlots}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parking Slots Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Sơ đồ bãi xe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 rounded-lg border-2 text-center ${
                  slot.occupied
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <ParkingCircle
                  className={`size-6 mx-auto mb-2 ${
                    slot.occupied ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
                <div className="font-semibold text-sm">{slot.slotNumber}</div>
                <div className="text-xs text-muted-foreground mt-1">{slot.area}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Đăng ký hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registrations.map((reg) => (
              <div key={reg.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Car className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{reg.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {reg.slotNumber} • {reg.vehicleNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={reg.type === 'monthly' ? 'default' : 'secondary'}>
                      {reg.type === 'monthly' ? 'Tháng' : 'Ngày'}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="size-3 mr-1" />
                      Hoạt động
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">
                    {reg.price.toLocaleString()} VNĐ
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(reg.startDate).toLocaleDateString('vi-VN')} -{' '}
                    {new Date(reg.endDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
