import { Reflection } from './types';

export const STORAGE_KEY = 'classReflections';

export function getReflections(): Reflection[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveReflections(reflections: Reflection[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
}
