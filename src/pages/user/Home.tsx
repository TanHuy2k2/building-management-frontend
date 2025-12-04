import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  ShoppingCart,
  Calendar,
  ParkingCircle,
  Bus,
  PartyPopper,
  Crown,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getRankDetails } from "../../data/mockData";

export default function UserHome() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const rankDetails = getRankDetails(currentUser.rank);

  const services = [
    {
      title: "Đặt Món Ăn",
      description: "Đặt món từ nhà hàng",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/user/orders",
    },
    {
      title: "Đặt Sân/Phòng",
      description: "Đặt sân thể thao, phòng họp",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/user/reservations",
    },
    {
      title: "Bãi Đậu Xe",
      description: "Đăng ký chỗ đậu xe",
      icon: ParkingCircle,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      path: "/user/parking",
    },
    {
      title: "Xe Buýt",
      description: "Đặt chỗ xe buýt nội khu",
      icon: Bus,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      path: "/user/bus",
    },
    {
      title: "Sự Kiện",
      description: "Tham gia sự kiện cộng đồng",
      icon: PartyPopper,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      path: "/user/events",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Rank Card */}
      <Card className={rankDetails.bgColor}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-white">
                <Crown className={`size-6 ${rankDetails.color}`} />
              </div>
              <div>
                <CardTitle>Hạng {rankDetails.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentUser.points} điểm tích lũy
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              1 điểm = {rankDetails.pointValue.toLocaleString()} VNĐ
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tổng chi tiêu</p>
              <p className="text-lg font-semibold">
                {currentUser.totalSpent.toLocaleString()} VNĐ
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Giá trị điểm</p>
              <p className="text-lg font-semibold">
                {(currentUser.points * rankDetails.pointValue).toLocaleString()}{" "}
                VNĐ
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4 text-green-600" />
              <span>
                Mỗi 20.000 VNĐ chi tiêu = 1 điểm • {rankDetails.name}:{" "}
                {rankDetails.pointValue.toLocaleString()} VNĐ/điểm
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Dịch vụ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link key={index} to={service.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`p-3 rounded-lg ${service.bgColor} w-fit`}>
                      <Icon className={`size-6 ${service.color}`} />
                    </div>
                    <CardTitle className="text-base mt-3">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Hệ thống hạng thành viên</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <Crown className="size-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Đồng</p>
                    <p className="text-sm text-muted-foreground">
                      Dưới 2 triệu
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">1.000 VNĐ/điểm</p>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <Crown className="size-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Bạc</p>
                    <p className="text-sm text-muted-foreground">2 - 5 triệu</p>
                  </div>
                </div>
                <p className="text-sm font-medium">1.200 VNĐ/điểm</p>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50">
                    <Crown className="size-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Vàng</p>
                    <p className="text-sm text-muted-foreground">
                      5 - 10 triệu
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">1.400 VNĐ/điểm</p>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Crown className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Bạch Kim</p>
                    <p className="text-sm text-muted-foreground">
                      Trên 10 triệu
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">1.500 VNĐ/điểm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
