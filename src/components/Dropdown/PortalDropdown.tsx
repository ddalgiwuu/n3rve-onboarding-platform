import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  closeOnScroll?: boolean;
}

interface Position {
  top: number;
  left: number;
  width: number;
}

/**
 * Portal-based Dropdown with dynamic positioning
 *
 * Features:
 * - Calculates position using getBoundingClientRect()
 * - Updates position on scroll/resize
 * - Auto-closes on scroll (optional)
 * - Click-outside to close
 * - No z-index conflicts (renders in Portal)
 * - Follows Radix UI positioning patterns
 */
export function PortalDropdown({
  trigger,
  children,
  className = '',
  align = 'left',
  closeOnScroll = true
}: PortalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position
  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    let left = rect.left + scrollX;

    // Alignment logic
    if (align === 'right') {
      left = rect.right + scrollX;
    } else if (align === 'center') {
      left = rect.left + scrollX + rect.width / 2;
    }

    setPosition({
      top: rect.bottom + scrollY + 4, // 4px gap
      left,
      width: rect.width
    });
  };

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  // Handle scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (closeOnScroll) {
        setIsOpen(false);
      } else {
        updatePosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen, closeOnScroll]);

  // Handle resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'inline-block', cursor: 'pointer' }}
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`dropdown-portal ${className}`}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              ...(align === 'right' && { transform: 'translateX(-100%)' }),
              ...(align === 'center' && { transform: 'translateX(-50%)' }),
              zIndex: 9999,
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              minWidth: align === 'left' ? `${position.width}px` : '200px',
              maxHeight: '400px',
              overflow: 'auto'
            }}
            role="menu"
            aria-orientation="vertical"
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * Dropdown Menu Item Component
 */
interface DropdownItemProps {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  onClick,
  children,
  disabled = false,
  className = ''
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`dropdown-item ${className}`}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 0.15s ease',
        ...(disabled ? {} : { ':hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' } })
      }}
      role="menuitem"
    >
      {children}
    </button>
  );
}

/**
 * Dropdown Divider Component
 */
export function DropdownDivider() {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        margin: '4px 0'
      }}
      role="separator"
    />
  );
}