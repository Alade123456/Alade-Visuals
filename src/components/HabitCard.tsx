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

  // Calculate past 7 days history with streak progression
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = getOffsetDate(-i);
      const dayName = new Date(Date.now() - i * 24 * 3600 * 1000)
        .toLocaleDateString('en-US', { weekday: 'narrow' });
      
      // Calculate streak on this historical date
      let streakOnDate = 0;
      let checkDate = new Date(Date.now() - i * 24 * 3600 * 1000);
      while (true) {
        const dateKey = formatDate(checkDate);
        if (habit.history[dateKey]) {
          streakOnDate++;
          // Move to previous day
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      days.push({
        dateStr,
        dayName,
        completed: !!habit.history[dateStr],
        streak: streakOnDate,
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

  // Streak Progression Spline Calculations
  const streaks = last7Days.map(d => d.streak);
  const maxStreakInWindow = Math.max(...streaks);
  const chartMax = Math.max(maxStreakInWindow, 1);

  const width = 280;
  const height = 52;
  const paddingX = 14;
  const points = last7Days.map((item, index) => {
    const x = paddingX + index * 42;
    const y = 42 - (item.streak / chartMax) * 32;
    return { x, y, ...item };
  });

  const getCurvePath = (pts: { x: number, y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + 14;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 28;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const curvePath = getCurvePath(points);
  const areaPath = curvePath 
    ? `${curvePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` 
    : '';

  const gradientId = `streak-grad-${habit.id}`;

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

      {/* Weekly Mini-Chart / Streak Momentum Progression */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Streak Momentum</span>
          </div>
          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
            Peak: {maxStreakInWindow}d
          </span>
        </div>

        {/* SVG Sparkline Container */}
        <div className="relative bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-2 rounded-2xl overflow-hidden mt-1">
          
          <svg className="w-full overflow-visible" height="52" viewBox="0 0 280 52">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={habit.colorLabel} stopOpacity="0.25" />
                <stop offset="100%" stopColor={habit.colorLabel} stopOpacity="0.00" />
              </linearGradient>
            </defs>
            
            {/* Horizontal guideline */}
            <line 
              x1="5" 
              y1="42" 
              x2="275" 
              y2="42" 
              className="stroke-slate-200 dark:stroke-slate-800/60" 
              strokeWidth="1" 
              strokeDasharray="3 3" 
            />
            
            {/* Area under the spline */}
            {areaPath && (
              <path 
                d={areaPath} 
                fill={`url(#${gradientId})`} 
                className="transition-all duration-500"
              />
            )}
            
            {/* Spline line stroke */}
            {curvePath && (
              <path 
                d={curvePath} 
                fill="none" 
                stroke={habit.colorLabel} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                className="transition-all duration-500"
              />
            )}
            
            {/* Interactive/indicator nodes on the line */}
            {points.map((pt, idx) => (
              <g key={idx}>
                {/* Outer pulsing ring for today's active point */}
                {pt.isToday && pt.completed && (
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="6.5" 
                    fill="none" 
                    stroke={habit.colorLabel} 
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}
                {/* Node circle */}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={pt.completed ? "4.5" : "3"} 
                  fill={pt.completed ? habit.colorLabel : "transparent"} 
                  stroke={pt.completed ? "none" : habit.colorLabel} 
                  strokeWidth={pt.completed ? "0" : "1.5"}
                  className="transition-all duration-300"
                />
                
                {/* Small indicator text showing the streak number if greater than 0 */}
                {pt.completed && pt.streak > 0 && (
                  <text 
                    x={pt.x} 
                    y={pt.y - 8} 
                    textAnchor="middle" 
                    className="text-[9px] font-black font-mono" 
                    fill={habit.colorLabel}
                  >
                    {pt.streak}
                  </text>
                )}
              </g>
            ))}
          </svg>
          
          {/* Weekday indicators aligned perfectly with chart nodes */}
          <div className="flex justify-between px-1.5 mt-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 select-none">
            {last7Days.map((day, idx) => (
              <div 
                key={idx} 
                className={`w-7 text-center flex flex-col items-center gap-0.5 ${
                  day.isToday 
                    ? 'text-blue-500 dark:text-blue-400 font-extrabold' 
                    : day.completed 
                      ? 'text-slate-600 dark:text-slate-300' 
                      : 'text-slate-400/80 dark:text-slate-600'
                }`}
              >
                <span>{day.dayName}</span>
                {/* Tiny status indicator */}
                <span 
                  className={`h-1 w-1 rounded-full ${
                    day.completed 
                      ? 'bg-emerald-500' 
                      : 'bg-transparent'
                  }`}
                  style={{ backgroundColor: day.completed ? habit.colorLabel : undefined }}
                />
              </div>
            ))}
          </div>

        </div>
        
        {/* Total stats sub-indicator */}
        <div className="flex justify-between items-center mt-1.5 px-1">
          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
            {totalCompleted} of {totalLogged} logged days
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            Consistency: {completionRate}%
          </span>
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
