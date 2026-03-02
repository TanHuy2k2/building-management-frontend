import { RankDiscount, UserRank, VATRate } from '../types';
import { POINT_EXCHANGE_VALUE, POINTS_EARN_RATE } from './constants';

export const formatVND = (value: number) => value.toLocaleString('vi-VN') + ' VND';

export const calculatePercentage = (amount: number, percent: number): number => {
  return (amount * percent) / 100;
};

export const calculatePayment = (
  amount: number,
  rank = UserRank.BRONZE,
  pointsUsed = 0,
  vatRate = VATRate.DEFAULT,
) => {
  const rankKey = rank.toUpperCase() as keyof typeof RankDiscount;
  const discount = (amount * RankDiscount[rankKey]) / 100;
  const maxPointsUsed = Math.ceil((amount - discount) / POINT_EXCHANGE_VALUE);
  const finalPointsUsed = Math.min(pointsUsed, maxPointsUsed);
  let finalAmount = Math.max(0, amount - discount - finalPointsUsed * POINT_EXCHANGE_VALUE);
  const vatCharge = calculatePercentage(finalAmount, vatRate);
  finalAmount = finalAmount + vatCharge;
  const pointsEarned = Math.floor(finalAmount / POINTS_EARN_RATE);

  return { finalAmount, discount, pointsEarned, finalPointsUsed, maxPointsUsed, vatCharge };
};
