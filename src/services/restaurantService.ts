import { buildQuery } from './../utils/query';
import { GetRestaurantsParams, ResponseInterface, RestaurantForm, UpdateStatusDto } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

// Get all restaurants
export async function getAllRestaurantsApi(
  params?: GetRestaurantsParams,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const query = params ? buildQuery(params) : '';
    const url = query ? `${API_ENDPOINTS.RESTAURANTS}?${query}` : API_ENDPOINTS.RESTAURANTS;
    const response: ResponseInterface = await apiRequest(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Get all restaurants
export async function getAllRestaurantsStatsApi(): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.RESTAURANT_STATS, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Get restaurant by ID
export async function getRestaurantByIdApi(id: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.RESTAURANT_BY_ID(id), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Create new restaurant
export async function createRestaurantApi(data: RestaurantForm): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.RESTAURANT_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Update restaurant
export async function updateRestaurantApi(
  id: string,
  data: RestaurantForm,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.RESTAURANT_UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Update restaurant status
export async function updateRestaurantStatusApi(
  id: string,
  status: UpdateStatusDto,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      API_ENDPOINTS.RESTAURANT_UPDATE_STATUS(id),
      {
        method: 'PATCH',
        body: JSON.stringify(status),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getRestaurantMenuApi(restaurantId: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      API_ENDPOINTS.RESTAURANT_MENU(restaurantId),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
