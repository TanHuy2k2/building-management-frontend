import { PaymentForm, PaymentUrlForm, ResponseInterface } from '../types';
import { API_ENDPOINTS, apiRequest } from './api';
import { getAccessToken } from './tokenService';

export async function createPaymentApi(data: PaymentForm): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.CREATE_PAYMENT, {
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

export async function createMomoPaymentApi(data: PaymentUrlForm): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      API_ENDPOINTS.CREATE_MOMO_PAYMENT,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
      true,
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function createVnpayPaymentApi(data: PaymentUrlForm): Promise<ResponseInterface> {
  try {
    const accessToken = await getAccessToken();
    const response: ResponseInterface = await apiRequest(
      API_ENDPOINTS.CREATE_VNPAY_PAYMENT,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
      true,
    );

    return response;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getPaymentByIdApi(id: string): Promise<ResponseInterface> {
  try {
    const token = await getAccessToken();
    const response: ResponseInterface = await apiRequest(API_ENDPOINTS.PAYMENT_BY_ID(id), {
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
