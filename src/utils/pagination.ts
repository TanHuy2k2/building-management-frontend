export const getPaginationNumbers = (page: number, total: number) => {
  if (total <= 5) return [...Array(total)].map((_, i) => i + 1);

  if (page <= 2) return [1, 2, 3, '...', total];

  if (page >= total - 1) return [1, '...', total - 2, total - 1, total];

  return [1, '...', page - 1, page, page + 1, '...', total];
};
