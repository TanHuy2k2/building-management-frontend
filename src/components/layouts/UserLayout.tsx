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
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRankDetails } from '../../utils/rank';
import { resolveImageUrl } from '../../utils/image';
import { DEFAULT_AVATAR_URL } from '../../utils/constants';
import { useState } from 'react';

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/user', icon: Home, label: 'Home' },
    { path: '/user/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/user/reservations', icon: Calendar, label: 'Reservations' },
    { path: '/user/parking', icon: ParkingCircle, label: 'Parking' },
    { path: '/user/bus', icon: Bus, label: 'Bus' },
    {
      icon: PartyPopper,
      label: 'Events',
      key: 'events',
      children: [
        {
          path: '/user/events/my',
          label: 'My Events',
          icon: CalendarCheck,
        },
        {
          path: '/user/events/upcoming',
          label: 'Upcoming events',
          icon: Compass,
        },
      ],
    },
    { path: '/user/information', icon: Bell, label: 'Information' },
    { path: '/user/profile', icon: User, label: 'Profile' },
  ];

  const rankDetails = currentUser ? getRankDetails(currentUser.rank) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"
              style={{ width: 56, height: 56 }}
            >
              <img
                src={resolveImageUrl(currentUser?.image_url, 'avatar')}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR_URL;
                }}
              />
            </div>

            {/* User info */}
            <div>
              <h1 className="font-semibold">Welcome, {currentUser?.full_name}</h1>
              {rankDetails && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={rankDetails.bgColor}>
                    <span className={rankDetails.color}>{rankDetails.name}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currentUser?.points} points
                  </span>
                </div>
              )}
            </div>
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
              <Link key={item.path} to={item.path ?? ''}>
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
            const isActive =
              location.pathname === item.path ||
              (item.path && item.path !== '/user' && location.pathname.startsWith(item.path));

            if (item.children) {
              const isOpen = openMenus[item.key];

              return (
                <div
                  key={item.label}
                  style={{
                    position: 'relative',
                    marginBottom: 0,
                  }}
                >
                  {/* Parent */}
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => toggleMenu(item.key)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <Icon className="size-4 mr-3" />
                    {item.label}
                    <span
                      style={{ marginLeft: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(item.key);
                      }}
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </span>
                  </Button>

                  {/* Children */}
                  {isOpen && (
                    <div
                      style={{
                        marginBottom: 0,
                        marginLeft: 10,
                        backgroundColor: '#fff',
                      }}
                    >
                      {item.children.map((child) => {
                        const isSubActive =
                          location.pathname === child.path ||
                          location.pathname.startsWith(child.path + '/');
                        const ChildIcon = child.icon;

                        return (
                          <Link key={child.path} to={child.path}>
                            <Button
                              variant={isSubActive ? 'secondary' : 'ghost'}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                              }}
                            >
                              <ChildIcon size={14} style={{ marginRight: 10 }} />
                              {child.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

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
