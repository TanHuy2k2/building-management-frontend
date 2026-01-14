import { DEFAULT_FOOD_IMG_URL, ENV, HTTP_PREFIX } from './constants';

export const resolveFoodImageUrl = (url?: string) => {
  if (!url) return DEFAULT_FOOD_IMG_URL;

  return url.startsWith(HTTP_PREFIX) ? url : `${ENV.BE_URL}/${url}`;
};

export const getImageUrls = (imageUrls?: string[]) =>
  imageUrls?.filter((url) => url.startsWith('uploads/menu-images/')) ?? [];

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
