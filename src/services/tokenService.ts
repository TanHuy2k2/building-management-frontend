import { refreshTokenApi } from './authService';

let refreshingPromise: Promise<string | null> | null = null;

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const decoded = parseJwt(token);
  if (!decoded?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now - 10;
}

export async function getAccessToken(): Promise<string | null> {
  const token = sessionStorage.getItem('access_token');

  if (token && !isTokenExpired(token)) {
    return token;
  }

  if (!refreshingPromise) {
    refreshingPromise = refreshTokenApi().then((res) => {
      refreshingPromise = null;
      return res?.data?.accessToken || null;
    });
  }

  return refreshingPromise;
}
