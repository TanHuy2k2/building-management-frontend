import { useMemo, useState, useEffect } from 'react';
import { MenuItemForm } from '../../../types';
import { Trash2 } from 'lucide-react';

type Props = {
  dishes: MenuItemForm[];
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

  const handleSelectDish = (dish: MenuItemForm) => {
    setSelectedItemsFn([...selectedItems, dish]);
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

      {/* Selected Items */}
      <div className="mt-2 flex flex-col gap-2 w-full">
        {selectedItems.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center w-full bg-white border border-gray-200 rounded-lg shadow-sm p-2"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{item.name}</span>
              <span className="text-gray-500 text-xs">
                ${item.price} · Qty {item.quantity}
              </span>
            </div>
            <button
              onClick={() => handleRemoveDish(idx)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-10" />}
    </div>
  );
}
