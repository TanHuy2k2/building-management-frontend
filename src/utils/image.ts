import { DEFAULT_FOOD_IMG_URL, ENV, HTTP_PREFIX } from './constants';

export const resolveFoodImageUrl = (url?: string) => {
  if (!url) return DEFAULT_FOOD_IMG_URL;

  return url.startsWith(HTTP_PREFIX) ? url : `${ENV.BE_URL}/${url}`;
};
