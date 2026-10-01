import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-[6px] transition-colors duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#0F5E63] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs h-8 gap-1.5',
    md: 'px-4 py-2 text-sm h-9 gap-2',
    lg: 'px-6 py-2.5 text-base h-11 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#0F5E63] text-white hover:bg-[#0C4D51] active:bg-[#093C3F] border border-transparent shadow-xs',
    secondary:
      'bg-[#FFFFFF] text-[#14202B] hover:bg-[#F4F5F2] active:bg-[#E8ECE5] border border-[#D8DCD5]',
    danger:
      'bg-[#B42318] text-white hover:bg-[#911D13] active:bg-[#72170F] border border-transparent shadow-xs',
    ghost:
      'bg-transparent text-[#14202B] hover:bg-[#E8ECE5] active:bg-[#D8DCD5] border border-transparent',
    outline:
      'bg-transparent text-[#0F5E63] border border-[#0F5E63] hover:bg-[#E7F3F3] active:bg-[#D0E7E7]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
