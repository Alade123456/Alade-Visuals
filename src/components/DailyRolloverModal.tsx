import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, ArrowRight, Trash2, X, Sparkles, CheckSquare, Square } from 'lucide-react';
import { Task } from '../types';
import { formatDate } from '../utils';

interface DailyRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onConfirm: (tasksToKeep: string[]) => void;
}

export default function DailyRolloverModal({ isOpen, onClose, tasks, onConfirm }: DailyRolloverModalProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set(tasks.map(t => t.id)));

  const toggleTask = (id: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTaskIds(newSet);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedTaskIds));
    onClose();
  };

  const todayStr = formatDate(new Date());

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800"
          >
            {/* Header Banner */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
            
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-900/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  New Day Reset
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  It's a new day! Old tasks have been cleared, but we found some <span className="font-semibold text-slate-700 dark:text-slate-300">important</span> tasks from yesterday. Which ones would you like to carry over to today?
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              {tasks.map((task) => {
                const isSelected = selectedTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-800 border-indigo-500/50 shadow-md shadow-indigo-500/5' 
                        : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className={`shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'
                    }`}>
                      {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600'
                      }`}>
                        {task.name}
                      </h3>
                      {task.priority !== 'Low' && (
                        <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md tracking-wider ${
                          task.priority === 'Urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between gap-3">
              <button
                onClick={() => { setSelectedTaskIds(new Set()); handleConfirm(); }}
                className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                Carry Over
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
