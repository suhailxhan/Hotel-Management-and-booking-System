import React from 'react';

interface StatNumberProps {
  label: string;
  value: string | number;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  tabular?: boolean;
}

export const StatNumber: React.FC<StatNumberProps> = ({
  label,
  value,
  subtext,
  size = 'md',
  tabular = true,
}) => {
  const valueSizes = {
    sm: 'text-xl', // 20px
    md: 'text-3xl', // 28px
    lg: 'text-4xl', // 36px
  };

  return (
    <div className="flex flex-col text-left">
      <span className="text-xs font-semibold text-[#57636E] uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`font-semibold text-[#14202B] ${valueSizes[size]} ${
          tabular ? 'font-mono' : ''
        }`}
      >
        {value}
      </span>
      {subtext && <span className="text-xs text-[#57636E] mt-0.5">{subtext}</span>}
    </div>
  );
};
