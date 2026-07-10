import { useMemo, useState } from 'react';

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && value !== '') return asNumber;
  return String(value).toLowerCase();
};

const compareValues = (a, b, direction) => {
  if (a < b) return direction === 'asc' ? -1 : 1;
  if (a > b) return direction === 'asc' ? 1 : -1;
  return 0;
};

const useSortableData = (items, initialConfig = null) => {
  const [sortConfig, setSortConfig] = useState(initialConfig);

  const sortedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!sortConfig || !sortConfig.key) return items;

    const { key, direction = 'asc', accessor } = sortConfig;

    return [...items].sort((a, b) => {
      const valueA = normalizeValue(accessor ? accessor(a) : a[key]);
      const valueB = normalizeValue(accessor ? accessor(b) : b[key]);
      return compareValues(valueA, valueB, direction);
    });
  }, [items, sortConfig]);

  const requestSort = (key, accessor) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return {
          key,
          accessor,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, accessor, direction: 'asc' };
    });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

export default useSortableData;
