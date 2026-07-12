import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Check, Trash2, Calendar, Clock, Flag, 
  Layers, Bookmark, Repeat, AlertCircle, Briefcase, 
  User, Activity, BookOpen, DollarSign, ShoppingCart, FolderPlus 
} from 'lucide-react';
import { Task, Habit, Category, Priority, RepeatInterval } from '../types';
import { DEFAULT_CATEGORIES, formatDate } from '../utils';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Omit<Task, 'id' | 'completed' | 'order'>) => void;
  onSaveHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'history' | 'createdAt'>) => void;
  categories: Category[];
  onCreateCategory: (cat: Category) => void;
  initialStage?: 'select' | 'task' | 'habit';
}

export default function TaskCreationModal({
  isOpen,
  onClose,
  onSaveTask,
  onSaveHabit,
  categories,
  onCreateCategory,
  initialStage = 'select'
}: TaskCreationModalProps) {
  const [stage, setStage] = useState<'select' | 'task' | 'habit'>(initialStage);

  // Sync stage on open
  useEffect(() => {
    if (isOpen) {
      setStage(initialStage);
    }
  }, [isOpen, initialStage]);

  // Task form states
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState(() => categories[0]?.name || 'Personal');

  // Synchronize category selection if categories array changes
  useEffect(() => {
    if (categories && categories.length > 0) {
      const exists = categories.some(c => c.name === taskCategory);
      if (!exists) {
        setTaskCategory(categories[0].name);
      }
    }
  }, [categories, taskCategory]);
  const [taskPriority, setTaskPriority] = useState<Priority>('Medium');
  const [taskDueDate, setTaskDueDate] = useState(formatDate(new Date()));
  const [taskDueTime, setTaskDueTime] = useState('12:00');
  const [taskReminder, setTaskReminder] = useState(true);
  const [taskRepeat, setTaskRepeat] = useState<RepeatInterval>('None');
  const [taskColor, setTaskColor] = useState('#3b82f6');
  const [taskDuration, setTaskDuration] = useState(30);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  // Habit form states
  const [habitName, setHabitName] = useState('');
  const [habitFreq, setHabitFreq] = useState<'Daily' | 'Weekly'>('Daily');
  const [habitColor, setHabitColor] = useState('#10b981');

  // Custom Category State
  const [showAddCustomCategory, setShowAddCustomCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-blue-500');
  const [newCatIcon, setNewCatIcon] = useState('Bookmark');

  const handleAddTaskSubtask = () => {
    if (newSubtaskName.trim()) {
      setSubtasks([...subtasks, newSubtaskName.trim()]);
      setNewSubtaskName('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleCreateCustomCategory = () => {
    if (newCatName.trim()) {
      const newCat: Category = {
        id: `cat-custom-${Date.now()}`,
        name: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon,
        isCustom: true
      };
      onCreateCategory(newCat);
      setTaskCategory(newCat.name);
      setNewCatName('');
      setShowAddCustomCategory(false);
    }
  };

  const resetForms = () => {
    setStage(initialStage);
    setTaskName('');
    setTaskDesc('');
    setTaskCategory(categories[0]?.name || 'Personal');
    setTaskPriority('Medium');
    setTaskDueDate(formatDate(new Date()));
    setTaskDueTime('12:00');
    setTaskReminder(true);
    setTaskRepeat('None');
    setTaskColor('#3b82f6');
    setTaskDuration(30);
    setSubtasks([]);
    setNewSubtaskName('');
    setTaskNotes('');

    setHabitName('');
    setHabitFreq('Daily');
    setHabitColor('#10b981');
    setShowAddCustomCategory(false);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    onSaveTask({
      name: taskName.trim(),
      description: taskDesc.trim(),
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate,
      dueTime: taskDueTime,
      reminder: taskReminder,
      repeat: taskRepeat,
      colorLabel: taskColor,
      duration: taskDuration,
      subtasks: subtasks.map(name => ({ id: `sub-${Date.now()}-${Math.random()}`, name, completed: false })),
      notes: taskNotes.trim(),
      pinned: false
    });

    resetForms();
    onClose();
  };

  const handleSubmitHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    onSaveHabit({
      name: habitName.trim(),
      frequency: habitFreq,
      paused: false,
      colorLabel: habitColor
    });

    resetForms();
    onClose();
  };

  const colorPresets = [
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // rose
    '#14b8a6', // teal
    '#6b7280', // slate
  ];

  const tailwindColorPresets = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-slate-500',
  ];

  const renderIcon = (name: string, className: string = "w-5 h-5") => {
    switch (name) {
      case 'Briefcase': return <Briefcase className={className} />;
      case 'User': return <User className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'DollarSign': return <DollarSign className={className} />;
      case 'ShoppingCart': return <ShoppingCart className={className} />;
      default: return <Bookmark className={className} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => { resetForms(); onClose(); }}
            id="modal-backdrop"
            className="fixed inset-0 bg-black z-50 pointer-events-auto"
          />

          {/* Bottom Sheet Modal Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            id="creation-bottom-sheet"
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-50 max-h-[92vh] overflow-y-auto no-scrollbar pb-8 border-t border-slate-100 dark:border-slate-800"
          >
            {/* Header Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3" />

            <div className="px-6 flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-white">
                {stage === 'select' && 'Create New'}
                {stage === 'task' && 'Create New Task'}
                {stage === 'habit' && 'Create New Habit'}
              </h3>
              <button 
                id="btn-close-modal"
                onClick={() => { resetForms(); onClose(); }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STAGE 1: Selection Sheet */}
            {stage === 'select' && (
              <div className="px-6 space-y-4 py-2" id="selection-stage">
                <button
                  id="btn-select-task"
                  onClick={() => setStage('task')}
                  className="w-full flex items-center p-4 rounded-[24px] bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border border-blue-100/50 dark:border-blue-900/30 transition-all text-left group"
                >
                  <div className="p-3 bg-blue-500 text-white rounded-xl mr-4 shadow-sm">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      New Task
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Create a one-time task to complete with checklists and subtasks.
                    </p>
                  </div>
                </button>

                <button
                  id="btn-select-habit"
                  onClick={() => setStage('habit')}
                  className="w-full flex items-center p-4 rounded-[24px] bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30 transition-all text-left group"
                >
                  <div className="p-3 bg-emerald-500 text-white rounded-xl mr-4 shadow-sm">
                    <Repeat className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      New Habit
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Create a recurring habit to build consistency and track daily streaks.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* STAGE 2: Task Form */}
            {stage === 'task' && (
              <form onSubmit={handleSubmitTask} className="px-6 space-y-5" id="task-form">
                {/* Task Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Task Name *
                  </label>
                  <input
                    id="input-task-name"
                    type="text"
                    required
                    placeholder="Enter task name..."
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="input-task-desc"
                    placeholder="Describe this task..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Category & Priority Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Category
                      </label>
                      <button
                        id="btn-add-category"
                        type="button"
                        onClick={() => setShowAddCustomCategory(!showAddCustomCategory)}
                        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Custom
                      </button>
                    </div>

                    {!showAddCustomCategory ? (
                      <select
                        id="select-task-category"
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <input
                          id="input-custom-cat"
                          type="text"
                          placeholder="New Category"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <div className="flex justify-between gap-1">
                          <button
                            id="btn-save-custom-cat"
                            type="button"
                            onClick={handleCreateCustomCategory}
                            className="w-full py-1 text-[10px] font-semibold bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Add
                          </button>
                          <button
                            id="btn-cancel-custom-cat"
                            type="button"
                            onClick={() => setShowAddCustomCategory(false)}
                            className="w-full py-1 text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Priority
                    </label>
                    <select
                      id="select-task-priority"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as Priority)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Due Date & Due Time Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date
                    </label>
                    <input
                      id="input-task-duedate"
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Due Time */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Due Time
                    </label>
                    <input
                      id="input-task-duetime"
                      type="time"
                      value={taskCheckTime(taskDueTime)}
                      onChange={(e) => setTaskDueTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Duration & Repeat Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Duration (Minutes) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Est. Duration (mins)
                    </label>
                    <input
                      id="input-task-duration"
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Repeat Interval */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Repeat className="w-3.5 h-3.5 text-slate-400" /> Repeat
                    </label>
                    <select
                      id="select-task-repeat"
                      value={taskRepeat}
                      onChange={(e) => setTaskRepeat(e.target.value as RepeatInterval)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="None">Once (None)</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Subtask Builder */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Subtasks Checklist
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="input-task-subtask-name"
                      type="text"
                      placeholder="Add subtask..."
                      value={newSubtaskName}
                      onChange={(e) => setNewSubtaskName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTaskSubtask(); } }}
                      className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      id="btn-add-subtask"
                      type="button"
                      onClick={handleAddTaskSubtask}
                      className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-all font-semibold text-sm flex items-center justify-center border border-slate-200 dark:border-slate-800"
                    >
                      Add
                    </button>
                  </div>

                  {subtasks.length > 0 && (
                    <ul className="space-y-2 max-h-36 overflow-y-auto pr-1 mt-2">
                      {subtasks.map((subName, i) => (
                        <li 
                          key={i} 
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-100 dark:border-slate-850"
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">{subName}</span>
                          <button
                            id={`btn-remove-subtask-${i}`}
                            type="button"
                            onClick={() => handleRemoveSubtask(i)}
                            className="text-slate-400 hover:text-red-500 p-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Color Preset Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Color Label
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTaskColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform ${taskColor === color ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Additional Notes
                  </label>
                  <textarea
                    id="input-task-notes"
                    placeholder="Reference links, passcode, context..."
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Reminder Option */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Push Notifications</span>
                      <p className="text-[10px] text-slate-400">Receive smart reminders before due time</p>
                    </div>
                  </div>
                  <input
                    id="checkbox-task-reminder"
                    type="checkbox"
                    checked={taskReminder}
                    onChange={(e) => setTaskReminder(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-100 dark:bg-slate-800 border-slate-300 focus:ring-blue-500"
                  />
                </div>

                {/* Save Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    id="btn-back-to-select"
                    type="button"
                    onClick={() => setStage('select')}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all font-semibold text-sm text-center"
                  >
                    Back
                  </button>
                  <button
                    id="btn-save-task"
                    type="submit"
                    className="flex-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-blue-500/20 text-center"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {/* STAGE 2: Habit Form */}
            {stage === 'habit' && (
              <form onSubmit={handleSubmitHabit} className="px-6 space-y-6" id="habit-form">
                {/* Habit Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Habit Name *
                  </label>
                  <input
                    id="input-habit-name"
                    type="text"
                    required
                    placeholder="E.g., Morning Meditate 10 mins"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Frequency Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Target Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-freq-daily"
                      type="button"
                      onClick={() => setHabitFreq('Daily')}
                      className={`py-3 rounded-xl font-medium text-sm transition-all border text-center ${habitFreq === 'Daily' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/15' : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'}`}
                    >
                      Every Day (Daily)
                    </button>
                    <button
                      id="btn-freq-weekly"
                      type="button"
                      onClick={() => setHabitFreq('Weekly')}
                      className={`py-3 rounded-xl font-medium text-sm transition-all border text-center ${habitFreq === 'Weekly' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/15' : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'}`}
                    >
                      Once a Week (Weekly)
                    </button>
                  </div>
                </div>

                {/* Color Preset Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Color Label
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setHabitColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform ${habitColor === color ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Description Helper info */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-[24px] border border-emerald-100/30 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
                  <strong>Consistency matters:</strong> New habits are easiest to build when anchored to existing routines (e.g. "Right after brushing my teeth"). This application tracks current and best streaks dynamically as you check completion each day.
                </div>

                {/* Save Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    id="btn-habit-back-to-select"
                    type="button"
                    onClick={() => setStage('select')}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all font-semibold text-sm text-center"
                  >
                    Back
                  </button>
                  <button
                    id="btn-save-habit"
                    type="submit"
                    className="flex-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-emerald-500/20 text-center"
                  >
                    Save Habit
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick helper to format standard 24h format safely for inputs
function taskCheckTime(val: string): string {
  if (!val) return '12:00';
  return val;
}
