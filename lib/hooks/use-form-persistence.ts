import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  storageKey: string,
  excludeFields: (keyof T)[] = []
) {
  const [isRestored, setIsRestored] = useState(false);

  // 1. Restore data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if we have data
        if (parsed && typeof parsed === 'object') {
          // Iterate and set values, ignoring excluded fields
          Object.keys(parsed).forEach((key) => {
            if (!excludeFields.includes(key as keyof T)) {
              form.setValue(key as any, parsed[key], {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to restore form data from localStorage:', e);
    } finally {
      setIsRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // 2. Watch and save data to localStorage
  useEffect(() => {
    if (!isRestored) return; // Don't save before restoring

    const subscription = form.watch((value) => {
      try {
        const dataToSave = { ...value };
        // Remove excluded fields (like File objects which can't be JSON serialized)
        excludeFields.forEach((field) => {
          delete dataToSave[field as keyof typeof dataToSave];
        });
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (e) {
        console.warn('Failed to save form data to localStorage:', e);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, storageKey, isRestored, excludeFields]);

  // 3. Helper to clear data (call this on successful submit)
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear form data from localStorage:', e);
    }
  };

  return { isRestored, clearSavedData };
}
