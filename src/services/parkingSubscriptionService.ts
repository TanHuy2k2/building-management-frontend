import { ParkingSubscriptionForm, ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

export async function getCurrentParkingSubscriptionApi(
  parkingId: string,
): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.CURRENT_PARKING_SUBSCRIPTION(parkingId)}`,
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

export async function getParkingSubscriptionsApi(parkingId: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      `${API_ENDPOINTS.PARKING_SUBSCRIPTION(parkingId)}`,
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

export async function createParkingSubscriptionApi(
  parkingId: string,
  data: ParkingSubscriptionForm,
): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      API_ENDPOINTS.CREATE_SUBSCRIPTION(parkingId),
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
