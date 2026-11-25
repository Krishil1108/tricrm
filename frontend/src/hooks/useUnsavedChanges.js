import { useEffect, useCallback } from 'react';

/**
 * Warns the user before closing/reloading the browser tab when there are unsaved changes,
 * and provides a confirmDiscard() helper for in-app modal/route transitions.
 */
export function useUnsavedChanges(isDirty, message = 'You have unsaved changes. Are you sure you want to leave?') {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(message);
  }, [isDirty, message]);

  return { confirmDiscard };
}

export default useUnsavedChanges;
