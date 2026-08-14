import React from 'react';
import { Inbox, CheckSquare, Shield, Clock, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

export function BottomNavBar() {
  const {
    currentView,
    setCurrentView,
    setSelectedProjectId,
    language,
    t,
  } = useApp();

  const isAr = language === 'ar';

  const navItems = [
    {
      id: 'inbox',
      label: t('inbox'),
      icon: Inbox,
      onClick: () => {
        setCurrentView('inbox');
        setSelectedProjectId(null);
      }
    },
    {
      id: 'today',
      label: isAr ? 'اليوم' : 'Today',
      icon: CheckSquare,
      onClick: () => {
        setCurrentView('today');
        setSelectedProjectId(null);
      }
    },
    {
      id: 'hero',
      label: isAr ? 'البطل' : 'Hero',
      icon: Shield,
      onClick: () => {
        setCurrentView('hero');
        setSelectedProjectId(null);
      }
    },
    {
      id: 'pomodoro',
      label: isAr ? 'بومودورو' : 'Pomodoro',
      icon: Clock,
      onClick: () => {
        setCurrentView('pomodoro');
        setSelectedProjectId(null);
      }
    },
    {
      id: 'leaderboard',
      label: isAr ? 'المتصدرين' : 'Leaderboard',
      icon: Trophy,
      onClick: () => {
        setCurrentView('leaderboard');
        setSelectedProjectId(null);
      }
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#f8f9fa] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-around px-2 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom,0px)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            id={`bottom-nav-btn-${item.id}`}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-all duration-200 cursor-pointer",
              isActive 
                ? "text-indigo-600 dark:text-indigo-400 scale-105 font-bold" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            <div className={cn(
              "p-1 rounded-xl transition-all duration-200 mb-0.5",
              isActive ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-transparent"
            )}>
              <Icon className="w-5 h-5 shrink-0" />
            </div>
            <span className="font-sans leading-none tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
