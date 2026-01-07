import { ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

// Get all menu schedules
export async function getMenuSchedulesApi(restaurantId: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();

    return await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.MENU_SCHEDULES}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Get menu schedule by ID
export async function getMenuScheduleByIdApi(id: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();

    return await apiRequest(API_ENDPOINTS.MENU_SCHEDULES_BY_ID(id), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Create menu schedule
export async function createMenuScheduleApi(
  restaurantId: string,
  data: FormData,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();

    return await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.MENU_SCHEDULE_CREATE}`,
      {
        method: 'POST',
        body: data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
}
