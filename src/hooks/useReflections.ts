import { useState, useEffect, useCallback } from 'react';
import { Reflection } from '@/lib/types';
import { loadReflections, saveReflections } from '@/lib/storage';

export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);

  useEffect(() => {
    setReflections(loadReflections());
  }, []);

  const addReflection = useCallback((reflection: Reflection) => {
    const current = loadReflections();
    current.unshift(reflection);
    saveReflections(current);
    setReflections([...current]);
  }, []);

  const deleteReflection = useCallback((id: number) => {
    const current = loadReflections();
    const filtered = current.filter(r => r.id !== id);
    saveReflections(filtered);
    setReflections([...filtered]);
  }, []);

  const refreshReflections = useCallback(() => {
    setReflections(loadReflections());
  }, []);

  return {
    reflections,
    addReflection,
    deleteReflection,
    refreshReflections,
  };
}
