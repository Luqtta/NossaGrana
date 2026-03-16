import { useState } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export const CurrencyInput = ({ value, onChange, className, placeholder = '0,00', required }: CurrencyInputProps) => {
  const [focused, setFocused] = useState(false);
  const [rawCents, setRawCents] = useState('');

  const formatDisplay = (v: number) => {
    if (!v) return '';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleFocus = () => {
    setFocused(true);
    const cents = Math.round(value * 100);
    setRawCents(cents > 0 ? cents.toString() : '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setRawCents(digits);
    onChange(digits ? parseInt(digits, 10) / 100 : 0);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium pointer-events-none">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={focused ? rawCents : formatDisplay(value)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`pl-10 ${className || ''}`}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};
