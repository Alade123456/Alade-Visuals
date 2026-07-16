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
  onEdit: (task: Task, updatedName?: string) => void;
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
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
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
  isSelected = false,
  onToggleSelect,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const todayStr = formatDate(new Date());

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(task.name);

  useEffect(() => {
    setEditedName(task.name);
  }, [task.name]);

  const handleSaveInlineName = () => {
    if (editedName.trim() && editedName.trim() !== task.name) {
      onEdit(task, editedName.trim());
    }
    setIsEditingName(false);
  };
  
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
    <div className="relative overflow-hidden rounded-[24px]">
      {/* Swipe background indicator - visible when swiped left */}
      <div className="absolute inset-0 bg-gradient-to-l from-rose-500 to-red-600 flex items-center justify-end pr-6 text-white rounded-[24px] pointer-events-none z-0">
        <div className="flex flex-col items-center justify-center gap-1">
          <Trash2 className="w-5 h-5 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
        </div>
      </div>

      <motion.div
        layout
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0.05 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100) {
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
        className={`group relative minimal-card border-l-4 transition-all overflow-hidden z-10 cursor-grab active:cursor-grabbing ${
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
        {/* Responsive layout: row on desktop, actions in a beautiful footer row on mobile */}
        <div className="flex flex-col w-full">
          <div className="p-3 px-4 flex items-center justify-between gap-3 w-full">
            {/* Left block: Checkbox and beautifully-aligned Category Icon */}
            <div className="flex items-center gap-2.5 shrink-0">
              {onToggleSelect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(task.id);
                  }}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800'
                  }`}
                  title="Select task for batch action"
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              )}

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

            {/* Middle block: Title, Category Badge, and Date Badge on a clean responsive layout */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4" onClick={() => !isEditingName && setIsExpanded(!isExpanded)}>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveInlineName();
                          } else if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setEditedName(task.name);
                          }
                        }}
                        autoFocus
                        className="flex-1 bg-white dark:bg-slate-800 border border-indigo-350 dark:border-indigo-700 rounded-lg px-2 py-1 text-sm font-bold text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-0"
                      />
                      <button
                        onClick={handleSaveInlineName}
                        className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setEditedName(task.name);
                        }}
                        className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 text-xs font-bold cursor-pointer"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0 w-full group/title">
                      <h4 
                        id={`task-title-${task.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className={`text-sm font-bold tracking-tight cursor-pointer select-none transition-colors break-words whitespace-normal leading-snug flex-1 min-w-0 ${
                          task.completed 
                            ? 'text-slate-400 line-through dark:text-slate-500' 
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {task.name}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingName(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all opacity-0 group-hover/title:opacity-100 focus:opacity-100 shrink-0 self-center cursor-pointer"
                        title="Inline Edit Name"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {task.pinned && (
                        <Pin className="w-3 h-3 text-blue-500 fill-blue-500 transform rotate-45 shrink-0 mt-1" />
                      )}
                    </div>
                  )}
                </div>
                  
                {/* Badges inline */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {isOverdue && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded shrink-0">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Overdue
                    </span>
                  )}
                  {progress && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded shrink-0">
                      <ListTodo className="w-2.5 h-2.5" />
                      {progress.completed}/{progress.total}
                    </span>
                  )}
                </div>

                {/* Subtle subtask progress bar */}
                {progress && (
                  <div className="mt-2 w-full max-w-[180px]" onClick={(e) => e.stopPropagation()}>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-1.5 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress.pct === 100 
                            ? 'bg-emerald-500' 
                            : 'bg-blue-500'
                        }`} 
                        style={{ width: `${progress.pct}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1 tracking-wider uppercase">
                      <span>Progress</span>
                      <span>{progress.pct}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges container: Clock and Priority */}
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto mt-0.5 sm:mt-0">
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

            {/* Desktop Action Buttons: Hidden on mobile, visible on hover on desktop */}
            <div className="hidden sm:flex items-center justify-end gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
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
          
          {/* Mobile Action Bar: Only visible on mobile, beautifully placed down below */}
          <div className="flex sm:hidden items-center justify-between px-4 pb-3 pt-1 border-t border-transparent group-hover:border-slate-50 dark:group-hover:border-slate-800/50">
            <div className="flex items-center gap-2">
              {task.priority !== 'Low' && (
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md tracking-wider ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); toggleTimer(); setIsExpanded(true); }}
                title="Focus Timer"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${timerMode !== 'idle' ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Timer className="w-4 h-4" />
              </button>
              <button
                id={`btn-pin-task-${task.id}-mobile`}
                onClick={(e) => { e.stopPropagation(); onTogglePin(task.id); }}
                title={task.pinned ? 'Unpin' : 'Pin to top'}
                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${task.pinned ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                id={`btn-edit-task-${task.id}-mobile`}
                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                title="Edit Task"
                className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                id={`btn-delete-task-${task.id}-mobile`}
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                title="Delete Task"
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                id={`btn-expand-task-${task.id}-mobile`}
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>



        {/* EXPANDED VIEW: Details, Subtasks checklist, and notes */}
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-1 pt-3.5 pb-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4 pl-14 pr-5 text-slate-700 dark:text-slate-300"
          >
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

            {/* Pomodoro Timer Module (Moved to bottom) */}
            <div className={`mt-4 p-4 rounded-2xl border transition-colors ${timerMode !== 'idle' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50' : 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-800'}`}>
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
  </div>
);
}
