import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { mockNotifications } from "../../data/mockData";
import { AlertCircle, Megaphone, Users } from "lucide-react";
import { NotificationType } from "../../types";

export default function UserNotifications() {
  const notifications = mockNotifications.filter(
    (n) => n.targetAudience === "all" || n.targetAudience === "users",
  );

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "emergency":
        return <AlertCircle className="size-5" />;
      case "service":
        return <Megaphone className="size-5" />;
      case "community":
        return <Users className="size-5" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    const config = {
      emergency: { label: "Khẩn cấp", variant: "destructive" as const },
      service: { label: "Dịch vụ", variant: "default" as const },
      community: { label: "Cộng đồng", variant: "secondary" as const },
    };
    return <Badge variant={config[type].variant}>{config[type].label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Thông Báo</h1>
        <p className="text-muted-foreground">Cập nhật mới nhất từ hệ thống</p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={notification.read ? "opacity-75" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      notification.type === "emergency"
                        ? "bg-red-100 text-red-600"
                        : notification.type === "service"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {getTypeIcon(notification.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {notification.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getTypeBadge(notification.type)}
                  {!notification.read && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      Mới
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{notification.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có thông báo nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
