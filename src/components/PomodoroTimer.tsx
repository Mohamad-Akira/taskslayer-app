import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Clock, Trophy, CheckSquare, Zap, PanelRightClose, PanelLeftClose, X, SkipForward, Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn, getLocalDateString } from '../lib/utils';
import { sendWebNotification } from '../utils/notifications';

interface PomodoroTimerProps {
  isEmbedded?: boolean;
}

export function PomodoroTimer({ isEmbedded = false }: PomodoroTimerProps) {
  const {
    tasks,
    activeTaskId,
    setActiveTaskId,
    completeTaskPomodoro,
    pomodoroStats,
    incrementPomodoroStats,
    isPomoOpen,
    setPomoOpen,
    t,
    language,
    notificationsEnabled,

    // Global Pomodoro states
    workDuration,
    setWorkDuration,
    breakDuration,
    setBreakDuration,
    workTimeLeft,
    setWorkTimeLeft,
    workIsRunning,
    setWorkIsRunning,
    breakTimeLeft,
    setBreakTimeLeft,
    breakIsRunning,
    setBreakIsRunning,
    mode,
    setMode,
    workMaxDuration,
    setWorkMaxDuration,
    breakMaxDuration,
    setBreakMaxDuration,
  } = useApp();

  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

  const todayStr = getLocalDateString();
  const todayStats = pomodoroStats.history?.[todayStr] || { completedSessions: 0, totalMinutes: 0 };

  const timeLeft = mode === 'work' ? workTimeLeft : breakTimeLeft;
  const isRunning = mode === 'work' ? workIsRunning : breakIsRunning;

  const setTimeLeft = (val: number | ((prev: number) => number)) => {
    if (mode === 'work') {
      setWorkTimeLeft(val);
    } else {
      setBreakTimeLeft(val);
    }
  };

  const setIsRunning = (val: boolean | ((prev: boolean) => boolean)) => {
    if (mode === 'work') {
      setWorkIsRunning(val);
    } else {
      setBreakIsRunning(val);
    }
  };

  const adjustTime = (secondsDelta: number) => {
    if (mode === 'work') {
      setWorkTimeLeft((prev) => {
        const newVal = prev + secondsDelta;
        return newVal > 0 ? newVal : 0;
      });
      if (secondsDelta > 0) {
        setWorkMaxDuration((prev) => prev + secondsDelta);
      }
    } else {
      setBreakTimeLeft((prev) => {
        const newVal = prev + secondsDelta;
        return newVal > 0 ? newVal : 0;
      });
      if (secondsDelta > 0) {
        setBreakMaxDuration((prev) => prev + secondsDelta);
      }
    }
  };

  // Resizable Pomodoro Sidebar logic
  const pomoRef = React.useRef<HTMLDivElement>(null);
  const [pomoWidth, setPomoWidth] = useState<number>(() => {
    const saved = localStorage.getItem('taskslayer_pomo_width') || localStorage.getItem('ticktick_pomo_width');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isPomoResizing, setIsPomoResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isRtl = language === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');

  const handlePomoMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPomoResizing(true);
  };

  useEffect(() => {
    if (!isPomoResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!pomoRef.current) return;
      const rect = pomoRef.current.getBoundingClientRect();
      const currentIsRtl = language === 'ar' || document.documentElement.dir === 'rtl';

      let newWidth: number;
      if (currentIsRtl) {
        // In RTL layout, Pomodoro sidebar is on the LEFT side of the screen, handle is on its RIGHT edge
        newWidth = e.clientX - rect.left;
      } else {
        // In LTR layout, Pomodoro sidebar is on the RIGHT side of the screen, handle is on its LEFT edge
        newWidth = rect.right - e.clientX;
      }

      const clampedWidth = Math.max(220, Math.min(480, newWidth));
      setPomoWidth(clampedWidth);
      localStorage.setItem('taskslayer_pomo_width', String(clampedWidth));
    };

    const handleMouseUp = () => {
      setIsPomoResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPomoResizing, language]);

  // Find currently active task
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const toggleTimer = () => {
    // Resume audio context if suspended (browser compliance)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        if (dummyCtx.state === 'suspended') {
          dummyCtx.resume();
        }
      }
    } catch (e) {}
    setIsRunning(!isRunning);
  };
  
  const resetTimer = () => {
    if (mode === 'work') {
      setWorkIsRunning(false);
      setWorkTimeLeft(workDuration * 60);
      setWorkMaxDuration(workDuration * 60);
    } else {
      setBreakIsRunning(false);
      setBreakTimeLeft(breakDuration * 60);
      setBreakMaxDuration(breakDuration * 60);
    }
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const maxDuration = mode === 'work' ? workMaxDuration : breakMaxDuration;
  const progress = maxDuration > 0 ? (maxDuration - timeLeft) / maxDuration : 0;

  // Duration Modal Helper
  const renderDurationModal = () => {
    if (!isDurationModalOpen) return null;
    return (
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setIsDurationModalOpen(false)}
      >
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative space-y-5 animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {mode === 'work' 
                  ? (language === 'ar' ? 'تحديد مدة التركيز' : 'Set Focus Duration') 
                  : (language === 'ar' ? 'تحديد مدة الاستراحة' : 'Set Break Duration')}
              </h3>
            </div>
            <button
              onClick={() => setIsDurationModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Presets Grid */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              {language === 'ar' ? 'اختيارات سريعة:' : 'Quick Presets:'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(mode === 'work' ? [15, 25, 30, 45, 50, 60] : [5, 10, 15, 20, 25, 30]).map((mins) => {
                const active = mode === 'work' ? workDuration === mins : breakDuration === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => {
                      if (mode === 'work') {
                        setWorkDuration(mins);
                        setIsRunning(false);
                        setTimeLeft(mins * 60);
                        setWorkMaxDuration(mins * 60);
                      } else {
                        setBreakDuration(mins);
                        setIsRunning(false);
                        setTimeLeft(mins * 60);
                        setBreakMaxDuration(mins * 60);
                      }
                      setIsDurationModalOpen(false);
                    }}
                    className={cn(
                      "py-2.5 px-3 rounded-xl font-mono text-sm font-bold border transition-all cursor-pointer flex items-center justify-center gap-1",
                      active
                        ? (mode === 'work' 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                            : "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20")
                        : "bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700"
                    )}
                  >
                    <span>{mins}</span>
                    <span className="text-xs">{language === 'ar' ? 'دقيقة' : 'm'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              {language === 'ar' ? 'أو أدخل مدة مخصصة (بالدقائق):' : 'Or enter custom minutes:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={180}
                value={mode === 'work' ? workDuration : breakDuration}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
                  if (mode === 'work') {
                    setWorkDuration(val);
                    setIsRunning(false);
                    setTimeLeft(val * 60);
                    setWorkMaxDuration(val * 60);
                  } else {
                    setBreakDuration(val);
                    setIsRunning(false);
                    setTimeLeft(val * 60);
                    setBreakMaxDuration(val * 60);
                  }
                }}
                className="flex-1 px-3 py-2 text-center text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setIsDurationModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'تطبيق' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Full Page View Rendering
  if (isEmbedded) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 text-left rtl:text-right animate-fade-in pb-12">
        {/* Header */}
        <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{t('pomodoro_timer')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar' ? 'جلسات التركيز والإنتاجية' : 'Focus and productivity sessions'}
              </p>
            </div>
          </div>
        </div>

        {/* Modes Buttons */}
        <div className="flex justify-center gap-2 bg-slate-200/50 dark:bg-slate-800/60 p-1.5 rounded-2xl">
          <button
            onClick={() => switchMode('work')}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
              mode === 'work' 
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'ar' ? 'جلسة التركيز' : 'Work Block'}</span>
          </button>
          <button
            onClick={() => switchMode('break')}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
              mode === 'break' 
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Coffee className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{language === 'ar' ? 'استراحة قصيرة' : 'Short Break'}</span>
          </button>
        </div>

        {/* Time Display with Ring design */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center shadow-xs">
          <div
            onClick={() => setIsDurationModalOpen(true)}
            className={cn(
              "w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-300 bg-slate-50 dark:bg-slate-950 shadow-md hover:shadow-xl shrink-0 cursor-pointer group relative",
              isRunning && "animate-pulse"
            )}
            title={language === 'ar' ? 'انقر لتغيير الوقت' : 'Click to change duration'}
          >
            {/* SVG Progress Ring */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  className={cn(
                    "transition-colors duration-300",
                    mode === 'work' 
                      ? "stroke-indigo-100 dark:stroke-indigo-950/60" 
                      : "stroke-teal-100 dark:stroke-teal-950/60"
                  )}
                  strokeWidth="3.5"
                  fill="transparent"
                />
                {/* Foreground Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  className={cn(
                    "transition-all duration-300 ease-out",
                    mode === 'work' 
                      ? "stroke-indigo-600 dark:stroke-indigo-500" 
                      : "stroke-teal-500 dark:stroke-teal-400"
                  )}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 47}
                  strokeDashoffset={2 * Math.PI * 47 * (1 - progress)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-3 w-full px-2" dir="ltr">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustTime(-300);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-xs"
                title={language === 'ar' ? 'تقليل 5 دقائق' : 'Decrease 5 minutes'}
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-mono transition-transform">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustTime(300);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-xs"
                title={language === 'ar' ? 'زيادة 5 دقائق' : 'Increase 5 minutes'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 font-mono group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {mode === 'work' 
                ? (language === 'ar' ? 'وقت التركيز' : 'FOCUS TIME') 
                : (language === 'ar' ? 'وقت الراحة' : 'REST TIME')}
            </span>
            <span className="text-xs text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 font-medium">
              ✏️ {language === 'ar' ? 'تغيير المدة' : 'Change Duration'}
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-6 mt-8" dir="ltr">
            <button
              onClick={resetTimer}
              className="w-12 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title={language === 'ar' ? 'إعادة ضبط المؤقت' : 'Reset timer'}
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTimer}
              className={cn(
                "w-16 h-16 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer",
                mode === 'work' 
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20" 
                  : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
              )}
            >
              {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 ml-1 fill-current" />}
            </button>

            {mode === 'break' && isRunning ? (
              <button
                onClick={() => switchMode('work')}
                className="w-12 h-12 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer animate-fade-in"
                title={language === 'ar' ? 'تخطي الاستراحة' : 'Skip Break'}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-12 h-12 opacity-0 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Active Focus Target & Analytics */}
        <div className="space-y-4">
          {activeTask ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                <Zap className="w-4 h-4 fill-current shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                  {language === 'ar' ? 'هدف التركيز النشط' : 'ACTIVE FOCUS OBJECTIVE'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{activeTask.title}</h3>
              {activeTask.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{activeTask.description}</p>
              )}
              <button
                onClick={() => completeTaskPomodoro(activeTask.id)}
                className="mt-4 w-full py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحديد كمكتمل' : 'Mark as Completed'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 text-center py-6">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === 'ar' ? 'اضغط زر البدء في المهمة للتركيز عليها' : "Select a task's Play button to focus"}
              </span>
            </div>
          )}

          {/* Analytics dashboard */}
          <div className="bg-indigo-950 dark:bg-slate-900 text-indigo-200 rounded-2xl p-5 border border-indigo-900 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4.5 h-4.5 text-amber-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                {language === 'ar' ? 'الإنجازات اليومية' : 'Daily Accomplishments'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center font-mono">
              <div className="bg-indigo-900/40 dark:bg-slate-800/50 p-3 rounded-xl border border-indigo-800/30 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-white">{todayStats.completedSessions}</div>
                <div className="text-[10px] text-indigo-300 dark:text-slate-400 uppercase tracking-tight font-semibold mt-0.5">
                  {language === 'ar' ? 'جلسات' : 'Blocks'}
                </div>
              </div>
              <div className="bg-indigo-900/40 dark:bg-slate-800/50 p-3 rounded-xl border border-indigo-800/30 dark:border-slate-700/50">
                <div className="text-2xl font-bold text-white">{todayStats.totalMinutes}m</div>
                <div className="text-[10px] text-indigo-300 dark:text-slate-400 uppercase tracking-tight font-semibold mt-0.5">
                  {language === 'ar' ? 'مستغرق' : 'Focused'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {renderDurationModal()}
      </div>
    );
  }

  // Right sidebar pane (desktop)
  return (
    <>
      {isPomoResizing && <div className="fixed inset-0 z-[100] cursor-col-resize select-none" />}
      <div 
        ref={pomoRef}
        style={isDesktop ? { width: `${pomoWidth}px` } : undefined}
        className={cn(
          "hidden lg:flex bg-[#e7eaee] dark:bg-slate-900 border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-800 h-screen p-6 pb-6 flex-col shrink-0 static inset-y-0 right-0 rtl:right-auto rtl:left-0 z-40 text-left rtl:text-right shadow-none overflow-y-auto relative group/pomo",
          isPomoOpen 
            ? "translate-x-0 opacity-100" 
            : "!hidden pointer-events-none",
          isPomoResizing ? "transition-none select-none" : "transition-all duration-300"
        )}
      >
        {/* Resize Drag Handle */}
        <div
          onMouseDown={handlePomoMouseDown}
          className={cn(
            "absolute top-0 bottom-0 w-3 cursor-col-resize z-30 hidden lg:flex items-center justify-center transition-all group-hover/pomo:opacity-100 opacity-60 hover:opacity-100",
            isRtl ? "right-0 -mr-1.5" : "left-0 -ml-1.5",
            isPomoResizing && "bg-indigo-500/20 opacity-100"
          )}
          title={language === 'ar' ? 'اسحب لتغيير العرض' : 'Drag to resize'}
        >
          <div className={cn(
            "w-1 h-12 rounded-full bg-slate-400/60 dark:bg-slate-600/60 group-hover/pomo:bg-indigo-500 transition-all",
            isPomoResizing && "bg-indigo-500 h-16 w-1.5"
          )} />
        </div>
      {/* Header */}
      <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 mb-8">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
          <h2 className="text-lg font-bold tracking-tight">{t('pomodoro_timer')}</h2>
        </div>
        
        {/* Close / Hide Button */}
        <button
          onClick={() => setPomoOpen(false)}
          className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title={language === 'ar' ? 'إخفاء مؤقت بومودورو' : 'Hide Pomodoro Timer'}
        >
          {language === 'ar' ? (
            <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          ) : (
            <PanelRightClose className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* Modes Buttons */}
      <div className="flex justify-center gap-2 mb-8 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-xl">
        <button
          onClick={() => switchMode('work')}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
            mode === 'work' 
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{language === 'ar' ? 'جلسة التركيز' : 'Work Block'}</span>
        </button>
        <button
          onClick={() => switchMode('break')}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
            mode === 'break' 
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Coffee className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>{language === 'ar' ? 'استراحة قصيرة' : 'Short Break'}</span>
        </button>
      </div>

      {/* Time Display with Ring design */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="relative flex items-center justify-center shrink-0">
          <div
            onClick={() => setIsDurationModalOpen(true)}
            className={cn(
              "w-52 h-52 rounded-full flex flex-col items-center justify-center transition-all duration-300 bg-white dark:bg-slate-950 shadow-md hover:shadow-xl dark:shadow-none shrink-0 cursor-pointer group relative",
              isRunning && "animate-pulse"
            )}
            style={{ paddingTop: '8px' }}
            title={language === 'ar' ? 'انقر لتغيير الوقت' : 'Click to change duration'}
          >
            {/* SVG Progress Ring */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  className={cn(
                    "transition-colors duration-300",
                    mode === 'work' 
                      ? "stroke-indigo-100 dark:stroke-indigo-950/60" 
                      : "stroke-teal-100 dark:stroke-teal-950/60"
                  )}
                  strokeWidth="3.5"
                  fill="transparent"
                />
                {/* Foreground Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  className={cn(
                    "transition-all duration-300 ease-out",
                    mode === 'work' 
                      ? "stroke-indigo-600 dark:stroke-indigo-500" 
                      : "stroke-teal-500 dark:stroke-teal-400"
                  )}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 47}
                  strokeDashoffset={2 * Math.PI * 47 * (1 - progress)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-2.5 w-full px-2" dir="ltr">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustTime(-300);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-xs"
                title={language === 'ar' ? 'تقليل 5 دقائق' : 'Decrease 5 minutes'}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-mono transition-transform">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  adjustTime(300);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-xs"
                title={language === 'ar' ? 'زيادة 5 دقائق' : 'Increase 5 minutes'}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 font-mono group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {mode === 'work' 
                ? (language === 'ar' ? 'وقت التركيز' : 'FOCUS TIME') 
                : (language === 'ar' ? 'وقت الراحة' : 'REST TIME')}
            </span>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 font-medium">
              ✏️ {language === 'ar' ? 'تغيير المدة' : 'Change Duration'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-5 mt-12 shrink-0" dir="ltr">
          <button
            onClick={resetTimer}
            className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center transition-colors shadow-sm shrink-0 cursor-pointer"
            title={language === 'ar' ? 'إعادة ضبط المؤقت' : 'Reset timer'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTimer}
            className={cn(
              "w-14 h-14 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shrink-0 cursor-pointer",
              mode === 'work' 
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 dark:shadow-none" 
                : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20 dark:shadow-none"
            )}
            style={{ paddingRight: '0px', paddingLeft: '0px' }}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 fill-current" />}
          </button>

          {mode === 'break' && isRunning ? (
            <button
              onClick={() => switchMode('work')}
              className="w-10 h-10 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-full flex items-center justify-center transition-colors shadow-sm shrink-0 cursor-pointer animate-fade-in"
              title={language === 'ar' ? 'تخطي الاستراحة' : 'Skip Break'}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-10 h-10 opacity-0 pointer-events-none" />
          )}
        </div>
      </div>
      
      {/* Active Focus Target details */}
      <div className="mt-auto space-y-4">
        {activeTask ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Zap className="w-4 h-4 fill-current shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                {language === 'ar' ? 'هدف التركيز النشط' : 'ACTIVE FOCUS OBJECTIVE'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{activeTask.title}</h3>
            {activeTask.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{activeTask.description}</p>
            )}
            <button
              onClick={() => completeTaskPomodoro(activeTask.id)}
              className="mt-3 w-full py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تحديد كمكتمل' : 'Mark as Completed'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-white/45 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/30 text-center py-5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'اضغط زر البدء في المهمة للتركيز عليها' : "Select a task's Play button to focus"}
            </span>
          </div>
        )}

        {/* Analytics mini dashboard */}
        <div className="bg-indigo-950 dark:bg-slate-900/60 text-indigo-200 rounded-2xl p-4 border border-indigo-900 dark:border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-white">
              {language === 'ar' ? 'الإنجازات اليومية' : 'Daily Accomplishments'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center font-mono">
            <div className="bg-indigo-900/40 dark:bg-slate-800/50 p-2 rounded-xl">
              <div className="text-xl font-bold text-white">{todayStats.completedSessions}</div>
              <div className="text-[9px] text-indigo-300 dark:text-slate-400 uppercase tracking-tight font-semibold">
                {language === 'ar' ? 'جلسات' : 'Blocks'}
              </div>
            </div>
            <div className="bg-indigo-900/40 dark:bg-slate-800/50 p-2 rounded-xl">
              <div className="text-xl font-bold text-white">{todayStats.totalMinutes}m</div>
              <div className="text-[9px] text-indigo-300 dark:text-slate-400 uppercase tracking-tight font-semibold">
                {language === 'ar' ? 'مستغرق' : 'Focused'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderDurationModal()}
    </div>
  </>
);
}
