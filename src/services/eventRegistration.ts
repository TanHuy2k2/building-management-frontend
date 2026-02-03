import { ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

export async function getEventRegistrationByUserApi(): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      API_ENDPOINTS.EVENT_REGISTRATIONS_BY_USER,
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

export async function registerEventApi(event_booking_id: string): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.CREATE_EVENT_REGISTRATIONS, {
      method: 'POST',
      body: JSON.stringify({ event_booking_id }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
