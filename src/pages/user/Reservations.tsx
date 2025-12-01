import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

export default function UserReservations() {
  const [open, setOpen] = useState(false);

  const facilities = [
    {
      id: 1,
      name: 'Sân Tennis A',
      type: 'field',
      price: 120000,
      description: 'Sân tennis tiêu chuẩn quốc tế',
    },
    {
      id: 2,
      name: 'Sân Bóng Đá Mini',
      type: 'field',
      price: 200000,
      description: 'Sân bóng đá 5 người',
    },
    {
      id: 3,
      name: 'Phòng Họp A',
      type: 'room',
      price: 150000,
      description: 'Phòng họp 20 người, có projector',
    },
    {
      id: 4,
      name: 'Hội Trường',
      type: 'room',
      price: 500000,
      description: 'Hội trường 200 người',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Đặt Sân/Phòng</h1>
          <p className="text-muted-foreground">Đặt cơ sở vật chất</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Đặt mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đặt sân/phòng</DialogTitle>
              <DialogDescription>Điền thông tin để đặt chỗ</DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Loại dịch vụ</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field">Sân thể thao</SelectItem>
                    <SelectItem value="room">Phòng họp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngày</Label>
                <Input type="date" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giờ bắt đầu</Label>
                  <Input type="time" />
                </div>
                <div className="space-y-2">
                  <Label>Giờ kết thúc</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Đặt chỗ</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((facility) => (
          <Card key={facility.id}>
            <CardHeader>
              <CardTitle className="text-base">{facility.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{facility.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Đặt trước 1 ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>Hủy trước 1 giờ</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {facility.price.toLocaleString()} VNĐ/giờ
                  </span>
                </div>
                <Button onClick={() => setOpen(true)}>Đặt ngay</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Info */}
      <Card>
        <CardHeader>
          <CardTitle>Chính sách đặt chỗ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Đặt trước tối thiểu 1 ngày</p>
          <p>• Hủy trước 1 giờ để được hoàn tiền</p>
          <p>• Đặt cọc 25-50% tổng giá trị</p>
          <p>• Tích điểm: 1 điểm cho mỗi 20.000 VNĐ</p>
        </CardContent>
      </Card>
    </div>
  );
}
