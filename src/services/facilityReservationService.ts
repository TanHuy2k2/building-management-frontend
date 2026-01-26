import { FacilityReservationForm, GetReservationParams, ResponseInterface } from '../types';
import { buildQuery } from '../utils/query';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

export async function getAllFacilityReservationApi(
  params?: GetReservationParams,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const query = params ? buildQuery(params) : '';
    const url = query ? `${API_ENDPOINTS.RESERVATIONS}?${query}` : API_ENDPOINTS.RESERVATIONS;
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

export async function getReservationByIdApi(id: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.RESERVATION_BY_ID(id), {
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

export async function createFacilityReservationApi(
  data: FacilityReservationForm,
): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      API_ENDPOINTS.CREATE_FACILITY_RESERVATION,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getReservationByUserApi(): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.RESERVATION_BY_USER, {
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
