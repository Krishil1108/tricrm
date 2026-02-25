import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced values to reduce unnecessary renders and API calls
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} - Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for throttled functions to limit execution frequency
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} - Throttled function
 */
export const useThrottle = (callback, delay = 300) => {
  const lastRan = useRef(Date.now());

  return (...args) => {
    const now = Date.now();
    if (now - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = now;
    }
  };
};

export default useDebounce;
