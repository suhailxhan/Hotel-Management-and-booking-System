import React, { useEffect } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  footer?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    full: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14202B]/60 backdrop-brightness-75 transition-opacity duration-150">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} bg-white border border-[#D8DCD5] rounded-[6px] shadow-lg flex flex-col max-h-[92vh] overflow-hidden text-left`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8DCD5] bg-[#F4F5F2]">
          <h2 className="text-lg font-semibold text-[#14202B]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#57636E] hover:text-[#14202B] text-sm font-semibold px-2 py-1 rounded-[6px] hover:bg-[#E8ECE5] transition-colors duration-150 cursor-pointer"
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-3 border-t border-[#D8DCD5] bg-[#F4F5F2] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
