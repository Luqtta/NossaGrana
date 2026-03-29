import { useState } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Monetary input that accepts both comma and dot decimal formats.
 * Examples: "54,50", "54.50", "1.000,50", "1,000.50".
 */
export const CurrencyInput = ({ value, onChange, className, placeholder = '0,00', required }: CurrencyInputProps) => {
  const [focused, setFocused] = useState(false);
  const [rawInput, setRawInput] = useState('');

  const formatDisplay = (v: number) => {
    if (!v && v !== 0) return '';
    if (v === 0) return '';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseValue = (input: string): number => {
    const sanitized = input.replace(/[^\d,.]/g, '').trim();
    if (!sanitized) return 0;

    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    const decimalIndex = Math.max(lastComma, lastDot);

    if (decimalIndex === -1) {
      const integerOnly = sanitized.replace(/[^\d]/g, '');
      return integerOnly ? Number(integerOnly) : 0;
    }

    const integerPart = sanitized.slice(0, decimalIndex).replace(/[^\d]/g, '');
    const decimalPartRaw = sanitized.slice(decimalIndex + 1).replace(/[^\d]/g, '');

    // More than 2 digits after the last separator means thousand grouping.
    if (decimalPartRaw.length > 2) {
      const digitsOnly = sanitized.replace(/[^\d]/g, '');
      return digitsOnly ? Number(digitsOnly) : 0;
    }

    const normalized = `${integerPart || '0'}.${decimalPartRaw || '0'}`;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const handleFocus = () => {
    setFocused(true);
    if (value > 0) {
      setRawInput(value.toFixed(2).replace('.', ','));
    } else {
      setRawInput('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const filtered = raw.replace(/[^\d,.]/g, '');

    setRawInput(filtered);
    onChange(parseValue(filtered));
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseValue(rawInput);
    onChange(parsed);
  };

  return (
    <div className="relative">
      <span className="absolute left-4 inset-y-0 flex items-center text-gray-500 dark:text-gray-400 font-medium pointer-events-none">
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={focused ? rawInput : formatDisplay(value)}
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