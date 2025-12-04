import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { mockEvents } from "../../data/mockData";
import { EventStatus } from "../../types";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

export default function EventsManagement() {
  const [events, setEvents] = useState(mockEvents);

  const getStatusBadge = (status: EventStatus) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      cancelled: "destructive",
      completed: "outline",
    } as const;
    const labels = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      cancelled: "Đã hủy",
      completed: "Hoàn thành",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const updateStatus = (id: string, status: EventStatus) => {
    setEvents(
      events.map((event) => (event.id === id ? { ...event, status } : event)),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quản lý Sự kiện</h1>
        <p className="text-muted-foreground">
          Duyệt và quản lý sự kiện cộng đồng
        </p>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{event.title}</CardTitle>
                {getStatusBadge(event.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.image && (
                <ImageWithFallback
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <p className="text-sm">{event.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span>Tổ chức: {event.organizerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {new Date(event.startDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
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

              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đăng ký:</span>
                  <span className="font-medium">
                    {event.currentParticipants}/{event.maxParticipants} người
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(event.currentParticipants / event.maxParticipants) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {event.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(event.id, "approved")}
                  >
                    Phê duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(event.id, "rejected")}
                  >
                    Từ chối
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
