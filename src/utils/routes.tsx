import { createBrowserRouter } from 'react-router';
import LoginPage from '../pages/LoginPage';
import ManagerLayout from '../components/layouts/ManagerLayout';
import UserLayout from '../components/layouts/UserLayout';

// Manager Pages
import ManagerDashboard from '../pages/manager/Dashboard';
import InformationManagement from '../pages/manager/InformationManagement';
import OrdersManagement from '../pages/manager/OrdersManagement';
import ReservationManagement from '../pages/manager/ReservationManagement';
import ParkingManagement from '../pages/manager/ParkingManagement';
import BusManagement from '../pages/manager/BusManagement';
import BusSubscriptionManagement from '../pages/manager/BusSubscriptionManagement';
import EventsManagement from '../pages/manager/EventsManagement';
import UserManagement from '../pages/manager/UserManagement';
import ReportsPage from '../pages/manager/ReportsPage';
import BusRouteManagement from '../pages/manager/busRoute/BusRouteManagement';
import RestaurantManagement from '../pages/manager/restaurant/RestaurantManagement';
import MenuManagement from '../pages/manager/menu/MenuManagement';
import DishManagement from '../pages/manager/menu/DishManagement';

// User Pages
import UserHome from '../pages/user/Home';
import UserOrders from '../pages/user/Orders';
import UserReservations from '../pages/user/Reservations';
import UserParking from '../pages/user/Parking';
import UserBus from '../pages/user/Bus';
import UpcomingEvents from '../pages/user/Events/UpcomingEvents';
import MyEvents from '../pages/user/Events/MyEvents';
import UserProfile from '../pages/user/Profile';
import UserInformation from '../pages/user/Information';
import BuildingManagement from '../pages/manager/BuildingManagement';
import FacilityManagement from '../pages/manager/FacilityManagement';

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
      { path: 'information', Component: InformationManagement },
      { path: 'orders', Component: OrdersManagement },
      { path: 'parking', Component: ParkingManagement },
      { path: 'bus', Component: BusManagement },
      { path: 'bus-routes', Component: BusRouteManagement },
      { path: 'bus-subscriptions', Component: BusSubscriptionManagement },
      { path: 'events', Component: EventsManagement },
      { path: 'users', Component: UserManagement },
      { path: 'reports', Component: ReportsPage },
      { path: 'facilities', Component: FacilityManagement },
      { path: 'reservations', Component: ReservationManagement },
      { path: 'restaurants', Component: RestaurantManagement },
      { path: 'menus', Component: MenuManagement },
      { path: 'dishes', Component: DishManagement },
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
      { path: 'events/upcoming', Component: UpcomingEvents },
      { path: 'events/my', Component: MyEvents },
      { path: 'profile', Component: UserProfile },
      { path: 'information', Component: UserInformation },
    ],
  },
]);
