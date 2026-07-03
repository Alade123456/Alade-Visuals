import { createClient } from '@supabase/supabase-js';
import { Task, Habit, Category, Achievement, UserPreferences } from './types';

// Read configuration from Vite environment variables safely
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Use a fallback to prevent runtime crashes if variables are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/*
=========================================
SUPABASE DATABASE SQL SCHEMA INSTRUCTIONS
=========================================
Copy and paste this SQL script into your Supabase SQL Editor to set up the necessary tables and RLS:

-- 1. Create Tasks table
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  due_date TEXT,
  due_time TEXT,
  reminder BOOLEAN,
  repeat TEXT,
  color_label TEXT,
  duration INTEGER,
  subtasks JSONB,
  notes TEXT,
  completed BOOLEAN,
  completed_at TEXT,
  pinned BOOLEAN,
  order_num INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Habits table
CREATE TABLE public.habits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT,
  streak INTEGER,
  best_streak INTEGER,
  history JSONB,
  paused BOOLEAN,
  color_label TEXT,
  created_at TEXT
);

-- 3. Create Categories table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_custom BOOLEAN
);

-- 4. Create Achievements table
CREATE TABLE public.achievements (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  unlocked_at TEXT,
  requirement_type TEXT,
  PRIMARY KEY (id, user_id)
);

-- 5. Create Preferences table
CREATE TABLE public.preferences (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  dark_mode BOOLEAN,
  notification_reminders BOOLEAN,
  reminder_times TEXT,
  start_of_week TEXT,
  time_format TEXT,
  default_home_mode TEXT,
  theme_color TEXT
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Set up Policies
CREATE POLICY "Users can modify their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can modify public or their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can modify their own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own preferences" ON public.preferences FOR ALL USING (auth.uid() = user_id);
*/

// --- DATA MAPPING HELPERS ---

export function mapTaskToDb(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    name: task.name,
    description: task.description,
    category: task.category,
    priority: task.priority,
    due_date: task.dueDate,
    due_time: task.dueTime,
    reminder: task.reminder,
    repeat: task.repeat,
    color_label: task.colorLabel,
    duration: task.duration,
    subtasks: JSON.stringify(task.subtasks),
    notes: task.notes,
    completed: task.completed,
    completed_at: task.completedAt || null,
    pinned: task.pinned,
    order_num: task.order,
  };
}

export function mapTaskFromDb(row: any): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: row.category || '',
    priority: row.priority || 'Medium',
    dueDate: row.due_date || '',
    dueTime: row.due_time || '',
    reminder: !!row.reminder,
    repeat: row.repeat || 'None',
    colorLabel: row.color_label || '',
    duration: row.duration || 0,
    subtasks: Array.isArray(row.subtasks)
      ? row.subtasks
      : typeof row.subtasks === 'string'
      ? JSON.parse(row.subtasks)
      : row.subtasks || [],
    notes: row.notes || '',
    completed: !!row.completed,
    completedAt: row.completed_at || undefined,
    pinned: !!row.pinned,
    order: row.order_num || 0,
  };
}

export function mapHabitToDb(habit: Habit, userId: string) {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    frequency: habit.frequency,
    streak: habit.streak,
    best_streak: habit.bestStreak,
    history: JSON.stringify(habit.history),
    paused: habit.paused,
    color_label: habit.colorLabel,
    created_at: habit.createdAt,
  };
}

export function mapHabitFromDb(row: any): Habit {
  return {
    id: row.id,
    name: row.name,
    frequency: row.frequency || 'Daily',
    streak: row.streak || 0,
    bestStreak: row.best_streak || 0,
    history: typeof row.history === 'string'
      ? JSON.parse(row.history)
      : row.history || {},
    paused: !!row.paused,
    colorLabel: row.color_label || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapCategoryToDb(category: Category, userId: string | null) {
  return {
    id: category.id,
    user_id: userId,
    name: category.name,
    color: category.color,
    icon: category.icon,
    is_custom: !!category.isCustom,
  };
}

export function mapCategoryFromDb(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color || 'bg-blue-500',
    icon: row.icon || 'CheckCircle',
    isCustom: !!row.is_custom,
  };
}

export function mapAchievementToDb(achievement: Achievement, userId: string) {
  return {
    id: achievement.id,
    user_id: userId,
    title: achievement.title,
    description: achievement.description,
    icon_name: achievement.iconName,
    unlocked_at: achievement.unlockedAt || null,
    requirement_type: achievement.requirementType,
  };
}

export function mapAchievementFromDb(row: any): Achievement {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    iconName: row.icon_name || 'Award',
    unlockedAt: row.unlocked_at || undefined,
    requirementType: row.requirement_type || 'first_task',
  };
}

export function mapPreferencesToDb(prefs: UserPreferences, userId: string) {
  return {
    user_id: userId,
    dark_mode: prefs.darkMode,
    notification_reminders: prefs.notificationReminders,
    reminder_times: prefs.reminderTimes,
    start_of_week: prefs.startOfWeek,
    time_format: prefs.timeFormat,
    default_home_mode: prefs.defaultHomeMode,
    theme_color: prefs.themeColor,
  };
}

export function mapPreferencesFromDb(row: any): UserPreferences {
  return {
    darkMode: !!row.dark_mode,
    notificationReminders: !!row.notification_reminders,
    reminderTimes: row.reminder_times || '09:00',
    startOfWeek: row.start_of_week || 'Monday',
    timeFormat: row.time_format || '12h',
    defaultHomeMode: row.default_home_mode || 'Productivity',
    themeColor: row.theme_color || 'indigo',
  };
}

// --- DATABASE SYNC FUNCTIONS ---

export async function syncPullAll(userId: string) {
  if (!isSupabaseConfigured) return null;

  try {
    const [tasksRes, habitsRes, categoriesRes, achievementsRes, prefsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`),
      supabase.from('achievements').select('*').eq('user_id', userId),
      supabase.from('preferences').select('*').eq('user_id', userId).single(),
    ]);

    return {
      tasks: tasksRes.data ? tasksRes.data.map(mapTaskFromDb) : null,
      habits: habitsRes.data ? habitsRes.data.map(mapHabitFromDb) : null,
      categories: categoriesRes.data ? categoriesRes.data.map(mapCategoryFromDb) : null,
      achievements: achievementsRes.data ? achievementsRes.data.map(mapAchievementFromDb) : null,
      preferences: prefsRes.data ? mapPreferencesFromDb(prefsRes.data) : null,
    };
  } catch (error) {
    console.error('Error pulling data from Supabase:', error);
    return null;
  }
}

export async function syncPushAll(
  userId: string,
  data: {
    tasks: Task[];
    habits: Habit[];
    categories: Category[];
    achievements: Achievement[];
    preferences: UserPreferences;
  }
) {
  if (!isSupabaseConfigured) return false;

  try {
    const taskRows = data.tasks.map(t => mapTaskToDb(t, userId));
    const habitRows = data.habits.map(h => mapHabitToDb(h, userId));
    const categoryRows = data.categories.filter(c => c.isCustom).map(c => mapCategoryToDb(c, userId));
    const achievementRows = data.achievements.map(a => mapAchievementToDb(a, userId));
    const prefRow = mapPreferencesToDb(data.preferences, userId);

    if (taskRows.length > 0) {
      await supabase.from('tasks').upsert(taskRows);
    }
    if (habitRows.length > 0) {
      await supabase.from('habits').upsert(habitRows);
    }
    if (categoryRows.length > 0) {
      await supabase.from('categories').upsert(categoryRows);
    }
    if (achievementRows.length > 0) {
      await supabase.from('achievements').upsert(achievementRows);
    }
    await supabase.from('preferences').upsert(prefRow);

    return true;
  } catch (error) {
    console.error('Error pushing data to Supabase:', error);
    return false;
  }
}
