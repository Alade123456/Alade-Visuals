import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, ArrowUpDown, Sparkles, 
  Download, Moon, Sun, Bell, BookOpen, Info, 
  Settings, Award, Flame, CheckCircle, Clock, Pin,
  Edit2, Trash2, Calendar, LayoutGrid, RotateCcw, AlertCircle,
  Play, Pause, Square, X, Zap
} from 'lucide-react';
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

import { Task, Habit, Category, Achievement, UserPreferences, SmartSuggestion, Priority, RepeatInterval, DailyGoalHistoryItem } from './types';
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  // --- SCROLL PRESERVATION REFS ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabScrollPositions = useRef<{ [key in TabId]?: number }>({});

  useEffect(() => {
    let unsubscribeSupabase: (() => void) | undefined;

    if (isSupabaseConfigured) {
      // 1. Supabase Auth Listener
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);
          localStorage.setItem('aura_auth', 'true');
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          setUserEmail(null);
          localStorage.removeItem('aura_auth');
        }
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);
          localStorage.setItem('aura_auth', 'true');
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          setUserEmail(null);
          localStorage.removeItem('aura_auth');
        }
        setAuthLoading(false);
      });

      unsubscribeSupabase = () => subscription.unsubscribe();
    } else {
      // 2. Local Storage Auth Fallback
      const isLocalAuth = localStorage.getItem('aura_auth') === 'true';
      if (isLocalAuth) {
        setIsAuthenticated(true);
        setUserId(localStorage.getItem('aura_local_uid') || 'local-user');
        setUserEmail(localStorage.getItem('aura_local_email') || 'aladealafia123@gmail.com');
        setDisplayName(localStorage.getItem('aura_local_username') || 'Alade');
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUserEmail(null);
      }
      
      const timer = setTimeout(() => {
        setAuthLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }

    return () => {
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
          // If the user has zero cloud data (i.e. brand new user signing in),
          // we start with a fresh clean state with zero statistics, instead of seeding from offline mock tasks.
          const hasNoCloudData = (!data.tasks || data.tasks.length === 0) && (!data.habits || data.habits.length === 0);
          if (hasNoCloudData) {
            setTasks([]);
            setHabits([]);
            setCategories(DEFAULT_CATEGORIES);
            setAchievements(INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: undefined })));
            setPreferences(DEFAULT_PREFERENCES);
            
            await syncPushAll(userId, {
              tasks: [],
              habits: [],
              categories: DEFAULT_CATEGORIES,
              achievements: INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: undefined })),
              preferences: DEFAULT_PREFERENCES
            });
          } else {
            // Otherwise, load whatever exists in the database
            setTasks(data.tasks || []);
            setHabits(data.habits || []);
            setCategories(data.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES);
            setAchievements(data.achievements && data.achievements.length > 0 ? data.achievements : INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlockedAt: undefined })));
            if (data.preferences) setPreferences(data.preferences);
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

  const [dailyGoalsHistory, setDailyGoalsHistory] = useState<DailyGoalHistoryItem[]>(() => {
    const saved = localStorage.getItem('aura_daily_goals_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'dg-seed-1',
        goal: 'Design high-fidelity product dashboard mockup',
        date: getOffsetDate(-1),
        completed: true,
        completedDate: getOffsetDate(-1)
      },
      {
        id: 'dg-seed-2',
        goal: 'Setup PostgreSQL database schema and migrations',
        date: getOffsetDate(-2),
        completed: true,
        completedDate: getOffsetDate(-2)
      },
      {
        id: 'dg-seed-3',
        goal: 'Write technical architecture design document',
        date: getOffsetDate(-3),
        completed: true,
        completedDate: getOffsetDate(-3)
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('aura_daily_goals_history', JSON.stringify(dailyGoalsHistory));
  }, [dailyGoalsHistory]);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const savedScreen = localStorage.getItem('aura_active_tab') as TabId;
    if (savedScreen) return savedScreen;

    const saved = localStorage.getItem('aura_preferences');
    if (saved) {
      const prefs: UserPreferences = JSON.parse(saved);
      return prefs.defaultHomeMode === 'Habits' ? 'habits' : 'home';
    }
    return 'home';
  });

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Modal Control
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Micro-interaction states
  const [showConfetti, setShowConfetti] = useState(false);

  const confettiPieces = React.useMemo(() => {
    if (!showConfetti) return [];
    return Array.from({ length: 150 }).map((_, i) => {
      const sizeRandom = Math.random();
      const width = 6 + sizeRandom * 10; // 6px to 16px
      const height = 8 + Math.random() * 12; // 8px to 20px
      const shapeVal = Math.random();
      let borderRadius = '0px';
      if (shapeVal > 0.7) {
        borderRadius = '50%';
      } else if (shapeVal > 0.4) {
        borderRadius = '20px';
      } else if (shapeVal > 0.1) {
        borderRadius = '2px';
      }
      
      const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
        '#a855f7', '#06b6d4', '#f43f5e', '#14b8a6', '#f97316'
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const animationDuration = 1.8 + Math.random() * 3.2; // 1.8s to 5.0s
      const animationDelay = Math.random() * 2.5; // 0s to 2.5s
      const animationName = ['confetti-fall-a', 'confetti-fall-b', 'confetti-fall-c'][Math.floor(Math.random() * 3)];
      
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        backgroundColor: color,
        width: `${width}px`,
        height: `${height}px`,
        borderRadius,
        animation: `${animationName} ${animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${animationDelay}s forwards`,
        opacity: 0.8 + Math.random() * 0.2,
      };
    });
  }, [showConfetti]);

  const [quoteIdx, setQuoteIdx] = useState(0);

  // Search & Filters (for Tasks screen)
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('aura_search_query') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => localStorage.getItem('aura_selected_category') || 'All');
  const [selectedPriority, setSelectedPriority] = useState<string>(() => localStorage.getItem('aura_selected_priority') || 'All');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'name'>(() => (localStorage.getItem('aura_sort_by') as any) || 'time');

  // Quick-Capture states
  const [quickTaskName, setQuickTaskName] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('Medium');

  // Segmented Control (for Home screen)
  const [homeSegment, setHomeSegment] = useState<'today' | 'upcoming' | 'habits' | 'history'>('today');

  // Daily Goal check-in state
  const [dailyGoalInput, setDailyGoalInput] = useState(() => {
    return localStorage.getItem('aura_draft_goal_input') || '';
  });
  const [isEditingDailyGoal, setIsEditingDailyGoal] = useState(false);
  const [displayName, setDisplayName] = useState('Alade');

  // --- FOCUS TIMER STATES ---
  const [focusDuration, setFocusDuration] = useState<number>(() => {
    const saved = localStorage.getItem('aura_focus_duration');
    return saved ? parseInt(saved, 10) : 25; // Default to 25 minutes
  });

  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'completed'>(() => {
    const saved = localStorage.getItem('aura_timer_state') as any;
    if (saved === 'running') {
      const savedEndTime = localStorage.getItem('aura_timer_end_time');
      if (savedEndTime) {
        const remaining = Math.max(0, Math.ceil((parseInt(savedEndTime, 10) - Date.now()) / 1000));
        if (remaining > 0) return 'running';
        return 'completed';
      }
    }
    return saved || 'idle';
  });

  const [endTime, setEndTime] = useState<number | null>(() => {
    const savedEndTime = localStorage.getItem('aura_timer_end_time');
    if (savedEndTime) {
      const remaining = Math.max(0, Math.ceil((parseInt(savedEndTime, 10) - Date.now()) / 1000));
      if (remaining > 0) return parseInt(savedEndTime, 10);
    }
    return null;
  });

  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(() => {
    const savedPaused = localStorage.getItem('aura_timer_paused_time_left');
    return savedPaused ? parseInt(savedPaused, 10) : null;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const savedState = localStorage.getItem('aura_timer_state');
    if (savedState === 'running') {
      const savedEndTime = localStorage.getItem('aura_timer_end_time');
      if (savedEndTime) {
        const remaining = Math.max(0, Math.ceil((parseInt(savedEndTime, 10) - Date.now()) / 1000));
        return remaining;
      }
    } else if (savedState === 'paused') {
      const savedPaused = localStorage.getItem('aura_timer_paused_time_left');
      if (savedPaused) return parseInt(savedPaused, 10);
    } else if (savedState === 'completed') {
      return 0;
    }
    const savedDuration = localStorage.getItem('aura_focus_duration');
    const dur = savedDuration ? parseInt(savedDuration, 10) : 25;
    return dur * 60; // in seconds
  });
  
  const [showConfirmStop, setShowConfirmStop] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pickerDuration, setPickerDuration] = useState(25);
  const [isEditingPicker, setIsEditingPicker] = useState(false);

  // --- SESSION PERSISTENCE SYNC EFFECTS ---
  useEffect(() => {
    localStorage.setItem('aura_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('aura_search_query', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('aura_selected_category', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem('aura_selected_priority', selectedPriority);
  }, [selectedPriority]);

  useEffect(() => {
    localStorage.setItem('aura_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (dailyGoalInput) {
      localStorage.setItem('aura_draft_goal_input', dailyGoalInput);
    } else {
      localStorage.removeItem('aura_draft_goal_input');
    }
  }, [dailyGoalInput]);

  useEffect(() => {
    localStorage.setItem('aura_timer_state', timerState);
    if (endTime !== null) {
      localStorage.setItem('aura_timer_end_time', endTime.toString());
    } else {
      localStorage.removeItem('aura_timer_end_time');
    }
    if (pausedTimeLeft !== null) {
      localStorage.setItem('aura_timer_paused_time_left', pausedTimeLeft.toString());
    } else {
      localStorage.removeItem('aura_timer_paused_time_left');
    }
  }, [timerState, endTime, pausedTimeLeft]);

  // Tab scroll restoration handler
  const handleTabChange = (newTab: TabId) => {
    if (scrollContainerRef.current) {
      tabScrollPositions.current[activeTab] = scrollContainerRef.current.scrollTop;
    }
    setActiveTab(newTab);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const savedPos = tabScrollPositions.current[activeTab] || 0;
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedPos;
        }
      }, 50);
    }
  }, [activeTab]);

  useEffect(() => {
    if (preferences.dailyGoal) {
      setDailyGoalInput(preferences.dailyGoal);
    } else {
      setDailyGoalInput('');
    }
  }, [preferences.dailyGoal]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Alade';
          const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
          setDisplayName(formattedName);
        }
      });
    } else {
      const rawName = localStorage.getItem('aura_local_username') || 'Alade';
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      setDisplayName(formattedName);
    }
  }, [userId]);

  // --- FOCUS TIMER EFFECTS ---
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (timerState === 'idle' || timerState === 'completed') {
      setTimeLeft(focusDuration * 60);
    }
  }, [focusDuration, timerState]);

  useEffect(() => {
    if (timerState === 'running') {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      document.title = `(${mins}:${secs.toString().padStart(2, '0')}) Focus | Aura Planner`;
    } else {
      document.title = 'Aura Planner';
    }
    return () => {
      document.title = 'Aura Planner';
    };
  }, [timerState, timeLeft]);

  useEffect(() => {
    if (timerState !== 'running' || endTime === null) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      setTimeLeft(remaining);

      if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
        const lastNotifiedStr = localStorage.getItem('aura_last_notified') || '0';
        const lastNotified = parseInt(lastNotifiedStr, 10);
        
        if (now - lastNotified >= 25000 || remaining <= 5) {
          localStorage.setItem('aura_last_notified', now.toString());
          try {
            new Notification('Focus Session Running', {
              body: `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')} remaining. Keep going on: ${preferences.dailyGoal || 'your primary focus'}`,
              tag: 'aura-focus-timer',
              silent: true,
            });
          } catch (e) {
            console.error('Error sending hidden notification:', e);
          }
        }
      }

      if (remaining <= 0) {
        clearInterval(interval);
        setTimerState('completed');
        setEndTime(null);
        setPausedTimeLeft(null);

        const todayStrVal = formatDate(new Date());
        setPreferences(prev => ({
          ...prev,
          dailyGoalCompleted: true,
          dailyGoalCompletedDate: todayStrVal
        }));
        
        setDailyGoalsHistory(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(item => item.date === todayStrVal);
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              completed: true,
              completedDate: todayStrVal
            };
          } else if (preferences.dailyGoal) {
            updated.push({
              id: `dg-${Date.now()}`,
              goal: preferences.dailyGoal,
              date: todayStrVal,
              completed: true,
              completedDate: todayStrVal
            });
          }
          return updated;
        });

        triggerConfetti();

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Session Completed! 🎉', {
              body: `Fantastic job! You've completed your focus duration of ${focusDuration} minutes.`,
              tag: 'aura-focus-timer',
              silent: false,
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerState, endTime, preferences.dailyGoal, focusDuration]);

  const handleStartTimer = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    const durationInSeconds = pausedTimeLeft !== null ? pausedTimeLeft : focusDuration * 60;
    setEndTime(Date.now() + durationInSeconds * 1000);
    setTimerState('running');
    setPausedTimeLeft(null);
  };

  const handlePauseTimer = () => {
    if (timerState !== 'running' || endTime === null) return;
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    setPausedTimeLeft(remaining);
    setTimerState('paused');
    setEndTime(null);
  };

  const handleStopTimer = () => {
    if (timerState === 'running' || timerState === 'paused') {
      setShowConfirmStop(true);
    } else {
      setTimerState('idle');
      setTimeLeft(focusDuration * 60);
      setEndTime(null);
      setPausedTimeLeft(null);
    }
  };

  const handleConfirmStopTimer = (confirm: boolean) => {
    setShowConfirmStop(false);
    if (confirm) {
      setTimerState('idle');
      setTimeLeft(focusDuration * 60);
      setEndTime(null);
      setPausedTimeLeft(null);
    }
  };

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

  const handleQuickAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskName.trim()) return;

    const todayStr = formatDate(new Date());
    const defaultCategory = categories[0]?.name || 'Personal';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: quickTaskName.trim(),
      description: '',
      category: defaultCategory,
      priority: quickTaskPriority,
      dueDate: todayStr,
      dueTime: '12:00',
      reminder: false,
      repeat: 'None',
      colorLabel: quickTaskPriority === 'Urgent' ? '#ef4444' : quickTaskPriority === 'High' ? '#f97316' : quickTaskPriority === 'Medium' ? '#3b82f6' : '#64748b',
      duration: 30,
      subtasks: [],
      notes: '',
      completed: false,
      pinned: false,
      order: tasks.length + 1
    };

    setTasks(prev => [newTask, ...prev]);
    setQuickTaskName('');
    setQuickTaskPriority('Medium');
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
    }
    setIsAuthenticated(false);
    setUserId(null);
    setUserEmail(null);
    localStorage.removeItem('aura_auth');
    localStorage.removeItem('aura_timer_state');
    localStorage.removeItem('aura_timer_end_time');
    localStorage.removeItem('aura_timer_paused_time_left');
    localStorage.removeItem('aura_active_tab');
    localStorage.removeItem('aura_draft_goal_input');
    
    setTimerState('idle');
    setTimeLeft(focusDuration * 60);
    setEndTime(null);
    setPausedTimeLeft(null);
    setActiveTab('home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* GoalMi Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25"
          >
            <span className="text-white text-4xl font-bold font-sans">G</span>
          </motion.div>
          
          {/* App Name */}
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">GoalsMi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">Productive Mindset</p>
          
          {/* Subtle Loading Animation */}
          <div className="flex justify-center items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </motion.div>
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
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="confetti-piece"
              style={{
                left: piece.left,
                backgroundColor: piece.backgroundColor,
                width: piece.width,
                height: piece.height,
                borderRadius: piece.borderRadius,
                animation: piece.animation,
                opacity: piece.opacity,
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
        <div ref={scrollContainerRef} className="flex-1 px-5 py-4 overflow-y-auto no-scrollbar pb-16">
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
                        Hi, {displayName}! 👋
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

                  {/* Daily Check-In Prompt / Focus Block */}
                  {(!preferences.dailyGoal || preferences.dailyGoalDate !== todayStr || isEditingDailyGoal) ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[24px] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-5 text-white shadow-lg shadow-blue-500/10 animate-fade-in"
                      id="daily-checkin-prompt"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 bg-white/10 rounded-lg text-white">
                          <Sparkles className="w-4 h-4 fill-white/10" />
                        </span>
                        <span className="text-xs uppercase font-bold tracking-wider text-blue-100">Daily Check-In</span>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-3">
                        What is your primary goal for today?
                      </h3>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const goalText = dailyGoalInput.trim();
                          if (!goalText) return;
                          setPreferences(prev => ({
                            ...prev,
                            dailyGoal: goalText,
                            dailyGoalDate: todayStr,
                            dailyGoalCompleted: false,
                            dailyGoalCompletedDate: ''
                          }));
                          
                          setDailyGoalsHistory(prev => {
                            const updated = [...prev];
                            const idx = updated.findIndex(item => item.date === todayStr);
                            if (idx >= 0) {
                              updated[idx] = {
                                ...updated[idx],
                                goal: goalText,
                                completed: false,
                                completedDate: ''
                              };
                            } else {
                              updated.push({
                                id: `dg-${Date.now()}`,
                                goal: goalText,
                                date: todayStr,
                                completed: false,
                                completedDate: ''
                              });
                            }
                            return updated;
                          });

                          setIsEditingDailyGoal(false);
                          setShowConfetti(true);
                          setTimeout(() => setShowConfetti(false), 3000);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={dailyGoalInput}
                          onChange={(e) => setDailyGoalInput(e.target.value)}
                          placeholder="e.g., Complete Quarterly Presentation..."
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-100/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!dailyGoalInput.trim()}
                          className="px-4 py-2.5 bg-white text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center"
                        >
                          Confirm
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[24px] bg-white dark:bg-slate-850 p-5 border border-slate-100 dark:border-slate-800/80 shadow-sm"
                      id="daily-focus-display"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => {
                              const isCompleted = !preferences.dailyGoalCompleted;
                              const completedDateStr = isCompleted ? todayStr : '';
                              setPreferences(prev => ({
                                ...prev,
                                dailyGoalCompleted: isCompleted,
                                dailyGoalCompletedDate: completedDateStr
                              }));
                              
                              setDailyGoalsHistory(prev => {
                                const updated = [...prev];
                                const idx = updated.findIndex(item => item.date === todayStr);
                                if (idx >= 0) {
                                  updated[idx] = {
                                    ...updated[idx],
                                    completed: isCompleted,
                                    completedDate: completedDateStr
                                  };
                                } else if (preferences.dailyGoal) {
                                  updated.push({
                                    id: `dg-${Date.now()}`,
                                    goal: preferences.dailyGoal,
                                    date: todayStr,
                                    completed: isCompleted,
                                    completedDate: completedDateStr
                                  });
                                }
                                return updated;
                              });

                              if (isCompleted) {
                                setShowConfetti(true);
                                setTimeout(() => setShowConfetti(false), 3000);
                              }
                            }}
                            className={`mt-1 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                              preferences.dailyGoalCompleted 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500'
                            }`}
                          >
                            {preferences.dailyGoalCompleted && (
                              <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          
                          <div>
                            <div className="flex items-center gap-1.5 mb-1 text-slate-400 dark:text-slate-500">
                              <span className={`w-1.5 h-1.5 rounded-full ${preferences.dailyGoalCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="text-[10px] uppercase font-bold tracking-wider">
                                {preferences.dailyGoalCompleted ? 'Daily Goal Completed!' : "Today's Primary Focus"}
                              </span>
                            </div>
                            <h3 className={`font-display font-extrabold text-lg text-slate-900 dark:text-white leading-tight ${
                              preferences.dailyGoalCompleted ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : ''
                            }`}>
                              {preferences.dailyGoal}
                            </h3>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setDailyGoalInput(preferences.dailyGoal || '');
                            setIsEditingDailyGoal(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Edit primary focus"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* --- FOCUS TIMER CARD --- */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="focus-timer-card"
                    className={`rounded-[24px] bg-white dark:bg-slate-850 p-5 border relative overflow-hidden transition-all duration-300 ${
                      timerState === 'running'
                        ? 'animate-border-pulse'
                        : 'border-slate-100 dark:border-slate-800/80 shadow-sm'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg shrink-0">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                            Focus Timer
                          </span>
                        </div>
                      </div>
                      
                      <button
                        id="btn-timer-settings"
                        onClick={() => {
                          setPickerDuration(focusDuration);
                          setIsSettingsOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Focus Timer Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Accidental Stop Confirmation Overlay inside the card */}
                    {showConfirmStop && (
                      <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-10 p-5 flex flex-col justify-center items-center text-center animate-fade-in">
                        <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
                        <h4 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                          Stop active session?
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[80%]">
                          Your current focus session progress will be lost.
                        </p>
                        <div className="flex gap-2.5 mt-4 w-full max-w-[240px]">
                          <button
                            id="btn-confirm-stop-yes"
                            onClick={() => handleConfirmStopTimer(true)}
                            className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm shadow-rose-500/15"
                          >
                            Yes, Stop
                          </button>
                          <button
                            id="btn-confirm-stop-no"
                            onClick={() => handleConfirmStopTimer(false)}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Keep Going
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Congratulatory State inside the card */}
                    {timerState === 'completed' ? (
                      <div className="text-center py-4 flex flex-col items-center">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                          <Award className="w-8 h-8 stroke-[2.2]" />
                        </div>
                        <h4 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                          Fantastic Job! 🎉
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[85%]">
                          You focused successfully on: <span className="font-bold text-slate-800 dark:text-slate-200">"{preferences.dailyGoal || 'your daily objective'}"</span>
                        </p>
                        <button
                          id="btn-reset-timer-done"
                          onClick={() => {
                            setTimerState('idle');
                            setTimeLeft(focusDuration * 60);
                          }}
                          className="mt-4 px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm shadow-indigo-500/20"
                        >
                          Start New Session
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Target Focus Goal Title */}
                        <div className="text-center px-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Currently Focusing On</p>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-1 italic">
                            "{preferences.dailyGoal || 'No primary goal set for today'}"
                          </p>
                        </div>

                        {/* Circular Progress Ring or Idle Display */}
                        <div className="relative flex justify-center items-center py-2">
                          <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="72"
                                cy="72"
                                r="64"
                                className="stroke-slate-100 dark:stroke-slate-800/80"
                                strokeWidth="5"
                                fill="transparent"
                              />
                              <motion.circle
                                cx="72"
                                cy="72"
                                r="64"
                                className="stroke-indigo-500"
                                strokeWidth="5"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 64}
                                initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                                animate={{
                                  strokeDashoffset:
                                    2 * Math.PI * 64 *
                                    (1 - (focusDuration * 60 - timeLeft) / (focusDuration * 60))
                                }}
                                transition={{ duration: 0.35 }}
                                strokeLinecap="round"
                              />
                            </svg>
                            
                            <div className="absolute flex flex-col items-center">
                              <span className="font-mono font-extrabold text-2xl tracking-tight text-slate-800 dark:text-white">
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                              </span>
                              
                              {/* Percentage completed */}
                              {timerState !== 'idle' && (
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 animate-pulse">
                                  {Math.round(((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100)}% Done
                                </span>
                              )}
                              
                              {timerState === 'idle' && (
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                  {focusDuration}m Goal
                                </span>
                              )}
                              
                              {timerState === 'paused' && (
                                <span className="text-[10px] font-bold text-amber-500 mt-0.5 uppercase tracking-wide">
                                  Paused
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center items-center gap-3">
                          {/* Play / Start Button */}
                          {timerState !== 'running' ? (
                            <button
                              id="btn-timer-start"
                              onClick={handleStartTimer}
                              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-500/20"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              {timerState === 'paused' ? 'Resume' : 'Start'}
                            </button>
                          ) : (
                            /* Pause Button */
                            <button
                              id="btn-timer-pause"
                              onClick={handlePauseTimer}
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20"
                            >
                              <Pause className="w-3.5 h-3.5 fill-white" />
                              Pause
                            </button>
                          )}

                          {/* Stop / Reset Button */}
                          <button
                            id="btn-timer-stop"
                            onClick={handleStopTimer}
                            disabled={timerState === 'idle'}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            Stop
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>

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
                  <div className="flex flex-wrap gap-1 mb-8 bg-gray-100 dark:bg-slate-850 p-1 rounded-xl w-fit">
                    <button
                      id="btn-segment-today"
                      onClick={() => setHomeSegment('today')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${homeSegment === 'today' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    >
                      Today
                    </button>
                    <button
                      id="btn-segment-upcoming"
                      onClick={() => setHomeSegment('upcoming')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${homeSegment === 'upcoming' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    >
                      Upcoming
                    </button>
                    <button
                      id="btn-segment-habits"
                      onClick={() => setHomeSegment('habits')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${homeSegment === 'habits' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    >
                      Habits
                    </button>
                    <button
                      id="btn-segment-history"
                      onClick={() => setHomeSegment('history')}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${homeSegment === 'history' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                    >
                      History
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

                    {homeSegment === 'history' && (
                      <>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Completed Daily Goals</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                            {dailyGoalsHistory.filter(item => item.completed && item.date !== todayStr).length} Completed
                          </span>
                        </div>

                        {dailyGoalsHistory.filter(item => item.completed && item.date !== todayStr).length === 0 ? (
                          <div className="rounded-[24px] border border-dashed border-gray-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
                            <Award className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">No completed goals recorded for previous dates yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                            {dailyGoalsHistory
                              .filter(item => item.completed && item.date !== todayStr)
                              .sort((a, b) => b.date.localeCompare(a.date))
                              .map(item => {
                                // Format the date nicely, e.g., July 2, 2026
                                const dateObj = new Date(item.date + 'T12:00:00');
                                const formattedHistoryDate = dateObj.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                });
                                return (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-[20px] bg-white dark:bg-slate-850 p-4 border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                                      </div>
                                      <div>
                                        <p className="font-display font-semibold text-sm text-slate-800 dark:text-slate-200 line-through decoration-slate-400 dark:decoration-slate-500">
                                          {item.goal}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                          Completed on {formattedHistoryDate}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-mono font-medium px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                      {item.date}
                                    </span>
                                  </motion.div>
                                );
                              })}
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

                  {/* Quick-Capture Input Field */}
                  <form onSubmit={handleQuickAddTask} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 p-3.5 rounded-3xl border border-blue-100/70 dark:border-slate-800 shadow-sm" id="quick-capture-form">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <input
                        id="input-quick-task"
                        type="text"
                        placeholder="Quick-Capture: Type task title and press Enter..."
                        value={quickTaskName}
                        onChange={(e) => setQuickTaskName(e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    
                    {/* Inline Priority Selector */}
                    <div className="flex items-center gap-1.5 justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                        Priority:
                      </span>
                      <div className="flex gap-1" id="quick-priority-picker">
                        {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map((p) => {
                          const isSelected = quickTaskPriority === p;
                          const colors = {
                            Low: isSelected ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                            Medium: isSelected ? 'bg-blue-500 text-white shadow-sm' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30',
                            High: isSelected ? 'bg-orange-500 text-white shadow-sm' : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30',
                            Urgent: isSelected ? 'bg-rose-500 text-white shadow-sm' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30',
                          };
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setQuickTaskPriority(p)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${colors[p]}`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="submit"
                        disabled={!quickTaskName.trim()}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          quickTaskName.trim()
                            ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </form>

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
                      {displayName || 'Alade Alafia'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {userEmail || 'aladealafia123@gmail.com'}
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
                          onClick={() => setShowSignOutConfirm(true)}
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
          onChangeTab={handleTabChange}
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

        {/* BOTTOM SHEET FOCUS TIMER SETTINGS */}
        <AnimatePresence>
          {isSettingsOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsEditingPicker(false);
                }}
                id="timer-settings-backdrop"
                className="fixed inset-0 bg-black z-50 pointer-events-auto"
              />

              {/* Bottom Sheet Modal Container */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                id="timer-settings-sheet"
                className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-50 pb-8 border-t border-slate-100 dark:border-slate-800"
              >
                {/* Header Handle */}
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3" />

                <div className="px-6 flex justify-between items-center mb-5">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">
                    Focus Settings
                  </h3>
                  <button
                    id="btn-close-timer-settings"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsEditingPicker(false);
                    }}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 space-y-5">
                  <div>
                    <label className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      Focus Duration
                    </label>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Current Duration</span>
                        <span className="font-display font-extrabold text-slate-800 dark:text-white text-base">
                          {focusDuration} Minutes
                        </span>
                      </div>
                      
                      {!isEditingPicker && (
                        <button
                          id="btn-trigger-edit-duration"
                          onClick={() => {
                            setPickerDuration(focusDuration);
                            setIsEditingPicker(true);
                          }}
                          className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          ✏️ Edit Duration
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4"
                      id="duration-edit-form"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose custom duration:</span>
                        <span className="font-mono font-extrabold text-indigo-500 dark:text-indigo-400 text-lg">
                          {pickerDuration} mins
                        </span>
                      </div>
                      
                      {/* Range slider or native number input */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPickerDuration(prev => Math.max(5, prev - 5))}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750"
                          >
                            -
                          </button>
                          
                          <input
                            type="range"
                            min="5"
                            max="120"
                            step="1"
                            value={pickerDuration}
                            onChange={(e) => setPickerDuration(parseInt(e.target.value, 10))}
                            className="flex-1 accent-indigo-500 dark:accent-indigo-400 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                          />
                          
                          <button
                            type="button"
                            onClick={() => setPickerDuration(prev => Math.min(120, prev + 5))}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-755"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                          <span>5 Min</span>
                          <span>60 Min</span>
                          <span>120 Min</span>
                        </div>
                      </div>

                      {/* Manual text picker fallback for full native inputs */}
                      <div className="flex gap-2.5 items-center pt-2">
                        <span className="text-xs text-slate-400 font-semibold shrink-0">Or enter:</span>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={pickerDuration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setPickerDuration(Math.min(120, Math.max(5, val)));
                            }
                          }}
                          className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-400 font-semibold">minutes</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          id="btn-save-duration"
                          onClick={() => {
                            setFocusDuration(pickerDuration);
                            localStorage.setItem('aura_focus_duration', pickerDuration.toString());
                            if (timerState === 'idle' || timerState === 'completed') {
                              setTimeLeft(pickerDuration * 60);
                            }
                            setIsEditingPicker(false);
                            setIsSettingsOpen(false);
                          }}
                          className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm shadow-indigo-500/15"
                        >
                          Save
                        </button>
                        <button
                          id="btn-cancel-edit-duration"
                          onClick={() => setIsEditingPicker(false)}
                          className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* SIGN OUT CONFIRMATION MODAL */}
        <AnimatePresence>
          {showSignOutConfirm && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSignOutConfirm(false)}
                className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 pointer-events-auto backdrop-blur-sm"
                id="signout-confirm-backdrop"
              />

              {/* Centered Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 m-auto w-[90%] max-w-sm h-fit bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl z-50 border border-slate-100 dark:border-slate-800 text-center"
                id="signout-confirm-dialog"
              >
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                </div>
                
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
                  Sign Out
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Are you sure you want to sign out of GoalMi?
                </p>

                <div className="flex gap-3">
                  <button
                    id="btn-confirm-signout-cancel"
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-signout-ok"
                    onClick={async () => {
                      setShowSignOutConfirm(false);
                      await handleSignOut();
                    }}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-sm shadow-rose-500/15 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
