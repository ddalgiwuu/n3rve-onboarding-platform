import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  className?: string
  placeholder?: string
  minDate?: string
  maxDate?: string
  id?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Select date',
  minDate,
  maxDate,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState(() => {
    if (value) {
      const date = new Date(value)
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
    const dateString = selectedDate.toISOString().split('T')[0]
    onChange(dateString)
    setIsOpen(false)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDisplayMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  const isDateDisabled = (day: number) => {
    const checkDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
    const checkDateString = checkDate.toISOString().split('T')[0]
    
    if (minDate && checkDateString < minDate) return true
    if (maxDate && checkDateString > maxDate) return true
    
    return false
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(displayMonth)
    const firstDay = getFirstDayOfMonth(displayMonth)
    const days = []
    const selectedDate = value ? new Date(value) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
      currentDate.setHours(0, 0, 0, 0)
      
      const isSelected = selectedDate && 
        currentDate.getDate() === selectedDate.getDate() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        currentDate.getFullYear() === selectedDate.getFullYear()
      
      const isToday = currentDate.getTime() === today.getTime()
      const isDisabled = isDateDisabled(day)

      days.push(
        <button
          key={day}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
          className={`
            p-2 text-sm rounded-lg transition-all duration-200
            ${isSelected 
              ? 'bg-gradient-to-r from-n3rve-500 to-n3rve-600 text-white font-semibold shadow-lg scale-105' 
              : isToday
                ? 'bg-n3rve-50 dark:bg-n3rve-900/20 text-n3rve-600 dark:text-n3rve-400 font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }
            ${isDisabled 
              ? 'opacity-40 cursor-not-allowed' 
              : 'cursor-pointer hover:scale-105'
            }
          `}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl 
          focus:ring-2 focus:ring-n3rve-500 focus:border-n3rve-main 
          bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white 
          transition-all duration-200 
          hover:bg-gray-100 dark:hover:bg-gray-800
          flex items-center justify-between
          ${className}
        `}
      >
        <span className={value ? '' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>

          {/* Today button */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                onChange(today)
                setIsOpen(false)
              }}
              className="w-full py-2 px-4 bg-n3rve-500 hover:bg-n3rve-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Select Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}