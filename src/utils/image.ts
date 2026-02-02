import { DEFAULT_AVATAR_URL, DEFAULT_FOOD_IMG_URL, ENV, HTTP_PREFIX } from './constants';

type ImageType = 'avatar' | 'food';

const DEFAULT_IMAGE_MAP: Record<ImageType, string> = {
  avatar: DEFAULT_AVATAR_URL,
  food: DEFAULT_FOOD_IMG_URL,
};

export const resolveImageUrl = (url?: string | null, type: ImageType = 'avatar') => {
  if (!url) return DEFAULT_IMAGE_MAP[type];

  return url.startsWith(HTTP_PREFIX) ? url : `${ENV.BE_URL}/${url}`;
};

const VALID_IMAGE_PREFIXES = ['uploads/menu-images/', 'uploads/dish-images/'];
export const getImageUrls = (imageUrls?: string[]) =>
  imageUrls?.filter((url) => VALID_IMAGE_PREFIXES.some((prefix) => url.startsWith(prefix))) ?? [];

export function removeDishImageAtIndex(params: {
  previewIndex: number;
  keptImageUrls: string[];
  images: File[];
}) {
  const { previewIndex, keptImageUrls, images } = params;
  let nextKept = keptImageUrls;
  let nextImages = images;
  if (previewIndex < keptImageUrls.length) {
    nextKept = keptImageUrls.filter((_, i) => i !== previewIndex);
  } else {
    const imageIndex = previewIndex - keptImageUrls.length;
    nextImages = images.filter((_, i) => i !== imageIndex);
  }

  const nextPreviewIndex = Math.max(0, previewIndex - 1);

  return {
    keptImageUrls: nextKept,
    images: nextImages,
    image_urls: [...nextKept, ...nextImages.map((file) => file.name)],
    previewIndex: nextPreviewIndex,
  };
}
