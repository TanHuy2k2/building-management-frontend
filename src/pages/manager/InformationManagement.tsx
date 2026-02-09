import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Plus, AlertCircle, Megaphone, Users } from 'lucide-react';
import { mockNotifications } from '../../data/mockData';
import { NotificationType } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

export default function InformationManagement() {
  const [notifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'emergency':
        return <AlertCircle className="size-4" />;
      case 'service':
        return <Megaphone className="size-4" />;
      case 'community':
        return <Users className="size-4" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    const variants = {
      emergency: 'destructive',
      service: 'default',
      community: 'secondary',
    } as const;
    const labels = {
      emergency: 'Khẩn cấp',
      service: 'Dịch vụ',
      community: 'Cộng đồng',
    };
    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý Thông báo</h1>
          <p className="text-muted-foreground">Tạo và quản lý thông báo hệ thống</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Tạo thông báo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo thông báo mới</DialogTitle>
              <DialogDescription>Gửi thông báo đến người dùng hệ thống</DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input placeholder="Nhập tiêu đề thông báo" />
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea placeholder="Nhập nội dung thông báo" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại thông báo</Label>
                  <Select defaultValue="service">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Khẩn cấp</SelectItem>
                      <SelectItem value="service">Dịch vụ</SelectItem>
                      <SelectItem value="community">Cộng đồng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Đối tượng</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="users">Cư dân</SelectItem>
                      <SelectItem value="managers">Quản lý</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Gửi thông báo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">{getTypeIcon(notification.type)}</div>
                  <div>
                    <CardTitle className="text-base">{notification.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                {getTypeBadge(notification.type)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{notification.message}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>
                  Gửi đến:{' '}
                  {notification.targetAudience === 'all'
                    ? 'Tất cả'
                    : notification.targetAudience === 'users'
                      ? 'Cư dân'
                      : 'Quản lý'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
