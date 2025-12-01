import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Calendar,
  Users,
  ParkingCircle,
  Bus,
  PartyPopper,
  TrendingUp,
} from 'lucide-react';
import { mockDashboardStats, mockRevenueByService } from '../../data/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function ManagerDashboard() {
  const stats = mockDashboardStats;

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: `${(stats.totalRevenue / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Đơn hàng',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Đặt chỗ',
      value: stats.totalReservations,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Người dùng',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Bãi xe đang dùng',
      value: stats.activeParking,
      icon: ParkingCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Xe buýt hôm nay',
      value: stats.todayBusBookings,
      icon: Bus,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Sự kiện sắp tới',
      value: stats.upcomingEvents,
      icon: PartyPopper,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Thông báo mới',
      value: stats.unreadNotifications,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan</h1>
        <p className="text-muted-foreground">Thống kê tổng hợp hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`size-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo dịch vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockRevenueByService}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="service" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `${(value / 1000000).toFixed(1)}M VNĐ`
                  }
                />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockRevenueByService}
                  dataKey="revenue"
                  nameKey="service"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.service}
                >
                  {mockRevenueByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `${(value / 1000000).toFixed(1)}M VNĐ`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch theo dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRevenueByService.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{service.service}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.transactions} giao dịch
                  </p>
                </div>
                <p className="font-semibold">
                  {(service.revenue / 1000000).toFixed(1)}M VNĐ
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
