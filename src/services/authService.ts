import { API_ENDPOINTS, apiRequest } from './api';

export async function loginApi(email: string, password: string) {
  try {
    const response = await apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  } catch (error: any) {
    console.error('Login API Error:', error.message);
    throw new Error(error.message || 'Login failed');
  }
}
