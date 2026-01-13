import { GetBusSubscriptionParams, ResponseInterface } from '../types';
import { buildQuery } from '../utils/query';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

export async function getAllBusSubscriptionApi(
  params?: GetBusSubscriptionParams,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const query = params ? buildQuery(params) : '';
    const url = query
      ? `${API_ENDPOINTS.BUS_SUBSCRIPTION}?${query}`
      : API_ENDPOINTS.BUS_SUBSCRIPTION;
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
