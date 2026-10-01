import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const typeStyles = {
    success: 'bg-[#15803D] text-white border-[#15803D]',
    error: 'bg-[#B42318] text-white border-[#B42318]',
    info: 'bg-[#14202B] text-white border-[#14202B]',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-[6px] border shadow-md text-sm font-medium transition-all duration-150 ${
        typeStyles[toast.type]
      }`}
      role="alert"
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-4 text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  );
};
