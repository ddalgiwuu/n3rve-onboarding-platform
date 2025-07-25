import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '00:00',
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Parse value on mount and when it changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h || '00');
      setMinutes(m || '00');
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHourChange = (newHour: string) => {
    const hour = parseInt(newHour);
    if (hour >= 0 && hour <= 23) {
      const formattedHour = hour.toString().padStart(2, '0');
      setHours(formattedHour);
      onChange(`${formattedHour}:${minutes}`);
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    const minute = parseInt(newMinute);
    if (minute >= 0 && minute <= 59) {
      const formattedMinute = minute.toString().padStart(2, '0');
      setMinutes(formattedMinute);
      onChange(`${hours}:${formattedMinute}`);
    }
  };

  const incrementHour = () => {
    const hour = (parseInt(hours) + 1) % 24;
    handleHourChange(hour.toString());
  };

  const decrementHour = () => {
    const hour = (parseInt(hours) - 1 + 24) % 24;
    handleHourChange(hour.toString());
  };

  const incrementMinute = () => {
    const minute = (parseInt(minutes) + 1) % 60;
    handleMinuteChange(minute.toString());
  };

  const decrementMinute = () => {
    const minute = (parseInt(minutes) - 1 + 60) % 60;
    handleMinuteChange(minute.toString());
  };

  const quickTimeOptions = [
    { label: '00:00', value: '00:00' },
    { label: '06:00', value: '06:00' },
    { label: '09:00', value: '09:00' },
    { label: '12:00', value: '12:00' },
    { label: '15:00', value: '15:00' },
    { label: '18:00', value: '18:00' },
    { label: '21:00', value: '21:00' },
  ];

  return (
    <div ref={pickerRef} className="relative">
      {/* Input Field */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer
          transition-all duration-200
          ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}
          ${isOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-300 dark:border-gray-600'}
          ${className}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Clock className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={value || placeholder}
          readOnly
          disabled={disabled}
          className="bg-transparent outline-none cursor-pointer flex-1 text-sm sm:text-base"
          placeholder={placeholder}
        />
      </div>

      {/* Picker Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
          {/* Quick Time Options */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t('time.quickSelect')}
            </p>
            <div className="grid grid-cols-4 gap-1">
              {quickTimeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    const [h, m] = option.value.split(':');
                    setHours(h);
                    setMinutes(m);
                  }}
                  className={`
                    px-2 py-1 text-xs rounded transition-all
                    ${value === option.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Time Selector */}
          <div className="flex items-center justify-center gap-4">
            {/* Hour Selector */}
            <div className="flex flex-col items-center">
              <button
                onClick={incrementHour}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={hours}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 2) {
                    setHours(val);
                    if (val.length === 2) {
                      handleHourChange(val);
                    }
                  }
                }}
                onBlur={() => handleHourChange(hours)}
                className="w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={2}
              />
              <button
                onClick={decrementHour}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('time.hours')}
              </span>
            </div>

            <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">:</span>

            {/* Minute Selector */}
            <div className="flex flex-col items-center">
              <button
                onClick={incrementMinute}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={minutes}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 2) {
                    setMinutes(val);
                    if (val.length === 2) {
                      handleMinuteChange(val);
                    }
                  }
                }}
                onBlur={() => handleMinuteChange(minutes)}
                className="w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={2}
              />
              <button
                onClick={decrementMinute}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('time.minutes')}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {t('time.done')}
          </button>
        </div>
      )}
    </div>
  );
};

export default TimePicker;