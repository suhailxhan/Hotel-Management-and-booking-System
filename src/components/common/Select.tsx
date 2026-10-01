import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#14202B]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`h-9 px-3 py-1.5 text-sm bg-white text-[#14202B] rounded-[6px] border ${
            error ? 'border-[#B42318] focus:ring-[#B42318]' : 'border-[#D8DCD5] focus:ring-[#0F5E63]'
          } focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-[#EEF0EC] cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-[#B42318]">{error}</span>}
        {!error && helperText && <span className="text-xs text-[#57636E]">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
