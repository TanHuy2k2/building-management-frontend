import { GetBusParams, ResponseInterface } from '../types';
import { buildQuery } from '../utils/query';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

export async function getAllBusApi(params?: GetBusParams): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const query = params ? buildQuery(params) : '';
    const url = query ? `${API_ENDPOINTS.BUS}?${query}` : API_ENDPOINTS.BUS;
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

export async function getAllBusStatsApi(): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.BUS_STATS, {
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
