export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RepeatInterval = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  reminder: boolean;
  repeat: RepeatInterval;
  colorLabel: string; // e.g. '#3b82f6'
  duration: number; // in minutes
  subtasks: Subtask[];
  notes: string;
  completed: boolean;
  completedAt?: string; // ISO timestamp
  pinned: boolean;
  order: number;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'Daily' | 'Weekly';
  streak: number;
  bestStreak: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD' -> true
  paused: boolean;
  colorLabel: string;
  createdAt: string; // ISO timestamp
}

export interface Category {
  id: string;
  name: string;
  color: string; // tailwind color class prefix (e.g. 'bg-blue-500')
  icon: string; // Lucide icon name
  isCustom?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string; // ISO timestamp if unlocked
  requirementType: 'first_task' | 'first_habit' | 'streak_7' | 'streak_30' | 'tasks_100' | 'champion' | 'early_bird' | 'consistency';
}

export interface DailyGoalHistoryItem {
  id: string;
  goal: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedDate?: string;
}

export interface UserPreferences {
  darkMode: boolean | 'Auto';
  notificationReminders: boolean;
  reminderTimes: string; // HH:MM
  startOfWeek: 'Monday' | 'Sunday';
  timeFormat: '12h' | '24h';
  defaultHomeMode: 'Productivity' | 'Habits';
  themeColor: 'blue' | 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';
  dailyGoal?: string;
  dailyGoalDate?: string;
  dailyGoalCompleted?: boolean;
  dailyGoalCompletedDate?: string;
  dailyGoalsHistory?: DailyGoalHistoryItem[];
  autoDeleteOldNotes?: boolean;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
}

export interface SmartSuggestion {
  id: string;
  text: string;
  type: 'insight' | 'reminder' | 'encouragement' | 'warning';
}

export interface DailyActivity {
  completedTasks: string[]; // task IDs
  pendingTasks: string[];   // task IDs
  completedHabits: string[]; // habit IDs
  missedHabits: string[];    // habit IDs
}

export interface Note {
  id: string;
  content: string;
  createdAt: string; // ISO timestamp
  pinned?: boolean;
}

