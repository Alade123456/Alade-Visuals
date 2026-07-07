import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Check, Clock, Flag, Pin, Trash2, Edit2, 
  ChevronDown, ChevronUp, ListTodo, Paperclip, AlertCircle,
  Play, Pause, Square, Coffee, Timer
} from 'lucide-react';
import { Task, Priority } from '../types';
import { formatTimeStr, formatDate } from '../utils';

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onToggleComplete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onTogglePin,
  onDelete,
  onEdit,
  onToggleSubtask,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const todayStr = formatDate(new Date());
  
  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<'idle' | 'work' | 'break'>('idle');
  const [timerStatus, setTimerStatus] = useState<'paused' | 'running'>('paused');
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    let interval: any;
    if (timerStatus === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Auto-switch mode on complete
      if (timerMode === 'work') {
        setTimerMode('break');
        setTimeLeft(5 * 60); // 5 min break
        setTimerStatus('paused');
      } else if (timerMode === 'break') {
        setTimerMode('work');
        setTimeLeft(25 * 60);
        setTimerStatus('paused');
      }
    }
    return () => clearInterval(interval);
  }, [timerStatus, timeLeft, timerMode]);

  const toggleTimer = () => {
    if (timerMode === 'idle') {
      setTimerMode('work');
      setTimeLeft(25 * 60);
      setTimerStatus('running');
    } else {
      setTimerStatus(prev => prev === 'running' ? 'paused' : 'running');
    }
  };

  const stopTimer = () => {
    setTimerMode('idle');
    setTimerStatus('paused');
    setTimeLeft(25 * 60);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isOverdue = !task.completed && task.dueDate < todayStr;
  const isToday = task.dueDate === todayStr;

  const priorityColors = {
    Low: 'bg-[#ECFDF5] text-[#059669]',
    Medium: 'bg-[#FEF3C7] text-[#D97706]',
    High: 'bg-[#FEE2E2] text-[#DC2626]',
    Urgent: 'bg-[#FEE2E2] text-[#DC2626]',
  };

  const getSubtasksProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const completed = task.subtasks.filter(s => s.completed).length;
    const total = task.subtasks.length;
    const pct = Math.round((completed / total) * 100);
    return { completed, total, pct };
  };

  const progress = getSubtasksProgress();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={task.completed ? { opacity: 0, x: 140, scale: 0.95 } : { opacity: 0, x: -100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 240, damping: 25 }}
      id={`task-card-${task.id}`}
      className={`group relative minimal-card flex items-start space-x-4 border-l-4 transition-all ${
        task.completed 
          ? 'bg-gray-50 shadow-none border-green-500 opacity-80 dark:bg-slate-800/50' 
          : timerMode !== 'idle'
            ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10'
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
        <div className="p-5 flex items-start gap-4 w-full">
          {/* Checkbox */}
          <button
            id={`btn-toggle-task-${task.id}`}
            onClick={() => onToggleComplete(task.id)}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
              task.completed
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
              <h4 
                id={`task-title-${task.id}`}
                className={`text-base font-bold tracking-tight cursor-pointer ${
                  task.completed 
                    ? 'text-gray-400 line-through dark:text-slate-500' 
                    : 'text-gray-800 dark:text-slate-100'
                }`}
              >
                {task.name}
              </h4>
              
              <div className="flex items-center gap-2">
                {task.priority !== 'Low' && (
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                )}
              </div>
            </div>
          
          <p className="text-xs text-gray-400 mt-1 font-medium flex items-center gap-1.5 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {task.completed ? 'Completed' : `Due ${formatTimeStr(task.dueTime)}`} • {task.category}
            {isOverdue && <span className="text-red-500 flex items-center"><AlertCircle className="w-3 h-3 ml-1 mr-0.5" /> Overdue</span>}
            {task.pinned && <Pin className="w-3.5 h-3.5 text-blue-500 fill-blue-500 transform rotate-45 ml-1" />}
          </p>

          {/* Description Preview (if not expanded) */}
          {task.description && !isExpanded && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
              {task.description}
            </p>
          )}

          {/* Pomodoro Timer Inline Display (when running but not expanded) */}
          {!isExpanded && timerMode !== 'idle' && (
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold">
              {timerStatus === 'running' ? <Timer className="w-3.5 h-3.5 animate-pulse" /> : <Pause className="w-3.5 h-3.5" />}
              {formatTimer(timeLeft)} - {timerMode === 'work' ? 'Focusing' : 'Break'}
            </div>
          )}

          {/* Badges and details row */}
          <div className="flex flex-wrap items-center gap-2 mt-2" onClick={() => setIsExpanded(!isExpanded)}>
            {/* Subtasks Count */}
            {progress && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-850 px-1.5 py-0.5 rounded">
                <ListTodo className="w-3 h-3 text-slate-400" />
                {progress.completed}/{progress.total} ({progress.pct}%)
              </span>
            )}
          </div>

            {/* Subtask Mini Progress Bar */}
            {progress && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progress.pct}%` }} 
                />
              </div>
            )}
          </div>

          {/* Quick Action Side Buttons (Always visible on desktop hover, neat toggle on tap) */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); toggleTimer(); setIsExpanded(true); }}
              title="Focus Timer"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${timerMode !== 'idle' ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-pin-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); onTogglePin(task.id); }}
              title={task.pinned ? 'Unpin' : 'Pin to top'}
              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${task.pinned ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-edit-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              title="Edit Task"
              className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-delete-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              title="Delete Task"
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-expand-task-${task.id}`}
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EXPANDED VIEW: Details, Subtasks checklist, and notes */}
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-1 pt-3 pb-4 border-t border-slate-100 dark:border-slate-800/60 space-y-4 pl-[4.5rem] pr-5 text-slate-700 dark:text-slate-300"
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
