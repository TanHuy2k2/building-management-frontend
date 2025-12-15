import { createBrowserRouter } from 'react-router';
import LoginPage from '../pages/LoginPage';
import ManagerLayout from '../components/layouts/ManagerLayout';
import UserLayout from '../components/layouts/UserLayout';

// Manager Pages
import ManagerDashboard from '../pages/manager/Dashboard';
import NotificationsManagement from '../pages/manager/NotificationsManagement';
import OrdersManagement from '../pages/manager/OrdersManagement';
import ReservationsManagement from '../pages/manager/ReservationsManagement';
import ParkingManagement from '../pages/manager/ParkingManagement';
import BusManagement from '../pages/manager/BusManagement';
import EventsManagement from '../pages/manager/EventsManagement';
import UsersManagement from '../pages/manager/UsersManagement';
import ReportsPage from '../pages/manager/ReportsPage';

// User Pages
import UserHome from '../pages/user/Home';
import UserOrders from '../pages/user/Orders';
import UserReservations from '../pages/user/Reservations';
import UserParking from '../pages/user/Parking';
import UserBus from '../pages/user/Bus';
import UserEvents from '../pages/user/Events';
import UserProfile from '../pages/user/Profile';
import UserNotifications from '../pages/user/Notifications';
import BuildingManagement from '../pages/manager/BuildingManagement';
import FacilityManagement from '../pages/manager/FacilityManagement';
import RestaurantManagement from '../pages/manager/RestaurantManagement';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/manager',
    Component: ManagerLayout,
    children: [
      { index: true, Component: ManagerDashboard },
      { path: 'buildings', Component: BuildingManagement },
      { path: 'notifications', Component: NotificationsManagement },
      { path: 'orders', Component: OrdersManagement },
      { path: 'reservations', Component: ReservationsManagement },
      { path: 'parking', Component: ParkingManagement },
      { path: 'bus', Component: BusManagement },
      { path: 'events', Component: EventsManagement },
      { path: 'users', Component: UsersManagement },
      { path: 'reports', Component: ReportsPage },
      { path: 'facilities', Component: FacilityManagement },
      { path: 'restaurants', Component: RestaurantManagement },
    ],
  },
  {
    path: '/user',
    Component: UserLayout,
    children: [
      { index: true, Component: UserHome },
      { path: 'orders', Component: UserOrders },
      { path: 'reservations', Component: UserReservations },
      { path: 'parking', Component: UserParking },
      { path: 'bus', Component: UserBus },
      { path: 'events', Component: UserEvents },
      { path: 'profile', Component: UserProfile },
      { path: 'notifications', Component: UserNotifications },
    ],
  },
]);
