import { CreateOrderDto, GetOrdersParams, OrderStatus, ResponseInterface } from '../types';
import { buildQuery } from '../utils/query';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

/* ===================== GET ALL ORDERS ===================== */
export async function getRestaurantOrdersApi(
  restaurantId: string,
  params?: GetOrdersParams,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const query = params ? buildQuery(params) : '';
    const orderUrl = `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.ORDERS}`;
    const url = query ? `${orderUrl}?${query}` : orderUrl;
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

/* ===================== GET CURRENT ORDERS ===================== */
export async function getCurrentOrdersApi(restaurantId: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.ORDERS_LIST_BY_USER}`,
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

/* ===================== GET ORDER HISTORY ===================== */
export async function getOrderHistoryApi(restaurantId: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.ORDERS_HISTORY_BY_USER}`,
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

/* ===================== GET ORDER BY ID ===================== */
export async function getOrderByIdApi(
  restaurantId: string,
  orderId: string,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.ORDER_BY_ID(orderId)}`,
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

/* ===================== CREATE ORDER ===================== */
export async function createOrderApi(
  restaurantId: string,
  data: CreateOrderDto,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.ORDERS_CREATE}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/* ===================== UPDATE ORDER ===================== */
export async function updateOrderByIdApi(
  restaurantId: string,
  orderId: string,
  data: Record<string, any>,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.UPDATE_ORDER_BY_ID(orderId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/* ===================== UPDATE ORDER STATUS ===================== */
export async function updateOrderStatusApi(
  restaurantId: string,
  orderId: string,
  status: OrderStatus,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.RESTAURANT_BY_ID(restaurantId)}${API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
