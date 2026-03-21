'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useReflections } from '@/hooks/useReflections';
import { Reflection } from '@/lib/types';

interface ReflectionsContextType {
  reflections: Reflection[];
  addReflection: (reflection: Reflection) => Promise<void>;
  deleteReflection: (id: number) => Promise<void>;
  refreshReflections: () => void;
  syncWithSupabase: () => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
}

const ReflectionsContext = createContext<ReflectionsContextType | null>(null);

export function ReflectionsProvider({ children }: { children: ReactNode }) {
  const value = useReflections();
  return (
    <ReflectionsContext.Provider value={value}>
      {children}
    </ReflectionsContext.Provider>
  );
}

export function useReflectionsContext(): ReflectionsContextType {
  const context = useContext(ReflectionsContext);
  if (!context) {
    throw new Error('useReflectionsContext must be used within a ReflectionsProvider');
  }
  return context;
}
