'use client';

import { useState, useEffect, useRef } from 'react';

interface CustomSelectOption {
  value: string;
  label: string;
  isDeletable?: boolean;
  onDelete?: () => void;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '請選擇',
  className = '',
  required = false,
  disabled = false,
}: CustomSelectProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // 獲取當前選中的標籤
  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white flex items-center justify-between transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed text-gray-500'
            : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedLabel}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <div
              key={`${option.value}-${index}`}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
            >
              <span
                onClick={() => {
                  onChange(option.value);
                  setShowDropdown(false);
                }}
                className={`flex-1 ${!option.value ? 'text-gray-500' : 'text-gray-900'}`}
              >
                {option.label}
              </span>
              {option.isDeletable && option.onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (option.onDelete) {
                      option.onDelete();
                    }
                  }}
                  className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-100 transition-colors ml-2"
                  title="刪除此選項"
                >
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 hover:text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
