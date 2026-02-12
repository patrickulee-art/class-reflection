import { useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastState {
  type: ToastType;
  message: string;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    type: 'success',
    message: '',
    visible: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ type, message, visible: true });

    timerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
      timerRef.current = null;
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
