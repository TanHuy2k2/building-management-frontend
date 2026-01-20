import { GetDishesParams, ResponseInterface } from '../types';
import { buildQuery } from '../utils/query';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

/* ===================== GET ALL DISHES ===================== */
export async function getRestaurantDishesApi(
  restaurantId: string,
  params?: GetDishesParams,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const query = params ? buildQuery(params) : '';
    const dishUrl = `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.DISHES}`;
    const url = query ? `${dishUrl}?${query}` : dishUrl;
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

/* ===================== GET DISH BY ID ===================== */
export async function getRestaurantDishByIdApi(
  restaurantId: string,
  dishId: string,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.DISH_BY_ID(dishId)}`,
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

/* ===================== CREATE DISH ===================== */
export async function createRestaurantDishApi(
  restaurantId: string,
  data: FormData,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.DISH_CREATE}`,
      {
        method: 'POST',
        body: data,
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

/* ===================== UPDATE DISH ===================== */
export async function updateRestaurantDishApi(
  restaurantId: string,
  dishId: string,
  data: FormData,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.UPDATE_DISH_BY_ID(dishId)}`,
      {
        method: 'PATCH',
        body: data,
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
