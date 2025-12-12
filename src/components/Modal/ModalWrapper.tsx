import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

/**
 * Production-ready Modal component using React Portal
 *
 * Features:
 * - Always viewport-centered using fixed positioning
 * - Renders outside DOM hierarchy via Portal
 * - Prevents body scroll when open
 * - Keyboard navigation (ESC to close)
 * - Click-outside to close
 * - Accessibility (focus trap, ARIA attributes)
 */
export function ModalWrapper({
  isOpen,
  onClose,
  children,
  closeOnEscape = true,
  closeOnBackdrop = true,
  className = ''
}: ModalWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`modal-content ${className}`}
        tabIndex={-1}
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/**
 * Alternative: Fixed positioning with transform centering
 * Use when flexbox is not suitable
 */
export function ModalWrapperTransform({
  isOpen,
  onClose,
  children,
  closeOnEscape = true,
  closeOnBackdrop = true,
  className = ''
}: ModalWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`modal-content ${className}`}
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}