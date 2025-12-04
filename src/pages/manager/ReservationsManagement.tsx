import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { mockReservations } from "../../data/mockData";
import { ReservationStatus, ReservationType } from "../../types";
import { Calendar, Clock, MapPin } from "lucide-react";

export default function ReservationsManagement() {
  const [reservations, setReservations] = useState(mockReservations);

  const getTypeBadge = (type: ReservationType) => {
    const types = {
      field: { label: "Sân thể thao", color: "bg-blue-100 text-blue-800" },
      room: { label: "Phòng họp", color: "bg-purple-100 text-purple-800" },
      other: { label: "Khác", color: "bg-gray-100 text-gray-800" },
    };
    return (
      <Badge variant="outline" className={types[type].color}>
        {types[type].label}
      </Badge>
    );
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const variants = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "default",
    } as const;
    const labels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      cancelled: "Đã hủy",
      completed: "Hoàn thành",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const updateStatus = (id: string, status: ReservationStatus) => {
    setReservations(
      reservations.map((res) => (res.id === id ? { ...res, status } : res)),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quản lý Đặt chỗ</h1>
        <p className="text-muted-foreground">
          Quản lý đặt sân, phòng và cơ sở vật chất
        </p>
      </div>

      <div className="grid gap-4">
        {reservations.map((reservation) => (
          <Card key={reservation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {reservation.facilityName}
                    </CardTitle>
                    {getTypeBadge(reservation.type)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reservation.userName}
                  </p>
                </div>
                {getStatusBadge(reservation.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    {new Date(reservation.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    {reservation.startTime} - {reservation.endTime} (
                    {reservation.duration}h)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>Mã: {reservation.id}</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Giá thuê:</span>
                  <span>{reservation.price.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Đặt cọc:</span>
                  <span>{reservation.deposit.toLocaleString()} VNĐ</span>
                </div>
              </div>

              {reservation.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(reservation.id, "confirmed")}
                  >
                    Xác nhận
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(reservation.id, "cancelled")}
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
