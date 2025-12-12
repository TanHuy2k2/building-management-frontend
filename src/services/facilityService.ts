import { FacilityForm, FacilityStatus, ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

export async function getAllFacilityApi(): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.FACILITIES, {
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

export async function getFacilityByIdApi(id: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.FACILITY_BY_ID(id), {
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

export async function createFacilityApi(data: FacilityForm): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.CREATE_FACILITY, {
      method: 'POST',
      body: JSON.stringify(data),
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

export async function updateFacilityApi(
  id: string,
  data: FacilityForm,
): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.UPDATE_FACILITY(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
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

export async function updateFacilityStatusApi(
  id: string,
  status: FacilityStatus,
): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.UPDATE_FACILITY_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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
