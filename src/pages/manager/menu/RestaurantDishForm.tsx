import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { ActiveStatus, DishCategory, MenuItemForm } from '../../../types';
import { removeDishImageAtIndex, resolveFoodImageUrl } from '../../../utils/image';
import { MAX_SHOWN_IMAGE_NAMES } from '../../../utils/constants';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type Props = {
  open: boolean;
  loading?: boolean;
  mode?: 'create' | 'edit';
  module?: 'dish' | 'menu';
  initialData?: Partial<MenuItemForm>;
  onClose: () => void;
  onSubmit: (dish: MenuItemForm, images: File[]) => Promise<void> | void;
};

const DEFAULT_FORM: MenuItemForm = {
  name: '',
  category: DishCategory.MAIN,
  price: 0,
  quantity: 1,
  description: '',
  image_urls: [],
  status: ActiveStatus.ACTIVE,
};

export default function RestaurantDishForm({
  open,
  loading,
  mode = 'create',
  module = 'menu',
  initialData,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<MenuItemForm>(DEFAULT_FORM);
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const initialImageUrls = (initialData?.image_urls ?? []) as string[];
  const previewImages = [
    ...keptImageUrls.map(resolveFoodImageUrl),
    ...images.map((file) => URL.createObjectURL(file)),
  ];
  const currentPreview = previewImages[previewIndex];

  useEffect(() => {
    setPreviewIndex(0);
  }, [images.length, initialImageUrls.length]);

  useEffect(() => {
    if (!open) return;

    setForm({
      ...DEFAULT_FORM,
      ...initialData,
      image_urls: mode === 'edit' ? (initialData?.image_urls ?? []) : [],
    });
    setKeptImageUrls(mode === 'edit' ? (initialData?.image_urls ?? []) : []);
    setImages([]);
    setPreviewIndex(0);
  }, [open, initialData, mode]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Dish name is required');

      return;
    }

    if (form.price <= 0) {
      toast.error('Price must be greater than 0');

      return;
    }

    const submitForm =
      module === 'dish'
        ? mode === 'create'
          ? (({ quantity, status, ...data }) => data)(form)
          : (({ quantity, ...data }) => data)(form)
        : (({ status, ...data }) => data)(form);
    await onSubmit(submitForm as MenuItemForm, images);
  };

  const handleRemoveImage = () => {
    const result = removeDishImageAtIndex({
      previewIndex,
      keptImageUrls,
      images,
    });

    setKeptImageUrls(result.keptImageUrls);
    setImages(result.images);
    setPreviewIndex(result.previewIndex);
    setForm((f) => ({
      ...f,
      image_urls: result.image_urls,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full" style={{ maxWidth: 800 }}>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit dish' : 'Add new dish'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Dish name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Enter dish name"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                min={0}
                step={10000}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {module === 'menu' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            )}

            {/* Category */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as DishCategory })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {Object.values(DishCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {module === 'dish' && mode === 'edit' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ActiveStatus })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value={ActiveStatus.ACTIVE}>Active</option>
                  <option value={ActiveStatus.INACTIVE}>Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* MIDDLE */}
          <div className="space-y-4">
            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Enter description"
              />
            </div>

            {/* Images */}
            <div className="space-y-2 flex flex-col items-center">
              <label
                htmlFor="dishImages"
                className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
              >
                Choose images
              </label>

              <input
                id="dishImages"
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (!e.target.files) return;

                  const newFiles = Array.from(e.target.files);
                  setImages((prev) => {
                    const nextImages = [...prev, ...newFiles];
                    setForm((f) => ({
                      ...f,
                      image_urls: [...keptImageUrls, ...nextImages.map((file) => file.name)],
                    }));
                    return nextImages;
                  });
                }}
              />

              {!!form.image_urls?.length && (
                <div className="w-full text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Selected images</p>

                  <ul className="space-y-1">
                    {form.image_urls.slice(0, MAX_SHOWN_IMAGE_NAMES).map((url, idx) => {
                      const displayName = url.split('/').pop();

                      return (
                        <li key={idx} className="truncate max-w-full" title={displayName}>
                          • {displayName}
                        </li>
                      );
                    })}

                    {form.image_urls.length > MAX_SHOWN_IMAGE_NAMES && (
                      <li className="italic">
                        +{form.image_urls.length - MAX_SHOWN_IMAGE_NAMES} more…
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-2">
            <div className="relative rounded-md bg-gray-100 w-full" style={{ height: 220 }}>
              {/* IMAGE */}
              <div className="w-full h-full overflow-hidden rounded-md">
                {currentPreview ? (
                  <img
                    src={currentPreview}
                    alt="preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              {previewImages.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute rounded-md bg-white hover:bg-gray-100 shadow-md transition"
                    style={{
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 28,
                      height: 28,
                      zIndex: 20,
                    }}
                    onClick={() =>
                      setPreviewIndex(
                        (previewIndex - 1 + previewImages.length) % previewImages.length,
                      )
                    }
                  >
                    <ArrowLeft style={{ width: 20, height: 20 }} className="text-black" />
                  </Button>

                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute rounded-md bg-white hover:bg-gray-100 shadow-md transition"
                    style={{
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 28,
                      height: 28,
                      zIndex: 20,
                    }}
                    onClick={() => setPreviewIndex((previewIndex + 1) % previewImages.length)}
                  >
                    <ArrowRight style={{ width: 20, height: 20 }} className="text-black" />
                  </Button>
                </>
              )}

              {/* REMOVE */}
              {previewImages.length > 0 && (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute rounded-md bg-white hover:bg-gray-100 shadow-md transition"
                  style={{
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    zIndex: 30,
                  }}
                  onClick={handleRemoveImage}
                >
                  ✕
                </Button>
              )}
            </div>

            <div className="text-xs text-center text-muted-foreground">
              {previewImages.length ? `${previewIndex + 1} / ${previewImages.length}` : 'No image'}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : mode === 'edit' ? 'Update dish' : 'Add dish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
