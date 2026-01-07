import { createContext, useContext, useState } from 'react';
import { Restaurant, RestaurantContextType } from '../types';

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);
export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  return (
    <RestaurantContext.Provider value={{ currentRestaurant, setCurrentRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }

  return context;
}
