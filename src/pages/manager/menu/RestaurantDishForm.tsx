import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { DishCategory, MenuItemForm } from '../../../types';

type Props = {
  open: boolean;
  loading?: boolean;
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
};

export default function RestaurantDishForm({
  open,
  loading,
  initialData,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<MenuItemForm>(DEFAULT_FORM);
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_FORM, ...initialData });
      setImages([]);
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Dish name is required');

      return;
    }

    if (form.price <= 0) {
      toast.error('Price must be greater than 0');
      
      return;
    }

    await onSubmit(form, images);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add new dish</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {/* Quantity */}
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
          </div>

          {/* RIGHT */}
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
                    const merged = [...prev, ...newFiles];
                    setForm((f) => ({
                      ...f,
                      image_urls: merged.map((file) => file.name),
                    }));
                    return merged;
                  });
                }}
              />

              {!!form.image_urls?.length && (
                <p className="text-xs text-muted-foreground text-center">
                  Selected: {form.image_urls.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Add dish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
