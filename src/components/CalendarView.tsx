import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Calendar, CheckCircle2, 
  Circle, Flame, Check, AlertCircle, AlertTriangle 
} from 'lucide-react';
import { Task, Habit } from '../types';
import { formatDate, formatTimeStr } from '../utils';

interface CalendarViewProps {
  tasks: Task[];
  habits: Habit[];
  onToggleTaskComplete: (id: string) => void;
  onToggleHabitToday: (id: string) => void;
}

export default function CalendarView({
  tasks,
  habits,
  onToggleTaskComplete,
  onToggleHabitToday
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(formatDate(new Date()));

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to get number of days in the month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of month (0-6 index, representing Sunday-Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Convert Sunday-first day index to Monday-first (0 = Monday, 6 = Sunday)
  const firstDayMondayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Generate previous month padding days
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
  const prevMonthPadding = [];
  for (let i = firstDayMondayIndex - 1; i >= 0; i--) {
    const dayVal = daysInPrevMonth - i;
    const dateStr = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayVal).padStart(2, '0')}`;
    prevMonthPadding.push({ day: dayVal, dateStr, isCurrentMonth: false });
  }

  // Generate current month days
  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    currentMonthDays.push({ day: i, dateStr, isCurrentMonth: true });
  }

  // Generate next month padding days
  const totalCells = prevMonthPadding.length + currentMonthDays.length;
  const nextMonthPaddingNeeded = 42 - totalCells; // 6 rows of 7 days
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthPadding = [];
  for (let i = 1; i <= nextMonthPaddingNeeded; i++) {
    const dateStr = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    nextMonthPadding.push({ day: i, dateStr, isCurrentMonth: false });
  }

  const allCalendarDays = [...prevMonthPadding, ...currentMonthDays, ...nextMonthPadding];

  // Change Month handler
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
  };

  // Date stats calculator
  const getDateStats = (dateStr: string) => {
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const completedTasks = dayTasks.filter(t => t.completed);
    const pendingTasks = dayTasks.filter(t => !t.completed);

    // Habits completion is checked in historical log
    // A habit is considered active on a date if its createdAt is <= that date and not paused
    const dayHabits = habits.filter(h => {
      const createdDate = h.createdAt.split('T')[0];
      return createdDate <= dateStr;
    });
    const completedHabits = dayHabits.filter(h => !!h.history[dateStr]);
    const missedHabits = dayHabits.filter(h => !h.history[dateStr] && !h.paused);

    return {
      completedTasks,
      pendingTasks,
      completedHabits,
      missedHabits,
      hasActivity: dayTasks.length > 0 || dayHabits.length > 0
    };
  };

  const selectedDayStats = getDateStats(selectedDateStr);

  // Format readable title for selected date
  const getReadableSelectedDate = () => {
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-5" id="calendar-container">
      {/* Calendar Header Card */}
      <div className="minimal-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="font-display font-bold text-slate-800 dark:text-white" id="calendar-title">
              {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              id="btn-calendar-prev"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="btn-calendar-today"
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDateStr(formatDate(today));
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Today
            </button>
            <button
              id="btn-calendar-next"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week titles */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <span key={idx} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1" id="calendar-days-grid">
          {allCalendarDays.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === formatDate(new Date());
            const stats = getDateStats(cell.dateStr);

            return (
              <button
                key={idx}
                id={`calendar-cell-${cell.dateStr}`}
                onClick={() => handleSelectDate(cell.dateStr)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 transition-all text-left group cursor-pointer ${
                  !cell.isCurrentMonth 
                    ? 'text-slate-300 dark:text-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-850/20' 
                    : isSelected
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/15'
                      : isToday
                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {/* Day number */}
                <span className={`text-xs font-semibold ${isSelected ? 'font-bold' : ''}`}>
                  {cell.day}
                </span>

                {/* Activity Dots Row */}
                <div className="flex gap-0.5 justify-center w-full min-h-[4px]">
                  {stats.pendingTasks.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />
                  )}
                  {stats.completedTasks.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-blue-500'}`} />
                  )}
                  {stats.completedHabits.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/90' : 'bg-emerald-500'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Stats & Actions Panel */}
      <div className="space-y-3" id="calendar-day-details">
        <div className="px-1 flex justify-between items-center">
          <h4 className="font-display font-semibold text-slate-800 dark:text-white text-sm">
            {getReadableSelectedDate()}
          </h4>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Daily Digest
          </span>
        </div>

        {/* Dynamic Activity List */}
        {!selectedDayStats.hasActivity ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No tasks or active habits scheduled for this day.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Add a new task or habit, or select a different date.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Scheduled Tasks Category */}
            {(selectedDayStats.pendingTasks.length > 0 || selectedDayStats.completedTasks.length > 0) && (
              <div className="minimal-card p-4 space-y-3">
                <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Tasks ({selectedDayStats.completedTasks.length + selectedDayStats.pendingTasks.length})
                </h5>

                <div className="space-y-2">
                  {/* Pending */}
                  {selectedDayStats.pendingTasks.map((t) => (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between p-2.5 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-950/20 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          id={`btn-cal-task-${t.id}`}
                          onClick={() => onToggleTaskComplete(t.id)}
                          className="w-5 h-5 rounded border border-slate-300 hover:border-slate-400 flex items-center justify-center shrink-0 cursor-pointer bg-white dark:bg-slate-800"
                        >
                          <span className="w-2.5 h-2.5 rounded-sm bg-transparent" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatTimeStr(t.dueTime)} • {t.category}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100/65 text-rose-800 uppercase shrink-0">Pending</span>
                    </div>
                  ))}

                  {/* Completed */}
                  {selectedDayStats.completedTasks.map((t) => (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-100 dark:border-slate-800/60 opacity-70"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          id={`btn-cal-task-done-${t.id}`}
                          onClick={() => onToggleTaskComplete(t.id)}
                          className="w-5 h-5 rounded bg-blue-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-through truncate">{t.name}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase shrink-0">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Habits Category */}
            {(selectedDayStats.completedHabits.length > 0 || selectedDayStats.missedHabits.length > 0) && (
              <div className="minimal-card p-4 space-y-3">
                <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Habits ({selectedDayStats.completedHabits.length + selectedDayStats.missedHabits.length})
                </h5>

                <div className="space-y-2">
                  {/* Completed Habits */}
                  {selectedDayStats.completedHabits.map((h) => (
                    <div 
                      key={h.id} 
                      className="flex items-center justify-between p-2.5 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950/20 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          id={`btn-cal-habit-${h.id}`}
                          onClick={() => onToggleHabitToday(h.id)}
                          className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{h.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{h.streak}d streak</span>
                      </div>
                    </div>
                  ))}

                  {/* Missed/Not Done Habits */}
                  {selectedDayStats.missedHabits.map((h) => {
                    const isSelectToday = selectedDateStr === formatDate(new Date());
                    return (
                      <div 
                        key={h.id} 
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-150 dark:border-slate-800/80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            id={`btn-cal-habit-miss-${h.id}`}
                            onClick={() => onToggleHabitToday(h.id)}
                            className="w-5 h-5 rounded-md border border-slate-300 hover:border-slate-400 flex items-center justify-center shrink-0 cursor-pointer bg-white dark:bg-slate-800"
                          >
                            <span className="w-2.5 h-2.5 rounded-sm bg-transparent" />
                          </button>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{h.name}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 uppercase shrink-0">
                          {isSelectToday ? 'Scheduled' : 'Missed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
