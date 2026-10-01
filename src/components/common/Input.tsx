import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  tabular?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, tabular, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#14202B]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-9 px-3 py-1.5 text-sm bg-white text-[#14202B] rounded-[6px] border ${
            error ? 'border-[#B42318] focus:ring-[#B42318]' : 'border-[#D8DCD5] focus:ring-[#0F5E63]'
          } focus:outline-none focus:ring-2 focus:border-transparent placeholder-[#8A95A0] disabled:bg-[#EEF0EC] disabled:text-[#8A95A0] ${
            tabular ? 'font-mono' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-[#B42318]">{error}</span>}
        {!error && helperText && <span className="text-xs text-[#57636E]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
