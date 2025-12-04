import { Notification, NotificationType } from '../types';
import { mockNotifications } from '../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all notifications
 * Backend API: GET /api/notifications
 */
export async function getNotifications(): Promise<Notification[]> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<Notification[]>(API_ENDPOINTS.NOTIFICATIONS);
  return mockNotifications;
}

/**
 * Get notifications for specific user role
 * Backend API: GET /api/notifications?role=user|manager
 */
export async function getNotificationsByRole(
  role: 'user' | 'manager'
): Promise<Notification[]> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<Notification[]>(`${API_ENDPOINTS.NOTIFICATIONS}?role=${role}`);
  
  const targetAudience = role === 'manager' ? 'managers' : 'users';
  return mockNotifications.filter(
    n => n.targetAudience === 'all' || n.targetAudience === targetAudience
  );
}

/**
 * Create notification
 * Backend API: POST /api/notifications
 */
export async function createNotification(data: {
  title: string;
  message: string;
  type: NotificationType;
  targetAudience: 'all' | 'managers' | 'users';
}): Promise<Notification> {
  await delay(500);
  // TODO: Replace with actual API call
  // return apiRequest<Notification>(API_ENDPOINTS.CREATE_NOTIFICATION, {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  // });
  
  return {
    id: `NOT${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

/**
 * Mark notification as read
 * Backend API: PATCH /api/notifications/:id/read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  await delay(200);
  // TODO: Replace with actual API call
  // return apiRequest<void>(API_ENDPOINTS.MARK_NOTIFICATION_READ(id), {
  //   method: 'PATCH',
  // });
}
