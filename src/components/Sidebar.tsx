import React, { useState, useEffect } from 'react';
import { Inbox, Calendar as CalendarIcon, CheckSquare, Kanban, BookOpen, User, Briefcase, Shield, Gift, Heart, Zap, Coins, X, Settings as SettingsIcon, BarChart3, ArrowUpDown, ChevronUp, ChevronDown, GripVertical, RotateCcw, Crown, Clock, ShieldAlert, Flame } from 'lucide-react';
import { useApp, getHeroClassTitle } from '../context/AppContext';
import { cn, getLocalDateString } from '../lib/utils';
import { googleSignIn, logout } from '../lib/firebase';
import { TaskSlayerLogo } from './TaskSlayerLogo';

const DEFAULT_VIEW_KEYS = ['inbox', 'today', 'pomodoro', 'calendar', 'kanban', 'hero', 'shop', 'leaderboard', 'stats', 'settings'];

export function Sidebar({ onOpenDailyBonus }: { onOpenDailyBonus?: () => void }) {
  const {
    currentView,
    setCurrentView,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    profile,
    isSidebarOpen,
    setSidebarOpen,
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    syncKey,
    connectSyncKey,
    isSyncing,
    syncError,
    disconnectSync,
    userEmail,
    userName,
    userAvatar,
    spamFreezeUntil,
    setShowSpamModal,
  } = useApp();

  const [successMsg, setSuccessMsg] = useState('');
  const [isBonusAvailable, setIsBonusAvailable] = useState(false);

  useEffect(() => {
    const checkBonus = () => {
      try {
        const todayStr = getLocalDateString();
        const saved = localStorage.getItem('taskslayer_daily_bonus_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          setIsBonusAvailable(parsed.lastClaimedDate !== todayStr);
        } else {
          setIsBonusAvailable(true);
        }
      } catch {
        setIsBonusAvailable(true);
      }
    };
    checkBonus();
    const interval = setInterval(checkBonus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Resizable sidebar logic
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('taskslayer_sidebar_width') || localStorage.getItem('ticktick_sidebar_width');
    return saved ? parseInt(saved, 10) : 256;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isRtl = language === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const currentIsRtl = language === 'ar' || document.documentElement.dir === 'rtl';

      let newWidth: number;
      if (currentIsRtl) {
        newWidth = rect.right - e.clientX;
      } else {
        newWidth = e.clientX - rect.left;
      }

      const clampedWidth = Math.max(200, Math.min(480, newWidth));
      setSidebarWidth(clampedWidth);
      localStorage.setItem('taskslayer_sidebar_width', String(clampedWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, language]);

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : (language === 'ar' ? 'البطل' : 'Hero'));
  const heroClassTitle = getHeroClassTitle(profile.level, profile.pillars, language);

  const renderAvatar = () => {
    if (userAvatar && userAvatar.startsWith('emoji:')) {
      return <span className="text-base select-none">{userAvatar.substring(6)}</span>;
    }
    if (userAvatar && (userAvatar.startsWith('data:image') || userAvatar.startsWith('http'))) {
      return <img src={userAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Avatar" />;
    }
    return <User className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />;
  };

  const [isReordering, setIsReordering] = useState(false);
  const [viewsOrder, setViewsOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('taskslayer_views_order') || localStorage.getItem('ticktick_views_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validKeys = parsed.filter(key => DEFAULT_VIEW_KEYS.includes(key));
          DEFAULT_VIEW_KEYS.forEach(key => {
            if (!validKeys.includes(key)) validKeys.push(key);
          });
          return validKeys;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_VIEW_KEYS;
  });

  useEffect(() => {
    localStorage.setItem('taskslayer_views_order', JSON.stringify(viewsOrder));
  }, [viewsOrder]);

  const allMenuItemsMap: Record<string, { id: string; label: string; icon: any }> = {
    inbox: { id: 'inbox', label: t('inbox'), icon: Inbox },
    today: { id: 'today', label: t('today'), icon: CheckSquare },
    pomodoro: { id: 'pomodoro', label: t('pomodoro_timer'), icon: Clock },
    calendar: { id: 'calendar', label: t('calendar'), icon: CalendarIcon },
    kanban: { id: 'kanban', label: t('kanban'), icon: Kanban },
    hero: { id: 'hero', label: t('hero'), icon: Shield },
    shop: { id: 'shop', label: t('shop'), icon: Gift },
    leaderboard: { id: 'leaderboard', label: t('leaderboard') || 'Leaderboard', icon: Crown },
    stats: { id: 'stats', label: t('stats'), icon: BarChart3 },
    settings: { id: 'settings', label: t('settings'), icon: SettingsIcon },
  };

  const orderedMenuItems = viewsOrder
    .map(key => allMenuItemsMap[key])
    .filter(Boolean);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...viewsOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setViewsOrder(newOrder);
  };

  const resetOrder = () => {
    setViewsOrder(DEFAULT_VIEW_KEYS);
  };

  const getProjectIcon = (projectId: string) => {
    switch (projectId) {
      case 'proj-work':
        return Briefcase;
      case 'proj-personal':
        return User;
      case 'proj-study':
        return BookOpen;
      default:
        return Briefcase;
    }
  };

  const getProjectName = (projectId: string, defaultName: string) => {
    if (projectId === 'proj-work') return t('work');
    if (projectId === 'proj-personal') return t('personal');
    if (projectId === 'proj-study') return t('study');
    return defaultName;
  };

  const hpPercent = Math.min(100, Math.max(0, (profile.hp / profile.maxHp) * 100));
  const mpPercent = Math.min(100, Math.max(0, (profile.mp / profile.maxMp) * 100));
  const xpPercent = Math.min(100, Math.max(0, (profile.xp / profile.xpToNextLevel) * 100));

  return (
    <>
      {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize select-none" />}
      <div 
        ref={sidebarRef}
        style={isDesktop ? { width: `${sidebarWidth}px` } : undefined}
        className={cn(
          "bg-[#e7eaee] dark:bg-slate-900 text-slate-700 dark:text-slate-300 h-screen flex flex-col shrink-0 fixed md:static inset-y-0 z-50 md:z-auto shadow-2xl md:shadow-none group/sidebar w-[285px] max-w-[85vw] md:w-auto md:max-w-none",
          isRtl 
            ? "right-0 left-auto border-l border-slate-250 dark:border-slate-800" 
            : "left-0 right-auto border-r border-slate-250 dark:border-slate-800",
          isSidebarOpen 
            ? "translate-x-0" 
            : isRtl 
              ? "translate-x-full md:translate-x-0" 
              : "-translate-x-full md:translate-x-0",
          isResizing ? "transition-none select-none" : "transition-transform duration-300 ease-out"
        )}
      >
        {/* Resize Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute top-0 bottom-0 w-3 cursor-col-resize z-30 hidden md:flex items-center justify-center transition-all group-hover/sidebar:opacity-100 opacity-60 hover:opacity-100",
            isRtl ? "left-0 -ml-1.5" : "right-0 -mr-1.5",
            isResizing && "bg-indigo-500/20 opacity-100"
          )}
          title={language === 'ar' ? 'اسحب لتغيير العرض' : 'Drag to resize'}
        >
          <div className={cn(
            "w-1 h-12 rounded-full bg-slate-400/60 dark:bg-slate-600/60 group-hover/sidebar:bg-indigo-500 transition-all",
            isResizing && "bg-indigo-500 h-16 w-1.5"
          )} />
        </div>
      {/* App Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-150 dark:border-slate-800 bg-[#e7eaee] dark:bg-slate-950">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="shrink-0 flex items-center justify-center">
            <TaskSlayerLogo className="w-10 h-10 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight pr-[8px]">TaskSlayer</span>
          </div>
          {spamFreezeUntil && Date.now() < spamFreezeUntil && (
            <button
              onClick={() => setShowSpamModal(true)}
              className="flex items-center justify-center p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 dark:border-red-500/20 cursor-pointer animate-pulse shrink-0 relative hover:scale-105 transition-all duration-200"
              title={language === 'ar' ? 'تنبيه التكرار السريع! اضغط لعرض التنازلي' : 'Spam Warning! Click to view countdown'}
            >
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-red-500 animate-ping" />
            </button>
          )}
        </div>
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mini RPG HUD Character Widget */}
      <div className="p-4 bg-white/45 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800/80 space-y-3">
        {/* Top Row: Daily Gift Button & Coins Wallet */}
        <div className="flex items-center justify-between gap-2">
          {/* Daily Gift Button */}
          <button
            type="button"
            onClick={() => onOpenDailyBonus?.()}
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            title={t('daily_bonus')}
          >
            <Gift className={cn("w-3.5 h-3.5 text-amber-500", isBonusAvailable && "animate-bounce")} />
            <span className="text-[11px] font-bold font-mono">{t('daily_bonus_gift')}</span>
            {isBonusAvailable && (
              <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900 animate-ping" />
            )}
          </button>

          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1 rtl:space-x-reverse">
            <Coins className="w-3.5 h-3.5" />
            <span>{profile.gold}{language === 'ar' ? 'ذ' : 'g'}</span>
          </span>
        </div>

        {/* User profile row */}
        <div className="flex items-center justify-between gap-2">
          {/* User profile section - clickable button to settings */}
          <button
            onClick={() => {
              setCurrentView('settings');
              setSelectedProjectId(null);
              setSidebarOpen(false); // Close on mobile
            }}
            title={language === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
            className="flex items-center space-x-2 rtl:space-x-reverse min-w-0 flex-1 text-left rtl:text-right cursor-pointer group hover:bg-slate-200/40 dark:hover:bg-slate-800/40 p-1 rounded-xl transition-all"
          >
            {/* Circle with user image */}
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 select-none shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-200">
              {renderAvatar()}
            </div>
            {/* User Name, Level Badge and Class Title */}
            <div className="min-w-0 flex flex-col justify-center mr-[6px] pr-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate select-none leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {displayName}
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/10 select-none leading-none shrink-0">
                  LVL {profile.level}
                </span>
              </div>
              <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 truncate select-none leading-none mt-1 h-[12px]">
                {heroClassTitle}
              </span>
            </div>
          </button>
        </div>

        {/* HP, MP & XP mini status bars */}
        <div className="space-y-1.5">
          {/* Mini HP */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <Heart className="w-2.5 h-2.5 text-red-500 fill-current shrink-0" />
                <span>HP</span>
              </span>
              <span className="font-mono text-red-400">{profile.hp.toLocaleString()}/{profile.maxHp.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          {/* Mini MP */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <Zap className="w-2.5 h-2.5 text-cyan-400 fill-current shrink-0" />
                <span>MP</span>
              </span>
              <span className="font-mono text-cyan-400">{profile.mp.toLocaleString()}/{profile.maxMp.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${mpPercent}%` }} />
            </div>
          </div>

          {/* Mini XP */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span className="flex items-center space-x-1 rtl:space-x-reverse font-mono">
                <Flame className="w-2.5 h-2.5 text-purple-400 fill-purple-400 shrink-0" />
                <span>XP</span>
              </span>
              <span className="font-mono text-indigo-400">{Math.round(xpPercent)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Views Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        <div className="px-3">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {language === 'ar' ? 'العروض' : 'Views'}
            </span>
            <div className="flex items-center gap-1.5">
              {isReordering ? (
                <>
                  <button
                    onClick={resetOrder}
                    className="text-[10px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
                    title={language === 'ar' ? 'إعادة الترتيب الافتراضي' : 'Reset Order'}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>{language === 'ar' ? 'اعادة الضبط' : 'Reset'}</span>
                  </button>
                  <button
                    onClick={() => setIsReordering(false)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'تم' : 'Done'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsReordering(true)}
                  className="text-[10px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  title={language === 'ar' ? 'تعديل ترتيب الأزرار' : 'Reorder buttons'}
                >
                  <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                  <span className="text-[10px] font-medium">{language === 'ar' ? 'ترتيب' : 'Reorder'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {orderedMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentView === item.id && selectedProjectId === null;
              const isFirst = index === 0;
              const isLast = index === orderedMenuItems.length - 1;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-indigo-600/90 text-white shadow-md shadow-indigo-900/30 font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:text-slate-200 dark:hover:bg-slate-800/50",
                    isReordering && "bg-slate-100/80 dark:bg-slate-800/60 border border-indigo-500/20"
                  )}
                >
                  <button
                    onClick={() => {
                      if (isReordering) return;
                      setCurrentView(item.id);
                      setSelectedProjectId(null); // Clear project filter
                      setSidebarOpen(false); // Close on mobile
                    }}
                    className="flex-1 flex items-center space-x-3 rtl:space-x-reverse text-left rtl:text-right cursor-pointer"
                  >
                    {isReordering && (
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-500")} />
                    <span style={language === 'ar' ? { paddingRight: '7px' } : { paddingLeft: '7px' }}>
                      {item.label}
                    </span>
                  </button>

                  {/* Reorder Up/Down buttons */}
                  {isReordering ? (
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={isFirst}
                        className={cn(
                          "p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer",
                          isFirst ? "opacity-20 cursor-not-allowed" : "text-indigo-600 dark:text-indigo-300"
                        )}
                        title={language === 'ar' ? 'تحريك للأعلى' : 'Move Up'}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={isLast}
                        className={cn(
                          "p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer",
                          isLast ? "opacity-20 cursor-not-allowed" : "text-indigo-600 dark:text-indigo-300"
                        )}
                        title={language === 'ar' ? 'تحريك للأسفل' : 'Move Down'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects section */}
        <div className="px-3">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {t('projects')}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {projects.map((project, idx) => {
              const Icon = getProjectIcon(project.id);
              const isActive = selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    if (currentView !== 'inbox' && currentView !== 'kanban') {
                      setCurrentView('inbox'); // go to inbox if in calendar to show project tasks
                    }
                    setSidebarOpen(false); // Close on mobile
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold border-l-4 border-indigo-500 rounded-l-none pl-2.5 rtl:border-l-0 rtl:border-r-4 rtl:border-indigo-500 rtl:rounded-r-none rtl:pr-2.5"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-slate-200 dark:hover:bg-slate-800/30"
                  )}
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-400" : "text-slate-500")} />
                    <span style={language === 'ar' ? { paddingRight: '7px' } : { paddingLeft: '7px' }}>
                      {getProjectName(project.id, project.name)}
                    </span>
                  </div>
                  <span className={cn("w-2 h-2 rounded-full shrink-0", project.color)} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </>
);
}

