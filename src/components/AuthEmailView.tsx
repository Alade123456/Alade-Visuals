import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, User, AlertCircle, Check } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

interface AuthEmailViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  message: string | null;
  setMessage: (message: string | null) => void;
  isRegistering: boolean;
  setIsRegistering: (isRegistering: boolean) => void;
}

export function AuthEmailView({ 
  onSignIn, 
  isLoading, 
  setIsLoading, 
  error, 
  setError, 
  message, 
  setMessage,
  isRegistering,
  setIsRegistering
}: AuthEmailViewProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (isRegistering && !username.trim()) {
      setError("Username is required.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: username
          });
        }
        onSignIn();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSignIn();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          {error.includes('operation-not-allowed') && (
            <div className="mt-2 pt-2 border-t border-red-200/30 dark:border-red-500/10 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">🛠️ How to fix this in your Firebase Console:</p>
              <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                <li>Go to your <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-500 font-bold">Firebase Console</a>.</li>
                <li>In the left sidebar, click on <strong className="text-slate-700 dark:text-slate-300">Authentication</strong>.</li>
                <li>Go to the <strong className="text-slate-700 dark:text-slate-300">Sign-in method</strong> tab.</li>
                <li>Click <strong className="text-slate-700 dark:text-slate-300">Add new provider</strong> (or edit the existing list).</li>
                <li>Select <strong className="text-slate-700 dark:text-slate-300">Email/Password</strong>.</li>
                <li>Toggle <strong className="text-slate-700 dark:text-slate-300">Enable</strong> (both Email/Password and passwordless options can be configured, but standard email/password is required) and click <strong className="text-slate-700 dark:text-slate-300">Save</strong>.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className="p-3.5 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-100 dark:border-green-500/20 text-left flex items-start gap-2">
          <Check className="w-5 h-5 shrink-0" />
          <p className="font-medium mt-0.5">{message}</p>
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
            placeholder="••••••••"
            required
          />
        </div>
        {!isRegistering && (
          <div className="flex justify-end mt-2">
            <button 
              type="button" 
              onClick={handleResetPassword}
              className="text-sm text-blue-500 font-medium hover:text-blue-600 transition-colors"
            >
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
  );
}
