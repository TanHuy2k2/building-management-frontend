import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Bell,
  ShoppingCart,
  Calendar,
  ParkingCircle,
  Bus,
  PartyPopper,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function ManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/manager', icon: LayoutDashboard, label: 'Tổng quan' },
    { path: '/manager/notifications', icon: Bell, label: 'Thông báo' },
    { path: '/manager/orders', icon: ShoppingCart, label: 'Đơn hàng' },
    { path: '/manager/reservations', icon: Calendar, label: 'Đặt chỗ' },
    { path: '/manager/parking', icon: ParkingCircle, label: 'Bãi xe' },
    { path: '/manager/bus', icon: Bus, label: 'Xe buýt' },
    { path: '/manager/events', icon: PartyPopper, label: 'Sự kiện' },
    { path: '/manager/users', icon: Users, label: 'Người dùng' },
    { path: '/manager/reports', icon: FileText, label: 'Báo cáo' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold">Quản Lý</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r z-40 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b">
          <h1 className="font-semibold text-lg">Quản Lý Hệ Thống</h1>
          <p className="text-sm text-muted-foreground mt-1">{currentUser?.name}</p>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/manager' && location.pathname.startsWith(item.path));

            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Icon className="size-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="size-4 mr-3" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}