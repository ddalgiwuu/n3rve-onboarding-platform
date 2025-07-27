import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
  value: string
  onChange: (datetime: string) => void
  className?: string
  placeholder?: string
  minDate?: string
  maxDate?: string
  id?: string
  label?: string
  error?: string
  hint?: string
  required?: boolean
  showTimeOnly?: boolean
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Select date and time',
  minDate,
  maxDate,
  id,
  label,
  error,
  hint,
  required,
  showTimeOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('00');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [displayMonth, setDisplayMonth] = useState(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse existing value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedHour(date.getHours().toString().padStart(2, '0'));
      setSelectedMinute(date.getMinutes().toString().padStart(2, '0'));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return showTimeOnly ? timeStr : `${dateStr} at ${timeStr}`;
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      day,
      parseInt(selectedHour),
      parseInt(selectedMinute)
    );
    onChange(selectedDate.toISOString());

    if (showTimeOnly) {
      // Don't close if we're only selecting time
      return;
    }
  };

  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);

    if (value || showTimeOnly) {
      const currentDate = value ? new Date(value) : new Date();
      const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        parseInt(hour),
        parseInt(minute)
      );
      onChange(newDate.toISOString());
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDisplayMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isDateDisabled = (day: number) => {
    const checkDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const checkDateString = checkDate.toISOString().split('T')[0];

    if (minDate && checkDateString < minDate) return true;
    if (maxDate && checkDateString > maxDate) return true;

    return false;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDay = getFirstDayOfMonth(displayMonth);
    const days = [];
    const selectedDate = value ? new Date(value) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
      currentDate.setHours(0, 0, 0, 0);

      const isSelected = selectedDate &&
        currentDate.getDate() === selectedDate.getDate() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        currentDate.getFullYear() === selectedDate.getFullYear();

      const isToday = currentDate.getTime() === today.getTime();
      const isDisabled = isDateDisabled(day);

      days.push(
        <button
          key={day}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
          className={`
            relative p-2 text-sm rounded-xl transition-all duration-200 min-w-[36px] min-h-[36px]
            ${isSelected
    ? 'bg-gradient-to-br from-n3rve-500 to-n3rve-600 text-white font-bold shadow-lg scale-110 ring-2 ring-n3rve-500/30'
    : isToday
      ? 'bg-gradient-to-br from-n3rve-50 to-purple-50 dark:from-n3rve-900/20 dark:to-purple-900/20 text-n3rve-600 dark:text-n3rve-400 font-semibold border-2 border-n3rve-200 dark:border-n3rve-800'
      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
}
            ${isDisabled
    ? 'opacity-30 cursor-not-allowed hover:scale-100'
    : 'cursor-pointer hover:scale-110 active:scale-95'
}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div ref={containerRef} className="relative group">
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-3.5 min-h-[48px] border-2 rounded-xl 
            bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm
            text-gray-900 dark:text-white font-medium
            border-gray-200 dark:border-gray-700
            hover:border-gray-300 dark:hover:border-gray-600
            focus:border-transparent focus:ring-4 focus:ring-n3rve-500/20 focus:outline-none
            focus:bg-white dark:focus:bg-gray-900
            focus:shadow-lg focus:shadow-n3rve-500/10
            transition-all duration-200 
            flex items-center justify-between
            ${error ? 'border-red-500 dark:border-red-500 hover:border-red-600 dark:hover:border-red-400 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/10' : ''}
            ${isOpen ? 'border-transparent ring-4 ring-n3rve-500/20 bg-white dark:bg-gray-900 shadow-lg shadow-n3rve-500/10' : ''}
            ${className}
          `}
        >
          <span className={value ? '' : 'text-gray-400 dark:text-gray-500'}>
            {value ? formatDateTime(value) : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {!showTimeOnly && <Calendar className={`w-5 h-5 transition-colors ${isOpen ? 'text-n3rve-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}`} />}
            <Clock className={`w-5 h-5 transition-colors ${isOpen ? 'text-n3rve-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full min-w-[320px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-1">
            {!showTimeOnly && (
              <>
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all hover:shadow-md group"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:text-n3rve-500 transition-colors" />
                  </button>

                  <h3 className="text-base font-bold bg-gradient-to-r from-n3rve-600 to-purple-600 dark:from-n3rve-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>

                  <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all hover:shadow-md group"
                  >
                    <ChevronRight className="w-4 h-4 group-hover:text-n3rve-500 transition-colors" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="p-4">
                  {/* Day labels */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center p-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>
                </div>
              </>
            )}

            {/* Time Selection */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">HOUR</label>
                  <div className="flex gap-1">
                    <select
                      value={selectedHour}
                      onChange={(e) => handleTimeChange(e.target.value, selectedMinute)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 transition-all"
                    >
                      {hours.map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-2xl font-bold text-gray-400 dark:text-gray-600 mt-6">:</div>

                <div className="text-center">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">MINUTE</label>
                  <div className="flex gap-1">
                    <select
                      value={selectedMinute}
                      onChange={(e) => handleTimeChange(selectedHour, e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-500 transition-all"
                    >
                      {minutes.map(minute => (
                        <option key={minute} value={minute}>{minute}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick time buttons */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleTimeChange('00', '00')}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
                >
                00:00
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange('06', '00')}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
                >
                06:00
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange('12', '00')}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
                >
                12:00
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange('18', '00')}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
                >
                18:00
                </button>
              </div>
            </div>

            {/* Confirm button */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-n3rve-500 to-n3rve-600 hover:from-n3rve-600 hover:to-n3rve-700 text-white rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
              Confirm
              </button>
            </div>
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
          <span className="w-1 h-1 bg-red-500 rounded-full" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default DateTimePicker;
