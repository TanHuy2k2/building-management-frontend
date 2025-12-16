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
