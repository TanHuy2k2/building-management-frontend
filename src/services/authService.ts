import { ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '../config/firebaseConfig';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function loginApi(email: string, password: string): Promise<ResponseInterface> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function registerApi(data: any): Promise<ResponseInterface> {
  try {
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function refreshTokenApi(): Promise<ResponseInterface | null> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response?.data?.accessToken) {
      sessionStorage.setItem('access_token', response.data.accessToken);
    }

    return response;
  } catch {
    return null;
  }
}

export async function logoutApi(): Promise<ResponseInterface | null> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
