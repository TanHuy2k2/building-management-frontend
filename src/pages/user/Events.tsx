import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { mockEvents } from "../../data/mockData";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

export default function UserEvents() {
  const events = mockEvents.filter((e) => e.status === "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sự Kiện Cộng Đồng</h1>
        <p className="text-muted-foreground">
          Tham gia các hoạt động cộng đồng
        </p>
      </div>

      <div className="grid gap-6">
        {events.map((event) => {
          const spotsLeft = event.maxParticipants - event.currentParticipants;
          const percentFull =
            (event.currentParticipants / event.maxParticipants) * 100;

          return (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700"
                  >
                    Đã duyệt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.image && (
                  <ImageWithFallback
                    src={event.image}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}

                <p className="text-muted-foreground">{event.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <span>Tổ chức: {event.organizerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      {new Date(event.startDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>
                      {new Date(event.startDate).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(event.endDate).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Số lượng tham gia:
                    </span>
                    <span className="font-medium">
                      {event.currentParticipants}/{event.maxParticipants} người
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        percentFull >= 90 ? "bg-red-600" : "bg-blue-600"
                      }`}
                      style={{ width: `${percentFull}%` }}
                    />
                  </div>
                  {spotsLeft > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Còn {spotsLeft} chỗ trống
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">Đã đầy</p>
                  )}

                  <Button className="w-full" disabled={spotsLeft === 0}>
                    {spotsLeft > 0 ? "Đăng ký tham gia" : "Hết chỗ"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có sự kiện nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
