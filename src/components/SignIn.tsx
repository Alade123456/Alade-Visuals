import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isSignUp) {
      if (!username.trim() || !email.trim() || !password) {
        setError('Please fill in all fields');
        return;
      }
      
      setIsLoading(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            avatar_idx: selectedAvatarIdx,
          }
        }
      });
      setIsLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Success! Switch to Sign In view
      setIsSignUp(false);
      setPassword('');
      setSuccessMessage('Your account has been created. Please check your email and verify your address before logging in.');
      
      // Ensure they are not auto-logged in, in case email verification is disabled
      if (data.session) {
        await supabase.auth.signOut();
      }
    } else {
      if (!email.trim() || !password) {
        setError('Please fill in all fields');
        return;
      }

      setIsLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      setIsLoading(false);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!data.session) {
        setError('Login failed: No session established.');
        return;
      }

      const userMetadata = data?.user?.user_metadata || {};
      const storedUsername = userMetadata.username || localStorage.getItem('aura_local_username') || 'User';
      const storedAvatarIdx = typeof userMetadata.avatar_idx === 'number' ? userMetadata.avatar_idx : 0;
      
      const selected = AVATAR_PRESETS[storedAvatarIdx] || AVATAR_PRESETS[0];
      const storedAvatar = `preset|${selected.emoji}|${selected.bg}`;

      localStorage.setItem('aura_local_username', storedUsername);
      localStorage.setItem('aura_local_avatar', storedAvatar);
      localStorage.setItem('aura_auth', 'true');
      
      onSignIn(storedUsername, storedAvatar);
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
            {isSignUp ? 'Create a local profile to start tracking goals.' : 'Sign in to access your local goals.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-750">
          <form onSubmit={handleSubmit} className="space-y-5">
            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium text-center">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium text-center">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-2 ml-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white font-medium"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Username Input */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-2 ml-1 mt-1">
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
                        required={isSignUp}
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : (isSignUp ? 'Create Profile' : 'Sign In')}
              {!isLoading && <ArrowRight size={18} />}
            </button>
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
