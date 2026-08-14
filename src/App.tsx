import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TaskListView } from './components/TaskListView';
import { KanbanView } from './components/KanbanView';
import { CalendarView } from './components/CalendarView';
import { HeroDashboard } from './components/HeroDashboard';
import { QuestShop } from './components/QuestShop';
import { SettingsView } from './components/SettingsView';
import { StatsView } from './components/StatsView';
import { LeaderboardView } from './components/LeaderboardView';
import { ToastNotification } from './components/ToastNotification';
import { WelcomeModal } from './components/WelcomeModal';
import { DailyLoginModal } from './components/DailyLoginModal';
import { Menu, Clock, Skull, Zap, Coins, Flame, Brain, Coffee, RefreshCw, X, ShieldAlert, PanelRightOpen, PanelLeftOpen, Gift, Trophy } from 'lucide-react';
import { cn, getLocalDateString } from './lib/utils';

function GameOverScreen() {
  const { isDead, deathStats, respawnHero, language } = useApp();

  if (!isDead) return null;

  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 select-none animate-fade-in text-center font-sans">
      <div className="max-w-md w-full bg-slate-900 border-2 border-red-600/50 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-red-950/50 space-y-6 relative overflow-hidden">
        {/* Decorative corner lights */}
        <div className="absolute top-0 left-0 w-2 h-2 bg-red-600 animate-pulse" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-red-600 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-600 animate-pulse" />

        {/* Skull Icon Header */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-red-600 rounded-full blur-sm opacity-75 animate-pulse" />
            <div className="relative bg-slate-950 p-4 rounded-full border border-red-600">
              <Skull className="w-12 h-12 text-red-500 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Game Over Title */}
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-red-500 tracking-wider font-mono uppercase animate-pulse">
            {isAr ? 'انتهت اللعبة' : 'GAME OVER'}
          </h2>
          <p className="text-xs text-red-400 font-bold uppercase tracking-widest font-mono">
            {isAr ? 'لقد سقطت في المعركة' : 'You Died'}
          </p>
        </div>

        {/* Narrative Text */}
        <div className="text-slate-400 text-sm leading-relaxed border-y border-slate-800 py-4 italic">
          {isAr
            ? 'لقد انهار بطلك في زنزانة المهام المتأخرة المستعصية! تم نقلك على وجه السرعة لالتماس العون والشفاء في المعبد المحلي.'
            : 'Your hero has collapsed in the dungeon of overdue tasks and must seek aid at the local Sanctuary.'}
        </div>

        {/* Penalty details block */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left rtl:text-right space-y-3 font-mono text-xs">
          <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px] pb-1 border-b border-slate-900 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>{isAr ? 'رسوم الإحياء ومستخلصات المعبد' : 'Sanctuary Resurrection Assessment'}</span>
          </h4>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'ضريبة الذهب المدفوعة:' : 'Gold Tax paid:'}</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              <span>{deathStats?.goldTax || 0}g</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'عقوبة نقاط الخبرة (XP):' : 'XP Progress Loss:'}</span>
            <span className={deathStats && deathStats.xpLoss > 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
              {deathStats && deathStats.xpLoss > 0 ? `-${deathStats.xpLoss} XP` : (isAr ? 'لا يوجد (تم دفع الضريبة بالذهب)' : 'None (Fully paid via Gold)')}
            </span>
          </div>

          {deathStats && deathStats.xpLoss > 0 && (
            <p className="text-[10px] text-red-500/80 leading-normal pt-1 italic">
              {isAr 
                ? '* تم خصم نقاط الخبرة لأن مخزون الذهب الخاص بك كان أقل من 50 ذهبة!' 
                : '* XP was lost because your gold pouch had less than 50 Gold!'}
            </p>
          )}
        </div>

        {/* Glowing Respawn Button */}
        <button
          onClick={respawnHero}
          className="w-full relative group overflow-hidden bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-red-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-400/30 uppercase tracking-wider text-sm font-mono"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
          <span>{isAr ? 'إحياء البطل والبدء مجددًا' : 'Respawn Hero'}</span>
        </button>
      </div>
    </div>
  );
}

function SpamFreezeModal() {
  const { showSpamModal, setShowSpamModal, spamFreezeUntil, language } = useApp();
  const [ticker, setTicker] = React.useState(0);

  React.useEffect(() => {
    if (!showSpamModal) return;
    if (!spamFreezeUntil) {
      setShowSpamModal(false);
      return;
    }
    const interval = setInterval(() => {
      const diff = spamFreezeUntil - Date.now();
      if (diff <= 0) {
        setShowSpamModal(false);
        clearInterval(interval);
      } else {
        setTicker(t => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showSpamModal, spamFreezeUntil, setShowSpamModal]);

  if (!showSpamModal) return null;

  const isAr = language === 'ar';
  
  const getRemainingTimeText = () => {
    if (!spamFreezeUntil) return '';
    const diff = spamFreezeUntil - Date.now();
    if (diff <= 0) return '';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return isAr 
      ? `${minutes} دقيقة و ${seconds} ثانية` 
      : `${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/50 dark:border-red-500/30 rounded-2xl p-6 shadow-[0_0_50px_0_rgba(239,68,68,0.3)] space-y-6 relative text-left rtl:text-right overflow-hidden">
        {/* Deep red glowing pulse in background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        {/* Header banner */}
        <div className="flex items-center gap-4 border-b border-red-500/20 pb-4">
          <div className="bg-red-500/10 p-3 rounded-full border border-red-500/30 shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono uppercase tracking-tight">
              {isAr ? '🚨 تم اكتشاف تكرار سريع' : '🚨 SPAM DETECTED'}
            </h3>
            <p className="text-xs text-red-400 font-mono font-bold uppercase">
              {isAr ? 'حماية نزاهة نظام الـ RPG' : 'RPG Integrity System Shield'}
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p className="font-semibold text-white">
            {isAr 
              ? 'لقد أنجزت أكثر من 6 مهام في غضون 10 ثوانٍ!' 
              : 'You have completed more than 6 tasks within 10 seconds!'}
          </p>
          <p className="text-xs text-slate-400">
            {isAr 
              ? 'لحماية نزاهة اللعبة ومنع كسب النقاط غير المشروع، تم تجميد كسب الـ XP والذهب ومؤشرات البطل بالكامل مؤقتاً لمدة 15 دقيقة.' 
              : 'To preserve game balance and prevent exploit patterns, all XP, Gold, and hero stat gains have been temporarily frozen for 15 minutes.'}
          </p>
        </div>

        {/* Lock Duration Panel */}
        <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 space-y-2 font-mono text-xs text-center">
          <span className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">
            {isAr ? 'الوقت المتبقي لفك التجميد' : 'FREEZE DURATION REMAINING'}
          </span>
          <span className="block text-2xl font-black text-red-500 animate-pulse tracking-widest">
            {getRemainingTimeText() || (isAr ? 'أقل من ثانية' : 'Few seconds')}
          </span>
        </div>

        {/* Close/Acknowledge button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setShowSpamModal(false)}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-900/40 transition-all duration-200 cursor-pointer text-center"
          >
            {isAr ? 'أفهم ذلك، سألتزم بالسرعة الطبيعية' : 'I Understand, I will keep a steady pace'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MpZeroModal() {
  const { showMpZeroModal, setShowMpZeroModal, meditateRest, profile, setProfile, addLog, language } = useApp();

  if (!showMpZeroModal) return null;

  const isAr = language === 'ar';

  const payGoldInn = () => {
    if (profile.gold >= 10) {
      setProfile(prev => ({
        ...prev,
        gold: prev.gold - 10,
        mp: prev.maxMp
      }));
      setTimeout(() => {
        addLog(
          isAr 
            ? '🏡 لقد نمت في الحانة مقابل 10 قطع ذهبية! تم استعادة المانا (MP) بالكامل!' 
            : '🏡 You slept at the Inn for 10 Gold! Fully restored your Mana (MP)!', 
          'heal'
        );
      }, 50);
      setShowMpZeroModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative text-left rtl:text-right">
        
        {/* Header banner */}
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="bg-cyan-100 dark:bg-cyan-950/50 p-3 rounded-full border border-cyan-200 dark:border-cyan-800 shrink-0">
            <Zap className="w-6 h-6 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono uppercase tracking-tight">
              {isAr ? '🔮 نفاذ المانا (0 MP)' : '🔮 OUT OF MANA (0 MP)'}
            </h3>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono font-bold uppercase">
              {isAr ? 'عقلك مرهق تمامًا!' : 'Your mind is exhausted!'}
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            {isAr 
              ? 'لا يمكنك الشروع في مهام جديدة حاليًا لأن مخزون المانا الخاص بك فارغ.' 
              : 'You cannot complete or do quests currently because your Mana (MP) is empty.'}
          </p>
          <p className="text-xs text-slate-400">
            {isAr 
              ? 'المهام الصعبة (عالية الرتبة والعاجلة) تستهلك المانا والتركيز الذهني. تحتاج إلى الاستراحة أو الشفاء لتتمكن من إكمالها.' 
              : 'Difficult quests (High and Urgent) consume Mana. You need to rest, meditate, or consume focus-restoring spells to recover.'}
          </p>
        </div>

        {/* Restoration Options Panel */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-4 space-y-3 font-mono text-xs text-left rtl:text-right">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
            {isAr ? 'خيارات الاستعادة السريعة' : 'Available Restorations'}
          </h4>

          {/* Option 1: Meditate (Free) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
            <div>
              <span className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-cyan-500" />
                <span>{isAr ? 'التأمل العميق' : 'Deep Meditation'}</span>
              </span>
              <span className="text-[10px] text-slate-500">{isAr ? 'استعد 20 مانا مجانًا' : 'Restore +20 MP for free'}</span>
            </div>
            <button
              type="button"
              onClick={meditateRest}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-sm transition-colors cursor-pointer text-center text-xs"
            >
              {isAr ? 'تأمل الآن' : 'Meditate'}
            </button>
          </div>

          {/* Option 2: Pay Gold to Sleep at Inn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
            <div>
              <span className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'النوم في النزل المحلي' : 'Rest at the Inn'}</span>
              </span>
              <span className="text-[10px] text-slate-500">{isAr ? 'استعادة كاملة (100% MP) مقابل 10 قطع ذهب' : 'Fully restore MP for 10 Gold'}</span>
            </div>
            <button
              type="button"
              onClick={payGoldInn}
              disabled={profile.gold < 10}
              className={`px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1 transition-colors text-center text-xs ${
                profile.gold >= 10
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>{isAr ? '10 ذهب' : '10 Gold'}</span>
            </button>
          </div>
        </div>

        {/* Close/Shop hint buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={() => setShowMpZeroModal(false)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MainAppContent() {
  const { 
    currentView, 
    setCurrentView,
    isSidebarOpen, 
    setSidebarOpen, 
    isPomoOpen, 
    setPomoOpen,
    tasks,
    activeTaskId,
    t,
    language,
  } = useApp();

  const [isDailyBonusOpen, setIsDailyBonusOpen] = React.useState(false);
  const [isBonusAvailable, setIsBonusAvailable] = React.useState(false);

  React.useEffect(() => {
    const checkBonus = () => {
      try {
        const todayStr = getLocalDateString();
        const saved = localStorage.getItem('taskslayer_daily_bonus_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          const available = parsed.lastClaimedDate !== todayStr;
          setIsBonusAvailable(available);
          return available;
        } else {
          setIsBonusAvailable(true);
          return true;
        }
      } catch (e) {
        setIsBonusAvailable(true);
        return true;
      }
    };

    const available = checkBonus();
    let timer: NodeJS.Timeout | null = null;
    if (available) {
      timer = setTimeout(() => setIsDailyBonusOpen(true), 1200);
    }

    const interval = setInterval(checkBonus, 3000);
    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isDailyBonusOpen]);

  const renderActiveView = () => {
    switch (currentView) {
      case 'inbox':
      case 'today':
        return <TaskListView />;
      case 'kanban':
        return <KanbanView />;
      case 'calendar':
        return <CalendarView />;
      case 'hero':
        return <HeroDashboard />;
      case 'pomodoro':
        return <PomodoroTimer isEmbedded={true} />;
      case 'shop':
        return <QuestShop />;
      case 'settings':
        return <SettingsView />;
      case 'stats':
        return <StatsView />;
      case 'leaderboard':
        return <LeaderboardView />;
      default:
        return <TaskListView />;
    }
  };

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'inbox': return t('inbox');
      case 'today': return t('today');
      case 'kanban': return t('kanban');
      case 'calendar': return t('calendar');
      case 'hero': return t('hero');
      case 'pomodoro': return t('pomodoro_timer');
      case 'shop': return t('shop');
      case 'settings': return t('settings') || 'Settings';
      case 'stats': return t('stats') || 'Stats';
      case 'leaderboard': return t('leaderboard') || 'Leaderboard';
      default: return t('questboard');
    }
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans antialiased text-slate-800 dark:text-slate-100 relative">
      {/* Sidebar Overlay Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-all duration-300 animate-fade-in" 
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar onOpenDailyBonus={() => setIsDailyBonusOpen(true)} />
      
      {/* Main Feature viewport workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
        {/* Mobile Header Bar */}
        <header className="flex md:hidden items-center justify-between px-3 py-2.5 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800 shadow-sm z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label={language === 'ar' ? 'المزيد' : 'More'}
            title={language === 'ar' ? 'المزيد' : 'More'}
          >
            <Menu className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{language === 'ar' ? 'المزيد' : 'More'}</span>
          </button>
          
          <h1 className="text-xs font-bold tracking-widest uppercase font-mono text-indigo-400 px-2 text-center truncate">
            {getHeaderTitle()}
          </h1>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDailyBonusOpen(true)}
              className="px-2 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 shrink-0"
              aria-label={t('daily_bonus_gift')}
              title={t('daily_bonus')}
            >
              <Gift className={cn("w-4 h-4 text-amber-400", isBonusAvailable && "animate-bounce")} />
              <span>{t('daily_bonus_gift')}</span>
            </button>

            <button 
              onClick={() => setCurrentView('shop')}
              className={cn(
                "px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold",
                currentView === 'shop'
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
              aria-label={language === 'ar' ? 'المتجر' : 'Shop'}
              title={language === 'ar' ? 'المتجر' : 'Shop'}
            >
              <Trophy className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{language === 'ar' ? 'المتجر' : 'Shop'}</span>
            </button>
          </div>
        </header>

        {/* Main View Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-16 md:pb-0">
          {renderActiveView()}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNavBar />
      </div>

      {/* Desktop Floating Quick Toggle Button when Pomodoro is hidden */}
      {!isPomoOpen && (
        <button
          onClick={() => setPomoOpen(true)}
          className="hidden lg:flex fixed top-4 ltr:right-4 rtl:left-4 z-40 items-center gap-2 px-3.5 py-2 bg-slate-900/90 dark:bg-slate-800/90 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-white rounded-xl shadow-xl border border-slate-700/60 backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-bold group animate-fade-in hover:scale-105"
          title={t('pomodoro_timer')}
        >
          {language === 'ar' ? (
            <PanelLeftOpen className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
          ) : (
            <PanelRightOpen className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
          )}
          <span>{t('pomodoro_timer')}</span>
        </button>
      )}

      {/* Pomodoro Backdrop Overlay for Mobile */}
      {isPomoOpen && (
        <div 
          onClick={() => setPomoOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-all duration-300 animate-fade-in" 
        />
      )}

      {/* Pomodoro Focus Control Pane (Desktop Right Sidebar) */}
      <PomodoroTimer isEmbedded={false} />

      {/* High-Fidelity Custom In-App Toast System */}
      <ToastNotification />

      {/* Retro RPG Game Over Overlay */}
      <GameOverScreen />

      {/* Out of Mana (0 MP) Overlay */}
      <SpamFreezeModal />
      <MpZeroModal />

      {/* Adventurer Welcome & Onboarding Modal */}
      <WelcomeModal />

      {/* Daily Login Bonus Reward Modal */}
      <DailyLoginModal isOpen={isDailyBonusOpen} onClose={() => setIsDailyBonusOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
