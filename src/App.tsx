import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, ArrowUpDown, Sparkles, 
  Download, Moon, Sun, Bell, BookOpen, Info, 
  Settings, Award, Flame, CheckCircle, Clock, Pin,
  Edit2, Trash2, Calendar, LayoutGrid, RotateCcw, AlertCircle
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { 
  supabase, 
  isSupabaseConfigured, 
  syncPullAll, 
  syncPushAll, 
  mapTaskToDb, 
  mapHabitToDb, 
  mapCategoryToDb, 
  mapAchievementToDb, 
  mapPreferencesToDb 
} from './supabase';

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

export default function App() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('aura_auth') === 'true';
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    let unsubscribeFirebase: (() => void) | undefined;
    let unsubscribeSupabase: (() => void) | undefined;

    if (isSupabaseConfigured) {
      // 1. Supabase Auth Listener
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          localStorage.setItem('aura_auth', 'true');
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('aura_auth');
        }
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          localStorage.setItem('aura_auth', 'true');
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('aura_auth');
        }
        setAuthLoading(false);
      });

      unsubscribeSupabase = () => subscription.unsubscribe();
    } else {
      // 2. Firebase Auth Listener Fallback
      unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsAuthenticated(true);
          setUserId(user.uid);
          localStorage.setItem('aura_auth', 'true');
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('aura_auth');
        }
        setAuthLoading(false);
      });
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (unsubscribeSupabase) unsubscribeSupabase();
    };
  }, []);

  // --- SUPABASE SYNC PULL ---
  useEffect(() => {
    const pullData = async () => {
      if (!isSupabaseConfigured || !userId) return;
      setIsPulling(true);
      try {
        const data = await syncPullAll(userId);
        if (data) {
          if (data.tasks && data.tasks.length > 0) setTasks(data.tasks);
          if (data.habits && data.habits.length > 0) setHabits(data.habits);
          if (data.categories && data.categories.length > 0) setCategories(data.categories);
          if (data.achievements && data.achievements.length > 0) setAchievements(data.achievements);
          if (data.preferences) setPreferences(data.preferences);

          // If user has zero cloud data, sync our current local data to seed Supabase
          const hasNoCloudData = (!data.tasks || data.tasks.length === 0) && (!data.habits || data.habits.length === 0);
          if (hasNoCloudData) {
            await syncPushAll(userId, {
              tasks,
              habits,
              categories,
              achievements,
              preferences
            });
          }
        }
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
      } finally {
        setIsPulling(false);
      }
    };

    pullData();
  }, [userId]);

  // --- CORE STATE ENGINE ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('aura_tasks');
    return saved ? JSON.parse(saved) : getInitialTasks();
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('aura_habits');
    return saved ? JSON.parse(saved) : getInitialHabits();
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('aura_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('aura_achievements');
    return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('aura_preferences');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('aura_preferences');
    if (saved) {
      const prefs: UserPreferences = JSON.parse(saved);
      return prefs.defaultHomeMode === 'Habits' ? 'habits' : 'home';
    }
    return 'home';
  });

  // Modal Control
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Micro-interaction states
  const [showConfetti, setShowConfetti] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Search & Filters (for Tasks screen)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'name'>('time');

  // Segmented Control (for Home screen)
  const [homeSegment, setHomeSegment] = useState<'today' | 'upcoming' | 'habits'>('today');

  // --- SYNC ENGINE ---
  useEffect(() => {
    const saved = localStorage.getItem('aura_tasks');
    const oldTasks: Task[] = saved ? JSON.parse(saved) : [];

    localStorage.setItem('aura_tasks', JSON.stringify(tasks));
    checkAchievements();

    if (isSupabaseConfigured && userId && !isPulling) {
      const deletedIds = oldTasks.filter(oldT => !tasks.some(newT => newT.id === oldT.id)).map(oldT => oldT.id);
      
      if (deletedIds.length > 0) {
        supabase.from('tasks').delete().in('id', deletedIds).then(({ error }) => {
          if (error) console.error("Error deleting tasks from Supabase:", error);
        });
      }

      if (tasks.length > 0) {
        supabase.from('tasks').upsert(tasks.map(t => mapTaskToDb(t, userId))).then(({ error }) => {
          if (error) console.error("Error upserting tasks to Supabase:", error);
        });
      }
    }
  }, [tasks]);

  useEffect(() => {
    const saved = localStorage.getItem('aura_habits');
    const oldHabits: Habit[] = saved ? JSON.parse(saved) : [];

    localStorage.setItem('aura_habits', JSON.stringify(habits));
    checkAchievements();

    if (isSupabaseConfigured && userId && !isPulling) {
      const deletedIds = oldHabits.filter(oldH => !habits.some(newH => newH.id === oldH.id)).map(oldH => oldH.id);
      
      if (deletedIds.length > 0) {
        supabase.from('habits').delete().in('id', deletedIds).then(({ error }) => {
          if (error) console.error("Error deleting habits from Supabase:", error);
        });
      }

      if (habits.length > 0) {
        supabase.from('habits').upsert(habits.map(h => mapHabitToDb(h, userId))).then(({ error }) => {
          if (error) console.error("Error upserting habits to Supabase:", error);
        });
      }
    }
  }, [habits]);

  useEffect(() => {
    const saved = localStorage.getItem('aura_categories');
    const oldCategories: Category[] = saved ? JSON.parse(saved) : [];

    localStorage.setItem('aura_categories', JSON.stringify(categories));

    if (isSupabaseConfigured && userId && !isPulling) {
      const deletedIds = oldCategories.filter(oldC => !categories.some(newC => newC.id === oldC.id)).map(oldC => oldC.id);
      
      if (deletedIds.length > 0) {
        supabase.from('categories').delete().in('id', deletedIds).then(({ error }) => {
          if (error) console.error("Error deleting categories from Supabase:", error);
        });
      }

      const customCats = categories.filter(c => c.isCustom);
      if (customCats.length > 0) {
        supabase.from('categories').upsert(customCats.map(c => mapCategoryToDb(c, userId))).then(({ error }) => {
          if (error) console.error("Error upserting categories to Supabase:", error);
        });
      }
    }
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('aura_achievements', JSON.stringify(achievements));

    if (isSupabaseConfigured && userId && !isPulling) {
      if (achievements.length > 0) {
        supabase.from('achievements').upsert(achievements.map(a => mapAchievementToDb(a, userId))).then(({ error }) => {
          if (error) console.error("Error upserting achievements to Supabase:", error);
        });
      }
    }
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('aura_preferences', JSON.stringify(preferences));
    applyThemeAndColor();

    if (isSupabaseConfigured && userId && !isPulling) {
      supabase.from('preferences').upsert(mapPreferencesToDb(preferences, userId)).then(({ error }) => {
        if (error) console.error("Error upserting preferences to Supabase:", error);
      });
    }
  }, [preferences]);

  // Rotates motivation quote daily or on click
  useEffect(() => {
    const day = new Date().getDay();
    setQuoteIdx(day % PRODUCTIVITY_QUOTES.length);
  }, []);

  // --- DYNAMIC THEMING ENGINE ---
  const applyThemeAndColor = () => {
    // 1. Dark Mode
    const root = document.documentElement;
    if (preferences.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. Primary Theme Accent Map
    const colors: Record<typeof preferences.themeColor, string> = {
      blue: '#3b82f6',
      indigo: '#6366f1',
      violet: '#8b5cf6',
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#ec4899',
      slate: '#64748b'
    };

    root.style.setProperty('--primary-color', colors[preferences.themeColor]);
  };

  // --- CONFETTI TRIGGER ---
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
  };

  // --- TASK ACTIONS ---
  const handleToggleTaskComplete = (id: string) => {
    let justCompleted = false;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = !t.completed;
        if (nextStatus) justCompleted = true;
        return {
          ...t,
          completed: nextStatus,
          completedAt: nextStatus ? new Date().toISOString() : undefined
        };
      }
      return t;
    }));

    if (justCompleted) {
      // Check if all today's tasks are completed
      const todayStr = formatDate(new Date());
      const remainingToday = tasks.filter(t => t.dueDate === todayStr && !t.completed && t.id !== id).length;
      if (remainingToday === 0) {
        triggerConfetti();
      }
    }
  };

  const handleToggleTaskPin = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveTask = (newTaskData: Omit<Task, 'id' | 'completed' | 'order'>) => {
    if (editingTask) {
      // Editing existing
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { 
        ...t, 
        ...newTaskData,
        // Preserve completed status
        completed: t.completed,
        completedAt: t.completedAt
      } : t));
      setEditingTask(null);
    } else {
      // Creating new
      const newTask: Task = {
        ...newTaskData,
        id: `task-${Date.now()}`,
        completed: false,
        order: tasks.length + 1
      };
      setTasks(prev => [newTask, ...prev]);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    }));
  };

  // --- HABIT ACTIONS ---
  const handleToggleHabitToday = (id: string) => {
    const todayStr = formatDate(new Date());
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCurrentlyDone = !!h.history[todayStr];
        const nextHistory = { ...h.history, [todayStr]: !isCurrentlyDone };
        
        // Calculate new streak
        let streak = h.streak;
        if (!isCurrentlyDone) {
          streak += 1;
        } else {
          streak = Math.max(0, streak - 1);
        }

        const bestStreak = Math.max(h.bestStreak, streak);

        return {
          ...h,
          history: nextHistory,
          streak,
          bestStreak
        };
      }
      return h;
    }));
  };

  const handleTogglePauseHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, paused: !h.paused } : h));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleDuplicateHabit = (id: string) => {
    const source = habits.find(h => h.id === id);
    if (source) {
      const duplicate: Habit = {
        ...source,
        id: `habit-${Date.now()}`,
        name: `${source.name} (Copy)`,
        streak: 0,
        bestStreak: 0,
        history: {},
        createdAt: new Date().toISOString()
      };
      setHabits(prev => [duplicate, ...prev]);
    }
  };

  const handleSaveHabit = (newHabitData: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'history' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: `habit-${Date.now()}`,
      streak: 0,
      bestStreak: 0,
      history: {},
      createdAt: new Date().toISOString()
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  // --- CUSTOM CATEGORY ---
  const handleCreateCategory = (newCat: Category) => {
    setCategories(prev => [...prev, newCat]);
  };

  // --- GAMIFICATION ENGINE ---
  const checkAchievements = () => {
    let updated = false;
    const todayStr = formatDate(new Date());

    const nextAch = achievements.map(ach => {
      if (ach.unlockedAt) return ach; // already unlocked

      let unlockCondition = false;

      switch (ach.requirementType) {
        case 'first_task':
          unlockCondition = tasks.some(t => t.completed);
          break;
        case 'first_habit':
          unlockCondition = habits.some(h => Object.values(h.history).some(Boolean));
          break;
        case 'streak_7':
          unlockCondition = habits.some(h => h.streak >= 7) || tasks.filter(t => t.completed).length >= 7;
          break;
        case 'streak_30':
          unlockCondition = habits.some(h => h.streak >= 30);
          break;
        case 'tasks_100':
          unlockCondition = tasks.filter(t => t.completed).length >= 100;
          break;
        case 'early_bird':
          // Check if any task completed before 9am
          unlockCondition = tasks.some(t => {
            if (!t.completed || !t.completedAt) return false;
            const hour = new Date(t.completedAt).getHours();
            return hour < 9;
          });
          break;
        case 'consistency':
          // Check if overall score >= 100 on multiple habits
          unlockCondition = habits.filter(h => h.streak >= 5).length >= 2;
          break;
        case 'champion':
          // Unlocks if all others are unlocked
          const others = achievements.filter(a => a.requirementType !== 'champion');
          unlockCondition = others.length > 0 && others.every(a => !!a.unlockedAt);
          break;
      }

      if (unlockCondition) {
        updated = true;
        return {
          ...ach,
          unlockedAt: new Date().toISOString()
        };
      }
      return ach;
    });

    if (updated) {
      setAchievements(nextAch);
    }
  };

  // --- SEED RESET ---
  const handleResetData = () => {
    if (window.confirm("This will overwrite your tasks/habits with pre-seeded test data. Proceed?")) {
      localStorage.removeItem('aura_tasks');
      localStorage.removeItem('aura_habits');
      localStorage.removeItem('aura_categories');
      localStorage.removeItem('aura_achievements');
      localStorage.removeItem('aura_preferences');
      
      setTasks(getInitialTasks());
      setHabits(getInitialHabits());
      setCategories(DEFAULT_CATEGORIES);
      setAchievements(INITIAL_ACHIEVEMENTS);
      setPreferences(DEFAULT_PREFERENCES);
      setActiveTab('home');
    }
  };

  // --- PROFILE DATA EXPORT ---
  const handleExportData = () => {
    const backup = {
      tasks,
      habits,
      categories,
      preferences,
      achievements
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "aura_productivity_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- CALCULATE PRODUCTIVITY METRICS FOR HOME VIEW ---
  const getTodayProductivityStats = () => {
    const todayStr = formatDate(new Date());
    
    // Tasks stats
    const todayTasks = tasks.filter(t => t.dueDate === todayStr);
    const completedTasks = todayTasks.filter(t => t.completed).length;
    
    // Habits stats
    const activeHabits = habits.filter(h => !h.paused);
    const completedHabits = activeHabits.filter(h => !!h.history[todayStr]).length;

    // Combined score
    const totalItems = todayTasks.length + activeHabits.length;
    const completedItems = completedTasks + completedHabits;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      tasksTotal: todayTasks.length,
      tasksDone: completedTasks,
      habitsTotal: activeHabits.length,
      habitsDone: completedHabits,
      pct: percentage
    };
  };

  const todayStats = getTodayProductivityStats();
  const suggestions = getSmartSuggestions(tasks, habits);

  // --- TASKS FILTERING ENGINE ---
  const getFilteredTasks = () => {
    return tasks.filter(t => {
      // 1. Search Query
      const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Category
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;

      // 3. Priority
      const matchPriority = selectedPriority === 'All' || t.priority === selectedPriority;

      return matchSearch && matchCat && matchPriority;
    }).sort((a, b) => {
      // Pin sorting is always first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Primary sorting option
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'priority') {
        const priorityOrder: Record<Priority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else {
        // Sort by Due Time
        return a.dueTime.localeCompare(b.dueTime);
      }
    });
  };

  const filteredTasksList = getFilteredTasks();

  const todayStr = formatDate(new Date());
  
  // Categorized groups for primary Task view
  const groupTasks = {
    pinned: filteredTasksList.filter(t => t.pinned && !t.completed),
    today: filteredTasksList.filter(t => t.dueDate === todayStr && !t.completed && !t.pinned),
    upcoming: filteredTasksList.filter(t => t.dueDate > todayStr && !t.completed && !t.pinned),
    overdue: filteredTasksList.filter(t => t.dueDate < todayStr && !t.completed && !t.pinned),
    completed: filteredTasksList.filter(t => t.completed)
  };

  const handleSignIn = () => {
    // This is now handled by the Firebase auth listener, but we can keep it for the SignIn component success callback
    setIsAuthenticated(true);
    localStorage.setItem('aura_auth', 'true');
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      await signOut(auth);
    }
    setIsAuthenticated(false);
    setUserId(null);
    localStorage.removeItem('aura_auth');
    setActiveTab('home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 pb-24 text-gray-900 dark:text-slate-100 transition-colors duration-300`}>
      {/* Decorative Blur Spheres */}
      <div className="fixed top-[-10%] left-[-20%] w-80 h-80 rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[15%] right-[-20%] w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-emerald-600/5 blur-3xl pointer-events-none" />

      {/* Confetti Visualizer Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" id="confetti-container">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Main Container constrained to Mobile viewport dimensions */}
      <main className="max-w-md mx-auto min-h-screen relative bg-[#F8F9FA] dark:bg-slate-900 flex flex-col text-[#1A1A1A] dark:text-slate-100">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="px-6 pt-6 pb-4 flex justify-between items-center sticky top-0 bg-[#F8F9FA]/95 dark:bg-slate-900/95 backdrop-blur-md z-30">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Sparkles className="w-5 h-5 fill-blue-500/20 stroke-[2.2]" />
            </span>
            <div>
              <h1 className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Aura Planner
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                Productive Mindset
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Dark Mode Switch */}
            <button
              id="btn-quick-theme-toggle"
              onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            >
              {preferences.darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Simulated Sync State */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/20 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Synced</span>
            </div>
          </div>
        </header>

        {/* CONTAINER ROUTING */}
        <div className="flex-1 px-5 py-4 overflow-y-auto no-scrollbar pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* --- 1. HOME SCREEN --- */}
              {activeTab === 'home' && (
                <div className="space-y-6" id="home-view">
                  {/* Daily Personalized Greeting Card */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
                        Hi, Alade! 👋
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        You've completed {todayStats.pct}% of your goals today.
                      </p>
                    </div>

                    {/* Progress Ring */}
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            className="stroke-[#E5E7EB] dark:stroke-slate-800"
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="32"
                            cy="32"
                            r="26"
                            className="stroke-blue-500"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 26}
                            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - todayStats.pct / 100) }}
                            transition={{ duration: 0.8 }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute font-display font-bold text-sm text-slate-800 dark:text-white">
                          {todayStats.pct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Suggestions Engine Slider */}
                  {suggestions.length > 0 && (
                    <div className="rounded-[24px] bg-blue-50 dark:bg-blue-950/20 p-4" id="smart-insights-panel">
                      <div className="flex items-center gap-1.5 mb-1 text-blue-500 dark:text-blue-400">
                        <Sparkles className="w-4 h-4 fill-blue-500/10" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Aura Insight Engine</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        "{suggestions[0].text}"
                      </p>
                    </div>
                  )}

                  {/* Home Segment Switcher */}
                  <div className="flex space-x-2 mb-8 bg-gray-100 dark:bg-slate-850 p-1 rounded-xl w-fit">
                    <button
                      id="btn-segment-today"
                      onClick={() => setHomeSegment('today')}
                      className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${homeSegment === 'today' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    >
                      Today
                    </button>
                    <button
                      id="btn-segment-upcoming"
                      onClick={() => setHomeSegment('upcoming')}
                      className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${homeSegment === 'upcoming' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    >
                      Upcoming
                    </button>
                    <button
                      id="btn-segment-habits"
                      onClick={() => setHomeSegment('habits')}
                      className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${homeSegment === 'habits' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    >
                      Habits
                    </button>
                  </div>

                  {/* List Container for Home segment */}
                  <div className="space-y-3">
                    {homeSegment === 'today' && (
                      <>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Scheduled Tasks</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{todayStats.tasksDone}/{todayStats.tasksTotal} Done</span>
                        </div>

                        {tasks.filter(t => t.dueDate === todayStr).length === 0 ? (
                          <div className="rounded-[24px] border border-dashed border-gray-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
                            <CheckCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">All clean! No tasks scheduled for today.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {tasks.filter(t => t.dueDate === todayStr).map(t => (
                              <TaskCard
                                key={t.id}
                                task={t}
                                onToggleComplete={handleToggleTaskComplete}
                                onTogglePin={handleToggleTaskPin}
                                onDelete={handleDeleteTask}
                                onEdit={(task) => { setEditingTask(task); setIsCreationOpen(true); }}
                                onToggleSubtask={handleToggleSubtask}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {homeSegment === 'upcoming' && (
                      <>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Future Agenda</span>
                        </div>

                        {tasks.filter(t => t.dueDate > todayStr).length === 0 ? (
                          <div className="rounded-[24px] border border-dashed border-gray-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
                            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">No upcoming tasks scheduled.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {tasks.filter(t => t.dueDate > todayStr).map(t => (
                              <TaskCard
                                key={t.id}
                                task={t}
                                onToggleComplete={handleToggleTaskComplete}
                                onTogglePin={handleToggleTaskPin}
                                onDelete={handleDeleteTask}
                                onEdit={(task) => { setEditingTask(task); setIsCreationOpen(true); }}
                                onToggleSubtask={handleToggleSubtask}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {homeSegment === 'habits' && (
                      <>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Habit List Tracker</span>
                        </div>

                        {habits.length === 0 ? (
                          <div className="rounded-[24px] border border-dashed border-gray-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
                            <Flame className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Build your systems! Add a recurring habit.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {habits.map(h => (
                              <HabitCard
                                key={h.id}
                                habit={h}
                                onToggleToday={handleToggleHabitToday}
                                onPause={handleTogglePauseHabit}
                                onDelete={handleDeleteHabit}
                                onDuplicate={handleDuplicateHabit}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Dynamic Motivational Quote Footnotes */}
                  <div className="rounded-[24px] border border-gray-100 dark:border-slate-850 p-4 text-center bg-slate-50 dark:bg-slate-850/30 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic text-left" id="motivational-quote-text">
                      {PRODUCTIVITY_QUOTES[quoteIdx]}
                    </p>
                  </div>
                </div>
              )}

              {/* --- 2. TASKS SCREEN --- */}
              {activeTab === 'tasks' && (
                <div className="space-y-5" id="tasks-view">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                        My Workspace Tasks
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Organize, sort, and execute milestones</p>
                    </div>
                  </div>

                  {/* Search, Filter & Sort Controls Grid */}
                  <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                      <input
                        id="input-search-tasks"
                        type="text"
                        placeholder="Search tasks name or details..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Category Selector */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          id="filter-category"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full bg-transparent border-none text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="All">All Categories</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          id="filter-priority"
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-full bg-transparent border-none text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="All">All Priorities</option>
                          <option value="Urgent">Urgent</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Sorting segmented row */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Sort criteria
                      </span>
                      <div className="flex bg-slate-100 dark:bg-slate-850 p-0.5 rounded-lg">
                        <button
                          id="btn-sort-time"
                          onClick={() => setSortBy('time')}
                          className={`px-2 py-1 text-[9px] font-bold rounded ${sortBy === 'time' ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Due Time
                        </button>
                        <button
                          id="btn-sort-priority"
                          onClick={() => setSortBy('priority')}
                          className={`px-2 py-1 text-[9px] font-bold rounded ${sortBy === 'priority' ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Priority
                        </button>
                        <button
                          id="btn-sort-name"
                          onClick={() => setSortBy('name')}
                          className={`px-2 py-1 text-[9px] font-bold rounded ${sortBy === 'name' ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Name
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Task categories panels */}
                  <div className="space-y-6">
                    {/* Pinned Tasks Group */}
                    {groupTasks.pinned.length > 0 && (
                      <div className="space-y-2.5" id="group-pinned-tasks">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1">
                          <Pin className="w-3 h-3 text-blue-500 transform rotate-45" /> Pinned Items
                        </h4>
                        <div className="space-y-3">
                          {groupTasks.pinned.map(t => (
                            <TaskCard
                              key={t.id}
                              task={t}
                              onToggleComplete={handleToggleTaskComplete}
                              onTogglePin={handleToggleTaskPin}
                              onDelete={handleDeleteTask}
                              onEdit={(task) => { setEditingTask(task); setIsCreationOpen(true); }}
                              onToggleSubtask={handleToggleSubtask}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overdue Tasks Group */}
                    {groupTasks.overdue.length > 0 && (
                      <div className="space-y-2.5" id="group-overdue-tasks">
                        <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider px-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Overdue Tasks
                        </h4>
                        <div className="space-y-3">
                          {groupTasks.overdue.map(t => (
                            <TaskCard
                              key={t.id}
                              task={t}
                              onToggleComplete={handleToggleTaskComplete}
                              onTogglePin={handleToggleTaskPin}
                              onDelete={handleDeleteTask}
                              onEdit={(task) => { setEditingTask(task); setIsCreationOpen(true); }}
                              onToggleSubtask={handleToggleSubtask}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Today's Tasks Group */}
                    <div className="space-y-2.5" id="group-today-tasks">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Today's Tasks
                      </h4>
                      {groupTasks.today.length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-1">No pending tasks for today.</p>
                      ) : (
                        <div className="space-y-3">
                          {groupTasks.today.map(t => (
                            <TaskCard
                              key={t.id}
                              task={t}
                              onToggleComplete={handleToggleTaskComplete}
                              onTogglePin={handleToggleTaskPin}
                              onDelete={handleDeleteTask}
                              onEdit={(task) => { setEditingTask(task); setIsCreationOpen(true); }}
                              onToggleSubtask={handleToggleSubtask}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upcoming Tasks Group */}
                    {groupTasks.upcoming.length > 0 && (
                      <div className="space-y-2.5" id="group-upcoming-tasks">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                          Upcoming / Future Agenda
                        </h4>
                        <div className="space-y-3">
                          {groupTasks.upcoming.map(t => (
                            <TaskCard
                              key={t.id}
                              task={t}
                              onToggleComplete={handleToggleTaskComplete}
                              onTogglePin={handleToggleTaskPin}
                              onDelete={handleDeleteTask}
                              onEdit={(task) => { setEditingTask(task); setIsCreationOpen(true); }}
                              onToggleSubtask={handleToggleSubtask}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Tasks Group */}
                    {groupTasks.completed.length > 0 && (
                      <div className="space-y-2.5 text-slate-400" id="group-completed-tasks">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider px-1">
                          Completed Workspace ({groupTasks.completed.length})
                        </h4>
                        <div className="space-y-3">
                          {groupTasks.completed.map(t => (
                            <TaskCard
                              key={t.id}
                              task={t}
                              onToggleComplete={handleToggleTaskComplete}
                              onTogglePin={handleToggleTaskPin}
                              onDelete={handleDeleteTask}
                              onEdit={(task) => { setEditingTask(task); setIsCreationOpen(true); }}
                              onToggleSubtask={handleToggleSubtask}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- 3. HABITS SCREEN --- */}
              {activeTab === 'habits' && (
                <div className="space-y-5" id="habits-view">
                  <div>
                    <h2 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                      Habit Architect
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Establish compound growth routines separate from tasks</p>
                  </div>

                  {/* Habit cards list */}
                  {habits.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-gray-200 dark:border-slate-850 p-12 text-center bg-white dark:bg-slate-900">
                      <Flame className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No recurring habits tracking yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Click the floating "+" button below to log a daily routine.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {habits.map(h => (
                        <HabitCard
                          key={h.id}
                          habit={h}
                          onToggleToday={handleToggleHabitToday}
                          onPause={handleTogglePauseHabit}
                          onDelete={handleDeleteHabit}
                          onDuplicate={handleDuplicateHabit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- 4. CALENDAR SCREEN --- */}
              {activeTab === 'calendar' && (
                <CalendarView
                  tasks={tasks}
                  habits={habits}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onToggleHabitToday={handleToggleHabitToday}
                />
              )}

              {/* --- 5. ANALYTICS SCREEN --- */}
              {activeTab === 'analytics' && (
                <AnalyticsView
                  tasks={tasks}
                  habits={habits}
                />
              )}

              {/* --- 6. PROFILE SCREEN --- */}
              {activeTab === 'profile' && (
                <div className="space-y-6" id="profile-view">
                  {/* Avatar & Score header */}
                  <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm text-center">
                    
                    {/* Visual custom gradient avatar */}
                    <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-display font-extrabold text-2xl shadow-lg ring-4 ring-slate-100 dark:ring-slate-800 mb-3">
                      AA
                    </div>

                    <h3 className="font-display font-bold text-slate-800 dark:text-white text-base">
                      Alade Alafia
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      aladealafia123@gmail.com
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Tasks</span>
                        <strong className="text-lg text-slate-800 dark:text-slate-100 font-display">
                          {tasks.filter(t => t.completed).length}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Habits Tracked</span>
                        <strong className="text-lg text-slate-800 dark:text-slate-100 font-display">
                          {habits.length}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Achievements Badge Sub-panel */}
                  <AchievementsView achievements={achievements} />

                  {/* Settings Module Panel */}
                  <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4" id="settings-panel">
                    <h4 className="font-display font-bold text-slate-800 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-850">
                      System Settings
                    </h4>

                    {/* Settings Lists */}
                    <div className="space-y-4 text-xs">
                      {/* Dark Mode toggle */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Theme Contrast (Dark Mode)</span>
                        <button
                          id="btn-toggle-dark-mode"
                          onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {preferences.darkMode ? 'Enabled (Dark)' : 'Disabled (Light)'}
                        </button>
                      </div>

                      {/* Theme Colors Choice */}
                      <div className="space-y-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Brand Color Accent</span>
                        <div className="flex gap-2">
                          {(['blue', 'indigo', 'violet', 'emerald', 'amber', 'rose', 'slate'] as const).map((col) => {
                            const bgColors = {
                              blue: 'bg-blue-500',
                              indigo: 'bg-indigo-500',
                              violet: 'bg-violet-500',
                              emerald: 'bg-emerald-500',
                              amber: 'bg-amber-500',
                              rose: 'bg-rose-500',
                              slate: 'bg-slate-500',
                            };
                            return (
                              <button
                                key={col}
                                id={`btn-theme-${col}`}
                                onClick={() => setPreferences(prev => ({ ...prev, themeColor: col }))}
                                className={`w-6 h-6 rounded-full ${bgColors[col]} ${preferences.themeColor === col ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-110' : ''}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Notification Switch */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Push Notifications Smart Prompts</span>
                        <input
                          id="checkbox-pref-notifications"
                          type="checkbox"
                          checked={preferences.notificationReminders}
                          onChange={(e) => setPreferences(prev => ({ ...prev, notificationReminders: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded bg-slate-100 dark:bg-slate-800 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Start of Week option */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Start Of Week Calendar</span>
                        <select
                          id="select-pref-startofweek"
                          value={preferences.startOfWeek}
                          onChange={(e) => setPreferences(prev => ({ ...prev, startOfWeek: e.target.value as 'Monday' | 'Sunday' }))}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-800"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>

                      {/* Default Home mode */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Default Launcher Mode</span>
                        <select
                          id="select-pref-defaultmode"
                          value={preferences.defaultHomeMode}
                          onChange={(e) => setPreferences(prev => ({ ...prev, defaultHomeMode: e.target.value as 'Productivity' | 'Habits' }))}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-800"
                        >
                          <option value="Productivity">Productivity (Tasks first)</option>
                          <option value="Habits">Habit Mode (Habits first)</option>
                        </select>
                      </div>

                      {/* Export & Data Backup controls */}
                      <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          id="btn-pref-export"
                          onClick={handleExportData}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-center flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-800"
                        >
                          <Download className="w-3.5 h-3.5" /> Export Data
                        </button>
                        
                        <button
                          id="btn-pref-reset"
                          onClick={handleResetData}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-semibold text-center flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-800"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Seed Reset
                        </button>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={handleSignOut}
                          className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-center flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-800"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* FLOATING ACTION TRIGGER BUTTON */}
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
          <motion.button
            id="floating-plus-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingTask(null); setIsCreationOpen(true); }}
            className="flex items-center gap-1.5 px-5 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-[0_8px_24px_rgba(59,130,246,0.35)] transition-all font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New</span>
          </motion.button>
        </div>

        {/* BOTTOM NAVIGATION NAVIGATION */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          tasksCount={tasks.filter(t => t.dueDate === todayStr && !t.completed).length}
          habitsCount={habits.filter(h => !h.paused && !h.history[todayStr]).length}
        />

        {/* BOTTOM SHEET TASK & HABIT FORM MODAL */}
        <TaskCreationModal
          isOpen={isCreationOpen}
          onClose={() => { setIsCreationOpen(false); setEditingTask(null); }}
          onSaveTask={handleSaveTask}
          onSaveHabit={handleSaveHabit}
          categories={categories}
          onCreateCategory={handleCreateCategory}
        />

      </main>
    </div>
  );
}
