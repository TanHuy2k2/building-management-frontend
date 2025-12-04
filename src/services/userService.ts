import { User } from '../types';
import { mockUsers } from '../data/mockData';
import { API_ENDPOINTS, apiRequest } from './api';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get all users
 * Backend API: GET /api/users
 */
export async function getUsers(): Promise<User[]> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<User[]>(API_ENDPOINTS.USERS);
  return mockUsers;
}

export async function getUserById(id: string, accessToken: string): Promise<any> {
  return apiRequest(API_ENDPOINTS.USER_BY_ID(id), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Login user
 * Backend API: POST /api/auth/login
 */
export async function loginUser(
  email: string,
  password: string,
  role: 'manager' | 'user',
): Promise<User | null> {
  await delay(500);
  // TODO: Replace with actual API call
  // return apiRequest<{ user: User; token: string }>(API_ENDPOINTS.LOGIN, {
  //   method: 'POST',
  //   body: JSON.stringify({ email, password, role }),
  // });

  const user = mockUsers.find((u) => u.email === email && u.roles === role);
  return user || null;
}

export async function getUserProfile(): Promise<any> {
  return apiRequest(API_ENDPOINTS.PROFILE, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
    },
  });
}
