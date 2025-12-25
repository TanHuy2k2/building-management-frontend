import { GetUsersParams, UpdatePasswordDto } from './../types/user';
import { CreateUserDto, ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from '../services/tokenService';
import { buildQuery } from '../utils/query';

export async function getUsers(params?: GetUsersParams): Promise<ResponseInterface> {
  const token = await getAccessToken();
  const query = params ? buildQuery(params) : '';
  const url = query ? `${API_ENDPOINTS.USERS}?${query}` : API_ENDPOINTS.USERS;
  const response: ResponseInterface = await apiRequest(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function getUsersStats(): Promise<ResponseInterface> {
  const accessToken = await getAccessToken();
  return apiRequest(API_ENDPOINTS.USERS_STATS, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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

export async function updatePassword(dto: UpdatePasswordDto): Promise<ResponseInterface> {
  const token = await getAccessToken();

  return apiRequest(API_ENDPOINTS.UPDATE_PASSWORD, {
    method: 'PATCH',
    body: JSON.stringify(dto),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateUserProfile(formData: FormData): Promise<ResponseInterface> {
  const token = await getAccessToken();

  return apiRequest(API_ENDPOINTS.PROFILE, {
    method: 'PATCH',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
