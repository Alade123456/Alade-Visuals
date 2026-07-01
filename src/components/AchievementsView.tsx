import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, Zap, Flame, Award, Cpu, 
  Sunrise, TrendingUp, Crown, Lock 
} from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsViewProps {
  achievements: Achievement[];
}

export default function AchievementsView({ achievements }: AchievementsViewProps) {
  
  const renderIcon = (name: string, isUnlocked: boolean) => {
    const baseClass = `w-7 h-7 ${isUnlocked ? 'scale-110' : 'text-slate-300 dark:text-slate-700'}`;
    
    switch (name) {
      case 'CheckCircle': 
        return <CheckCircle className={`${baseClass} text-blue-500`} />;
      case 'Zap': 
        return <Zap className={`${baseClass} text-yellow-500`} />;
      case 'Flame': 
        return <Flame className={`${baseClass} text-orange-500`} />;
      case 'Award': 
        return <Award className={`${baseClass} text-emerald-500`} />;
      case 'Cpu': 
        return <Cpu className={`${baseClass} text-indigo-500`} />;
      case 'Sunrise': 
        return <Sunrise className={`${baseClass} text-amber-500`} />;
      case 'TrendingUp': 
        return <TrendingUp className={`${baseClass} text-pink-500`} />;
      case 'Crown': 
        return <Crown className={`${baseClass} text-purple-500`} />;
      default: 
        return <Award className={baseClass} />;
    }
  };

  const unlockedCount = achievements.filter(a => !!a.unlockedAt).length;

  return (
    <div className="space-y-4" id="achievements-container">
      <div className="flex justify-between items-center px-1">
        <div>
          <h4 className="font-display font-bold text-slate-800 dark:text-white text-sm">
            Milestones & Achievements
          </h4>
          <p className="text-[10px] text-slate-400">Unlock awards as you build systems</p>
        </div>
        <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
          {unlockedCount} / {achievements.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3" id="achievements-grid">
        {achievements.map((ach) => {
          const isUnlocked = !!ach.unlockedAt;

          return (
            <motion.div
              key={ach.id}
              whileHover={{ scale: 1.02 }}
              className={`minimal-card p-3.5 flex flex-col items-center text-center relative overflow-hidden transition-all ${
                isUnlocked 
                  ? 'border-slate-200/80 dark:border-slate-800 shadow-sm' 
                  : 'border-dashed border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-950/20'
              }`}
            >
              {/* Lock Indicator */}
              {!isUnlocked && (
                <div className="absolute top-2 right-2 text-slate-300 dark:text-slate-700">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Award Icon Sphere */}
              <div className={`p-3 rounded-full mb-3 flex items-center justify-center ${
                isUnlocked 
                  ? 'bg-slate-50 dark:bg-slate-850 shadow-inner' 
                  : 'bg-transparent border border-dashed border-slate-200 dark:border-slate-800'
              }`}>
                {renderIcon(ach.iconName, isUnlocked)}
              </div>

              <h5 className={`text-xs font-bold leading-tight ${isUnlocked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                {ach.title}
              </h5>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug mt-1 max-w-[120px]">
                {ach.description}
              </p>

              {/* Unlocked Date Badge */}
              {isUnlocked && ach.unlockedAt && (
                <span className="text-[8px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded mt-2 uppercase">
                  Earned
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
