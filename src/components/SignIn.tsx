import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, ArrowRight, Sparkles } from 'lucide-react';

interface SignInProps {
  onSignIn: (username: string, avatarUrl: string) => void;
}

const AVATAR_PRESETS = [
  { emoji: '👨‍💻', label: 'Coder', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' },
  { emoji: '👩‍🔬', label: 'Scientist', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' },
  { emoji: '👨‍🎨', label: 'Artist', bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600' },
  { emoji: '👩‍🚀', label: 'Astronaut', bg: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600' },
  { emoji: '🕵️', label: 'Detective', bg: 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300' },
  { emoji: '👩‍🍳', label: 'Chef', bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' },
  { emoji: '🦸‍♀️', label: 'Hero', bg: 'bg-red-50 dark:bg-red-950/30 text-red-600' },
  { emoji: '🧙‍♂️', label: 'Wizard', bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600' },
  { emoji: '👩‍🏫', label: 'Teacher', bg: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700' },
  { emoji: '👨‍🚒', label: 'Firefighter', bg: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' },
  { emoji: '👩‍⚖️', label: 'Judge', bg: 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400' },
  { emoji: '🥷', label: 'Ninja', bg: 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100' },
];

export default function SignIn({ onSignIn }: SignInProps) {
  const [username, setUsername] = useState('');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      const selected = AVATAR_PRESETS[selectedAvatarIdx];
      const serializedAvatar = `preset|${selected.emoji}|${selected.bg}`;
      
      localStorage.setItem('aura_auth', 'true');
      localStorage.setItem('aura_local_username', username.trim());
      localStorage.setItem('aura_local_avatar', serializedAvatar);
      
      onSignIn(username.trim(), serializedAvatar);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20"
          >
            <span className="text-white text-3xl font-bold font-sans">G</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">GoalsMi</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Set up your profile to start tracking your goals locally.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-750">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-2 ml-1">
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white font-medium"
                  placeholder="Enter username"
                  maxLength={15}
                  required
                />
              </div>
            </div>

            {/* Avatar Preset Grid */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-3 ml-1 flex items-center gap-1">
                <Sparkles size={12} className="text-blue-500" /> Choose Your Avatar
              </label>
              
              <div className="grid grid-cols-4 gap-3 max-h-[190px] overflow-y-auto p-1 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-750">
                {AVATAR_PRESETS.map((preset, index) => {
                  const isSelected = selectedAvatarIdx === index;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSelectedAvatarIdx(index)}
                      className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm' 
                          : 'border-slate-150 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/40'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl mb-1 ${preset.bg}`}>
                        {preset.emoji}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                        {preset.label}
                      </span>
                      
                      {isSelected && (
                        <motion.div 
                          layoutId="active-avatar-ring"
                          className="absolute inset-0 rounded-2xl border-2 border-blue-500 pointer-events-none"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Get Started Button */}
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2 cursor-pointer"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
