import { User } from "../types";
import { mockUsers } from "../data/mockData";

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

/**
 * Get user by ID
 * Backend API: GET /api/users/:id
 */
export async function getUserById(id: string): Promise<User | null> {
  await delay(200);
  // TODO: Replace with actual API call
  // return apiRequest<User>(API_ENDPOINTS.USER_BY_ID(id));
  return mockUsers.find((user) => user.id === id) || null;
}

/**
 * Login user
 * Backend API: POST /api/auth/login
 */
export async function loginUser(
  email: string,
  password: string,
  role: "manager" | "user",
): Promise<User | null> {
  await delay(500);
  // TODO: Replace with actual API call
  // return apiRequest<{ user: User; token: string }>(API_ENDPOINTS.LOGIN, {
  //   method: 'POST',
  //   body: JSON.stringify({ email, password, role }),
  // });

  const user = mockUsers.find((u) => u.email === email && u.role === role);
  return user || null;
}

/**
 * Get user profile
 * Backend API: GET /api/users/profile
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  await delay(200);
  // TODO: Replace with actual API call with auth token
  // return apiRequest<User>('/users/profile');
  return mockUsers.find((user) => user.id === userId) || null;
}
