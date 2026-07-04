import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { users, tasks, habits, categories, achievements, preferences } from './src/db/schema.ts';
import { eq, or, and, inArray, not } from 'drizzle-orm';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json({ limit: '10mb' }));

  // API Health Route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'cloudsql_postgres' });
  });

  // 1. Pull Sync Route
  app.get('/api/sync/pull', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const email = req.user!.email || '';

    try {
      // Ensure the user exists in Cloud SQL
      await db.insert(users)
        .values({ uid, email })
        .onConflictDoUpdate({
          target: users.uid,
          set: { email },
        });

      // Fetch or initialize user preferences
      let userPrefs = await db.select().from(preferences).where(eq(preferences.userId, uid)).limit(1);
      if (userPrefs.length === 0) {
        const defaultPrefs = {
          userId: uid,
          darkMode: false,
          notificationReminders: false,
          reminderTimes: '09:00',
          startOfWeek: 'Monday',
          timeFormat: '12h',
          defaultHomeMode: 'Productivity',
          themeColor: 'indigo',
        };
        await db.insert(preferences).values(defaultPrefs);
        userPrefs = [defaultPrefs as any];
      }

      // Fetch tasks, habits, categories, and achievements
      const [userTasks, userHabits, userCategories, userAchievements] = await Promise.all([
        db.select().from(tasks).where(eq(tasks.userId, uid)),
        db.select().from(habits).where(eq(habits.userId, uid)),
        db.select().from(categories).where(or(eq(categories.userId, uid), eq(categories.userId, null as any))),
        db.select().from(achievements).where(eq(achievements.userId, uid)),
      ]);

      res.json({
        tasks: userTasks,
        habits: userHabits,
        categories: userCategories,
        achievements: userAchievements,
        preferences: userPrefs[0],
      });
    } catch (error: any) {
      console.error('Error pulling sync data:', error);
      res.status(500).json({ error: 'Failed to pull data from database', details: error.message });
    }
  });

  // 2. Push Sync Route (Declarative State Sync)
  app.post('/api/sync/push', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const email = req.user!.email || '';
    const { 
      tasks: pushTasks, 
      habits: pushHabits, 
      categories: pushCategories, 
      achievements: pushAchievements, 
      preferences: pushPreferences 
    } = req.body;

    try {
      // Ensure user exists
      await db.insert(users)
        .values({ uid, email })
        .onConflictDoUpdate({
          target: users.uid,
          set: { email },
        });

      // A. Preferences
      if (pushPreferences) {
        await db.insert(preferences)
          .values({
            userId: uid,
            darkMode: !!pushPreferences.darkMode,
            notificationReminders: !!pushPreferences.notificationReminders,
            reminderTimes: pushPreferences.reminderTimes || '09:00',
            startOfWeek: pushPreferences.startOfWeek || 'Monday',
            timeFormat: pushPreferences.timeFormat || '12h',
            defaultHomeMode: pushPreferences.defaultHomeMode || 'Productivity',
            themeColor: pushPreferences.themeColor || 'indigo',
            dailyGoal: pushPreferences.dailyGoal || null,
            dailyGoalDate: pushPreferences.dailyGoalDate || null,
            dailyGoalCompleted: !!pushPreferences.dailyGoalCompleted,
            dailyGoalCompletedDate: pushPreferences.dailyGoalCompletedDate || null,
          })
          .onConflictDoUpdate({
            target: preferences.userId,
            set: {
              darkMode: !!pushPreferences.darkMode,
              notificationReminders: !!pushPreferences.notificationReminders,
              reminderTimes: pushPreferences.reminderTimes || '09:00',
              startOfWeek: pushPreferences.startOfWeek || 'Monday',
              timeFormat: pushPreferences.timeFormat || '12h',
              defaultHomeMode: pushPreferences.defaultHomeMode || 'Productivity',
              themeColor: pushPreferences.themeColor || 'indigo',
              dailyGoal: pushPreferences.dailyGoal || null,
              dailyGoalDate: pushPreferences.dailyGoalDate || null,
              dailyGoalCompleted: !!pushPreferences.dailyGoalCompleted,
              dailyGoalCompletedDate: pushPreferences.dailyGoalCompletedDate || null,
            },
          });
      }

      // B. Tasks (Sync & Declarative Deletion)
      if (Array.isArray(pushTasks)) {
        const incomingTaskIds = pushTasks.map((t: any) => t.id);
        if (incomingTaskIds.length > 0) {
          await db.delete(tasks).where(and(eq(tasks.userId, uid), not(inArray(tasks.id, incomingTaskIds))));
        } else {
          await db.delete(tasks).where(eq(tasks.userId, uid));
        }

        for (const task of pushTasks) {
          await db.insert(tasks)
            .values({
              id: task.id,
              userId: uid,
              name: task.name,
              description: task.description || '',
              category: task.category || '',
              priority: task.priority || 'Medium',
              dueDate: task.dueDate || '',
              dueTime: task.dueTime || '',
              reminder: !!task.reminder,
              repeat: task.repeat || 'None',
              colorLabel: task.colorLabel || '',
              duration: task.duration || 0,
              subtasks: task.subtasks || [],
              notes: task.notes || '',
              completed: !!task.completed,
              completedAt: task.completedAt || null,
              pinned: !!task.pinned,
              orderNum: task.orderNum || task.order || 0,
            })
            .onConflictDoUpdate({
              target: tasks.id,
              set: {
                name: task.name,
                description: task.description || '',
                category: task.category || '',
                priority: task.priority || 'Medium',
                dueDate: task.dueDate || '',
                dueTime: task.dueTime || '',
                reminder: !!task.reminder,
                repeat: task.repeat || 'None',
                colorLabel: task.colorLabel || '',
                duration: task.duration || 0,
                subtasks: task.subtasks || [],
                notes: task.notes || '',
                completed: !!task.completed,
                completedAt: task.completedAt || null,
                pinned: !!task.pinned,
                orderNum: task.orderNum || task.order || 0,
              },
            });
        }
      }

      // C. Habits (Sync & Declarative Deletion)
      if (Array.isArray(pushHabits)) {
        const incomingHabitIds = pushHabits.map((h: any) => h.id);
        if (incomingHabitIds.length > 0) {
          await db.delete(habits).where(and(eq(habits.userId, uid), not(inArray(habits.id, incomingHabitIds))));
        } else {
          await db.delete(habits).where(eq(habits.userId, uid));
        }

        for (const habit of pushHabits) {
          await db.insert(habits)
            .values({
              id: habit.id,
              userId: uid,
              name: habit.name,
              frequency: habit.frequency || 'Daily',
              streak: habit.streak || 0,
              bestStreak: habit.bestStreak || 0,
              history: habit.history || {},
              paused: !!habit.paused,
              colorLabel: habit.colorLabel || '',
              createdAt: habit.createdAt || new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: habits.id,
              set: {
                name: habit.name,
                frequency: habit.frequency || 'Daily',
                streak: habit.streak || 0,
                bestStreak: habit.bestStreak || 0,
                history: habit.history || {},
                paused: !!habit.paused,
                colorLabel: habit.colorLabel || '',
              },
            });
        }
      }

      // D. Categories (Sync & Declarative Deletion of custom ones)
      if (Array.isArray(pushCategories)) {
        const customCategories = pushCategories.filter((c: any) => c.isCustom);
        const incomingCategoryIds = customCategories.map((c: any) => c.id);
        if (incomingCategoryIds.length > 0) {
          await db.delete(categories).where(and(eq(categories.userId, uid), not(inArray(categories.id, incomingCategoryIds))));
        } else {
          await db.delete(categories).where(eq(categories.userId, uid));
        }

        for (const cat of customCategories) {
          await db.insert(categories)
            .values({
              id: cat.id,
              userId: uid,
              name: cat.name,
              color: cat.color || 'bg-blue-500',
              icon: cat.icon || 'CheckCircle',
              isCustom: true,
            })
            .onConflictDoUpdate({
              target: categories.id,
              set: {
                name: cat.name,
                color: cat.color || 'bg-blue-500',
                icon: cat.icon || 'CheckCircle',
              },
            });
        }
      }

      // E. Achievements
      if (Array.isArray(pushAchievements)) {
        for (const ach of pushAchievements) {
          await db.insert(achievements)
            .values({
              id: ach.id,
              userId: uid,
              title: ach.title,
              description: ach.description || '',
              iconName: ach.iconName || 'Award',
              unlockedAt: ach.unlockedAt || null,
              requirementType: ach.requirementType,
            })
            .onConflictDoUpdate({
              target: [achievements.id, achievements.userId],
              set: {
                title: ach.title,
                description: ach.description || '',
                iconName: ach.iconName || 'Award',
                unlockedAt: ach.unlockedAt || null,
              },
            });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error pushing sync data:', error);
      res.status(500).json({ error: 'Failed to push data to database', details: error.message });
    }
  });

  // 3. Table specific endpoints
  // Tasks delete
  app.delete('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { ids } = req.body;
    try {
      if (Array.isArray(ids) && ids.length > 0) {
        await db.delete(tasks).where(and(eq(tasks.userId, uid), inArray(tasks.id, ids)));
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting tasks:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tasks upsert
  app.post('/api/tasks/upsert', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { rows } = req.body;
    try {
      if (Array.isArray(rows)) {
        for (const row of rows) {
          await db.insert(tasks)
            .values({
              id: row.id,
              userId: uid,
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
              subtasks: typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : row.subtasks || [],
              notes: row.notes || '',
              completed: !!row.completed,
              completedAt: row.completed_at || null,
              pinned: !!row.pinned,
              orderNum: row.order_num || 0,
            })
            .onConflictDoUpdate({
              target: tasks.id,
              set: {
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
                subtasks: typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : row.subtasks || [],
                notes: row.notes || '',
                completed: !!row.completed,
                completedAt: row.completed_at || null,
                pinned: !!row.pinned,
                orderNum: row.order_num || 0,
              }
            });
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error upserting tasks:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Habits delete
  app.delete('/api/habits', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { ids } = req.body;
    try {
      if (Array.isArray(ids) && ids.length > 0) {
        await db.delete(habits).where(and(eq(habits.userId, uid), inArray(habits.id, ids)));
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting habits:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Habits upsert
  app.post('/api/habits/upsert', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { rows } = req.body;
    try {
      if (Array.isArray(rows)) {
        for (const row of rows) {
          await db.insert(habits)
            .values({
              id: row.id,
              userId: uid,
              name: row.name,
              frequency: row.frequency || 'Daily',
              streak: row.streak || 0,
              bestStreak: row.best_streak || 0,
              history: typeof row.history === 'string' ? JSON.parse(row.history) : row.history || {},
              paused: !!row.paused,
              colorLabel: row.color_label || '',
              createdAt: row.created_at || new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: habits.id,
              set: {
                name: row.name,
                frequency: row.frequency || 'Daily',
                streak: row.streak || 0,
                bestStreak: row.best_streak || 0,
                history: typeof row.history === 'string' ? JSON.parse(row.history) : row.history || {},
                paused: !!row.paused,
                colorLabel: row.color_label || '',
              }
            });
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error upserting habits:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Categories delete
  app.delete('/api/categories', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { ids } = req.body;
    try {
      if (Array.isArray(ids) && ids.length > 0) {
        await db.delete(categories).where(and(eq(categories.userId, uid), inArray(categories.id, ids)));
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting categories:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Categories upsert
  app.post('/api/categories/upsert', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { rows } = req.body;
    try {
      if (Array.isArray(rows)) {
        for (const row of rows) {
          await db.insert(categories)
            .values({
              id: row.id,
              userId: uid,
              name: row.name,
              color: row.color || 'bg-blue-500',
              icon: row.icon || 'CheckCircle',
              isCustom: !!row.is_custom,
            })
            .onConflictDoUpdate({
              target: categories.id,
              set: {
                name: row.name,
                color: row.color || 'bg-blue-500',
                icon: row.icon || 'CheckCircle',
                isCustom: !!row.is_custom,
              }
            });
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error upserting categories:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Achievements upsert
  app.post('/api/achievements/upsert', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { rows } = req.body;
    try {
      if (Array.isArray(rows)) {
        for (const row of rows) {
          await db.insert(achievements)
            .values({
              id: row.id,
              userId: uid,
              title: row.title,
              description: row.description || '',
              iconName: row.icon_name || 'Award',
              unlockedAt: row.unlocked_at || null,
              requirementType: row.requirement_type,
            })
            .onConflictDoUpdate({
              target: [achievements.id, achievements.userId],
              set: {
                title: row.title,
                description: row.description || '',
                iconName: row.icon_name || 'Award',
                unlockedAt: row.unlocked_at || null,
              }
            });
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error upserting achievements:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Preferences upsert
  app.post('/api/preferences/upsert', requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user!.uid;
    const { row } = req.body;
    try {
      if (row) {
        await db.insert(preferences)
           .values({
             userId: uid,
             darkMode: !!row.dark_mode,
             notificationReminders: !!row.notification_reminders,
             reminderTimes: row.reminder_times || '09:00',
             startOfWeek: row.start_of_week || 'Monday',
             timeFormat: row.time_format || '12h',
             defaultHomeMode: row.default_home_mode || 'Productivity',
             themeColor: row.theme_color || 'indigo',
             dailyGoal: row.daily_goal || null,
             dailyGoalDate: row.daily_goal_date || null,
             dailyGoalCompleted: !!row.daily_goal_completed,
             dailyGoalCompletedDate: row.daily_goal_completed_date || null,
           })
           .onConflictDoUpdate({
             target: preferences.userId,
             set: {
               darkMode: !!row.dark_mode,
               notificationReminders: !!row.notification_reminders,
               reminderTimes: row.reminder_times || '09:00',
               startOfWeek: row.start_of_week || 'Monday',
               timeFormat: row.time_format || '12h',
               defaultHomeMode: row.default_home_mode || 'Productivity',
               themeColor: row.theme_color || 'indigo',
               dailyGoal: row.daily_goal || null,
               dailyGoalDate: row.daily_goal_date || null,
               dailyGoalCompleted: !!row.daily_goal_completed,
               dailyGoalCompletedDate: row.daily_goal_completed_date || null,
             }
           });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error upserting preferences:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
