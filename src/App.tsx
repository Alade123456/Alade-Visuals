import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, ArrowUpDown, Sparkles, FileText, StickyNote, 
  Download, Moon, Sun, Bell, BookOpen, Info, 
  Settings, Award, Flame, CheckCircle, Clock, Pin,
  Edit2, Trash2, Calendar, LayoutGrid, RotateCcw, AlertCircle,
  Play, Pause, Square, X, Zap, ChevronDown, ChevronUp, ChevronRight, Check, Coffee, Timer, LogOut,
  Briefcase, User, Activity, DollarSign, ShoppingCart, Bookmark, Star, Target, Home
} from 'lucide-react';
import { Task, Habit, Category, Achievement, UserPreferences, SmartSuggestion, Priority, RepeatInterval, Note } from './types';
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
import AnimatedCounter from './components/AnimatedCounter';
import DailySummaryModal from './components/DailySummaryModal';
import confetti from 'canvas-confetti';
import { useSupabaseArraySync, useSupabaseObjectSync } from './useSupabaseSync';
import { useTaskReminders } from './useTaskReminders';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAppInitializing, setIsAppInitializing] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setIsAppInitializing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Trigger Daily Summary Modal when the app is initialized and user is authenticated
  useEffect(() => {
    if (!isAppInitializing && isAuthenticated) {
      const todayStr = formatDate(new Date());
      const lastShownDate = localStorage.getItem('goalsmi_last_summary_shown_date');
      if (lastShownDate !== todayStr) {
        setIsDailySummaryOpen(true);
      }
    }
  }, [isAppInitializing, isAuthenticated]);

  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('aura_local_username') || '';
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('aura_local_avatar') || '';
  });

  useEffect(() => {
    // Import supabase dynamically or import it at the top
    import('./supabaseClient').then(({ supabase }) => {
      const handleSessionChange = (session: any) => {
        if (session) {
          setIsAuthenticated(true);
          
          // Try to extract metadata
          const userMetadata = session.user?.user_metadata || {};
          
          // Google provider supplies full_name or name, and avatar_url
          // Manual signup supplies username and avatar_idx
          const googleName = userMetadata.full_name || userMetadata.name || session.user?.email?.split('@')[0] || 'User';
          
          const currentLocalName = localStorage.getItem('aura_local_username');
          const finalUsername = currentLocalName || userMetadata.username || googleName;
          
          setDisplayName(finalUsername);
          localStorage.setItem('aura_local_username', finalUsername);
          
          // Handle avatar
          const currentLocalAvatar = localStorage.getItem('aura_local_avatar');
          if (!currentLocalAvatar) {
            let finalAvatar = '';
            if (typeof userMetadata.avatar_idx === 'number') {
              const preset = AVATAR_PRESETS[userMetadata.avatar_idx] || AVATAR_PRESETS[0];
              finalAvatar = `preset|${preset.emoji}|${preset.bg}`;
            } else if (userMetadata.avatar_url) {
              finalAvatar = userMetadata.avatar_url;
            } else {
              const preset = AVATAR_PRESETS[0];
              finalAvatar = `preset|${preset.emoji}|${preset.bg}`;
            }
            setAvatarUrl(finalAvatar);
            localStorage.setItem('aura_local_avatar', finalAvatar);
          } else {
            setAvatarUrl(currentLocalAvatar);
          }

          localStorage.setItem('aura_auth', 'true');
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('aura_auth');
        }
      };

      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSessionChange(session);
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleSessionChange(session);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  // If this window is a Supabase OAuth popup, notify parent and close
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      if (isAuthenticated) {
        try {
          window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
        } catch (e) {
          // ignore potential cross-origin issues
        }
        window.close();
      }
    }
  }, [isAuthenticated]);

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
  const [notes, setNotes] = useState<Note[]>(() => loadLocal('aura_notes', []));

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [profileSubTab, setProfileSubTab] = useState<'achievements' | 'analytics' | 'calendar' | 'settings'>('achievements');
  const [isCreating, setIsCreating] = useState(false);
  const [modalInitialStage, setModalInitialStage] = useState<'select' | 'task' | 'habit'>('select');
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);

  const openCreateModal = (stage: 'select' | 'task' | 'habit' = 'select') => {
    setModalInitialStage(stage);
    setIsCreating(true);
  };

  // Profile management states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Search & Filter state for Tasks console
  const [taskSearch, setTaskSearch] = useState('');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('All');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('All');
  const [taskSort, setTaskSort] = useState<'time' | 'priority' | 'completion'>('time');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Interactive custom notifications/toasts
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  // --- FOCUS TIMER OVERLAY STATE ---
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [activeFocusTimerMode, setActiveFocusTimerMode] = useState<'idle' | 'work' | 'break'>('idle');
  const [activeFocusTimerStatus, setActiveFocusTimerStatus] = useState<'paused' | 'running'>('paused');
  const [activeFocusTimeLeft, setActiveFocusTimeLeft] = useState(25 * 60);
  const [showFocusOverlay, setShowFocusOverlay] = useState(false);
  const [showTimerEdit, setShowTimerEdit] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync to Supabase in real-time while preserving optimistic UI
  useSupabaseArraySync('tasks', tasks, setTasks, isAuthenticated);
  useSupabaseArraySync('habits', habits, setHabits, isAuthenticated);
  useSupabaseArraySync('categories', categories, setCategories, isAuthenticated);
  useSupabaseArraySync('achievements', achievements, setAchievements, isAuthenticated);
  useSupabaseArraySync('notes', notes, setNotes, isAuthenticated);
  useSupabaseObjectSync('preferences', preferences, setPreferences, isAuthenticated);

  // Initialize task reminders notification check
  useTaskReminders(tasks);

  // Persist to local storage whenever data changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('aura_tasks', JSON.stringify(tasks));
      localStorage.setItem('aura_habits', JSON.stringify(habits));
      localStorage.setItem('aura_categories', JSON.stringify(categories));
      localStorage.setItem('aura_achievements', JSON.stringify(achievements));
      localStorage.setItem('aura_preferences', JSON.stringify(preferences));
      localStorage.setItem('aura_notes', JSON.stringify(notes));
    }
  }, [tasks, habits, categories, achievements, preferences, notes, isAuthenticated]);

  // Automatically deletes notes older than 7 days when the app loads
  useEffect(() => {
    const isAutoCleanupEnabled = preferences.autoDeleteOldNotes ?? true;
    if (isAutoCleanupEnabled) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      setNotes(prevNotes => {
        const remainingNotes = prevNotes.filter(note => {
          const noteTime = new Date(note.createdAt).getTime();
          return noteTime >= sevenDaysAgo;
        });
        return remainingNotes;
      });
    }
  }, []);

  // Synchronize dark mode class
  useEffect(() => {
    // Add a class to enable global transitions for theme colors
    document.documentElement.classList.add('theme-transitioning');
    
    const applyTheme = () => {
      let isDark = false;
      if (preferences.darkMode === 'Auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = !!preferences.darkMode;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Set up media query listener if 'Auto' is selected
    let mediaQuery: MediaQueryList | null = null;
    let listener: ((e: MediaQueryListEvent) => void) | null = null;

    if (preferences.darkMode === 'Auto') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      listener = (e: MediaQueryListEvent) => {
        document.documentElement.classList.add('theme-transitioning');
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 300);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else if ((mediaQuery as any).addListener) {
        // Fallback for older browsers
        (mediaQuery as any).addListener(listener);
      }
    }

    // Remove the global transition class after the transition duration
    const timeout = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (mediaQuery && listener) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', listener);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(listener);
        }
      }
    };
  }, [preferences.darkMode]);

  const unlockAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          // Play a very short silent note to trigger actual hardware playback unlock
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(0);
          osc.stop(0.01);
          setIsAudioUnlocked(true);
        }).catch(err => {
          console.warn("Failed to resume audio context:", err);
        });
      } else {
        setIsAudioUnlocked(true);
      }
    } catch (error) {
      console.warn("Failed to unlock audio context:", error);
    }
  };

  const playTimerCompleteSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = audioContextRef.current || new AudioContextClass();
      if (!audioContextRef.current) {
        audioContextRef.current = ctx;
      }
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playNote = (frequency: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.6, startTime + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playNote(523.25, now, 0.4);        // C5
      playNote(659.25, now + 0.12, 0.4); // E5
      playNote(783.99, now + 0.24, 0.4); // G5
      playNote(1046.50, now + 0.36, 0.8); // C6
    } catch (error) {
      console.warn("Could not play synthesized audio alert:", error);
    }
  };

  // Focus Timer Interval
  useEffect(() => {
    let interval: any;
    if (activeFocusTimerStatus === 'running' && activeFocusTimeLeft > 0) {
      interval = setInterval(() => {
        setActiveFocusTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (activeFocusTimeLeft === 0 && activeFocusTaskId) {
      // Play beautiful alert sound!
      playTimerCompleteSound();

      // Auto-switch mode on complete
      if (activeFocusTimerMode === 'work') {
        setActiveFocusTimerMode('break');
        setActiveFocusTimeLeft((preferences.pomodoroBreakMinutes ?? 5) * 60); // Break duration
        setActiveFocusTimerStatus('paused');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100, 50, 100]);
        }
      } else if (activeFocusTimerMode === 'break') {
        setActiveFocusTimerMode('work');
        setActiveFocusTimeLeft((preferences.pomodoroWorkMinutes ?? 25) * 60); // Work duration
        setActiveFocusTimerStatus('paused');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([80, 40, 80]);
        }
      }
    }
    return () => clearInterval(interval);
  }, [activeFocusTimerStatus, activeFocusTimeLeft, activeFocusTimerMode, activeFocusTaskId, preferences.pomodoroWorkMinutes, preferences.pomodoroBreakMinutes]);

  // Keep initial active focus time left in sync with user preferences when idle
  useEffect(() => {
    if (activeFocusTimerMode === 'idle') {
      setActiveFocusTimeLeft((preferences.pomodoroWorkMinutes ?? 25) * 60);
    }
  }, [preferences.pomodoroWorkMinutes, activeFocusTimerMode]);

  const handleStartFocus = (taskId: string) => {
    unlockAudio();
    setActiveFocusTaskId(taskId);
    setActiveFocusTimerMode('work');
    setActiveFocusTimerStatus('running');
    setActiveFocusTimeLeft((preferences.pomodoroWorkMinutes ?? 25) * 60);
    setShowFocusOverlay(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  };

  const handlePauseFocus = () => {
    unlockAudio();
    setActiveFocusTimerStatus('paused');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  const handleResumeFocus = () => {
    unlockAudio();
    setActiveFocusTimerStatus('running');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  const handleStopFocus = () => {
    setActiveFocusTaskId(null);
    setActiveFocusTimerMode('idle');
    setActiveFocusTimerStatus('paused');
    setActiveFocusTimeLeft((preferences.pomodoroWorkMinutes ?? 25) * 60);
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
    
    // Reload state from local storage or set defaults
    setTasks(loadLocal('aura_tasks', getInitialTasks()));
    setHabits(loadLocal('aura_habits', getInitialHabits()));
    setCategories(loadLocal('aura_categories', DEFAULT_CATEGORIES));
    setAchievements(loadLocal('aura_achievements', INITIAL_ACHIEVEMENTS));
    setPreferences(loadLocal('aura_preferences', DEFAULT_PREFERENCES));
  };

  const handleResetData = () => {
    localStorage.removeItem('aura_last_confetti_date');
    localStorage.removeItem('aura_tasks');
    localStorage.removeItem('aura_habits');
    localStorage.removeItem('aura_achievements');
    localStorage.removeItem('aura_notes');
    setTasks([]);
    setHabits([]);
    setNotes([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setNotification({
      title: 'Data Reset',
      message: 'App statistics, tasks, habits, and notes have been reset to 0.',
    });
  };

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('./supabaseClient');
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    localStorage.removeItem('aura_auth');
    localStorage.removeItem('aura_notes');
    setTasks([]);
    setHabits([]);
    setNotes([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setPreferences(DEFAULT_PREFERENCES);
    setAvatarUrl('');
    setDisplayName('');
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
    setSelectedTaskIds(prev => prev.filter(taskId => taskId !== id));
  };

  const handleToggleSelectAll = () => {
    const allFilteredSelected = sortedTasks.length > 0 && sortedTasks.every(t => selectedTaskIds.includes(t.id));
    if (allFilteredSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !sortedTasks.some(t => t.id === id)));
    } else {
      const newSelections = sortedTasks.map(t => t.id);
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...newSelections])));
    }
  };

  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const handleBatchDeleteTasks = () => {
    if (selectedTaskIds.length === 0) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the ${selectedTaskIds.length} selected tasks?`);
    if (confirmDelete) {
      setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id)));
      setSelectedTaskIds([]);
    }
  };

  const handleBatchCompleteTasks = () => {
    if (selectedTaskIds.length === 0) return;
    let triggeredConfetti = false;
    const updatedTasks = tasks.map(t => {
      if (selectedTaskIds.includes(t.id)) {
        const isNowCompleted = true;
        if (isNowCompleted && !t.completed) {
          const completedToday = tasks.some(task => task.completed && task.completedAt && task.completedAt.startsWith(todayStr));
          const lastConfettiDate = localStorage.getItem('aura_last_confetti_date');
          
          if (!completedToday && lastConfettiDate !== todayStr) {
            triggeredConfetti = true;
            localStorage.setItem('aura_last_confetti_date', todayStr);
          }
        }
        return { 
          ...t, 
          completed: true, 
          completedAt: t.completed ? t.completedAt : new Date().toISOString()
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    setSelectedTaskIds([]);

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

  const handleEditTask = (task: Task, updatedName?: string) => {
    const newName = updatedName !== undefined ? updatedName : prompt("Edit Task Name:", task.name);
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

  // Category management states
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [showAddCategorySection, setShowAddCategorySection] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-blue-500');
  const [newCatIcon, setNewCatIcon] = useState('Bookmark');

  const TAILWIND_COLOR_PRESETS = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-slate-500',
  ];

  const AVAILABLE_ICONS = [
    'Briefcase',
    'User',
    'Activity',
    'BookOpen',
    'DollarSign',
    'ShoppingCart',
    'Bookmark',
    'Star',
    'Target',
    'Home',
    'Sparkles',
  ];

  const renderCategoryIcon = (name: string, className = "w-4 h-4") => {
    switch (name) {
      case 'Briefcase': return <Briefcase className={className} />;
      case 'User': return <User className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'DollarSign': return <DollarSign className={className} />;
      case 'ShoppingCart': return <ShoppingCart className={className} />;
      case 'Star': return <Star className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Home': return <Home className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      default: return <Bookmark className={className} />;
    }
  };

  const handleCreateCategory = (cat: Category) => {
    setCategories(prev => [...prev, cat]);
  };

  const handleUpdateCategoryName = (id: string) => {
    if (!editingCatName.trim()) return;
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    const oldName = cat.name;
    const newName = editingCatName.trim();
    
    // Check if the name already exists
    if (categories.some(c => c.id !== id && c.name.toLowerCase() === newName.toLowerCase())) {
      alert("A category with this name already exists.");
      return;
    }

    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
    setTasks(prev => prev.map(t => t.category === oldName ? { ...t, category: newName } : t));
    
    if (taskCategoryFilter === oldName) {
      setTaskCategoryFilter(newName);
    }
    
    setEditingCatId(null);
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    
    if (categories.length <= 1) {
      alert("You must keep at least one category.");
      return;
    }

    if (confirm(`Are you sure you want to delete the category "${cat.name}"? All tasks in this category will be reassigned.`)) {
      const oldName = cat.name;
      const remaining = categories.filter(c => c.id !== id);
      const fallbackName = remaining[0].name;

      setCategories(remaining);
      setTasks(prev => prev.map(t => t.category === oldName ? { ...t, category: fallbackName } : t));

      if (taskCategoryFilter === oldName) {
        setTaskCategoryFilter('All');
      }
    }
  };

  const handleSaveNewCategory = () => {
    if (!newCatName.trim()) return;
    const name = newCatName.trim();

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert("A category with this name already exists.");
      return;
    }

    const newCat: Category = {
      id: `cat-custom-${Date.now()}`,
      name,
      color: newCatColor,
      icon: newCatIcon,
      isCustom: true
    };

    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setShowAddCategorySection(false);
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
    const matchesIncomplete = !showOnlyIncomplete || !task.completed;
    return matchesSearch && matchesCategory && matchesPriority && matchesIncomplete;
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

  const handleAddNote = () => {
    if (!quickNoteText.trim()) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: quickNoteText.trim(),
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    setQuickNoteText('');
    
    // Subtle haptic feedback
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    
    // Subtle haptic feedback
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  };

  const handleTogglePinNote = (id: string) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, pinned: !note.pinned } : note));
    
    // Subtle haptic feedback
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  };

  const renderHome = () => (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Dynamic Profile Greeting Row */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-[24px] leading-[24px] pl-0 ml-0 mr-0 mt-[12px] font-bold text-slate-900 dark:text-white tracking-tight">
            Hello, {displayName || 'User'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[8px] leading-[19px] mt-1 italic font-medium">
            "{quote}"
          </p>
          <div className="pt-1.5">
            <button
              id="btn-reopen-summary"
              onClick={() => setIsDailySummaryOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/65 border border-indigo-100/40 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 animate-pulse text-indigo-500" />
              Daily Summary
            </button>
          </div>
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
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            <AnimatedCounter value={pendingTasksCount} />
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Pending Tasks Today</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-750/60">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            <AnimatedCounter value={pendingHabitsCount} />
          </h3>
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
      <div className="space-y-4 relative z-[60] bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl p-4 -mx-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
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
          <AnimatePresence mode="popLayout">
            {tasksForToday.slice(0, 3).map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <TaskCard 
                  task={task}
                  onToggleComplete={handleToggleTask}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onToggleSubtask={handleToggleSubtask}
                  categories={categories}
                  activeFocusTaskId={activeFocusTaskId}
                  activeFocusTimeLeft={activeFocusTimeLeft}
                  activeFocusTimerMode={activeFocusTimerMode}
                  activeFocusTimerStatus={activeFocusTimerStatus}
                  onStartFocus={handleStartFocus}
                  onPauseFocus={handlePauseFocus}
                  onResumeFocus={handleResumeFocus}
                  onStopFocus={handleStopFocus}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {tasksForToday.length === 0 && (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-150 dark:border-slate-750">
              No tasks for today. Tap "Create New" to schedule something!
            </div>
          )}
        </div>
      </div>

      {/* Ephemeral Quick Thoughts / Notes Panel */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <StickyNote size={16} className="text-slate-400" /> Ephemeral Thoughts
          </h2>
          {notes.length > 0 && (
            <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          )}
        </div>

        {/* Note Input Box */}
        <div className="flex gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-750/50 shadow-sm">
          <input
            type="text"
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddNote();
              }
            }}
            className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150/60 dark:border-slate-700/80 outline-none focus:ring-2 focus:ring-blue-500/30 text-xs text-slate-850 dark:text-white"
            placeholder="Jot down a quick thought, idea, or draft..."
          />
          <button
            type="button"
            onClick={handleAddNote}
            disabled={!quickNoteText.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Notes list / grid container */}
        <div className="relative">
          <AnimatePresence initial={false}>
            {notes.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {[...notes].sort((a, b) => {
                  const aPinned = !!a.pinned;
                  const bPinned = !!b.pinned;
                  if (aPinned !== bPinned) {
                    return aPinned ? -1 : 1;
                  }
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }).map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`bg-amber-50/30 dark:bg-amber-950/5 border p-4 rounded-2xl relative flex flex-col justify-between group hover:shadow-sm transition-all ${note.pinned ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 shadow-sm' : 'border-amber-100/60 dark:border-amber-900/10 hover:border-amber-200/50 dark:hover:border-amber-900/30'}`}
                  >
                    <div className="absolute right-3 top-3 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePinNote(note.id)}
                        className={`p-1 rounded-lg hover:bg-slate-150/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer ${note.pinned ? 'text-amber-500 dark:text-amber-400 opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        title={note.pinned ? "Unpin Note" : "Pin Note"}
                      >
                        <Pin size={12} className={note.pinned ? "fill-current" : ""} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-slate-150/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pr-12 break-words whitespace-pre-wrap">
                      {note.content}
                    </p>
                    
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-amber-100/40 dark:border-amber-900/10 text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                      <span className={`flex items-center gap-1 ${note.pinned ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
                        <FileText size={9} />
                        {note.pinned ? 'Pinned Thought' : 'Quick Note'}
                      </span>
                      <span>
                        {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-150 dark:border-slate-750"
              >
                No quick notes captured yet. Jot something down above!
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Toggle Option for Incomplete Tasks only */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-750/50">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Show only incomplete</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Hide tasks that have been checked off</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowOnlyIncomplete(prev => !prev);
              if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                navigator.vibrate(10);
              }
            }}
            className={`w-11 h-6 rounded-full relative transition-all duration-300 flex items-center p-0.5 shrink-0 ${showOnlyIncomplete ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <motion.div 
              layout
              className="w-5 h-5 bg-white rounded-full shadow-md"
              animate={{ x: showOnlyIncomplete ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </button>
        </div>
      </div>

      {/* Selection Control Bar & Action Drawer */}
      {sortedTasks.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer select-none"
          >
            <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all ${
              sortedTasks.length > 0 && sortedTasks.every(t => selectedTaskIds.includes(t.id))
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500'
            }`}>
              {sortedTasks.length > 0 && sortedTasks.every(t => selectedTaskIds.includes(t.id)) && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>
              {sortedTasks.every(t => selectedTaskIds.includes(t.id)) 
                ? 'Deselect All Shown' 
                : `Select All Shown (${sortedTasks.length})`}
            </span>
          </button>
          {selectedTaskIds.length > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {selectedTaskIds.length} selected
            </span>
          )}
        </div>
      )}

      {/* Batch Actions Bar */}
      <AnimatePresence>
        {selectedTaskIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-indigo-50/45 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-black">
                  {selectedTaskIds.length}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  tasks selected for batch actions
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleBatchCompleteTasks}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  Complete
                </button>
                <button
                  onClick={handleBatchDeleteTasks}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedTaskIds([])}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Filtered List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <TaskCard 
                task={task}
                onToggleComplete={handleToggleTask}
                onTogglePin={handleTogglePin}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onToggleSubtask={handleToggleSubtask}
                categories={categories}
                activeFocusTaskId={activeFocusTaskId}
                activeFocusTimeLeft={activeFocusTimeLeft}
                activeFocusTimerMode={activeFocusTimerMode}
                activeFocusTimerStatus={activeFocusTimerStatus}
                onStartFocus={handleStartFocus}
                onPauseFocus={handlePauseFocus}
                onResumeFocus={handleResumeFocus}
                onStopFocus={handleStopFocus}
                isSelected={selectedTaskIds.includes(task.id)}
                onToggleSelect={handleToggleSelectTask}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-750/50 shadow-sm max-w-lg mx-auto mt-6 space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Decorative outer glow circles */}
              <div className="absolute inset-0 bg-blue-500/15 dark:bg-blue-400/5 rounded-full blur-xl animate-pulse" />
              <div className="absolute w-20 h-20 bg-blue-50 dark:bg-blue-950/20 rounded-full border border-blue-100 dark:border-blue-900/30 flex items-center justify-center" />
              <div className="absolute w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center transform rotate-6 hover:rotate-12 transition-transform duration-300">
                <CheckCircle className="w-7 h-7 text-white stroke-[2.5]" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 dark:bg-amber-500 rounded-full flex items-center justify-center shadow-md animate-bounce" style={{ animationDuration: '3s' }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Your console is beautifully clear</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                No active tasks found. Map out your next objective to focus your mind and design systems that work for you.
              </p>
            </div>

            <button
              onClick={() => openCreateModal('task')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10 font-bold tracking-wide text-xs cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Create Your First Task
            </button>
          </motion.div>
        ) : sortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/85 max-w-lg mx-auto mt-6 space-y-5"
          >
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 rounded-full blur-md" />
              <div className="absolute w-16 h-16 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-150 dark:border-slate-700 flex items-center justify-center" />
              <Search className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              <X className="absolute bottom-1 right-1 w-4 h-4 text-rose-500 bg-white dark:bg-slate-900 rounded-full border border-rose-100 dark:border-rose-900/60 p-0.5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No matches in your console</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                We couldn't find any tasks matching your filters. Try adjusting your search query, category, or priority level.
              </p>
            </div>

            <button
              onClick={() => {
                setTaskSearch('');
                setTaskCategoryFilter('All');
                setTaskPriorityFilter('All');
              }}
              className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-150 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-850"
            >
              Reset Console Filters
            </button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );

  const renderHabits = () => (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Habit Streaks</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Consistency builds character. Log your systems daily.</p>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {habits.map(habit => (
            <motion.div
              key={habit.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <HabitCard 
                habit={habit}
                onToggleToday={handleLogHabit}
                onPause={handleTogglePause}
                onDelete={handleDeleteHabit}
                onDuplicate={() => {}}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {habits.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-750/50 shadow-sm max-w-lg mx-auto col-span-full mt-2 space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Decorative outer glow circles */}
              <div className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-400/5 rounded-full blur-xl animate-pulse" />
              <div className="absolute w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-full border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center" />
              <div className="absolute w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center transform -rotate-6 hover:rotate-12 transition-transform duration-300">
                <Flame className="w-7 h-7 text-white stroke-[2.5]" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 dark:bg-amber-500 rounded-full flex items-center justify-center shadow-md animate-bounce" style={{ animationDuration: '4s' }}>
                <Zap className="w-3.5 h-3.5 text-white fill-current" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Consistency builds character</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Establish daily or weekly habits that compound over time. Success is the product of small, steady daily routines.
              </p>
            </div>

            <button
              onClick={() => openCreateModal('habit')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10 font-bold tracking-wide text-xs cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Set Up First Habit
            </button>
          </motion.div>
        )}
      </motion.div>
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
            {/* Task Categories Manager */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Manage Task Categories
                </span>
                {!showAddCategorySection && (
                  <button
                    onClick={() => setShowAddCategorySection(true)}
                    className="text-xs text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </button>
                )}
              </div>

              {/* Category Add Form */}
              {showAddCategorySection && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">New Category</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    />
                    
                    {/* Color picker */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Color</span>
                      <div className="flex gap-2 flex-wrap">
                        {TAILWIND_COLOR_PRESETS.map((colorClass) => (
                          <button
                            key={colorClass}
                            type="button"
                            onClick={() => setNewCatColor(colorClass)}
                            className={`w-6 h-6 rounded-full transition-transform ${newCatColor === colorClass ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900' : 'hover:scale-110'} ${colorClass}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Icon selector */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Icon</span>
                      <div className="flex gap-2 flex-wrap bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-150 dark:border-slate-700">
                        {AVAILABLE_ICONS.map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setNewCatIcon(iconName)}
                            className={`p-1.5 rounded transition-all ${newCatIcon === iconName ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          >
                            {renderCategoryIcon(iconName, "w-4 h-4")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setShowAddCategorySection(false);
                          setNewCatName('');
                        }}
                        className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNewCategory}
                        className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isEditing = editingCatId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100/50 dark:border-slate-850/40"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex gap-2 items-center">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${cat.color}`} />
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateCategoryName(cat.id)}
                            className="p-1 text-emerald-500 hover:text-emerald-600 font-bold text-xs"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 font-bold text-xs"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${cat.color || 'bg-blue-500'}`}>
                              {renderCategoryIcon(cat.icon, "w-4 h-4")}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {cat.name}
                              </span>
                              <span className="text-[9px] text-slate-400 block">
                                {tasks.filter(t => t.category === cat.name).length} tasks
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Rename"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

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
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 w-fit shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences(p => ({ ...p, darkMode: false }));
                      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                        navigator.vibrate(10);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${preferences.darkMode === false ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences(p => ({ ...p, darkMode: true }));
                      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                        navigator.vibrate(10);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${preferences.darkMode === true ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences(p => ({ ...p, darkMode: 'Auto' }));
                      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                        navigator.vibrate(10);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${preferences.darkMode === 'Auto' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750/50">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Task Reminder Flags</h4>
                  <p className="text-[11px] text-slate-400">Push status flags automatically</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreferences(p => ({ ...p, notificationReminders: !p.notificationReminders }));
                    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                      navigator.vibrate(10);
                    }
                  }}
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

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-750/50">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Auto-Cleanup Notes</h4>
                  <p className="text-[11px] text-slate-400">Delete quick thoughts older than 7 days</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreferences(p => ({ ...p, autoDeleteOldNotes: !(p.autoDeleteOldNotes ?? true) }));
                    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                      navigator.vibrate(10);
                    }
                  }}
                  className={`w-11 h-6 rounded-full relative transition-all duration-300 flex items-center p-0.5 ${((preferences.autoDeleteOldNotes ?? true)) ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    layout
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ x: (preferences.autoDeleteOldNotes ?? true) ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-750/50 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Custom Pomodoro Timer</h4>
                  <p className="text-[11px] text-slate-400">Set default durations for focus and rest sessions</p>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Focus Session (Min)</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={preferences.pomodoroWorkMinutes ?? 25}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(180, parseInt(e.target.value) || 25));
                        setPreferences(p => ({ ...p, pomodoroWorkMinutes: val }));
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Short Break (Min)</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={preferences.pomodoroBreakMinutes ?? 5}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 5));
                        setPreferences(p => ({ ...p, pomodoroBreakMinutes: val }));
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750/50 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Account Management
              </span>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
            {/* Spinning gradient ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 opacity-80"
            />
            <div className="absolute inset-1 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center">
              <span className="text-blue-500 dark:text-blue-400 text-5xl font-black font-sans select-none tracking-tighter">G</span>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">GoalsMi</h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider mt-1.5 animate-pulse">Your system companion</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  if (isAppInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative flex flex-col justify-between">
        
        {/* Skeleton Header / Branding Overlay */}
        <div className="max-w-xl w-full mx-auto p-6 space-y-6 flex-1 flex flex-col pb-32">
          
          {/* Header Row Skeleton */}
          <div className="flex justify-between items-center mt-3">
            <div className="space-y-2">
              <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-3 w-56 bg-slate-200/50 dark:bg-slate-800/40 rounded-lg animate-pulse" />
            </div>
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse shadow-sm" />
          </div>

          {/* Progress Card Skeleton */}
          <div className="bg-gradient-to-br from-slate-200/50 to-slate-200/20 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/40 dark:border-slate-800/30 p-6 rounded-3xl relative overflow-hidden flex items-center justify-between shadow-sm animate-pulse">
            <div className="space-y-3 flex-1 pr-4">
              <div className="w-24 h-4 bg-slate-300/40 dark:bg-slate-800/70 rounded-full" />
              <div className="w-36 h-6 bg-slate-300/60 dark:bg-slate-800/90 rounded-xl" />
              <div className="w-48 h-3.5 bg-slate-200 dark:bg-slate-850 rounded-lg" />
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-slate-200/50 dark:bg-slate-800/40" />
            </div>
          </div>

          {/* Central Branded Sync Status Drawer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-xl relative overflow-hidden">
            {/* Elegant top color band */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                    System Core Sync
                  </span>
                  <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                  Synchronizing GoalsMi companion...
                </h3>
                {/* Dynamic Framer Motion Shimmer Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full mt-3 overflow-hidden relative">
                  <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                    className="absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List Title Skeleton */}
          <div className="space-y-3 pt-2">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            
            {/* Task Item Skeletons */}
            {[1, 2, 3].map((idx) => (
              <div 
                key={idx}
                className="bg-white/45 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-pulse"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-2 w-1/4 bg-slate-150 dark:bg-slate-850 rounded-md" />
                  </div>
                </div>
                <div className="w-14 h-5 bg-slate-150 dark:bg-slate-850 rounded-full shrink-0" />
              </div>
            ))}
          </div>

          {/* Quick Notes Area Skeleton */}
          <div className="bg-white/45 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl h-14 flex items-center justify-between animate-pulse">
            <div className="h-3.5 w-1/3 bg-slate-150 dark:bg-slate-850 rounded-lg" />
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>

        </div>

        {/* Skeleton Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white/80 dark:bg-slate-950/80 border-t border-slate-200/40 dark:border-slate-850/40 py-3.5 flex justify-around items-center rounded-t-3xl shadow-lg z-40 backdrop-blur-md animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>

      </div>
    );
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
      <main className="max-w-xl mx-auto bg-slate-50/50 dark:bg-slate-950/50 min-h-screen relative shadow-sm pb-48">
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
            onClick={() => openCreateModal('select')}
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
            const totalDuration = activeFocusTimerMode === 'work' 
              ? (preferences.pomodoroWorkMinutes ?? 25) * 60 
              : (preferences.pomodoroBreakMinutes ?? 5) * 60;
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

                  {/* Quick Timer Adjustments / Direct Edit */}
                  <div className="flex flex-col items-center gap-3 -mt-3 w-full max-w-xs z-10">
                    {/* Controls Row */}
                    <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800/80 px-4 py-1.5 rounded-2xl shadow-inner w-full justify-between">
                      {activeFocusTimerStatus === 'paused' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFocusTimeLeft(prev => Math.max(60, prev - 5 * 60));
                            }}
                            className="text-[11px] font-black text-slate-400 hover:text-white px-2 py-1 bg-slate-950/40 hover:bg-slate-950/90 rounded-xl border border-slate-800/80 transition-colors cursor-pointer select-none"
                            title="Subtract 5 Minutes"
                          >
                            -5m
                          </button>
                          <span className="text-[10px] font-bold text-slate-400">
                            {activeFocusTimerMode === 'work' ? 'Work' : 'Break'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFocusTimeLeft(prev => Math.min(180 * 60, prev + 5 * 60));
                            }}
                            className="text-[11px] font-black text-slate-400 hover:text-white px-2 py-1 bg-slate-950/40 hover:bg-slate-950/90 rounded-xl border border-slate-800/80 transition-colors cursor-pointer select-none"
                            title="Add 5 Minutes"
                          >
                            +5m
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                          Session Active
                        </span>
                      )}

                      {/* Settings Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowTimerEdit(!showTimerEdit)}
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 select-none ${
                          showTimerEdit 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Settings className="w-3 h-3" />
                        {showTimerEdit ? 'Done' : 'Edit Default'}
                      </button>
                    </div>

                    {/* Default Settings Inputs Drawer */}
                    <AnimatePresence>
                      {showTimerEdit && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -5 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -5 }}
                          className="w-full bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                              Timer Settings
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold">
                              Saved automatically
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Work Session</label>
                              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <input
                                  type="number"
                                  min={1}
                                  max={180}
                                  value={preferences.pomodoroWorkMinutes ?? 25}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(180, parseInt(e.target.value) || 25));
                                    setPreferences(p => ({ ...p, pomodoroWorkMinutes: val }));
                                  }}
                                  className="w-full bg-transparent px-2 py-1 text-xs font-mono font-bold text-slate-200 outline-none text-center"
                                />
                                <span className="text-[10px] font-bold text-slate-500 pr-2">min</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Break Period</label>
                              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={preferences.pomodoroBreakMinutes ?? 5}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 5));
                                    setPreferences(p => ({ ...p, pomodoroBreakMinutes: val }));
                                  }}
                                  className="w-full bg-transparent px-2 py-1 text-xs font-mono font-bold text-slate-200 outline-none text-center"
                                />
                                <span className="text-[10px] font-bold text-slate-500 pr-2">min</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                  
                  {/* Browser Audio Permission / Compatibility Status */}
                  <div className="w-full bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full relative ${isAudioUnlocked ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                          {!isAudioUnlocked && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${isAudioUnlocked ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                          {isAudioUnlocked ? '🔔 Audio Notifications Permitted' : '⚠️ Audio Permission Pending'}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Mobile Compatibility</span>
                    </div>
                    
                    {!isAudioUnlocked ? (
                      <div>
                        <p className="text-[10px] text-slate-400 leading-normal mb-2.5">
                          Mobile browsers require a touch gesture to allow audio alerts to ring in the background. Tap below to permit sound.
                        </p>
                        <button
                          onClick={() => {
                            unlockAudio();
                            setTimeout(() => playTimerCompleteSound(), 100);
                          }}
                          className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                        >
                          🔓 Request & Test Alarm Audio
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 bg-slate-950/40 p-2 rounded-xl border border-slate-850">
                        <button
                          onClick={playTimerCompleteSound}
                          className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          🔊 Play Test Ring
                        </button>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight">
                          Success! Audio is unlocked. Alerts will trigger reliably when the timer completes.
                        </p>
                      </div>
                    )}
                  </div>

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
        initialStage={modalInitialStage}
      />

      {/* Daily Summary Modal */}
      <DailySummaryModal 
        isOpen={isDailySummaryOpen}
        onClose={() => setIsDailySummaryOpen(false)}
        tasks={tasks}
        habits={habits}
      />
    </div>
  );
}
