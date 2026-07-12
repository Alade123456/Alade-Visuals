import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Check, Clock, Flag, Pin, Trash2, Edit2, 
  ChevronDown, ChevronUp, ListTodo, Paperclip, AlertCircle,
  Play, Pause, Square, Coffee, Timer,
  Briefcase, Heart, BookOpen, Coins, ShoppingCart, User,
  Bookmark, Star, Target, Home, Sparkles, Activity, DollarSign
} from 'lucide-react';
import { Task, Priority, Category } from '../types';
import { formatTimeStr, formatDate } from '../utils';

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onToggleComplete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  categories?: Category[];
  activeFocusTaskId?: string | null;
  activeFocusTimeLeft?: number;
  activeFocusTimerMode?: 'idle' | 'work' | 'break';
  activeFocusTimerStatus?: 'paused' | 'running';
  onStartFocus?: (taskId: string) => void;
  onPauseFocus?: () => void;
  onResumeFocus?: () => void;
  onStopFocus?: () => void;
}

const categoryConfigs: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  Work: { icon: Briefcase, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  Health: { icon: Heart, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  Learning: { icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  Finance: { icon: Coins, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  Shopping: { icon: ShoppingCart, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  Personal: { icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
};

const iconMap: Record<string, React.ComponentType<any>> = {
  Briefcase,
  Heart,
  BookOpen,
  Coins,
  DollarSign,
  ShoppingCart,
  User,
  Bookmark,
  Star,
  Target,
  Home,
  Sparkles,
  Activity,
};

const getCategoryStyles = (catColor: string) => {
  const colorMap: Record<string, { bg: string; color: string }> = {
    'bg-blue-500': { bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-600 dark:text-blue-400' },
    'bg-indigo-500': { bg: 'bg-indigo-50 dark:bg-indigo-950/30', color: 'text-indigo-600 dark:text-indigo-400' },
    'bg-violet-500': { bg: 'bg-violet-50 dark:bg-violet-950/30', color: 'text-violet-600 dark:text-violet-400' },
    'bg-emerald-500': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400' },
    'bg-amber-500': { bg: 'bg-amber-50 dark:bg-amber-950/20', color: 'text-amber-600 dark:text-amber-400' },
    'bg-rose-500': { bg: 'bg-rose-50 dark:bg-rose-950/30', color: 'text-rose-600 dark:text-rose-400' },
    'bg-teal-500': { bg: 'bg-teal-50 dark:bg-teal-950/30', color: 'text-teal-600 dark:text-teal-400' },
    'bg-slate-500': { bg: 'bg-slate-50 dark:bg-slate-800/40', color: 'text-slate-600 dark:text-slate-400' },
  };
  return colorMap[catColor] || { bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-600 dark:text-blue-400' };
};

const getCategoryConfig = (category: string) => {
  return categoryConfigs[category] || { icon: ListTodo, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/40' };
};

export default function TaskCard({
  task,
  onToggleComplete,
  onTogglePin,
  onDelete,
  onEdit,
  onToggleSubtask,
  categories,
  activeFocusTaskId,
  activeFocusTimeLeft,
  activeFocusTimerMode,
  activeFocusTimerStatus,
  onStartFocus,
  onPauseFocus,
  onResumeFocus,
  onStopFocus,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const todayStr = formatDate(new Date());
  
  // Use either the shared active focus timer state or fallback to idle
  const isCurrentlyFocused = activeFocusTaskId === task.id;
  const timerMode = isCurrentlyFocused ? (activeFocusTimerMode || 'idle') : 'idle';
  const timerStatus = isCurrentlyFocused ? (activeFocusTimerStatus || 'paused') : 'paused';
  const timeLeft = isCurrentlyFocused ? (activeFocusTimeLeft !== undefined ? activeFocusTimeLeft : 25 * 60) : 25 * 60;

  const toggleTimer = () => {
    if (isCurrentlyFocused) {
      if (timerStatus === 'running') {
        onPauseFocus?.();
      } else {
        onResumeFocus?.();
      }
    } else {
      onStartFocus?.(task.id);
    }
  };

  const stopTimer = () => {
    onStopFocus?.();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isOverdue = !task.completed && task.dueDate < todayStr;
  const isToday = task.dueDate === todayStr;

  const priorityColors = {
    Low: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/30',
    Medium: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]/30',
    High: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]/30',
    Urgent: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]/40',
  };

  const getSubtasksProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter(s => s.completed).length;
    const total = task.subtasks.length;
    const pct = Math.round((completed / total) * 100);
    return { completed, total, pct };
  };

  const progress = getSubtasksProgress();
  
  // Dynamic category styling and icon resolution
  const catObj = categories?.find(c => c.name === task.category);
  const CategoryIcon = catObj && iconMap[catObj.icon] 
    ? iconMap[catObj.icon] 
    : (categoryConfigs[task.category]?.icon || ListTodo);
  
  const categoryConfig = catObj 
    ? getCategoryStyles(catObj.color) 
    : (categoryConfigs[task.category] || { bg: 'bg-slate-100 dark:bg-slate-800/40', color: 'text-slate-600 dark:text-slate-400' });

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.2, right: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.x < -80) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(60);
          }
          onDelete(task.id);
        }
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={task.completed ? { opacity: 0, x: 140, scale: 0.95 } : { opacity: 0, x: -100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 240, damping: 25 }}
      id={`task-card-${task.id}`}
      className={`group relative minimal-card border-l-4 transition-all overflow-hidden ${
        task.completed 
          ? 'bg-slate-50/50 shadow-none border-green-500 opacity-80 dark:bg-slate-800/30' 
          : timerMode !== 'idle'
            ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/5'
            : isOverdue 
              ? 'border-red-500' 
              : task.priority === 'High' || task.priority === 'Urgent'
                ? 'border-red-500'
                : task.priority === 'Medium'
                  ? 'border-yellow-400'
                  : 'border-blue-500'
      }`}
    >
      <div className="w-full">
        {/* Compact single horizontal row */}
        <div className="p-3 px-4 flex items-center justify-between gap-3 w-full">
          {/* Left block: Checkbox and beautifully-aligned Category Icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id={`btn-toggle-task-${task.id}`}
              onClick={() => onToggleComplete(task.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
                task.completed
                  ? 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800'
              }`}
            >
              {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            <div 
              className={`p-1.5 rounded-lg shrink-0 ${categoryConfig.bg} ${categoryConfig.color} flex items-center justify-center`}
              title={task.category}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Middle block: Title, Category Badge, and Date Badge on a clean straight line */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h4 
                id={`task-title-${task.id}`}
                className={`text-sm font-bold tracking-tight truncate cursor-pointer select-none transition-colors ${
                  task.completed 
                    ? 'text-slate-400 line-through dark:text-slate-500' 
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {task.name}
              </h4>
              
              {/* Badges inline */}
              <div className="flex items-center gap-1.5 shrink-0">
                {task.pinned && (
                  <Pin className="w-3 h-3 text-blue-500 fill-blue-500 transform rotate-45" />
                )}
                {isOverdue && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Overdue
                  </span>
                )}
                {progress && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                    <ListTodo className="w-2.5 h-2.5" />
                    {progress.completed}/{progress.total}
                  </span>
                )}
              </div>
            </div>

            {/* Badges container on the right side of the straight line */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1 ${
                isOverdue 
                  ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                  : 'bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400'
              }`}>
                <Clock className="w-2.5 h-2.5" />
                {task.completed ? 'Done' : formatTimeStr(task.dueTime)}
              </span>

              {task.priority !== 'Low' && (
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md tracking-wider ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              )}
            </div>
          </div>

          {/* Right Block: Action buttons (Compact and styled beautifully) */}
          <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); toggleTimer(); setIsExpanded(true); }}
              title="Focus Timer"
              className={`p-1 rounded-lg transition-colors cursor-pointer ${timerMode !== 'idle' ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-pin-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); onTogglePin(task.id); }}
              title={task.pinned ? 'Unpin' : 'Pin to top'}
              className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${task.pinned ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-edit-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              title="Edit Task"
              className="p-1 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-delete-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              title="Delete Task"
              className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-expand-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mini Bottom Progress Line (Subtle 1px visual cue for completed subtasks) */}
        {!isExpanded && progress && (
          <div className="w-full bg-slate-100 dark:bg-slate-800/40 h-[2px] overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300" 
              style={{ width: `${progress.pct}%` }} 
            />
          </div>
        )}

        {/* EXPANDED VIEW: Details, Subtasks checklist, and notes */}
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-1 pt-3.5 pb-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4 pl-14 pr-5 text-slate-700 dark:text-slate-300"
          >
            {/* Pomodoro Timer Module */}
            <div className={`p-4 rounded-2xl border transition-colors ${timerMode !== 'idle' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50' : 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 ${timerMode !== 'idle' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                  {timerMode === 'work' ? <Timer className="w-3 h-3" /> : timerMode === 'break' ? <Coffee className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                  {timerMode === 'work' ? 'Focus Session' : timerMode === 'break' ? 'Break Time' : 'Pomodoro Timer'}
                </span>
                {timerMode !== 'idle' && (
                  <button onClick={stopTimer} className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer">
                    <Square className="w-3 h-3" /> Stop
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-mono font-bold tracking-tight ${timerMode !== 'idle' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatTimer(timeLeft)}
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                  {timerMode === 'idle' ? (
                    <button 
                      onClick={toggleTimer}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Focus
                    </button>
                  ) : (
                    <button 
                      onClick={toggleTimer}
                      className={`${timerStatus === 'running' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer`}
                    >
                      {timerStatus === 'running' ? (
                        <><Pause className="w-3.5 h-3.5 fill-current" /> Pause</>
                      ) : (
                        <><Play className="w-3.5 h-3.5 fill-current" /> Resume</>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Pomodoro Progress Bar */}
              {timerMode !== 'idle' && (
                <div className="w-full bg-indigo-100 dark:bg-indigo-900/50 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerMode === 'work' ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${(timeLeft / (timerMode === 'work' ? 25 * 60 : 5 * 60)) * 100}%` }} 
                  />
                </div>
              )}
            </div>

            {/* Extended Description */}
            {task.description && (
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Description</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{task.description}</p>
              </div>
            )}

            {/* Subtasks interactive list */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="space-y-1.5 mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Subtasks Checklist</span>
                <div className="space-y-1.5">
                  {task.subtasks.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-850 p-1.5 rounded-lg transition-colors"
                    >
                      <button
                        id={`btn-subtask-${task.id}-${sub.id}`}
                        type="button"
                        onClick={() => onToggleSubtask(task.id, sub.id)}
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer ${
                          sub.completed
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span className={`text-xs ${sub.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {sub.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {task.notes && (
              <div className="space-y-0.5 bg-slate-50 dark:bg-slate-850/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> Quick Notes
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line mt-0.5">{task.notes}</p>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
              <span>Duration: {task.duration} mins</span>
              {task.completedAt && (
                <span>Completed at: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
