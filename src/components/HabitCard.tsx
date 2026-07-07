import React from 'react';
import { motion } from 'motion/react';
import { Check, Flame, Award, Pause, Play, Trash2, Copy, BarChart2 } from 'lucide-react';
import { Habit } from '../types';
import { formatDate, getOffsetDate } from '../utils';

interface HabitCardProps {
  key?: React.Key;
  habit: Habit;
  onToggleToday: (id: string) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function HabitCard({
  habit,
  onToggleToday,
  onPause,
  onDelete,
  onDuplicate
}: HabitCardProps) {
  const todayStr = formatDate(new Date());
  const isCompletedToday = !!habit.history[todayStr];

  // Calculate past 7 days history
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = getOffsetDate(-i);
      const dayName = new Date(Date.now() - i * 24 * 3600 * 1000)
        .toLocaleDateString('en-US', { weekday: 'narrow' });
      days.push({
        dateStr,
        dayName,
        completed: !!habit.history[dateStr],
        isToday: i === 0
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  // Calculate stats
  const totalLogged = Object.keys(habit.history).length;
  const totalCompleted = Object.values(habit.history).filter(Boolean).length;
  const completionRate = totalLogged > 0 ? Math.round((totalCompleted / totalLogged) * 100) : 0;

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return 'text-yellow-400 fill-yellow-400 drop-shadow-sm'; // Gold
    if (streak >= 5) return 'text-slate-300 fill-slate-300 drop-shadow-sm'; // Silver
    if (streak > 0) return 'text-amber-600 fill-amber-600 drop-shadow-sm'; // Bronze
    return 'text-transparent';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      id={`habit-card-${habit.id}`}
      className={`minimal-card p-4 transition-all ${
        habit.paused 
          ? 'opacity-60 grayscale' 
          : 'hover:-translate-y-1'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Habit Main Info */}
        <div className="flex-1 min-w-0 flex items-center space-x-3">
          <div 
            className="p-2 rounded-lg" 
            style={{ backgroundColor: `${habit.colorLabel}20`, color: habit.colorLabel }} 
          >
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 
              id={`habit-title-${habit.id}`}
              className={`text-base font-bold tracking-tight text-gray-800 dark:text-slate-100 line-clamp-1 ${habit.paused ? 'line-through text-gray-400' : ''}`}
            >
              {habit.name}
            </h4>
            <div className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1.5">
              <strong id={`habit-streak-${habit.id}`} className="flex items-center gap-0.5">
                {habit.streak > 0 && <Flame className={`w-3.5 h-3.5 ${getStreakColor(habit.streak)}`} />}
                {habit.streak} day streak
              </strong> 
              <span>•</span> 
              <span>Best: {habit.bestStreak}d</span>
            </div>
          </div>
        </div>

        {/* Check Action Button */}
        <button
          id={`btn-complete-habit-${habit.id}`}
          onClick={() => !habit.paused && onToggleToday(habit.id)}
          disabled={habit.paused}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isCompletedToday 
              ? 'border-2 border-green-400 text-green-500 bg-green-50' 
              : 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 cursor-pointer'
          } ${habit.paused ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isCompletedToday ? (
            <Check className="w-5 h-5 stroke-[3]" />
          ) : (
            <span className="text-[10px] font-bold">GO</span>
          )}
        </button>
      </div>

      {/* Mini Progress Graph / 7-Day Spark Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Weekly Progress</span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {totalCompleted} of {totalLogged} logged days
          </span>
        </div>

        <div className="flex justify-between gap-1.5 bg-slate-50 dark:bg-slate-850/50 p-2 rounded-xl">
          {last7Days.map((day, idx) => (
            <div 
              key={idx} 
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className={`text-[9px] font-semibold ${day.isToday ? 'text-blue-500 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                {day.dayName}
              </span>
              <div
                id={`spark-circle-${habit.id}-${idx}`}
                title={day.dateStr + (day.completed ? ' (Completed)' : ' (Pending)')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                  day.completed
                    ? 'text-white'
                    : 'border border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
                style={{
                  backgroundColor: day.completed ? habit.colorLabel : 'transparent',
                  boxShadow: day.completed ? `${habit.colorLabel}20 0px 4px 6px` : 'none'
                }}
              >
                {day.completed ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span className="text-[8px] opacity-70">{day.isToday ? '•' : ''}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Settings Row */}
      <div className="flex justify-between items-center mt-3 pt-2 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Freq: {habit.frequency}</span>
        
        <div className="flex items-center gap-2">
          {/* Pause Toggle */}
          <button
            id={`btn-pause-habit-${habit.id}`}
            onClick={() => onPause(habit.id)}
            title={habit.paused ? 'Resume tracking' : 'Pause tracking'}
            className="flex items-center gap-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {habit.paused ? (
              <>
                <Play className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500 font-semibold">Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" /> <span>Pause</span>
              </>
            )}
          </button>

          <span className="text-slate-200 dark:text-slate-800">|</span>

          {/* Duplicate */}
          <button
            id={`btn-dup-habit-${habit.id}`}
            onClick={() => onDuplicate(habit.id)}
            title="Duplicate Habit"
            className="text-slate-400 hover:text-blue-500"
          >
            <Copy className="w-3 h-3" />
          </button>

          <span className="text-slate-200 dark:text-slate-800">|</span>

          {/* Delete */}
          <button
            id={`btn-del-habit-${habit.id}`}
            onClick={() => onDelete(habit.id)}
            title="Delete Habit"
            className="text-slate-400 hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
