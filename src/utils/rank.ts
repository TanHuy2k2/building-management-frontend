export const getRankDetails = (rank?: string) => {
  const ranks = {
    bronze: {
      name: 'bronze',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      pointValue: 1000,
      minSpent: 0,
      maxSpent: 2000000,
      discount: 0,
    },
    silver: {
      name: 'silver',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      pointValue: 1200,
      minSpent: 2000000,
      maxSpent: 5000000,
      discount: 2,
    },
    gold: {
      name: 'gold',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      pointValue: 1400,
      minSpent: 5000000,
      maxSpent: 10000000,
      discount: 5,
    },
    platinum: {
      name: 'platinum',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      pointValue: 1500,
      minSpent: 10000000,
      maxSpent: Infinity,
      discount: 10,
    },
  };
  return ranks[rank as keyof typeof ranks] || ranks.bronze;
};
