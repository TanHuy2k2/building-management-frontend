import { useMemo, useState, useEffect } from 'react';
import { Dish, MenuItemForm } from '../../../types';
import { Trash2 } from 'lucide-react';
import { formatVND } from '../../../utils/currency';

type Props = {
  dishes: (Dish | MenuItemForm)[];
  disabledNames?: string[];
  placeholder?: string;
  value?: MenuItemForm[];
  onChange?: (items: MenuItemForm[]) => void;
  onSelect?: (selectedDishes: MenuItemForm[]) => void;
};

export default function RestaurantDishSelector({
  dishes,
  disabledNames = [],
  placeholder = 'Search existing dish...',
  value,
  onChange,
  onSelect,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [internalSelectedItems, setInternalSelectedItems] = useState<MenuItemForm[]>([]);

  const selectedItems = value ?? internalSelectedItems;
  const setSelectedItemsFn = onChange ?? setInternalSelectedItems;
  const filteredDishes = useMemo(() => {
    const q = query.toLowerCase().trim();
    return dishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(q) &&
        !disabledNames.includes(dish.name) &&
        !selectedItems.find((i) => i.name === dish.name),
    );
  }, [query, dishes, disabledNames, selectedItems]);

  useEffect(() => {
    if (onSelect) onSelect(selectedItems);
  }, [selectedItems, onSelect]);

  const handleSelectDish = (dish: Dish | MenuItemForm) => {
    const formDish: MenuItemForm = {
      name: dish.name,
      price: dish.price,
      quantity: 1,
      category: dish.category,
      description: dish.description ?? '',
      image_urls: dish.image_urls ?? [],
    };

    setSelectedItemsFn([...selectedItems, formDish]);
    setQuery('');
    setOpen(false);
  };

  const handleRemoveDish = (idx: number) => {
    setSelectedItemsFn(selectedItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="relative w-full">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {open && filteredDishes.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow">
          {filteredDishes.map((dish) => (
            <div
              key={dish.name}
              onClick={() => handleSelectDish(dish)}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
            >
              {dish.name}
            </div>
          ))}
        </div>
      )}

      {open && query && filteredDishes.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow">
          No dish found
        </div>
      )}

      <div className="mt-2 flex flex-col gap-2 w-full">
        {selectedItems.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center w-full bg-white border border-gray-200 rounded-lg shadow-sm p-2"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{item.name}</span>
              <span className="text-gray-500 text-xs">{formatVND(item.price)}</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => {
                  const qty = Math.max(1, Number(e.target.value) || 1);
                  setSelectedItemsFn(
                    selectedItems.map((d, i) => (i === idx ? { ...d, quantity: qty } : d)),
                  );
                }}
                style={{ width: 60 }}
                className="w-16 rounded-md border px-2 py-1 text-sm text-right"
              />

              <button
                onClick={() => handleRemoveDish(idx)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-10" />}
    </div>
  );
}
