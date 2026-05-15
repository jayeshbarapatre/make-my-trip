import React, { useState, useMemo, useRef, useEffect } from 'react';
import './CustomCalendarPicker.css';

/**
 * Custom Calendar Picker Component
 * Replicates the premium MakeMyTrip double-month calendar overlay with live pricing
 */
export default function CustomCalendarPicker({
  value, // Format: 'YYYY-MM-DD'
  onChange,
  onClose,
  isOpen,
  labelText = 'Departure'
}) {
  const containerRef = useRef(null);

  // Parse initial base date
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }, [value]);

  // Track the left month being displayed (starts with selectedDate's month or current month)
  const [currentYear, setCurrentYear] = useState(() => {
    const initDate = selectedDate || today;
    return initDate.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initDate = selectedDate || today;
    return initDate.getMonth(); // 0-indexed
  });

  // Keep state updated if selected date changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentYear(selectedDate.getFullYear());
      setCurrentMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  // Handle outside clicks to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Generate stable, realistic fare prices for days based on date
  const getDayPrice = (year, month, day) => {
    const seed = (year * 37 + (month + 1) * 17 + day * 13) % 100;
    
    // Create authentic levels of pricing
    if (seed < 15) return { val: '6,482', cheap: true };
    if (seed < 30) return { val: '6,998', cheap: true };
    if (seed < 45) return { val: '7,372', cheap: true };
    if (seed < 60) return { val: '7,665', cheap: true };
    if (seed < 75) return { val: '7,741', cheap: false };
    if (seed < 85) return { val: '7,849', cheap: false };
    if (seed < 93) return { val: '8,332', cheap: false };
    return { val: '9,203', cheap: false };
  };

  // Helper to get formatted name of month
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to navigate months
  const handlePrevMonths = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonths = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Calculate year & month for the right month panel
  const rightMonthObj = useMemo(() => {
    if (currentMonth === 11) {
      return { month: 0, year: currentYear + 1 };
    }
    return { month: currentMonth + 1, year: currentYear };
  }, [currentMonth, currentYear]);

  // Generate calendar days for a specific year and month
  const generateMonthDays = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total days
    
    const daySlots = [];
    
    // Empty slots before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      daySlots.push(null);
    }

    // Active days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isPast = dateObj < today;
      const isSelected = selectedDate && 
                         selectedDate.getDate() === d && 
                         selectedDate.getMonth() === month && 
                         selectedDate.getFullYear() === year;

      const fare = getDayPrice(year, month, d);

      daySlots.push({
        day: d,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isPast,
        isSelected,
        fare
      });
    }

    return daySlots;
  };

  const leftMonthDays = useMemo(() => generateMonthDays(currentYear, currentMonth), [currentYear, currentMonth, selectedDate]);
  const rightMonthDays = useMemo(() => generateMonthDays(rightMonthObj.year, rightMonthObj.month), [rightMonthObj, selectedDate]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return 'Select Date';
    const dStr = String(selectedDate.getDate());
    const mStr = MONTH_NAMES[selectedDate.getMonth()].substring(0, 3);
    const yStr = String(selectedDate.getFullYear()).substring(2);
    return `${dStr} ${mStr} ${yStr}`;
  }, [selectedDate]);

  if (!isOpen) return null;

  return (
    <>
      <div className="mmt-cal-backdrop" onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }} />
      <div 
        className="mmt-cal-overlay" 
        ref={containerRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Top Header section */}
      <div className="mmt-cal-header">
        <div className="mmt-cal-header-left">
          <span className="mmt-cal-icon">📅</span>
          <span className="mmt-cal-selected-val">{formattedSelectedDate}</span>
          <span className="mmt-cal-dash">-</span>
          <span className="mmt-cal-helper-txt">Book round trip for great savings</span>
        </div>
      </div>

      {/* Main Panels Body */}
      <div className="mmt-cal-body">
        {/* Left Control Navigation */}
        <button type="button" className="mmt-cal-nav-btn prev" onClick={handlePrevMonths}>
          ‹
        </button>

        {/* Month Panels Container */}
        <div className="mmt-cal-month-panels">
          
          {/* Left Month Panel */}
          <div className="mmt-cal-month-col">
            <h3 className="mmt-cal-month-title">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            
            <div className="mmt-cal-weekdays">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
                <div key={w} className="mmt-cal-wkday">{w}</div>
              ))}
            </div>

            <div className="mmt-cal-days-grid">
              {leftMonthDays.map((item, idx) => {
                if (!item) return <div key={`empty-l-${idx}`} className="mmt-cal-day-cell empty" />;
                return (
                  <button
                    key={`day-l-${item.day}`}
                    type="button"
                    disabled={item.isPast}
                    className={`mmt-cal-day-cell active-day${item.isSelected ? ' selected' : ''}${item.isPast ? ' disabled' : ''}`}
                    onClick={() => {
                      if (!item.isPast && onChange) {
                        onChange(item.dateStr);
                        if (onClose) onClose();
                      }
                    }}
                  >
                    <span className="mmt-cal-day-num">{item.day}</span>
                    {!item.isPast && (
                      <span className={`mmt-cal-day-fare${item.fare.cheap ? ' cheap' : ''}`}>
                        {item.fare.val}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Month Panel */}
          <div className="mmt-cal-month-col">
            <h3 className="mmt-cal-month-title">
              {MONTH_NAMES[rightMonthObj.month]} {rightMonthObj.year}
            </h3>

            <div className="mmt-cal-weekdays">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
                <div key={w} className="mmt-cal-wkday">{w}</div>
              ))}
            </div>

            <div className="mmt-cal-days-grid">
              {rightMonthDays.map((item, idx) => {
                if (!item) return <div key={`empty-r-${idx}`} className="mmt-cal-day-cell empty" />;
                return (
                  <button
                    key={`day-r-${item.day}`}
                    type="button"
                    disabled={item.isPast}
                    className={`mmt-cal-day-cell active-day${item.isSelected ? ' selected' : ''}${item.isPast ? ' disabled' : ''}`}
                    onClick={() => {
                      if (!item.isPast && onChange) {
                        onChange(item.dateStr);
                        if (onClose) onClose();
                      }
                    }}
                  >
                    <span className="mmt-cal-day-num">{item.day}</span>
                    {!item.isPast && (
                      <span className={`mmt-cal-day-fare${item.fare.cheap ? ' cheap' : ''}`}>
                        {item.fare.val}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Control Navigation */}
        <button type="button" className="mmt-cal-nav-btn next" onClick={handleNextMonths}>
          ›
        </button>
      </div>

      {/* Footer bar */}
      <div className="mmt-cal-footer">
        Showing our lowest prices in ₹
      </div>
    </div>
    </>
  );
}
