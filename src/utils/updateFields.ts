export const removeEmptyFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (obj instanceof Date) return obj;

  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (value === '' || value == null) return acc;

      if (value instanceof Date) {
        acc[key] = value;

        return acc;
      }

      if (Array.isArray(value) && !value.length) return acc;

      if (typeof value === 'object') {
        const cleaned = removeEmptyFields(value);
        if (Object.keys(cleaned).length) acc[key] = cleaned;
      } else {
        acc[key] = value;
      }

      return acc;
    },
    Array.isArray(obj) ? [] : ({} as any),
  );
};

export const getChangedFields = (original: Record<string, any>, updated: Record<string, any>) => {
  const result: Record<string, any> = {};
  for (const key in updated) {
    if (JSON.stringify(updated[key]) !== JSON.stringify(original[key])) {
      result[key] = updated[key];
    }
  }

  return result;
};
