'use client';

import { useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className={`modal-overlay ${isOpen ? 'show' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
