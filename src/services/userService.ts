import { CreateUserDto, ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from '../services/tokenService';

export async function getUsers(): Promise<ResponseInterface> {
  const token = await getAccessToken();

  return apiRequest(API_ENDPOINTS.USERS, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getManagers(): Promise<ResponseInterface> {
  const accessToken = await getAccessToken();
  return apiRequest(API_ENDPOINTS.USERS_BY_ROLE('manager'), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getUserById(id: string): Promise<ResponseInterface> {
  const token = await getAccessToken();

  return apiRequest(API_ENDPOINTS.USER_DETAIL_BY_ID(id), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getUserProfile(): Promise<ResponseInterface> {
  const token = await getAccessToken();

  return apiRequest(API_ENDPOINTS.PROFILE, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createUser(user: CreateUserDto): Promise<ResponseInterface> {
  const token = await getAccessToken();

  return apiRequest(API_ENDPOINTS.CREATE_USER, {
    method: 'POST',
    body: JSON.stringify(user),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateUser(id: string, formData: FormData): Promise<ResponseInterface> {
  const token = await getAccessToken();

  return apiRequest(API_ENDPOINTS.USER_BY_ID(id), {
    method: 'PATCH',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
