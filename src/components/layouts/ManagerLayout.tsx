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
  Building,
  Landmark,
  UtensilsCrossed,
  Map,
  CreditCard,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { RestaurantProvider } from '../../contexts/RestaurantContext';

export default function ManagerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    { path: '/manager', icon: LayoutDashboard, label: 'Overview' },
    { path: '/manager/notifications', icon: Bell, label: 'Notifications' },
    { path: '/manager/parking', icon: ParkingCircle, label: 'Parking' },
    {
      icon: Bus,
      label: 'Bus',
      path: '/manager/bus',
      key: 'bus',
      children: [
        {
          path: '/manager/bus-routes',
          label: 'Routes',
          icon: Map,
        },
        {
          path: '/manager/bus-subscriptions',
          label: 'Subscriptions',
          icon: CreditCard,
        },
      ],
    },
    { path: '/manager/events', icon: PartyPopper, label: 'Events' },
    { path: '/manager/users', icon: Users, label: 'Users' },
    { path: '/manager/reports', icon: FileText, label: 'Reports' },
    { path: '/manager/buildings', icon: Building, label: 'Buildings' },
    { path: '/manager/facilities', icon: Landmark, label: 'Facilities' },
    { path: '/manager/reservations', icon: Calendar, label: 'Reservations' },
    {
      path: '/manager/restaurants',
      icon: UtensilsCrossed,
      label: 'Restaurants',
      key: 'restaurant',
      children: [
        {
          path: '/manager/menus',
          label: 'Menus',
          icon: ClipboardList,
        },
        {
          path: '/manager/orders',
          label: 'Orders',
          icon: ShoppingCart,
        },
      ],
    },
  ];

  return (
    <RestaurantProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold">Manager</h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
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
            <h1 className="font-semibold text-lg">Management System</h1>
            <p className="text-sm text-muted-foreground mt-1">{currentUser?.full_name}</p>
          </div>

          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/manager' && location.pathname.startsWith(item.path));

              if (item.children) {
                const isOpen = openMenus[item.key];
                const ItemIcon = item.icon;

                return (
                  <div
                    key={item.label}
                    style={{
                      position: 'relative',
                      marginBottom: 0,
                    }}
                  >
                    {/* PARENT MENU */}
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <ItemIcon className="size-4 mr-3" />
                      {item.label}

                      {/* ICON TOGGLE */}
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

                    {/* SUB MENU – DROP DOWN */}
                    {isOpen && (
                      <div
                        style={{
                          marginTop: 0,
                          marginLeft: 10,
                          backgroundColor: '#fff',
                          padding: 6,
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

              // MENU DEFAULT
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
              Log out
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
    </RestaurantProvider>
  );
}
