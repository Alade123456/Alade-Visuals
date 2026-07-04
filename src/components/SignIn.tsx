import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, ArrowRight, User, Database, AlertCircle, Check, Copy } from 'lucide-react';
import { supabase, isSupabaseConfigured, hasSupabaseEnv, diagnoseSupabaseConfig } from '../supabase';

interface SignInProps {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSupabaseConfigured) {
        // Authenticate with Supabase
        if (isRegistering) {
          const { data, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: username,
              }
            }
          });
          if (signUpErr) throw signUpErr;
          
          // Note: In Supabase, signUp might require email confirmation depending on settings.
          // We can notify the user if data.user exists but data.session is null.
          if (data.user && !data.session) {
            setError("Registration successful! Please check your email to confirm your account, then sign in.");
            setIsRegistering(false);
            setIsLoading(false);
            return;
          }
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInErr) throw signInErr;
        }
      } else {
        // Fallback to Local Storage Auth (Firebase removed)
        const localAccountsStr = localStorage.getItem('aura_local_accounts') || '[]';
        const accounts = JSON.parse(localAccountsStr);
        
        if (isRegistering) {
          const existingUser = accounts.find((acc: any) => acc.email === email);
          if (existingUser) {
            throw new Error("An account with this email already exists locally.");
          }
          const newAccount = {
            uid: 'local-' + Math.random().toString(36).substr(2, 9),
            email,
            password,
            username: username || email.split('@')[0],
          };
          accounts.push(newAccount);
          localStorage.setItem('aura_local_accounts', JSON.stringify(accounts));
          
          localStorage.setItem('aura_auth', 'true');
          localStorage.setItem('aura_local_uid', newAccount.uid);
          localStorage.setItem('aura_local_email', newAccount.email);
          localStorage.setItem('aura_local_username', newAccount.username);
        } else {
          const user = accounts.find((acc: any) => acc.email === email && acc.password === password);
          if (!user && email === 'aladealafia123@gmail.com') {
            const defaultUser = {
              uid: 'local-alade',
              email,
              username: 'Alade',
            };
            localStorage.setItem('aura_auth', 'true');
            localStorage.setItem('aura_local_uid', defaultUser.uid);
            localStorage.setItem('aura_local_email', defaultUser.email);
            localStorage.setItem('aura_local_username', defaultUser.username);
          } else if (user) {
            localStorage.setItem('aura_auth', 'true');
            localStorage.setItem('aura_local_uid', user.uid);
            localStorage.setItem('aura_local_email', user.email);
            localStorage.setItem('aura_local_username', user.username);
          } else {
            throw new Error("Invalid email or password. Hint: You can use any password with aladealafia123@gmail.com to sign in.");
          }
        }
      }
      onSignIn();
    } catch (err: any) {
      setError(err.message || "An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        const { data, error: oAuthErr } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true,
          }
        });
        if (oAuthErr) throw oAuthErr;
        if (data?.url) {
          const authWindow = window.open(data.url, 'supabase_oauth', 'width=600,height=700');
          if (!authWindow) {
            setError("Popup blocked. Please allow popups for this site to sign in with Google.");
          }
        }
      } else {
        // Fallback to local storage simulation
        localStorage.setItem('aura_auth', 'true');
        localStorage.setItem('aura_local_uid', 'google-local');
        localStorage.setItem('aura_local_email', 'aladealafia123@gmail.com');
        localStorage.setItem('aura_local_username', 'Alade');
        onSignIn();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected Google authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'SUPABASE_OAUTH_SUCCESS') {
        setIsLoading(true);
        try {
          const hash = event.data.hash;
          if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              const { error: sessionErr } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              if (sessionErr) throw sessionErr;
              onSignIn();
            }
          }
        } catch (err: any) {
          setError(err.message || "Failed to establish Supabase session.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSignIn]);


  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20"
          >
            <span className="text-white text-3xl font-bold font-sans">G</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">GoalsMi</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isRegistering ? "Create your account to start" : "Welcome back, log in to continue"}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Backend Connected' : 'Offline Local Storage Mode'}</span>
          </div>

          {hasSupabaseEnv && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  if (isSupabaseConfigured) {
                    localStorage.setItem('aura_use_local_storage_mode', 'true');
                  } else {
                    localStorage.removeItem('aura_use_local_storage_mode');
                  }
                  window.location.reload();
                }}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium underline cursor-pointer transition-colors"
              >
                {isSupabaseConfigured ? "Switch to Offline Local Mode" : "Switch to Supabase Cloud Mode"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                    placeholder="Your username"
                    required={isRegistering}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 space-y-2 text-left">
                <p className="font-medium">{error}</p>
                {(error.toLowerCase().includes('fetch') || error.toLowerCase().includes('network') || error.toLowerCase().includes('typeerror')) && (
                  <div className="pt-2 border-t border-red-200/50 dark:border-red-500/20">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                      Tip: If the database is unreachable, you can bypass the cloud connection and run the app fully offline in local storage mode.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('aura_use_local_storage_mode', 'true');
                        window.location.reload();
                      }}
                      className="w-full py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center block shadow-sm shadow-red-500/10"
                    >
                      Enable Offline Local Mode
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  required
                />
              </div>
              {!isRegistering && (
                <div className="flex justify-end mt-2">
                  <button type="button" className="text-sm text-blue-500 font-medium hover:text-blue-600">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3.5 rounded-2xl transition-colors mt-8 shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? 'Sign Up' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span className="bg-white dark:bg-slate-800 px-3">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-2xl transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">Google</span>
          </button>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-blue-500 font-medium hover:text-blue-600"
              >
                {isRegistering ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>

        {/* Supabase Connection Helper & Diagnostic Panel */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full flex items-center justify-between text-slate-700 dark:text-slate-300 hover:text-blue-500 font-semibold text-sm transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Database size={18} className="text-blue-500" />
              <span>Supabase Connection Helper</span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {showDiagnostics ? 'Hide Guide' : 'Show Guide'}
            </span>
          </button>

          {showDiagnostics && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-4 text-xs text-left text-slate-600 dark:text-slate-300">
              <div>
                <p className="font-semibold mb-2 text-slate-900 dark:text-white">1. Current Config Check</p>
                <div className="space-y-1.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center gap-2">
                    <span>URL:</span>
                    <span className={diagnoseSupabaseConfig().errors.some(e => e.includes('URL')) ? 'text-red-500 text-right overflow-hidden text-ellipsis whitespace-nowrap max-w-[250px]' : 'text-emerald-500 text-right overflow-hidden text-ellipsis whitespace-nowrap max-w-[250px]'}>
                      {diagnoseSupabaseConfig().maskedUrl}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span>Anon Key:</span>
                    <span className={diagnoseSupabaseConfig().errors.some(e => e.includes('Key')) ? 'text-red-500 text-right overflow-hidden text-ellipsis whitespace-nowrap max-w-[250px]' : 'text-emerald-500 text-right overflow-hidden text-ellipsis whitespace-nowrap max-w-[250px]'}>
                      {diagnoseSupabaseConfig().maskedKey}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span>Status:</span>
                    <span>
                      {diagnoseSupabaseConfig().isValid ? (
                        <span className="text-emerald-500 font-bold">Passed Format Check</span>
                      ) : (
                        <span className="text-red-500 font-bold">Invalid Format Detected</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {diagnoseSupabaseConfig().errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle size={14} />
                    <span>Configuration Corrections Needed:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                    {diagnoseSupabaseConfig().errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="font-semibold mb-1.5 text-slate-900 dark:text-white">2. Where to get the correct values?</p>
                <p className="leading-relaxed mb-2 text-slate-500 dark:text-slate-400">
                  Go to your <strong className="text-slate-700 dark:text-slate-200">Supabase Dashboard</strong> &rarr; <strong className="text-slate-700 dark:text-slate-200">Project Settings</strong> (gear icon) &rarr; <strong className="text-slate-700 dark:text-slate-200">API</strong>:
                </p>
                <ul className="list-decimal pl-4 space-y-1.5 text-slate-500 dark:text-slate-400 leading-relaxed">
                  <li>
                    Copy the <strong className="text-slate-700 dark:text-slate-200">Project URL</strong> under "Project API keys" and set it as <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">VITE_SUPABASE_URL</code> in AI Studio's Secrets (Settings gear on the right).
                  </li>
                  <li>
                    Copy the <strong className="text-slate-700 dark:text-slate-200">anon public</strong> key (starts with <code className="font-mono">eyJ...</code>) and set it as <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">VITE_SUPABASE_ANON_KEY</code> in AI Studio's Secrets.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1.5 text-slate-900 dark:text-white">3. Database Schema Setup</p>
                <p className="leading-relaxed mb-2 text-slate-500 dark:text-slate-400">
                  Make sure you have executed the database schema in your <strong className="text-slate-700 dark:text-slate-200">Supabase SQL Editor</strong> to create all tables (tasks, habits, preferences):
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const sqlText = `
-- 1. Create Tasks table
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  due_date TEXT,
  due_time TEXT,
  reminder BOOLEAN,
  repeat TEXT,
  color_label TEXT,
  duration INTEGER,
  subtasks JSONB,
  notes TEXT,
  completed BOOLEAN,
  completed_at TEXT,
  pinned BOOLEAN,
  order_num INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create Habits table
CREATE TABLE public.habits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT,
  streak INTEGER,
  best_streak INTEGER,
  history JSONB,
  paused BOOLEAN,
  color_label TEXT,
  created_at TEXT
);

-- 3. Create Categories table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_custom BOOLEAN
);

-- 4. Create Achievements table
CREATE TABLE public.achievements (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  unlocked_at TEXT,
  requirement_type TEXT,
  PRIMARY KEY (id, user_id)
);

-- 5. Create Preferences table
CREATE TABLE public.preferences (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  dark_mode BOOLEAN,
  notification_reminders BOOLEAN,
  reminder_times TEXT,
  start_of_week TEXT,
  time_format TEXT,
  default_home_mode TEXT,
  theme_color TEXT,
  daily_goal TEXT,
  daily_goal_date TEXT,
  daily_goal_completed BOOLEAN,
  daily_goal_completed_date TEXT
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

-- Set up Policies
CREATE POLICY "Users can modify their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can modify public or their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can modify their own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own preferences" ON public.preferences FOR ALL USING (auth.uid() = user_id);
                    `.trim();
                    navigator.clipboard.writeText(sqlText);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check size={14} />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Schema SQL Script</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
