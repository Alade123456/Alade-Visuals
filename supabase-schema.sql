-- Execute this SQL code in the Supabase SQL Editor to set up the database tables

-- 1. Tasks Table
CREATE TABLE tasks (
  "id" TEXT PRIMARY KEY,
  "user_id" UUID REFERENCES auth.users NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "priority" TEXT,
  "dueDate" TEXT,
  "dueTime" TEXT,
  "reminder" BOOLEAN DEFAULT false,
  "repeat" TEXT,
  "colorLabel" TEXT,
  "duration" INTEGER,
  "subtasks" JSONB DEFAULT '[]'::jsonb,
  "notes" TEXT,
  "completed" BOOLEAN DEFAULT false,
  "completedAt" TEXT,
  "pinned" BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

-- 2. Habits Table
CREATE TABLE habits (
  "id" TEXT PRIMARY KEY,
  "user_id" UUID REFERENCES auth.users NOT NULL,
  "name" TEXT NOT NULL,
  "frequency" TEXT,
  "streak" INTEGER DEFAULT 0,
  "bestStreak" INTEGER DEFAULT 0,
  "history" JSONB DEFAULT '{}'::jsonb,
  "paused" BOOLEAN DEFAULT false,
  "colorLabel" TEXT,
  "createdAt" TEXT
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own habits" ON habits FOR ALL USING (auth.uid() = user_id);

-- 3. Categories Table
CREATE TABLE categories (
  "id" TEXT PRIMARY KEY,
  "user_id" UUID REFERENCES auth.users NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT,
  "icon" TEXT,
  "isCustom" BOOLEAN DEFAULT false
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (auth.uid() = user_id);

-- 4. Achievements Table
CREATE TABLE achievements (
  "id" TEXT NOT NULL,
  "user_id" UUID REFERENCES auth.users NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "iconName" TEXT,
  "unlockedAt" TEXT,
  "requirementType" TEXT,
  PRIMARY KEY ("id", "user_id")
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own achievements" ON achievements FOR ALL USING (auth.uid() = user_id);

-- 5. Notes Table
CREATE TABLE notes (
  "id" TEXT PRIMARY KEY,
  "user_id" UUID REFERENCES auth.users NOT NULL,
  "content" TEXT,
  "createdAt" TEXT,
  "pinned" BOOLEAN DEFAULT false
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notes" ON notes FOR ALL USING (auth.uid() = user_id);

-- 6. Preferences Table
CREATE TABLE preferences (
  "user_id" UUID PRIMARY KEY REFERENCES auth.users,
  "darkMode" TEXT DEFAULT 'Auto',
  "notificationReminders" BOOLEAN DEFAULT false,
  "reminderTimes" TEXT DEFAULT '09:00',
  "startOfWeek" TEXT DEFAULT 'Monday',
  "timeFormat" TEXT DEFAULT '12h',
  "defaultHomeMode" TEXT DEFAULT 'Productivity',
  "themeColor" TEXT DEFAULT 'blue',
  "dailyGoal" TEXT,
  "dailyGoalDate" TEXT,
  "dailyGoalCompleted" BOOLEAN DEFAULT false,
  "dailyGoalCompletedDate" TEXT,
  "dailyGoalsHistory" JSONB DEFAULT '[]'::jsonb,
  "autoDeleteOldNotes" BOOLEAN DEFAULT false
);
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences" ON preferences FOR ALL USING (auth.uid() = user_id);
