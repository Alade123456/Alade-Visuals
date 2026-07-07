import { Task, Habit, Category, Achievement, UserPreferences } from './types';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';

export const supabaseUrl = 'https://cloudsql.local';
export const supabaseAnonKey = 'cloudsql-key';
export const hasSupabaseEnv = true;
export const isSupabaseConfigured = true;

// Helper to construct auth headers with Firebase token
async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Global API Fetch helper
async function apiCall(endpoint: string, method: string, body: any = null) {
  const headers = await getAuthHeaders();
  const options: RequestInit = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(endpoint, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error (${res.status}): ${errText || res.statusText}`);
  }
  return res.json();
}

// Query builder to mimic supabase.from()
class SupabaseQueryBuilder {
  tableName: string;
  constructor(tableName: string) {
    this.tableName = tableName;
  }

  delete() {
    return {
      in: async (field: string, values: any[]) => {
        try {
          await apiCall(`/api/${this.tableName}`, 'DELETE', { ids: values });
          return { error: null };
        } catch (error: any) {
          console.error(`Error deleting from ${this.tableName}:`, error);
          return { error };
        }
      }
    };
  }

  async upsert(values: any) {
    try {
      if (this.tableName === 'preferences') {
        await apiCall(`/api/preferences/upsert`, 'POST', { row: values });
      } else {
        const rows = Array.isArray(values) ? values : [values];
        await apiCall(`/api/${this.tableName}/upsert`, 'POST', { rows });
      }
      return { error: null };
    } catch (error: any) {
      console.error(`Error upserting to ${this.tableName}:`, error);
      return { error };
    }
  }
}

// Mock client containing auth and from queries
export const supabase = {
  auth: {
    async getSession() {
      const user = auth.currentUser;
      if (user) {
        return { data: { session: { user: { id: user.uid, email: user.email } } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    async getUser() {
      const user = auth.currentUser;
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || 'Alade';
        return { 
          data: { 
            user: { 
              id: user.uid, 
              email: user.email,
              user_metadata: { full_name: name }
            } 
          }, 
          error: null 
        };
      }
      return { data: { user: null }, error: new Error('No user logged in') };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          callback('SIGNED_IN', { user: { id: user.uid, email: user.email } });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return { data: { subscription: { unsubscribe } } };
    },

    async signInWithOAuth(params: any) {
      try {
        const result = await signInWithPopup(auth, googleAuthProvider);
        return { data: { url: null, user: result.user }, error: null };
      } catch (error: any) {
        console.error('Firebase OAuth error:', error);
        return { data: null, error };
      }
    },

    async signUp(params: any) {
      try {
        const { email, password } = params;
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return { data: { user: result.user, session: {} }, error: null };
      } catch (error: any) {
        console.error('Firebase Register error:', error);
        return { data: { user: null, session: null }, error };
      }
    },

    async signInWithPassword(params: any) {
      try {
        const { email, password } = params;
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { data: { user: result.user, session: {} }, error: null };
      } catch (error: any) {
        console.error('Firebase Password Sign In error:', error);
        return { data: { user: null, session: null }, error };
      }
    },

    async signOut() {
      try {
        await firebaseSignOut(auth);
        return { error: null };
      } catch (error: any) {
        console.error('Firebase Sign Out error:', error);
        return { error };
      }
    },

    async resetPasswordForEmail(email: string) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
      } catch (error: any) {
        console.error('Firebase Password Reset error:', error);
        return { error };
      }
    },

    async setSession(params: any) {
      // Stub for setSession
      return { data: { session: {} }, error: null };
    }
  },

  from(tableName: string) {
    return new SupabaseQueryBuilder(tableName);
  }
};

export function diagnoseSupabaseConfig() {
  return {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    maskedUrl: 'Cloud SQL / Firebase Active',
    maskedKey: 'Active'
  };
}

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
    dueDate: row.due_date || row.dueDate || '',
    dueTime: row.due_time || row.dueTime || '',
    reminder: !!row.reminder,
    repeat: row.repeat || 'None',
    colorLabel: row.color_label || row.colorLabel || '',
    duration: row.duration || 0,
    subtasks: Array.isArray(row.subtasks)
      ? row.subtasks
      : typeof row.subtasks === 'string'
      ? JSON.parse(row.subtasks)
      : row.subtasks || [],
    notes: row.notes || '',
    completed: !!row.completed,
    completedAt: row.completed_at || row.completedAt || undefined,
    pinned: !!row.pinned,
    order: row.order_num || row.orderNum || 0,
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
    bestStreak: row.best_streak || row.bestStreak || 0,
    history: typeof row.history === 'string'
      ? JSON.parse(row.history)
      : row.history || {},
    paused: !!row.paused,
    colorLabel: row.color_label || row.colorLabel || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
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
    isCustom: !!row.is_custom || !!row.isCustom,
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
    iconName: row.icon_name || row.iconName || 'Award',
    unlockedAt: row.unlocked_at || row.unlockedAt || undefined,
    requirementType: row.requirement_type || row.requirementType || 'first_task',
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
    daily_goal: prefs.dailyGoal,
    daily_goal_date: prefs.dailyGoalDate,
    daily_goal_completed: prefs.dailyGoalCompleted,
    daily_goal_completed_date: prefs.dailyGoalCompletedDate,
  };
}

export function mapPreferencesFromDb(row: any): UserPreferences {
  return {
    darkMode: !!row.dark_mode || !!row.darkMode,
    notificationReminders: !!row.notification_reminders || !!row.notificationReminders,
    reminderTimes: row.reminder_times || row.reminderTimes || '09:00',
    startOfWeek: row.start_of_week || row.startOfWeek || 'Monday',
    timeFormat: row.time_format || row.timeFormat || '12h',
    defaultHomeMode: row.default_home_mode || row.defaultHomeMode || 'Productivity',
    themeColor: row.theme_color || row.themeColor || 'indigo',
    dailyGoal: row.daily_goal || row.dailyGoal || '',
    dailyGoalDate: row.daily_goal_date || row.dailyGoalDate || '',
    dailyGoalCompleted: !!row.daily_goal_completed || !!row.dailyGoalCompleted,
    dailyGoalCompletedDate: row.daily_goal_completed_date || row.dailyGoalCompletedDate || '',
  };
}

// --- DATABASE SYNC FUNCTIONS ---

export async function syncPullAll(userId: string) {
  try {
    const data = await apiCall('/api/sync/pull', 'GET');
    return {
      tasks: data.tasks ? data.tasks.map(mapTaskFromDb) : [],
      habits: data.habits ? data.habits.map(mapHabitFromDb) : [],
      categories: data.categories ? data.categories.map(mapCategoryFromDb) : [],
      achievements: data.achievements ? data.achievements.map(mapAchievementFromDb) : [],
      preferences: data.preferences ? mapPreferencesFromDb(data.preferences) : null,
    };
  } catch (error) {
    console.error('Error pulling data from Cloud SQL API:', error);
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
  try {
    await apiCall('/api/sync/push', 'POST', {
      tasks: data.tasks.map(t => mapTaskToDb(t, userId)),
      habits: data.habits.map(h => mapHabitToDb(h, userId)),
      categories: data.categories.filter(c => c.isCustom).map(c => mapCategoryToDb(c, userId)),
      achievements: data.achievements.map(a => mapAchievementToDb(a, userId)),
      preferences: mapPreferencesToDb(data.preferences, userId),
    });
    return true;
  } catch (error) {
    console.error('Error pushing data to Cloud SQL API:', error);
    return false;
  }
}
