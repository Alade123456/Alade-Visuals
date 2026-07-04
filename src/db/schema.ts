import { pgTable, text, integer, boolean, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users table
export const users = pgTable('users', {
  uid: text('uid').primaryKey(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Tasks table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  priority: text('priority').notNull().default('Medium'),
  dueDate: text('due_date'),
  dueTime: text('due_time'),
  reminder: boolean('reminder').notNull().default(false),
  repeat: text('repeat').notNull().default('None'),
  colorLabel: text('color_label'),
  duration: integer('duration').notNull().default(0),
  subtasks: jsonb('subtasks'),
  notes: text('notes'),
  completed: boolean('completed').notNull().default(false),
  completedAt: text('completed_at'),
  pinned: boolean('pinned').notNull().default(false),
  orderNum: integer('order_num').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Habits table
export const habits = pgTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  frequency: text('frequency').notNull().default('Daily'),
  streak: integer('streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  history: jsonb('history'),
  paused: boolean('paused').notNull().default(false),
  colorLabel: text('color_label'),
  createdAt: text('created_at').notNull(),
});

// 4. Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  isCustom: boolean('is_custom').notNull().default(false),
});

// 5. Achievements table
export const achievements = pgTable('achievements', {
  id: text('id').notNull(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  iconName: text('icon_name'),
  unlockedAt: text('unlocked_at'),
  requirementType: text('requirement_type').notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.id, table.userId] }),
  ];
});

// 6. Preferences table
export const preferences = pgTable('preferences', {
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .primaryKey(),
  darkMode: boolean('dark_mode').notNull().default(false),
  notificationReminders: boolean('notification_reminders').notNull().default(false),
  reminderTimes: text('reminder_times').notNull().default('09:00'),
  startOfWeek: text('start_of_week').notNull().default('Monday'),
  timeFormat: text('time_format').notNull().default('12h'),
  defaultHomeMode: text('default_home_mode').notNull().default('Productivity'),
  themeColor: text('theme_color').notNull().default('indigo'),
  dailyGoal: text('daily_goal'),
  dailyGoalDate: text('daily_goal_date'),
  dailyGoalCompleted: boolean('daily_goal_completed').notNull().default(false),
  dailyGoalCompletedDate: text('daily_goal_completed_date'),
});

// Relations definitions
export const usersRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks),
  habits: many(habits),
  categories: many(categories),
  achievements: many(achievements),
  preferences: one(preferences, {
    fields: [users.uid],
    references: [preferences.userId],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.uid],
  }),
}));

export const habitsRelations = relations(habits, ({ one }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.uid],
  }),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.uid],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.uid],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, {
    fields: [preferences.userId],
    references: [users.uid],
  }),
}));
