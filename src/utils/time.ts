import { BUS_SPEED_KMH, DAY_ORDER } from './constants';
import { BusStop, DayOfWeek } from '../types';

export const formatDateVN = (date: Date | string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatTimeVN = (date: Date | string) => {
  return new Date(date).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const durationHours = (start: Date | string, end: Date | string) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();

  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
};

export const getNextDay = (day: DayOfWeek) => {
  const idx = DAY_ORDER.indexOf(day);
  if (idx === -1 || idx === DAY_ORDER.length - 1) return null;
  return DAY_ORDER[idx + 1];
};

export const formatTimeForInput = (date?: Date | string | null): string => {
  if (!date) return '';

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
};

export const calcEstimatedArrival = (stops: BusStop[]) => {
  let total = 0;

  return stops.map((s, i) => {
    if (i === 0) {
      return { ...s, estimated_arrival: 0 };
    }

    const [lat1, lng1] = stops[i - 1].location.split(',').map(Number);
    const [lat2, lng2] = s.location.split(',').map(Number);
    const dist = haversineKm(lat1, lng1, lat2, lng2);
    const minutes = (dist / BUS_SPEED_KMH) * 60;

    total += Math.round(minutes);

    return {
      ...s,
      estimated_arrival: total,
    };
  });
};
