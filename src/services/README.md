# API Services

Thư mục này chứa các service để gọi API từ backend. Hiện tại đang sử dụng mock data, sau này sẽ thay thế bằng API thực tế.

## Cấu trúc

```
/services
  ├── api.ts              # Cấu hình API base và endpoints
  ├── userService.ts      # API liên quan đến user
  ├── orderService.ts     # API liên quan đến đơn hàng
  ├── notificationService.ts  # API thông báo
  ├── dashboardService.ts # API thống kê dashboard
  └── README.md           # File này
```

## Cách sử dụng

### Import service vào component:

```tsx
import { getOrders, createOrder } from '../services/orderService';
import { getMenuItems } from '../services/orderService';
```

### Sử dụng trong component:

```tsx
// Ví dụ lấy danh sách orders
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchOrders() {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }
  
  fetchOrders();
}, []);
```

## Chuyển sang API thật

Khi backend API đã sẵn sàng, chỉ cần:

1. Cập nhật `API_BASE_URL` trong `/services/api.ts`
2. Uncomment code fetch API trong mỗi service function
3. Remove mock data return statements

### Ví dụ:

**Trước (mock data):**
```ts
export async function getOrders(): Promise<Order[]> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<Order[]>(API_ENDPOINTS.ORDERS);
  return mockOrders;
}
```

**Sau (API thật):**
```ts
export async function getOrders(): Promise<Order[]> {
  return apiRequest<Order[]>(API_ENDPOINTS.ORDERS);
}
```

## API Endpoints

Tất cả endpoints được định nghĩa trong `api.ts`:

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất

### Users
- `GET /api/users` - Lấy danh sách users
- `GET /api/users/:id` - Lấy user theo ID

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/:id` - Lấy đơn hàng theo ID
- `PATCH /api/orders/:id/status` - Cập nhật trạng thái đơn hàng

### Menu
- `GET /api/menu` - Lấy danh sách món ăn
- `GET /api/menu/:id` - Lấy món ăn theo ID

### Reservations
- `GET /api/reservations` - Lấy danh sách đặt chỗ
- `POST /api/reservations` - Tạo đặt chỗ mới
- `PATCH /api/reservations/:id/status` - Cập nhật trạng thái

### Parking
- `GET /api/parking/slots` - Lấy danh sách chỗ đậu xe
- `GET /api/parking/registrations` - Lấy danh sách đăng ký
- `POST /api/parking/registrations` - Tạo đăng ký mới

### Bus
- `GET /api/bus/routes` - Lấy danh sách tuyến xe
- `GET /api/bus/schedules` - Lấy lịch trình
- `GET /api/bus/bookings` - Lấy danh sách đặt chỗ
- `POST /api/bus/bookings` - Tạo đặt chỗ mới

### Events
- `GET /api/events` - Lấy danh sách sự kiện
- `POST /api/events` - Tạo sự kiện mới
- `GET /api/events/:id` - Lấy sự kiện theo ID
- `PATCH /api/events/:id/status` - Cập nhật trạng thái
- `GET /api/events/:id/registrations` - Lấy danh sách đăng ký

### Notifications
- `GET /api/notifications` - Lấy danh sách thông báo
- `POST /api/notifications` - Tạo thông báo mới
- `PATCH /api/notifications/:id/read` - Đánh dấu đã đọc

### Transactions
- `GET /api/transactions` - Lấy danh sách giao dịch
- `GET /api/users/:userId/transactions` - Lấy giao dịch theo user

### Dashboard
- `GET /api/dashboard/stats` - Lấy thống kê tổng quan
- `GET /api/dashboard/revenue-by-service` - Lấy doanh thu theo dịch vụ

## Environment Variables

Tạo file `.env` trong thư mục root:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

## Error Handling

Tất cả service functions sẽ throw error nếu API call thất bại. Component nên handle error:

```tsx
try {
  const data = await getOrders();
  setOrders(data);
} catch (error) {
  console.error('Error:', error);
  // Show error toast/notification
}
```

## Authentication

Khi backend API yêu cầu authentication, thêm token vào headers:

```ts
const token = localStorage.getItem('authToken');

const response = await fetch(`${API_BASE_URL}${endpoint}`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});
```
