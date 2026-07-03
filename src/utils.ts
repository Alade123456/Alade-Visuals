import { Task, Habit, Category, Achievement, UserPreferences, SmartSuggestion } from './types';

// Helper to format Date to YYYY-MM-DD in local timezone
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get offset date
export function getOffsetDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatDate(d);
}

// Get day of week abbreviation
export function getDayOfWeekAbbr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Format time nicely
export function formatTimeStr(time24: string, format12h: boolean = true): string {
  if (!time24) return '';
  if (!format12h) return time24;
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minStr} ${ampm}`;
}

// Default Categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Work', color: 'bg-blue-500', icon: 'Briefcase' },
  { id: 'cat-personal', name: 'Personal', color: 'bg-indigo-500', icon: 'User' },
  { id: 'cat-health', name: 'Health', color: 'bg-emerald-500', icon: 'Activity' },
  { id: 'cat-learning', name: 'Learning', color: 'bg-violet-500', icon: 'BookOpen' },
  { id: 'cat-finance', name: 'Finance', color: 'bg-amber-500', icon: 'DollarSign' },
  { id: 'cat-shopping', name: 'Shopping', color: 'bg-rose-500', icon: 'ShoppingCart' },
];

// Pre-seeded Tasks
export const getInitialTasks = (): Task[] => [
  {
    id: 'task-1',
    name: 'Quarterly review presentation',
    description: 'Prepare key performance metrics and future scaling goals slides for team sync.',
    category: 'Work',
    priority: 'Urgent',
    dueDate: getOffsetDate(0), // Today
    dueTime: '10:00',
    reminder: true,
    repeat: 'None',
    colorLabel: '#ef4444', // Red
    duration: 60,
    subtasks: [
      { id: 'sub-1', name: 'Gather metrics from analytics panel', completed: true },
      { id: 'sub-2', name: 'Outline project milestones chart', completed: false },
      { id: 'sub-3', name: 'Review with product lead', completed: false }
    ],
    notes: 'Access reports dashboard in Google Drive first.',
    completed: false,
    pinned: true,
    order: 1
  },
  {
    id: 'task-2',
    name: 'Annual health checkup booking',
    description: 'Call Dr. Carter to schedule the annual physical and routine labs.',
    category: 'Health',
    priority: 'High',
    dueDate: getOffsetDate(0), // Today
    dueTime: '14:30',
    reminder: true,
    repeat: 'None',
    colorLabel: '#10b981', // Emerald
    duration: 15,
    subtasks: [],
    notes: 'Insurance card is in desk drawer.',
    completed: true,
    completedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    pinned: false,
    order: 2
  },
  {
    id: 'task-3',
    name: 'Read 20 pages of clean architecture',
    description: 'Deep dive into interface segregation and dependency inversion chapters.',
    category: 'Learning',
    priority: 'Medium',
    dueDate: getOffsetDate(0), // Today
    dueTime: '21:00',
    reminder: false,
    repeat: 'Daily',
    colorLabel: '#8b5cf6', // Violet
    duration: 30,
    subtasks: [],
    notes: 'Bookmark is at page 142.',
    completed: false,
    pinned: false,
    order: 3
  },
  {
    id: 'task-4',
    name: 'Budget spreadsheet reconciliation',
    description: 'Check credit card statements against monthly ledger and file expense reports.',
    category: 'Finance',
    priority: 'Medium',
    dueDate: getOffsetDate(1), // Tomorrow
    dueTime: '11:00',
    reminder: true,
    repeat: 'Monthly',
    colorLabel: '#f59e0b', // Amber
    duration: 45,
    subtasks: [
      { id: 'sub-4', name: 'Download bank statement PDF', completed: true },
      { id: 'sub-5', name: 'Verify grocery expenses category', completed: true },
      { id: 'sub-6', name: 'Export expense receipt scans', completed: false }
    ],
    notes: 'Remember to deduct learning books under learning allowances.',
    completed: false,
    pinned: false,
    order: 4
  },
  {
    id: 'task-5',
    name: 'Buy high-protein groceries',
    description: 'Greek yogurt, salmon fillets, spinach, blueberries, almond butter, eggs.',
    category: 'Shopping',
    priority: 'Low',
    dueDate: getOffsetDate(2), // In 2 days
    dueTime: '18:00',
    reminder: false,
    repeat: 'None',
    colorLabel: '#ec4899', // Rose
    duration: 30,
    subtasks: [],
    notes: 'Go to Whole Foods or Trader Joe\'s.',
    completed: false,
    pinned: false,
    order: 5
  },
  {
    id: 'task-6',
    name: 'Design portfolio homepage sketch',
    description: 'Draft typography pairings, grid sizing, and layout spacing structures.',
    category: 'Personal',
    priority: 'High',
    dueDate: getOffsetDate(-1), // Yesterday (Overdue!)
    dueTime: '16:00',
    reminder: false,
    repeat: 'None',
    colorLabel: '#6366f1', // Indigo
    duration: 90,
    subtasks: [],
    notes: 'Use a high-contrast minimalist look with elegant negative space.',
    completed: false,
    pinned: false,
    order: 6
  }
];

// Pre-seeded Habits
export const getInitialHabits = (): Habit[] => [
  {
    id: 'habit-1',
    name: 'Diaphragmatic Breathing (10 mins)',
    frequency: 'Daily',
    streak: 8,
    bestStreak: 15,
    history: {
      [getOffsetDate(-5)]: true,
      [getOffsetDate(-4)]: true,
      [getOffsetDate(-3)]: true,
      [getOffsetDate(-2)]: true,
      [getOffsetDate(-1)]: true,
      [getOffsetDate(0)]: true, // Completed today
    },
    paused: false,
    colorLabel: '#3b82f6',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'habit-2',
    name: 'Morning Hydration (500ml)',
    frequency: 'Daily',
    streak: 12,
    bestStreak: 20,
    history: {
      [getOffsetDate(-5)]: true,
      [getOffsetDate(-4)]: true,
      [getOffsetDate(-3)]: true,
      [getOffsetDate(-2)]: true,
      [getOffsetDate(-1)]: true,
      [getOffsetDate(0)]: false, // Not completed yet today
    },
    paused: false,
    colorLabel: '#10b981',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'habit-3',
    name: 'Read Tech News / Newsletter',
    frequency: 'Daily',
    streak: 0,
    bestStreak: 6,
    history: {
      [getOffsetDate(-5)]: true,
      [getOffsetDate(-4)]: false,
      [getOffsetDate(-3)]: false,
      [getOffsetDate(-2)]: true,
      [getOffsetDate(-1)]: false,
      [getOffsetDate(0)]: false, // Not completed yet today
    },
    paused: false,
    colorLabel: '#8b5cf6',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'habit-4',
    name: 'Review Weekly Budget Spend',
    frequency: 'Weekly',
    streak: 4,
    bestStreak: 4,
    history: {
      [getOffsetDate(-14)]: true,
      [getOffsetDate(-7)]: true,
      [getOffsetDate(0)]: true, // Completed today
    },
    paused: false,
    colorLabel: '#f59e0b',
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
  }
];

// Initial Achievements
export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    title: 'First Step Forward',
    description: 'Complete your first single-time task.',
    iconName: 'CheckCircle',
    unlockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    requirementType: 'first_task'
  },
  {
    id: 'ach-2',
    title: 'Spark of Habit',
    description: 'Log and complete your first recurring habit.',
    iconName: 'Zap',
    unlockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    requirementType: 'first_habit'
  },
  {
    id: 'ach-3',
    title: 'Weekly Catalyst',
    description: 'Maintain a perfect 7-day habit or task streak.',
    iconName: 'Flame',
    unlockedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    requirementType: 'streak_7'
  },
  {
    id: 'ach-4',
    title: 'Habitual Sage',
    description: 'Reach a perfect 30-day streak on any recurring habit.',
    iconName: 'Award',
    requirementType: 'streak_30'
  },
  {
    id: 'ach-5',
    title: 'Productivity Titan',
    description: 'Complete 100 tasks across any categories.',
    iconName: 'Cpu',
    requirementType: 'tasks_100'
  },
  {
    id: 'ach-6',
    title: 'Early Bird',
    description: 'Complete a high-priority task before 9:00 AM.',
    iconName: 'Sunrise',
    requirementType: 'early_bird'
  },
  {
    id: 'ach-7',
    title: 'Consistency Master',
    description: 'Achieve 100% productivity score 5 days in a single week.',
    iconName: 'TrendingUp',
    requirementType: 'consistency'
  },
  {
    id: 'ach-8',
    title: 'Productivity Champion',
    description: 'Unlock all other productivity milestones.',
    iconName: 'Crown',
    requirementType: 'champion'
  }
];

// Inspirational Quotes List
export const PRODUCTIVITY_QUOTES = [
  "Focus on being productive instead of busy. — Tim Ferriss",
  "Great things are done by a series of small things brought together. — Vincent Van Gogh",
  "Your mind is for having ideas, not holding them. — David Allen",
  "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
  "Habits change into character. — Ovid",
  "You do not rise to the level of your goals. You fall to the level of your systems. — James Clear",
  "Small daily improvements over time lead to stunning results. — Robin Sharma",
  "The secret of getting ahead is getting started. — Mark Twain"
];

// Default User Preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: false,
  notificationReminders: true,
  reminderTimes: '08:00',
  startOfWeek: 'Monday',
  timeFormat: '12h',
  defaultHomeMode: 'Productivity',
  themeColor: 'blue',
  dailyGoal: '',
  dailyGoalDate: '',
  dailyGoalCompleted: false,
  dailyGoalCompletedDate: ''
};

// Generate helpful smart notifications / suggestions based on tasks & habits state
export function getSmartSuggestions(tasks: Task[], habits: Habit[]): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const todayStr = formatDate(new Date());

  // Check 1: Remaining High-Priority Tasks
  const highPriorityLeft = tasks.filter(t => !t.completed && t.dueDate === todayStr && (t.priority === 'High' || t.priority === 'Urgent')).length;
  if (highPriorityLeft > 0) {
    suggestions.push({
      id: 'sug-high-pri',
      text: `Focus alert: You have ${highPriorityLeft} high-priority task${highPriorityLeft > 1 ? 's' : ''} left for today.`,
      type: 'warning'
    });
  }

  // Check 2: Completed today's tasks
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const completedTodayTasks = todayTasks.filter(t => t.completed);
  if (todayTasks.length > 0 && completedTodayTasks.length === todayTasks.length) {
    suggestions.push({
      id: 'sug-all-done',
      text: "Outstanding effort! You've completed all scheduled tasks for today. Plan tomorrow?",
      type: 'encouragement'
    });
  }

  // Check 3: Habits tracking reminders
  const incompleteHabits = habits.filter(h => !h.paused && !h.history[todayStr]);
  if (incompleteHabits.length > 0) {
    const nextHabit = incompleteHabits[0];
    suggestions.push({
      id: 'sug-habit-remind',
      text: `Context reminder: You usually complete "${nextHabit.name}" around this time.`,
      type: 'insight'
    });
  }

  // Check 4: Generalized advice if lists are empty or well on track
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'sug-default-quote',
      text: "Tip: Deep work sessions are best scheduled in 90-minute blocks with short breathing pauses.",
      type: 'insight'
    });
  }

  return suggestions;
}
