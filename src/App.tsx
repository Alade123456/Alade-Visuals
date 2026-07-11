import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, ArrowUpDown, Sparkles, 
  Download, Moon, Sun, Bell, BookOpen, Info, 
  Settings, Award, Flame, CheckCircle, Clock, Pin,
  Edit2, Trash2, Calendar, LayoutGrid, RotateCcw, AlertCircle,
  Play, Pause, Square, X, Zap, ChevronDown, ChevronUp, ChevronRight, Check, Coffee, Timer
} from 'lucide-react';
import { Task, Habit, Category, Achievement, UserPreferences, SmartSuggestion, Priority, RepeatInterval } from './types';
import { 
  getInitialTasks, getInitialHabits, INITIAL_ACHIEVEMENTS, 
  DEFAULT_CATEGORIES, DEFAULT_PREFERENCES, PRODUCTIVITY_QUOTES,
  getSmartSuggestions, formatDate, getOffsetDate, formatTimeStr 
} from './utils';

// Subcomponents
import BottomNav, { TabId } from './components/BottomNav';
import TaskCard from './components/TaskCard';
import HabitCard from './components/HabitCard';
import CalendarView from './components/CalendarView';
import AnalyticsView from './components/AnalyticsView';
import AchievementsView from './components/AchievementsView';
import TaskCreationModal from './components/TaskCreationModal';
import SignIn from './components/SignIn';
import confetti from 'canvas-confetti';

const AVATAR_PRESETS = [
  { emoji: '👨‍💻', label: 'Coder', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' },
  { emoji: '👩‍🔬', label: 'Scientist', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' },
  { emoji: '👨‍🎨', label: 'Artist', bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600' },
  { emoji: '👩‍🚀', label: 'Astronaut', bg: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600' },
  { emoji: '🕵️', label: 'Detective', bg: 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300' },
  { emoji: '👩‍🍳', label: 'Chef', bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' },
  { emoji: '🦸‍♀️', label: 'Hero', bg: 'bg-red-50 dark:bg-red-950/30 text-red-600' },
  { emoji: '🧙‍♂️', label: 'Wizard', bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600' },
  { emoji: '👩‍🏫', label: 'Teacher', bg: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700' },
  { emoji: '👨‍🚒', label: 'Firefighter', bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' },
  { emoji: '👩‍⚖️', label: 'Judge', bg: 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400' },
  { emoji: '🥷', label: 'Ninja', bg: 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100' },
];

export default function App() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('aura_auth') === 'true';
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('aura_local_username') || '';
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('aura_local_avatar') || '';
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // --- DATA STATE ---
  const loadLocal = (key: string, fallback: any) => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return fallback;
      }
    }
    return fallback;
  };

  const [tasks, setTasks] = useState<Task[]>(() => loadLocal('aura_tasks', getInitialTasks()));
  const [habits, setHabits] = useState<Habit[]>(() => loadLocal('aura_habits', getInitialHabits()));
  const [categories, setCategories] = useState<Category[]>(() => loadLocal('aura_categories', DEFAULT_CATEGORIES));
  const [achievements, setAchievements] = useState<Achievement[]>(() => loadLocal('aura_achievements', INITIAL_ACHIEVEMENTS));
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadLocal('aura_preferences', DEFAULT_PREFERENCES));

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [profileSubTab, setProfileSubTab] = useState<'achievements' | 'analytics' | 'calendar' | 'settings'>('achievements');
  const [isCreating, setIsCreating] = useState(false);

  // Profile management states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Search & Filter state for Tasks console
  const [taskSearch, setTaskSearch] = useState('');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('All');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('All');
  const [taskSort, setTaskSort] = useState<'time' | 'priority' | 'completion'>('time');

  // Interactive custom notifications/toasts
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  // --- FOCUS TIMER OVERLAY STATE ---
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [activeFocusTimerMode, setActiveFocusTimerMode] = useState<'idle' | 'work' | 'break'>('idle');
  const [activeFocusTimerStatus, setActiveFocusTimerStatus] = useState<'paused' | 'running'>('paused');
  const [activeFocusTimeLeft, setActiveFocusTimeLeft] = useState(25 * 60);
  const [showFocusOverlay, setShowFocusOverlay] = useState(false);

  // Persist to local storage whenever data changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('aura_tasks', JSON.stringify(tasks));
      localStorage.setItem('aura_habits', JSON.stringify(habits));
      localStorage.setItem('aura_categories', JSON.stringify(categories));
      localStorage.setItem('aura_achievements', JSON.stringify(achievements));
      localStorage.setItem('aura_preferences', JSON.stringify(preferences));
    }
  }, [tasks, habits, categories, achievements, preferences, isAuthenticated]);

  // Synchronize dark mode class
  useEffect(() => {
    // Add a class to enable global transitions for theme colors
    document.documentElement.classList.add('theme-transitioning');
    
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Remove the global transition class after the transition duration
    const timeout = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);

    return () => clearTimeout(timeout);
  }, [preferences.darkMode]);

  // Focus Timer Interval
  useEffect(() => {
    let interval: any;
    if (activeFocusTimerStatus === 'running' && activeFocusTimeLeft > 0) {
      interval = setInterval(() => {
        setActiveFocusTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (activeFocusTimeLeft === 0 && activeFocusTaskId) {
      // Auto-switch mode on complete
      if (activeFocusTimerMode === 'work') {
        setActiveFocusTimerMode('break');
        setActiveFocusTimeLeft(5 * 60); // 5 min break
        setActiveFocusTimerStatus('paused');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100, 50, 100]);
        }
      } else if (activeFocusTimerMode === 'break') {
        setActiveFocusTimerMode('work');
        setActiveFocusTimeLeft(25 * 60); // 25 min work
        setActiveFocusTimerStatus('paused');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([80, 40, 80]);
        }
      }
    }
    return () => clearInterval(interval);
  }, [activeFocusTimerStatus, activeFocusTimeLeft, activeFocusTimerMode, activeFocusTaskId]);

  const handleStartFocus = (taskId: string) => {
    setActiveFocusTaskId(taskId);
    setActiveFocusTimerMode('work');
    setActiveFocusTimerStatus('running');
    setActiveFocusTimeLeft(25 * 60);
    setShowFocusOverlay(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  };

  const handlePauseFocus = () => {
    setActiveFocusTimerStatus('paused');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  const handleResumeFocus = () => {
    setActiveFocusTimerStatus('running');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  const handleStopFocus = () => {
    setActiveFocusTaskId(null);
    setActiveFocusTimerMode('idle');
    setActiveFocusTimerStatus('paused');
    setActiveFocusTimeLeft(25 * 60);
    setShowFocusOverlay(false);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 100]);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Motivational quote selection (stabilized per session/load)
  const [quote] = useState(() => {
    const randomIdx = Math.floor(Math.random() * PRODUCTIVITY_QUOTES.length);
    return PRODUCTIVITY_QUOTES[randomIdx];
  });

  // Dynamic achievement unlocker
  const checkAndUnlockAchievements = (currentTasks: Task[], currentHabits: Habit[]) => {
    let stateChanged = false;
    const todayStr = formatDate(new Date());

    const updatedAchievements = achievements.map(ach => {
      if (ach.unlockedAt) return ach; // Already unlocked

      let shouldUnlock = false;

      switch (ach.requirementType) {
        case 'first_task':
          if (currentTasks.some(t => t.completed)) {
            shouldUnlock = true;
          }
          break;
        case 'first_habit':
          if (currentHabits.some(h => Object.values(h.history).some(v => v === true))) {
            shouldUnlock = true;
          }
          break;
        case 'streak_7':
          if (currentHabits.some(h => h.streak >= 7 || h.bestStreak >= 7)) {
            shouldUnlock = true;
          }
          break;
        case 'streak_30':
          if (currentHabits.some(h => h.streak >= 30 || h.bestStreak >= 30)) {
            shouldUnlock = true;
          }
          break;
        case 'tasks_100':
          // Scaled to 10 completed tasks to make it fun and accessible for standard workloads
          if (currentTasks.filter(t => t.completed).length >= 10) {
            shouldUnlock = true;
          }
          break;
        case 'early_bird':
          // Completed any task whose dueTime is before 9:00 AM
          const hasEarlyBird = currentTasks.some(t => {
            if (!t.completed || !t.dueTime) return false;
            const hour = parseInt(t.dueTime.split(':')[0], 10);
            return hour < 9;
          });
          if (hasEarlyBird) {
            shouldUnlock = true;
          }
          break;
        case 'consistency':
          // Completed at least 5 tasks total
          if (currentTasks.filter(t => t.completed).length >= 5) {
            shouldUnlock = true;
          }
          break;
        case 'champion':
          // All other achievements are unlocked
          const otherCount = achievements.filter(a => a.id !== 'ach-8' && !!a.unlockedAt).length;
          if (otherCount >= 7) {
            shouldUnlock = true;
          }
          break;
      }

      if (shouldUnlock) {
        stateChanged = true;
        
        // Trigger elegant multi-burst confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Set top floating toast (mutes during active Focus session)
        if (!activeFocusTaskId) {
          setNotification({
            title: '🏆 Milestone Unlocked!',
            message: `${ach.title}: ${ach.description}`,
          });
        }

        return {
          ...ach,
          unlockedAt: new Date().toISOString()
        };
      }

      return ach;
    });

    if (stateChanged) {
      setAchievements(updatedAchievements);
    }
  };

  // Run achievement evaluations whenever state changes
  useEffect(() => {
    if (isAuthenticated) {
      checkAndUnlockAchievements(tasks, habits);
    }
  }, [tasks, habits, isAuthenticated]);

  const handleSignIn = (username: string, avatar: string) => {
    setIsAuthenticated(true);
    setDisplayName(username);
    setAvatarUrl(avatar);
    localStorage.setItem('aura_auth', 'true');
    localStorage.setItem('aura_local_username', username);
    if (avatar) localStorage.setItem('aura_local_avatar', avatar);
    
    // Default mock data seed on first signin
    if (!localStorage.getItem('aura_tasks')) {
      setTasks(getInitialTasks());
      setHabits(getInitialHabits());
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('aura_last_confetti_date');
    localStorage.removeItem('aura_tasks');
    localStorage.removeItem('aura_habits');
    localStorage.removeItem('aura_achievements');
    setTasks([]);
    setHabits([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setNotification({
      title: 'Data Reset',
      message: 'App statistics, tasks, and habits have been reset to 0.',
    });
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setDisplayName(tempName.trim());
      localStorage.setItem('aura_local_username', tempName.trim());
      setIsEditingName(false);
    }
  };

  const todayStr = formatDate(new Date());
  
  const pendingTasksCount = tasks.filter(t => !t.completed && t.dueDate === todayStr).length;
  const pendingHabitsCount = habits.filter(h => !h.history[todayStr] && !h.paused).length;

  const handleSaveTask = (taskData: any) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      completed: false,
      order: tasks.length + 1
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleSaveHabit = (habitData: any) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      streak: 0,
      bestStreak: 0,
      history: {},
      createdAt: new Date().toISOString()
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleToggleTask = (id: string) => {
    let triggeredConfetti = false;
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const isNowCompleted = !t.completed;
        if (isNowCompleted) {
          // Tactile haptic feedback on completion
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(100);
          }
          // Check if it is the first task completed today
          const completedToday = tasks.some(task => task.completed && task.completedAt && task.completedAt.startsWith(todayStr));
          const lastConfettiDate = localStorage.getItem('aura_last_confetti_date');
          
          if (!completedToday && lastConfettiDate !== todayStr) {
            triggeredConfetti = true;
            localStorage.setItem('aura_last_confetti_date', todayStr);
          }
        } else {
          // Short discrete haptic feedback on unchecking
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(40);
          }
        }
        return { 
          ...t, 
          completed: isNowCompleted, 
          completedAt: isNowCompleted ? new Date().toISOString() : undefined 
        };
      }
      return t;
    });

    setTasks(updatedTasks);

    if (triggeredConfetti) {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 }
      });
    }
  };

  const handleTogglePin = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTask = (task: Task) => {
    const newName = prompt("Edit Task Name:", task.name);
    if (newName !== null && newName.trim()) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, name: newName.trim() } : t));
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const subtasks = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            const isNowCompleted = !s.completed;
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(isNowCompleted ? 60 : 30);
            }
            return { ...s, completed: isNowCompleted };
          }
          return s;
        });
        return { ...t, subtasks };
      }
      return t;
    }));
  };

  const handleLogHabit = (id: string) => {
    const updatedHabits = habits.map(h => {
      if (h.id === id) {
        const history = { ...h.history };
        const hasLoggedToday = !!history[todayStr];
        
        if (hasLoggedToday) {
          delete history[todayStr];
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(40);
          }
        } else {
          history[todayStr] = true;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([80, 40, 80]); // Snappy double pulse for logging a habit
          }
        }

        // Calculate current streak
        let currentStreak = 0;
        let scanDate = new Date();
        
        if (hasLoggedToday) {
          // If we just unchecked today, scan starting from yesterday
          scanDate.setDate(scanDate.getDate() - 1);
        }

        while (true) {
          const formattedScan = formatDate(scanDate);
          if (history[formattedScan]) {
            currentStreak++;
            scanDate.setDate(scanDate.getDate() - 1);
          } else {
            break;
          }
        }

        const bestStreak = Math.max(h.bestStreak, currentStreak);

        return { 
          ...h, 
          history,
          streak: currentStreak,
          bestStreak
        };
      }
      return h;
    });

    setHabits(updatedHabits);
  };

  const handleTogglePause = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, paused: !h.paused } : h));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleCreateCategory = (cat: Category) => {
    setCategories(prev => [...prev, cat]);
  };

  // Avatar helper renderer
  const renderUserAvatar = (url: string, name: string, sizeClass = "w-12 h-12 text-xl") => {
    if (url && url.startsWith('preset|')) {
      const [_, emoji, bgClass] = url.split('|');
      return (
        <div className={`rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm shrink-0 ${sizeClass} ${bgClass}`}>
          {emoji}
        </div>
      );
    } else if (url) {
      return (
        <img src={url} alt="Avatar" className={`rounded-full shadow-sm object-cover border-2 border-white dark:border-slate-850 shrink-0 ${sizeClass}`} />
      );
    } else {
      return (
        <div className={`rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 ${sizeClass}`}>
          {name ? name.charAt(0).toUpperCase() : 'U'}
        </div>
      );
    }
  };

  // Filter tasks based on search, category, priority
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(taskSearch.toLowerCase()));
    const matchesCategory = taskCategoryFilter === 'All' || task.category === taskCategoryFilter;
    const matchesPriority = taskPriorityFilter === 'All' || task.priority === taskPriorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Sort filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (taskSort === 'completion') {
      return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
    }
    if (taskSort === 'priority') {
      const weight = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const aW = weight[a.priority] || 0;
      const bW = weight[b.priority] || 0;
      return bW - aW;
    }
    // Default 'time' (due time)
    const aTime = a.dueDate + (a.dueTime || '23:59');
    const bTime = b.dueDate + (b.dueTime || '23:59');
    return aTime.localeCompare(bTime);
  });

  // Today's specific variables for circular ring calculation
  const tasksForToday = tasks.filter(t => t.dueDate === todayStr);
  const totalTasksForTodayCount = tasksForToday.length;
  const completedTasksForTodayCount = tasksForToday.filter(t => t.completed).length;
  const completionPercentage = totalTasksForTodayCount > 0 
    ? Math.round((completedTasksForTodayCount / totalTasksForTodayCount) * 100) 
    : 0;

  // Smart suggestions ticker list
  const activeSuggestions = getSmartSuggestions(tasks, habits);

  const renderHome = () => (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Dynamic Profile Greeting Row */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Hello, {displayName || 'User'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 italic font-medium">
            "{quote}"
          </p>
        </div>
        {renderUserAvatar(avatarUrl, displayName, "w-13 h-13 text-2xl")}
      </div>

      {/* Task Completion Ring & Progress Panel */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/15 relative overflow-hidden flex items-center justify-between">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-lg pointer-events-none" />
        
        <div className="space-y-3 relative z-10 max-w-[65%]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest bg-white/15 px-2.5 py-1 rounded-full text-blue-50">
            Today's System
          </span>
          <h2 className="text-xl font-bold tracking-tight">
            {completionPercentage === 100 
              ? "All Done! 🎉" 
              : completionPercentage >= 50 
                ? "Over half way! 💪" 
                : "Let's begin! 🚀"}
          </h2>
          <p className="text-blue-100 text-[11px] leading-relaxed">
            {totalTasksForTodayCount > 0 
              ? `You completed ${completedTasksForTodayCount} of your ${totalTasksForTodayCount} scheduled tasks today.`
              : "No tasks scheduled for today. Create some goals or take a break!"}
          </p>
        </div>

        {/* Circular SVG Ring */}
        {totalTasksForTodayCount > 0 && (
          <div className="relative w-24 h-24 flex items-center justify-center z-10 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-white/20"
                strokeWidth="6.5"
                fill="transparent"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-white"
                strokeWidth="7"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 38}
                initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - completionPercentage / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-base font-extrabold text-white">
                {completionPercentage}%
              </span>
              <span className="text-[8px] uppercase tracking-wider font-bold text-blue-100">
                completed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bento Mini-Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-750/60">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{pendingTasksCount}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Pending Tasks Today</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-750/60">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{pendingHabitsCount}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Incomplete Habits</p>
        </div>
      </div>

      {/* Smart Suggestions Console */}
      {activeSuggestions.length > 0 && (
        <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-500">
              Smart Advisor
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
              {activeSuggestions[0].text}
            </p>
          </div>
        </div>
      )}

      {/* Today's Tasks Summary List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Clock size={16} className="text-slate-400" /> Today's Focus List
          </h2>
          <button 
            onClick={() => setActiveTab('tasks')}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
          >
            All Tasks <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {tasksForToday.slice(0, 3).map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onTogglePin={handleTogglePin}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              onToggleSubtask={handleToggleSubtask}
              activeFocusTaskId={activeFocusTaskId}
              activeFocusTimeLeft={activeFocusTimeLeft}
              activeFocusTimerMode={activeFocusTimerMode}
              activeFocusTimerStatus={activeFocusTimerStatus}
              onStartFocus={handleStartFocus}
              onPauseFocus={handlePauseFocus}
              onResumeFocus={handleResumeFocus}
              onStopFocus={handleStopFocus}
            />
          ))}
          {tasksForToday.length === 0 && (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-150 dark:border-slate-750">
              No tasks for today. Tap "Create New" to schedule something!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tasks Console</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Filter, search, and manage your daily systems.</p>
        </div>
      </div>

      {/* Search and Filters Drawer */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-750/50 space-y-3.5">
        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/30 text-xs text-slate-850 dark:text-white"
            placeholder="Search tasks..."
          />
        </div>

        {/* Categorized Filter tags */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Category</span>
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={() => setTaskCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${taskCategoryFilter === 'All' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-150'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setTaskCategoryFilter(cat.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${taskCategoryFilter === cat.name ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-150'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Priority & Sorting Control Row */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-750/50">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Priority</span>
            <select 
              value={taskPriorityFilter}
              onChange={(e) => setTaskPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Sort Order</span>
            <select
              value={taskSort}
              onChange={(e) => setTaskSort(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="time">Due Time</option>
              <option value="priority">Priority Level</option>
              <option value="completion">Completion Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Filtered List */}
      <div className="space-y-3">
        {sortedTasks.map(task => (
          <TaskCard 
            key={task.id}
            task={task}
            onToggleComplete={handleToggleTask}
            onTogglePin={handleTogglePin}
            onDelete={handleDeleteTask}
            onEdit={handleEditTask}
            onToggleSubtask={handleToggleSubtask}
            activeFocusTaskId={activeFocusTaskId}
            activeFocusTimeLeft={activeFocusTimeLeft}
            activeFocusTimerMode={activeFocusTimerMode}
            activeFocusTimerStatus={activeFocusTimerStatus}
            onStartFocus={handleStartFocus}
            onPauseFocus={handlePauseFocus}
            onResumeFocus={handleResumeFocus}
            onStopFocus={handleStopFocus}
          />
        ))}
        {sortedTasks.length === 0 && (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-150 dark:border-slate-750">
            <Info className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            No tasks found matching your filters.
          </div>
        )}
      </div>
    </div>
  );

  const renderHabits = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Habit Streaks</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Consistency builds character. Log your systems daily.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map(habit => (
          <HabitCard 
            key={habit.id}
            habit={habit}
            onToggleToday={handleLogHabit}
            onPause={handleTogglePause}
            onDelete={handleDeleteHabit}
            onDuplicate={() => {}}
          />
        ))}
        {habits.length === 0 && (
          <div className="p-12 col-span-full text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-150 dark:border-slate-750">
            <Flame className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            No habits active. Start a new habit streak!
          </div>
        )}
      </div>
    </div>
  );

  const renderProfileSubTab = () => {
    switch (profileSubTab) {
      case 'achievements':
        return <AchievementsView achievements={achievements} />;
      case 'analytics':
        return <AnalyticsView tasks={tasks} habits={habits} />;
      case 'calendar':
        return (
          <CalendarView 
            tasks={tasks}
            habits={habits}
            onToggleTaskComplete={handleToggleTask}
            onToggleHabitToday={handleLogHabit}
          />
        );
      case 'settings':
        return (
          <div className="space-y-6">
            {/* Customizable Username */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750/50 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Edit Username
              </span>
              
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={15}
                    className="flex-1 px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-950 dark:text-white"
                  />
                  <button 
                    onClick={handleSaveName}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{displayName}</span>
                  <button 
                    onClick={() => { setTempName(displayName); setIsEditingName(true); }}
                    className="text-xs text-blue-500 hover:text-blue-600 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    Change Name
                  </button>
                </div>
              )}
            </div>

            {/* Avatar Selectors */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750/50 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Change Profile Avatar
              </span>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((preset) => {
                  const presetStr = `preset|${preset.emoji}|${preset.bg}`;
                  const isSelected = avatarUrl === presetStr;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setAvatarUrl(presetStr);
                        localStorage.setItem('aura_local_avatar', presetStr);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border transition-all hover:scale-110 cursor-pointer ${preset.bg} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'border-transparent'}`}
                    >
                      {preset.emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark Mode toggle & preferences */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750/50 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                System Customization
              </span>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Dark Mode Contrast</h4>
                  <p className="text-[11px] text-slate-400">Reduce strain in dim environments</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences(p => ({ ...p, darkMode: !p.darkMode }))}
                  className={`w-11 h-6 rounded-full relative transition-all duration-300 flex items-center p-0.5 ${preferences.darkMode ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    layout
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ x: preferences.darkMode ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750/50">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Task Reminder Flags</h4>
                  <p className="text-[11px] text-slate-400">Push status flags automatically</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences(p => ({ ...p, notificationReminders: !p.notificationReminders }))}
                  className={`w-11 h-6 rounded-full relative transition-all duration-300 flex items-center p-0.5 ${preferences.notificationReminders ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    layout
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ x: preferences.notificationReminders ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                </button>
              </div>
            </div>

            {/* Clean start */}
            {isConfirmingReset ? (
              <div className="w-full p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold text-center">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsConfirmingReset(false)}
                    className="flex-1 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      handleResetData();
                      setIsConfirmingReset(false);
                    }}
                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-rose-500/20 cursor-pointer transition-colors"
                  >
                    Yes, Reset Data
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsConfirmingReset(true)} 
                className="w-full py-4 bg-rose-50 dark:bg-rose-950/10 hover:bg-rose-100/50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-xs font-bold rounded-2xl border border-rose-100 dark:border-rose-950 transition-colors cursor-pointer"
              >
                Reset App Statistics & Data
              </button>
            )}
          </div>
        );
    }
  };

  const renderProfile = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-750/60 shadow-sm flex flex-col items-center text-center">
        <div className="mb-3">
          {renderUserAvatar(avatarUrl, displayName, "w-18 h-18 text-3xl")}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{displayName}</h2>
        <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wider">
          Daily Architect
        </span>
      </div>

      {/* Sub-tab segment selector */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-0.5 overflow-x-auto">
        <button
          onClick={() => setProfileSubTab('achievements')}
          className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${profileSubTab === 'achievements' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
        >
          🏆 Achievements
        </button>
        <button
          onClick={() => setProfileSubTab('analytics')}
          className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${profileSubTab === 'analytics' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
        >
          📊 Stats
        </button>
        <button
          onClick={() => setProfileSubTab('calendar')}
          className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${profileSubTab === 'calendar' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
        >
          📅 Calendar
        </button>
        <button
          onClick={() => setProfileSubTab('settings')}
          className={`flex-1 py-2 px-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${profileSubTab === 'settings' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Profile sub tab body */}
      <div className="pb-8">
        {renderProfileSubTab()}
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25"
          >
            <span className="text-white text-4xl font-bold font-sans">G</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">GoalsMi</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Your system companion</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Floating toast notification for Achievement unlocks */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            className="fixed top-6 left-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 border border-slate-750">
              <div className="text-2xl mt-0.5">🏆</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-white">{notification.title}</h4>
                <p className="text-slate-300 text-[10px] mt-1 leading-normal">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-white transition-colors shrink-0 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tab Routing */}
      <main className="max-w-xl mx-auto bg-slate-50/50 dark:bg-slate-950/50 min-h-screen relative shadow-sm">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'habits' && renderHabits()}
        {activeTab === 'profile' && renderProfile()}
      </main>

      {/* Floating Create Button */}
      {!activeFocusTaskId && (
        <div className="fixed bottom-22 left-1/2 transform -translate-x-1/2 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/25 font-bold tracking-wide text-xs cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            Create Goal
          </motion.button>
        </div>
      )}

      {/* Floating Focus Bar (when minimized) */}
      <AnimatePresence>
        {activeFocusTaskId && !showFocusOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            onClick={() => setShowFocusOverlay(true)}
            className="fixed bottom-22 left-4 right-4 md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 z-40 bg-indigo-600 dark:bg-indigo-700 text-white rounded-2xl p-3 px-4 shadow-xl shadow-indigo-600/20 flex items-center justify-between cursor-pointer border border-indigo-500 hover:bg-indigo-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Timer className={`w-5 h-5 ${activeFocusTimerStatus === 'running' ? 'animate-pulse' : ''}`} />
                {activeFocusTimerStatus === 'running' && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                  {activeFocusTimerMode === 'work' ? 'Focusing Task' : 'Break Time'}
                </div>
                <div className="text-xs font-bold truncate pr-2">
                  {tasks.find(t => t.id === activeFocusTaskId)?.name || 'Active Task'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold bg-indigo-700/60 dark:bg-indigo-800/60 px-2.5 py-1 rounded-lg">
                {formatTimer(activeFocusTimeLeft)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopFocus();
                }}
                className="p-1.5 hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Stop Focus"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Focus Timer Overlay */}
      <AnimatePresence>
        {activeFocusTaskId && showFocusOverlay && (
          (() => {
            const focusedTask = tasks.find(t => t.id === activeFocusTaskId);
            if (!focusedTask) return null;
            
            // Calculate progress circle stroke
            const totalDuration = activeFocusTimerMode === 'work' ? 25 * 60 : 5 * 60;
            const percentage = (activeFocusTimeLeft / totalDuration) * 100;
            const radius = 90;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-6 overflow-y-auto"
              >
                {/* Glow ambient effects */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl -z-10 animate-pulse pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl -z-10 animate-pulse pointer-events-none" />

                {/* Top Bar */}
                <div className="w-full max-w-lg flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-4 py-1.5 rounded-full text-[11px] font-bold text-slate-300">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>🔇 Focus Mode Active (DND Enabled)</span>
                  </div>
                  <button
                    onClick={() => setShowFocusOverlay(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent hover:border-slate-800 rounded-full transition-all cursor-pointer animate-none"
                    title="Minimize"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Center Content: Timer and Task Card */}
                <div className="w-full max-w-lg flex-1 flex flex-col items-center justify-center py-8 gap-8">
                  
                  {/* Circular Timer Display */}
                  <div className="relative flex items-center justify-center w-56 h-56">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background track */}
                      <circle
                        cx="112"
                        cy="112"
                        r={radius}
                        className="stroke-slate-800/60"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Active progress */}
                      <motion.circle
                        cx="112"
                        cy="112"
                        r={radius}
                        className={activeFocusTimerMode === 'work' ? 'stroke-indigo-500 shadow-lg' : 'stroke-emerald-500 shadow-lg'}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transition={{ duration: 1, ease: 'linear' }}
                      />
                    </svg>

                    {/* Timer digits overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className={`text-4xl md:text-5xl font-mono font-black tracking-widest ${activeFocusTimerMode === 'work' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {formatTimer(activeFocusTimeLeft)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {activeFocusTimerMode === 'work' ? 'Focus Session' : 'Short Break'}
                      </span>
                    </div>
                  </div>

                  {/* Highlighted Task Card Wrapper */}
                  <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden ring-2 ring-indigo-500/30">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                    
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-md mb-2">
                          {focusedTask.category}
                        </span>
                        <h2 className="text-lg font-black text-white tracking-tight leading-snug">
                          {focusedTask.name}
                        </h2>
                        {focusedTask.description && (
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            {focusedTask.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subtasks checklist within focus overlay */}
                    {focusedTask.subtasks && focusedTask.subtasks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Subtasks checklist ({focusedTask.subtasks.filter(s => s.completed).length}/{focusedTask.subtasks.length})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {focusedTask.subtasks.map(sub => (
                            <div 
                              key={sub.id} 
                              className="flex items-center gap-2 hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleSubtask(focusedTask.id, sub.id)}
                                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer ${
                                  sub.completed
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                                }`}
                              >
                                {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <span className={`text-xs ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                {sub.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {focusedTask.notes && (
                      <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Quick Notes</span>
                        <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">{focusedTask.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Control Buttons */}
                <div className="w-full max-w-lg flex flex-col gap-3 mb-4">
                  <div className="flex gap-3 justify-center">
                    {/* Pause/Resume Button */}
                    <button
                      onClick={activeFocusTimerStatus === 'running' ? handlePauseFocus : handleResumeFocus}
                      className={`flex-1 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                        activeFocusTimerStatus === 'running' 
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' 
                          : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                      }`}
                    >
                      {activeFocusTimerStatus === 'running' ? (
                        <><Pause className="w-4 h-4 fill-current" /> Pause Focus</>
                      ) : (
                        <><Play className="w-4 h-4 fill-current" /> Resume Focus</>
                      )}
                    </button>

                    {/* Complete Task Button */}
                    <button
                      onClick={() => {
                        handleToggleTask(focusedTask.id);
                        handleStopFocus();
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Complete Task
                    </button>
                  </div>

                  {/* Stop Focus Button */}
                  <button
                    onClick={handleStopFocus}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-red-400 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-800 hover:border-slate-700"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> End Focus Session
                  </button>
                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      {/* Bottom Floating Navigation Bar */}
      <BottomNav 
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        tasksCount={pendingTasksCount}
        habitsCount={pendingHabitsCount}
      />

      {/* Task Creation Modal */}
      <TaskCreationModal 
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSaveTask={handleSaveTask}
        onSaveHabit={handleSaveHabit}
        categories={categories}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
