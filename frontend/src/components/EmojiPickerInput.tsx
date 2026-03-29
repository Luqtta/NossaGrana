import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { type EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from '../contexts/ThemeContext';

interface EmojiPickerInputProps {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}

export const EmojiPickerInput = ({ value, onChange, label = 'Emoji / Ícone' }: EmojiPickerInputProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Fecha o picker ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 outline-none hover:border-emerald-400 transition text-left"
      >
        <span className="text-2xl">{value || '📦'}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {open ? 'Fechar picker' : 'Clique para escolher um emoji'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            searchPlaceholder="Buscar emoji..."
            lazyLoadEmojis
          />
        </div>
      )}
    </div>
  );
};
