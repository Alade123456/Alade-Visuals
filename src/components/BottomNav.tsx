import React from 'react';
import { Home, ListTodo, Flame, User } from 'lucide-react';

export type TabId = 'home' | 'tasks' | 'habits' | 'analytics' | 'profile' | 'calendar';

interface BottomNavProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  tasksCount: number;
  habitsCount: number;
}

export default function BottomNav({ 
  activeTab, 
  onChangeTab,
  tasksCount,
  habitsCount
}: BottomNavProps) {
  interface NavItem {
    id: TabId;
    label: string;
    icon: any;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, badge: tasksCount },
    { id: 'habits', label: 'Habits', icon: Flame, badge: habitsCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav 
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_24px_-4px_rgba(148,163,184,0.12)] dark:shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.3)] z-40 px-3 pb-safe-bottom"
    >
      <div className="flex justify-between items-center py-2 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className="flex-1 flex flex-col items-center justify-center relative py-1 focus:outline-none cursor-pointer transition-all"
            >
              {/* Active Indicator Arc */}
              {isActive && (
                <span 
                  className="absolute top-0 w-8 h-1 rounded-full bg-blue-500" 
                  id={`nav-active-indicator-${item.id}`}
                />
              )}

              {/* Icon Container with optional badges */}
              <div className="relative p-1">
                <Icon 
                  className={`w-5.5 h-5.5 transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-500 scale-110 stroke-[2.5]' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`} 
                />
                
                {/* Numeric Indicator Badges (only for active counts in Tasks / Habits) */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span 
                className={`text-[9px] font-bold tracking-wider uppercase mt-1 transition-colors ${
                  isActive 
                    ? 'text-blue-500 font-extrabold' 
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
