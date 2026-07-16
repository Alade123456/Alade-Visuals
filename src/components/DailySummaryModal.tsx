import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, X, Award, Flame, Smile, CheckCircle2, Zap, Sparkles, 
  ArrowRight, Compass, ShieldAlert, Trophy, Star
} from 'lucide-react';
import { Task, Habit } from '../types';
import { formatDate } from '../utils';

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: Habit[];
}

export default function DailySummaryModal({
  isOpen,
  onClose,
  tasks,
  habits
}: DailySummaryModalProps) {
  // Calculate yesterday's date string
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  };

  const yesterdayStr = getYesterdayStr();
  const yesterdayFormatted = new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Filter yesterday's tasks
  const completedTasksYesterday = tasks.filter(t => 
    t.completed && (
      (t.completedAt && t.completedAt.startsWith(yesterdayStr)) || 
      (!t.completedAt && t.dueDate === yesterdayStr)
    )
  );

  const pendingTasksYesterday = tasks.filter(t => 
    !t.completed && t.dueDate === yesterdayStr
  );

  const totalTasksYesterday = completedTasksYesterday.length + pendingTasksYesterday.length;
  const taskCompletionRate = totalTasksYesterday > 0 
    ? Math.round((completedTasksYesterday.length / totalTasksYesterday) * 100) 
    : 0;

  // Filter yesterday's habits
  const activeHabits = habits.filter(h => !h.paused);
  const completedHabitsYesterday = activeHabits.filter(h => h.history[yesterdayStr] === true);
  const missedHabitsYesterday = activeHabits.filter(h => !h.history[yesterdayStr]);
  const totalHabitsYesterday = activeHabits.length;

  const habitCompletionRate = totalHabitsYesterday > 0
    ? Math.round((completedHabitsYesterday.length / totalHabitsYesterday) * 100)
    : 0;

  // Overall Productivity Score
  const totalItemsYesterday = totalTasksYesterday + totalHabitsYesterday;
  const totalCompletedYesterday = completedTasksYesterday.length + completedHabitsYesterday.length;
  const overallProductivityScore = totalItemsYesterday > 0
    ? Math.round((totalCompletedYesterday / totalItemsYesterday) * 100)
    : 0;

  // Find any active high streaks
  const bestStreakHabit = habits.length > 0 
    ? [...habits].sort((a, b) => b.streak - a.streak)[0]
    : null;

  // Handle Close & Save in LocalStorage to prevent re-opening today
  const handleGotIt = () => {
    const todayStr = formatDate(new Date());
    localStorage.setItem('goalsmi_last_summary_shown_date', todayStr);
    onClose();
  };

  // Select dynamic greeting and illustration details based on success
  const getFeedbackMessage = () => {
    if (totalItemsYesterday === 0) {
      return {
        title: "A Blank Canvas!",
        desc: "Yesterday was a quiet day. Today is a brand new opportunity to build momentum, log habits, and conquer your agenda!",
        icon: Compass,
        color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30",
        badge: "Fresh Start"
      };
    }
    if (overallProductivityScore >= 80) {
      return {
        title: "Absolute Champion!",
        desc: "You crushed it yesterday! Your consistency is carving a path straight to your goals. Let's keep this momentum roaring!",
        icon: Trophy,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30",
        badge: "Supercharged"
      };
    }
    if (overallProductivityScore >= 40) {
      return {
        title: "Steady Progress!",
        desc: "Solid effort yesterday. Every single checked box and logged habit is a vote for the person you are becoming. Let's aim even higher today!",
        icon: Sparkles,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30",
        badge: "On Track"
      };
    }
    return {
      title: "Regroup & Recharge!",
      desc: "Yesterday didn't go exactly as planned, and that is completely okay. Resetting focus is a superpower. Let's tackle today one step at a time!",
      icon: Smile,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30",
      badge: "Reset Day"
    };
  };

  const feedback = getFeedbackMessage();
  const FeedbackIcon = feedback.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={handleGotIt}
            id="summary-modal-backdrop"
            className="fixed inset-0 bg-black z-[100] pointer-events-auto"
          />

          {/* Daily Summary Dialog container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            id="daily-summary-dialog"
            className="fixed inset-x-4 bottom-8 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[100] max-h-[85vh] overflow-y-auto no-scrollbar pb-6 border border-slate-150 dark:border-slate-800"
          >
            {/* Elegant Top Decorative Header Banner */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
            
            {/* Header Content */}
            <div className="p-6 pb-0 flex justify-between items-start mt-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Morning Briefing
                </span>
                <h3 className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-1">
                  Yesterday's Summary
                </h3>
                <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mt-0.5">
                  {yesterdayFormatted}
                </p>
              </div>
              <button 
                id="btn-close-summary"
                onClick={handleGotIt}
                className="p-1.5 rounded-full hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 mt-4 space-y-4">
              {/* Motivational Banner / Overall Grade */}
              <div className={`p-4 rounded-2xl flex items-start gap-3.5 ${feedback.color}`}>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm self-start shrink-0">
                  <FeedbackIcon className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {feedback.title}
                    </h4>
                    <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-white dark:bg-slate-900/60 shadow-xs">
                      {feedback.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                    {feedback.desc}
                  </p>
                </div>
              </div>

              {/* Progress Ring / Dashboard Grid */}
              {totalItemsYesterday > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Total Performance Ring Card */}
                  <div className="col-span-1 bg-slate-50 dark:bg-slate-850/60 p-3 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-850">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="28" cy="28" r="22" 
                          className="stroke-slate-200 dark:stroke-slate-800" 
                          strokeWidth="4" fill="transparent" 
                        />
                        <motion.circle 
                          cx="28" cy="28" r="22" 
                          className="stroke-indigo-500" 
                          strokeWidth="4" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 22}
                          initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - overallProductivityScore / 100) }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {overallProductivityScore}%
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-2 block">
                      Day Score
                    </span>
                  </div>

                  {/* Tasks Summary Mini Card */}
                  <div className="col-span-1 bg-slate-50 dark:bg-slate-850/60 p-3 rounded-2xl flex flex-col justify-between border border-slate-100 dark:border-slate-850">
                    <div>
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
                        {completedTasksYesterday.length}/{totalTasksYesterday}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Tasks Completed
                      </span>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${taskCompletionRate}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Habits Summary Mini Card */}
                  <div className="col-span-1 bg-slate-50 dark:bg-slate-850/60 p-3 rounded-2xl flex flex-col justify-between border border-slate-100 dark:border-slate-850">
                    <div>
                      <Zap className="w-4 h-4 text-emerald-500 mb-1" />
                      <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
                        {completedHabitsYesterday.length}/{totalHabitsYesterday}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Habits Logged
                      </span>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${habitCompletionRate}%` }} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Habit Streaks Highlight Banner */}
              {bestStreakHabit && bestStreakHabit.streak > 0 && (
                <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Streak Alive! 🔥
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">
                        Your habit "{bestStreakHabit.name}" is going strong
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    {bestStreakHabit.streak} Days
                  </span>
                </div>
              )}

              {/* Task/Habit Items List */}
              {totalItemsYesterday > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                    Breakdown
                  </span>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {/* Render Completed Tasks */}
                    {completedTasksYesterday.map(task => (
                      <div key={task.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 line-clamp-1 flex-1">
                          {task.name}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Task
                        </span>
                      </div>
                    ))}

                    {/* Render Completed Habits */}
                    {completedHabitsYesterday.map(habit => (
                      <div key={habit.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                          <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 line-clamp-1 flex-1">
                          {habit.name}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Habit
                        </span>
                      </div>
                    ))}

                    {/* Render Missed/Pending Tasks */}
                    {pendingTasksYesterday.map(task => (
                      <div key={task.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10">
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-750 flex items-center justify-center shrink-0">
                          <span className="text-[8px] text-slate-400">•</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-1 flex-1">
                          {task.name}
                        </span>
                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-450 uppercase tracking-wider">
                          Postponed
                        </span>
                      </div>
                    ))}

                    {/* Render Missed Habits */}
                    {missedHabitsYesterday.map(habit => (
                      <div key={habit.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10">
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-750 flex items-center justify-center shrink-0">
                          <span className="text-[8px] text-slate-400">•</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-1 flex-1">
                          {habit.name}
                        </span>
                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-450 uppercase tracking-wider">
                          Habit Missed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                id="btn-confirm-daily-summary"
                onClick={handleGotIt}
                className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Let's Conquer Today! 🚀
              </button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
