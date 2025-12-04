import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Home,
  ShoppingCart,
  Calendar,
  ParkingCircle,
  Bus,
  PartyPopper,
  User,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRankDetails } from '../../data/mockData';

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/user', icon: Home, label: 'Trang chủ' },
    { path: '/user/orders', icon: ShoppingCart, label: 'Đặt món' },
    { path: '/user/reservations', icon: Calendar, label: 'Đặt chỗ' },
    { path: '/user/parking', icon: ParkingCircle, label: 'Bãi xe' },
    { path: '/user/bus', icon: Bus, label: 'Xe buýt' },
    { path: '/user/events', icon: PartyPopper, label: 'Sự kiện' },
    { path: '/user/notifications', icon: Bell, label: 'Thông báo' },
    { path: '/user/profile', icon: User, label: 'Tài khoản' },
  ];

  const rankDetails = currentUser ? getRankDetails(currentUser.ranks) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">Xin chào, {currentUser?.fullName}</h1>
            {rankDetails && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={rankDetails.bgColor}>
                  <span className={rankDetails.color}>{rankDetails.name}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">{currentUser?.points} điểm</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="grid grid-cols-4 gap-1 p-2">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full flex-col h-auto py-2 px-1"
                  size="sm"
                >
                  <Icon className="size-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r pt-20">
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <Button variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start">
                  <Icon className="size-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Adjust main content for desktop sidebar */}
      <style>{`
        @media (min-width: 1024px) {
          main {
            margin-left: 16rem;
          }
        }
      `}</style>
    </div>
  );
}
