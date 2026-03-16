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
    setRawCents(value > 0 ? Math.round(value).toString() : '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setRawCents(digits);
    onChange(digits ? parseInt(digits, 10) : 0);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <div className="relative">
      <span className="absolute left-4 inset-y-0 flex items-center text-gray-500 dark:text-gray-400 font-medium pointer-events-none">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={focused ? rawCents : formatDisplay(value)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`pl-12 ${className || ''}`}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};
