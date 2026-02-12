'use client';

import { ToastState } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastState;
}

export default function Toast({ toast }: ToastProps) {
  return (
    <div className={`toast ${toast.type} ${toast.visible ? 'show' : ''}`}>
      <span>{toast.type === 'success' ? '\u2714' : '\u2716'}</span>
      <span>{toast.message}</span>
    </div>
  );
}
