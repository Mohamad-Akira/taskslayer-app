import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { cn, getLocalDateString } from '../lib/utils';
import { 
  BarChart3, Calendar, CheckCircle2, Clock, TrendingUp, Sparkles, 
  Filter, ChevronDown, Brain, Leaf, Flame, Zap, Award, Check,
  ChevronLeft, ChevronRight, Rocket, Star, Trophy, Coffee
} from 'lucide-react';

function getSmoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  const k = 0.22;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) * k;
    const cp1y = p1.y + (p2.y - p0.y) * k;
    const cp2x = p2.x - (p3.x - p1.x) * k;
    const cp2y = p2.y - (p3.y - p1.y) * k;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

function getSmoothAreaPath(points: { x: number; y: number }[], bottomY: number) {
  const linePath = getSmoothPath(points);
  if (!linePath) return '';
  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;
  return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
}

export function StatsView() {
  const { theme, language, t, tasks, pomodoroStats } = useApp();
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeCardPage, setActiveCardPage] = useState<1 | 2>(1);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Dynamic calculations
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const totalTasksCount = tasks.length;
  const taskCompletionRate = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Calculate today's focus hours dynamically
  const todayStr = getLocalDateString();
  const todayMinutes = pomodoroStats.history?.[todayStr]?.totalMinutes || 0;
  const todayFocusHours = todayMinutes > 0 
    ? Number((todayMinutes / 60).toFixed(1))
    : 0;

  // Dynamic Badge Tiers based on today's focus hours
  const badgeTiers = [
    {
      id: 'starter',
      badgeLabel: 'STARTER BADGE',
      keywordAr: 'جديد',
      keywordEn: 'Fresh',
      minHours: 0,
      icon: Coffee,
      descriptionAr: 'لم تسجل ساعات تركيز اليوم بعد. ابدأ جلسة بومودورو الآن لإحراز وسامك اليومي الأول!',
      descriptionEn: 'No focus hours recorded today yet. Start a Pomodoro session now to earn your badge!'
    },
    {
      id: 'active',
      badgeLabel: 'ACTIVE BADGE',
      keywordAr: 'نشيط',
      keywordEn: 'Active',
      minHours: 0.5,
      icon: Rocket,
      descriptionAr: 'أظهرت نشاطاً متواصلاً وسجلت جلسات تركيز ممتازة في اليوم الحالي.',
      descriptionEn: 'Showed continuous focus and completed active focus sessions today.'
    },
    {
      id: 'distinguished',
      badgeLabel: 'DISTINGUISHED BADGE',
      keywordAr: 'عالي',
      keywordEn: 'Distinguished',
      minHours: 1.5,
      icon: Award,
      descriptionAr: 'أداء عالي المنسوب وتفوق ملحوظ في ساعات التركيز اليوم.',
      descriptionEn: 'High performance and remarkable focus hours recorded today.'
    },
    {
      id: 'fire',
      badgeLabel: 'FIRE BADGE',
      keywordAr: 'حماسي',
      keywordEn: 'Passionate',
      minHours: 3,
      icon: Flame,
      descriptionAr: 'حماس ملتهب وإنتاجية متوقدة تغلبت بها على تحديات التركيز اليوم!',
      descriptionEn: 'Unstoppable energy and flaming focus hours today!'
    },
    {
      id: 'boss',
      badgeLabel: 'BOSS BADGE',
      keywordAr: 'بطلي',
      keywordEn: 'Boss',
      minHours: 5,
      icon: Trophy,
      descriptionAr: 'سيطرة تامة وانضباط استثنائي في التركيز كقائد حقيقي اليوم!',
      descriptionEn: 'Complete mastery of focus goals today like a true boss!'
    },
    {
      id: 'legendary',
      badgeLabel: 'LEGENDARY BADGE',
      keywordAr: 'أسطووري',
      keywordEn: 'Legendary',
      minHours: 7,
      icon: Star,
      descriptionAr: 'إنجاز أسطوري استثنائي تجاوز جميع التوقعات في ساعات التركيز اليوم!',
      descriptionEn: 'Legendary performance today exceeding all limits!'
    }
  ];

  // Automatically calculated earned tier index based strictly on today's focus hours
  const earnedTierIndex = badgeTiers.reduce((acc, tier, idx) => {
    return todayFocusHours >= tier.minHours ? idx : acc;
  }, 0);

  const currentBadge = badgeTiers[earnedTierIndex];
  const BadgeIcon = currentBadge.icon;

  // Sync total focus hours with actual pomodoro statistics
  const totalFocusHours = (pomodoroStats.totalMinutes / 60).toFixed(2);
  
  // Average focus time per day (based on pomodoro minutes)
  const dailyFocusAvgMinutes = Math.round((pomodoroStats.totalMinutes || 0) / 7);
  const avgHours = Math.floor(dailyFocusAvgMinutes / 60);
  const avgMins = dailyFocusAvgMinutes % 60;

  // Dynamic calculation of weekly accomplishment status (Saturday to Friday)
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  
  // Map standard Day Index to custom index starting on Saturday (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
  const mappedIndex = (currentDayIndex + 1) % 7;
  
  const weekDays = [
    { id: 'sat', en: 'Saturday', enShort: 'Sat', ar: 'السبت', arShort: 'سبت', index: 0 },
    { id: 'sun', en: 'Sunday', enShort: 'Sun', ar: 'الأحد', arShort: 'أحد', index: 1 },
    { id: 'mon', en: 'Monday', enShort: 'Mon', ar: 'الاثنين', arShort: 'اثنين', index: 2 },
    { id: 'tue', en: 'Tuesday', enShort: 'Tue', ar: 'الثلاثاء', arShort: 'ثلاثاء', index: 3 },
    { id: 'wed', en: 'Wednesday', enShort: 'Wed', ar: 'الأربعاء', arShort: 'أربعاء', index: 4 },
    { id: 'thu', en: 'Thursday', enShort: 'Thu', ar: 'الخميس', arShort: 'خميس', index: 5 },
    { id: 'fri', en: 'Friday', enShort: 'Fri', ar: 'الجمعة', arShort: 'جمعة', index: 6 }
  ].map((day) => {
    // Get the exact date object for this weekday in the current week (local time)
    const diffDays = day.index - mappedIndex;
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() + diffDays);
    
    const year = dayDate.getFullYear();
    const month = String(dayDate.getMonth() + 1).padStart(2, '0');
    const dateVal = String(dayDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dateVal}`;

    // Filter tasks belonging to this day (either by dueDate or createdAt fallback)
    const tasksOnDay = tasks.filter(t => {
      const taskDate = t.dueDate || (t.createdAt ? t.createdAt.split('T')[0] : '');
      return taskDate === dateString;
    });

    // Check if there is at least 1 completed task on this day
    const completedTasksOnDay = tasksOnDay.filter(t => t.status === 'done');
    const completed = completedTasksOnDay.length > 0;

    // Glowing state if it is today and completed, or today pending
    const isToday = day.index === mappedIndex;
    const isFuture = day.index > mappedIndex;
    const isPast = day.index < mappedIndex;
    const glowing = isToday && completed;

    return {
      ...day,
      dateString,
      completed,
      glowing,
      isToday,
      isFuture,
      isPast
    };
  });

  const getPeriodLabel = () => {
    if (filterPeriod === 'week') return language === 'ar' ? 'هذا الأسبوع' : 'This Week';
    if (filterPeriod === 'month') return language === 'ar' ? 'هذا الشهر' : 'This Month';
    return language === 'ar' ? 'كل الأوقات' : 'All Time';
  };

  return (
    <div 
      className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-8 font-sans text-left rtl:text-right"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
              {language === 'ar' ? 'نظرة عامة على أدائك' : 'OVERVIEW OF YOUR PERFORMANCE'}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-indigo-500 shrink-0" />
              <span>{language === 'ar' ? 'إحصائيات الإنجاز' : 'Achievement Stats'}</span>
            </h1>
          </div>

          {/* Styled Filter Dropdown */}
          <div className="relative self-start sm:self-auto">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تصفية النتائج' : 'Filter Results'}: {getPeriodLabel()}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showFilterDropdown && "rotate-180")} />
            </button>

            {showFilterDropdown && (
              <div className="absolute left-0 rtl:right-0 rtl:left-auto sm:left-auto sm:right-0 sm:rtl:left-0 sm:rtl:right-auto mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                <button
                  onClick={() => { setFilterPeriod('week'); setShowFilterDropdown(false); }}
                  className="w-full text-left rtl:text-right px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {language === 'ar' ? 'هذا الأسبوع' : 'This Week'}
                </button>
                <button
                  onClick={() => { setFilterPeriod('month'); setShowFilterDropdown(false); }}
                  className="w-full text-left rtl:text-right px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border-t border-slate-100 dark:border-slate-700/50"
                >
                  {language === 'ar' ? 'هذا الشهر' : 'This Month'}
                </button>
                <button
                  onClick={() => { setFilterPeriod('all'); setShowFilterDropdown(false); }}
                  className="w-full text-left rtl:text-right px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border-t border-slate-100 dark:border-slate-700/50"
                >
                  {language === 'ar' ? 'كل الأوقات' : 'All Time'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Center Major Stats & Streak Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Daily Work Status / Weekly Flow Analysis Tracker Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 md:p-6 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>
                      {activeCardPage === 1 
                        ? (language === 'ar' ? 'حالة العمل اليومي' : 'Daily Work Status')
                        : (language === 'ar' ? 'تحليل التدفق الأسبوعي' : 'Weekly Flow Analysis')
                      }
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeCardPage === 1
                      ? (language === 'ar' ? 'متابعة أيام الإنجاز في الأسبوع' : 'Tracking achievement days this week')
                      : (language === 'ar' ? 'قياس ساعات التركيز العميق اليومية' : 'Measuring daily deep focus hours')
                    }
                  </p>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <button
                    onClick={() => setActiveCardPage(activeCardPage === 1 ? 2 : 1)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title={language === 'ar' ? 'الصفحة السابقة/التالية' : 'Previous/Next Page'}
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </button>
                  
                  <div className="flex gap-1.5 items-center px-1 cursor-pointer" onClick={() => setActiveCardPage(activeCardPage === 1 ? 2 : 1)}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveCardPage(1); }}
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                        activeCardPage === 1 
                          ? "w-6 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" 
                          : "w-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-indigo-300"
                      )}
                      aria-label="Page 1"
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveCardPage(2); }}
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                        activeCardPage === 2 
                          ? "w-6 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse" 
                          : "w-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-indigo-300"
                      )}
                      aria-label="Page 2"
                    />
                  </div>

                  <button
                    onClick={() => setActiveCardPage(activeCardPage === 1 ? 2 : 1)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title={language === 'ar' ? 'الصفحة السابقة/التالية' : 'Previous/Next Page'}
                  >
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* PAGE 1: Connected Streak Dots Timeline */}
              {activeCardPage === 1 && (
                <div className="relative pt-4 pb-2 animate-fade-in">
                  
                  {/* Horizontal line connector */}
                  <div className="absolute top-1/2 left-[7.14%] right-[7.14%] h-[2px] bg-slate-100 dark:bg-slate-700 -translate-y-6 z-0" />
                  {(() => {
                    const lastCompletedIndex = [...weekDays].reverse().findIndex(d => d.completed);
                    const lastCompletedIdx = lastCompletedIndex === -1 ? -1 : 6 - lastCompletedIndex;
                    const progressPercentage = lastCompletedIdx <= 0 ? 0 : (lastCompletedIdx / 6) * 100;
                    return (
                      <div 
                        className="absolute top-1/2 h-[2px] bg-indigo-500 -translate-y-6 z-0 transition-all duration-1000" 
                        style={{
                          left: language === 'ar' ? 'auto' : '7.14%',
                          right: language === 'ar' ? '7.14%' : 'auto',
                          width: `calc((100% - 14.28%) * ${progressPercentage / 100})`
                        }}
                      />
                    );
                  })()}

                  <div className="grid grid-cols-7 gap-1 relative z-10">
                    {weekDays.map((day) => (
                      <div key={day.id} className={cn(
                        "flex flex-col items-center space-y-3 min-w-0 transition-opacity duration-300",
                        day.isFuture ? "opacity-45" : "opacity-100"
                      )}>
                        <span className={cn(
                          "text-[10px] sm:text-xs md:text-sm block truncate max-w-full text-center transition-colors",
                          day.isFuture 
                            ? "text-slate-400 dark:text-slate-500 font-medium" 
                            : "font-bold text-slate-700 dark:text-slate-300"
                        )}>
                          <span className="hidden sm:inline">{language === 'ar' ? day.ar : day.en}</span>
                          <span className="inline sm:hidden">{language === 'ar' ? day.arShort : day.enShort}</span>
                        </span>

                        {/* Timeline circle dot */}
                        <div className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0",
                          day.glowing 
                            ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110" 
                            : day.completed 
                              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400" 
                              : day.isFuture
                                ? "bg-slate-50/40 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-700 text-slate-300 dark:text-slate-600 opacity-60"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600"
                        )}>
                          {day.completed || day.glowing ? (
                            <Check className={cn("w-4.5 h-4.5 sm:w-5 sm:h-5", day.glowing ? "text-indigo-600 dark:text-indigo-400 animate-bounce" : "text-indigo-600 dark:text-indigo-400")} />
                          ) : day.isFuture ? (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-300/60 dark:bg-slate-700/60" />
                          ) : (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                          )}
                        </div>

                        {/* Status indicator pill */}
                        <span className={cn(
                          "px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-mono tracking-wide font-bold transition-all truncate max-w-full",
                          day.completed || day.glowing
                            ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                            : day.isFuture
                              ? "bg-slate-100/40 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                              : "bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40"
                        )}>
                          {day.completed || day.glowing 
                            ? (language === 'ar' ? 'منجز' : 'Done') 
                            : day.isFuture
                              ? (language === 'ar' ? 'قادم' : 'Upcoming')
                              : (language === 'ar' ? 'معلق' : 'Pending')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE 2: Weekly Flow Analysis Area / Curve Chart */}
              {activeCardPage === 2 && (() => {
                const isAllZero = pomodoroStats.totalMinutes === 0 && completedTasksCount === 0;
                const flowValues = isAllZero 
                  ? [0, 0, 0, 0, 0, 0, 0]
                  : weekDays.map((day) => {
                      const tasksOnDay = tasks.filter(t => {
                        const taskDate = t.dueDate || (t.createdAt ? t.createdAt.split('T')[0] : '');
                        return taskDate === day.dateString && t.status === 'done';
                      });
                      return tasksOnDay.length > 0 ? Number((tasksOnDay.length * 0.8).toFixed(1)) : 0.2;
                    });
                const flowPoints = weekDays.map((day, idx) => {
                  const val = flowValues[idx];
                  const x = 50 + idx * 100;
                  const y = 180 - (val / 5) * 160;
                  const dateParts = day.dateString.split('-');
                  const shortFormattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : day.dateString;

                  return {
                    ...day,
                    val,
                    x,
                    y,
                    shortFormattedDate
                  };
                });

                return (
                  <div className="space-y-2 animate-fade-in pt-1">
                    {/* Responsive SVG Container */}
                    <div className="relative w-full overflow-hidden">
                      <svg className="w-full h-auto overflow-visible select-none" viewBox="0 0 700 200">
                        <defs>
                          <linearGradient id="purpleFlowGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                            <stop offset="75%" stopColor="#818cf8" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                          <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Horizontal Grid Lines for 0..5 */}
                        {[0, 1, 2, 3, 4, 5].map((gridVal) => {
                          const gridY = 180 - (gridVal / 5) * 160;
                          return (
                            <g key={gridVal}>
                              <line 
                                x1="35" 
                                y1={gridY} 
                                x2="665" 
                                y2={gridY} 
                                stroke="currentColor" 
                                className="text-slate-200 dark:text-slate-700/50" 
                                strokeDasharray="4 4" 
                                strokeWidth="1"
                              />
                              <text 
                                x="22" 
                                y={gridY + 4} 
                                fill="currentColor" 
                                className="text-[11px] font-mono font-medium fill-slate-400 dark:fill-slate-500" 
                                textAnchor="end"
                              >
                                {gridVal}
                              </text>
                            </g>
                          );
                        })}

                        {/* Smooth Area Gradient Fill */}
                        <path 
                          d={getSmoothAreaPath(flowPoints, 180)} 
                          fill="url(#purpleFlowGradient)" 
                        />

                        {/* Smooth Bezier Curve Line */}
                        <path 
                          d={getSmoothPath(flowPoints)} 
                          stroke="#6366f1" 
                          strokeWidth="3.5" 
                          fill="none" 
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#glowPurple)"
                        />

                        {/* Interactive Data Point Dots */}
                        {flowPoints.map((pt, i) => {
                          const isHovered = hoveredPointIndex === i;
                          return (
                            <g 
                              key={pt.id} 
                              className="cursor-pointer group"
                              onMouseEnter={() => setHoveredPointIndex(i)}
                              onMouseLeave={() => setHoveredPointIndex(null)}
                            >
                              {/* Pulse Ring when Hovered */}
                              {isHovered && (
                                <circle 
                                  cx={pt.x} 
                                  cy={pt.y} 
                                  r="13" 
                                  fill="#6366f1" 
                                  fillOpacity="0.25" 
                                  className="animate-ping"
                                />
                              )}

                              {/* Main Circle Dot */}
                              <circle 
                                cx={pt.x} 
                                cy={pt.y} 
                                r={isHovered ? "7" : pt.isFuture ? "4" : "5"} 
                                fill="#6366f1" 
                                fillOpacity={pt.isFuture ? (isHovered ? "0.7" : "0.25") : "1"}
                                stroke={pt.isFuture ? "#a5b4fc" : "#ffffff"} 
                                strokeWidth={pt.isFuture ? "1.5" : "2.5"} 
                                strokeDasharray={pt.isFuture ? "2 2" : undefined}
                                className={cn("transition-all duration-300", pt.isFuture ? "opacity-60" : "shadow-lg")}
                              />

                              {/* Hover Tooltip Banner */}
                              {isHovered && (
                                <g transform={`translate(${pt.x}, ${Math.max(25, pt.y - 18)})`}>
                                  <rect 
                                    x="-45" 
                                    y="-28" 
                                    width="90" 
                                    height="24" 
                                    rx="6" 
                                    fill="#1e1b4b" 
                                    stroke="#6366f1" 
                                    strokeWidth="1"
                                    className="shadow-xl"
                                  />
                                  <text 
                                    x="0" 
                                    y="-12" 
                                    fill="#ffffff" 
                                    fontSize="10" 
                                    fontWeight="bold" 
                                    textAnchor="middle"
                                  >
                                    {pt.val} {language === 'ar' ? 'ساعة تركيز' : 'hrs focus'}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* X-Axis Day & Checkmarks Row */}
                    <div className="grid grid-cols-7 gap-1 pt-3 border-t border-slate-100 dark:border-slate-700/60 relative z-10">
                      {flowPoints.map((pt) => (
                        <div key={pt.id} className={cn(
                          "flex flex-col items-center space-y-1 min-w-0 transition-opacity duration-300",
                          pt.isFuture ? "opacity-45" : "opacity-100"
                        )}>
                          <span className={cn(
                            "text-[10px] sm:text-xs block truncate text-center transition-colors",
                            pt.isFuture 
                              ? "text-slate-400 dark:text-slate-500 font-medium" 
                              : "font-bold text-slate-700 dark:text-slate-300"
                          )}>
                            {language === 'ar' ? pt.ar : pt.en}
                          </span>
                          <span className={cn(
                            "text-[9px] sm:text-[10px] font-mono",
                            pt.isFuture ? "text-slate-400/50 dark:text-slate-600/60" : "text-slate-400 dark:text-slate-500"
                          )}>
                            {pt.shortFormattedDate}
                          </span>
                          <div className="pt-0.5 min-h-[18px] flex items-center justify-center">
                            {pt.completed ? (
                              <Check className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            ) : pt.isToday ? (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            ) : pt.isFuture ? (
                              <span className="text-[10px] text-slate-300/60 dark:text-slate-700/60 font-mono">•</span>
                            ) : (
                              <span className="text-[10px] text-slate-300 dark:text-slate-700 font-bold">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sub Bento Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Daily Focus Average Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">{language === 'ar' ? 'المعدل' : 'AVG'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'ar' ? 'متوسط التركيز اليومي' : 'Daily Focus Average'}
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-1">
                    {language === 'ar' 
                      ? `${avgHours} س ${avgMins} د` 
                      : `${avgHours}h ${avgMins}m`}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'ar' ? 'متوسط وقت اليوم الواحد' : 'Average focus time per single day'}
                  </p>
                </div>
              </div>

              {/* Completed Quests/Tasks Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">{language === 'ar' ? 'المهام' : 'QUESTS'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'ar' ? 'المهام المنجزة' : 'Completed Quests'}
                  </span>
                  <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white mt-1">
                    {completedTasksCount}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'ar' ? 'إجمالي الإنجاز اليومي والشهري' : 'Total completed quests'}
                  </p>
                </div>
              </div>

              {/* Accomplishment / Progress Rate Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">{language === 'ar' ? 'النسبة' : 'RATE'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {language === 'ar' ? 'معدل الإنجاز' : 'Accomplishment Rate'}
                  </span>
                  <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
                    <span>{taskCompletionRate}%</span>
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'ar' ? 'مقارنة بالمتوسط العام' : 'Compared to overall general average'}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Side Sidebar Bento Cards */}
          <div className="space-y-6">
            
            {/* Dynamic Badge & Achievement Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl relative overflow-hidden flex flex-col items-center justify-between text-center group min-h-[310px] transition-all duration-500">
              {/* Glowing backdrop circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              
              {/* Card Header */}
              <div className="w-full flex items-center justify-between relative z-10">
                <div className="text-right rtl:text-right ltr:text-left">
                  <span className="text-[10px] font-mono tracking-wider font-bold text-indigo-300/80 uppercase block">
                    {language === 'ar' ? 'وسام التركيز اليومي' : 'DAILY FOCUS BADGE'}
                  </span>
                </div>

                {/* Automatic badge indicator based on today's focus hours */}
                <div className="px-2.5 py-1 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {todayFocusHours > 0 
                      ? (language === 'ar' ? `${todayFocusHours} ساعة تركيز اليوم` : `${todayFocusHours}h Today Focus`)
                      : (language === 'ar' ? '0 ساعات تركيز اليوم' : '0h Today Focus')}
                  </span>
                </div>
              </div>

              {/* Main Title displaying exact format from images */}
              <div className="my-3 relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center justify-center gap-1.5 flex-wrap">
                  <span>{language === 'ar' ? 'أسبوع' : 'Very'}</span>
                  <span className="text-indigo-300 dark:text-indigo-200 bg-indigo-500/20 px-2.5 py-0.5 rounded-xl border border-indigo-400/40 font-black shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    {language === 'ar' ? currentBadge.keywordAr : currentBadge.keywordEn}
                  </span>
                  <span>{language === 'ar' ? 'جداً!' : 'Week!'}</span>
                </h3>
                <p className="text-[11px] text-indigo-200/80 mt-2 max-w-[220px] mx-auto leading-relaxed">
                  {language === 'ar' ? currentBadge.descriptionAr : currentBadge.descriptionEn}
                </p>
              </div>

              {/* Center Glowing Icon */}
              <div className="my-2 relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 sm:w-22 sm:h-22 bg-indigo-500/10 border border-indigo-400/40 rounded-3xl flex items-center justify-center shadow-[0_0_35px_rgba(99,102,241,0.4)] relative group-hover:scale-110 transition-transform duration-500 backdrop-blur-md">
                  <BadgeIcon className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-200 fill-indigo-300/10 stroke-[2] drop-shadow-[0_0_10px_rgba(165,180,252,0.8)] animate-pulse" />
                </div>
                
                {/* Dynamic status indicator */}
                <span className="mt-2.5 text-[10px] font-mono text-indigo-300/70 font-semibold">
                  {language === 'ar' 
                    ? `مكتسب تلقائياً بناءً على تركيز اليوم (${todayFocusHours} س)` 
                    : `Earned automatically based on today's focus (${todayFocusHours}h)`}
                </span>
              </div>

              {/* Pill Button Label at Bottom */}
              <div className="w-full mt-3 relative z-10">
                <div className="w-full py-2.5 px-4 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 font-mono text-[11px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner backdrop-blur-md group-hover:border-indigo-400 transition-colors">
                  <BadgeIcon className="w-4 h-4 text-indigo-300" />
                  <span>{currentBadge.badgeLabel}</span>
                </div>
              </div>
            </div>



            {/* Total Focus Hours Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-indigo-500/40 transition-all">
              <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl" />
              
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === 'ar' ? 'إجمالي ساعات التركيز' : 'Total Focus Hours'}
              </span>
              
              <div className="text-3xl font-bold font-mono text-slate-800 dark:text-white mt-1 tracking-tight">
                {totalFocusHours}
              </div>

              <span className="text-[10px] text-slate-500 mt-1">
                {language === 'ar' ? 'ساعة للفترة المحددة' : 'Hours for the selected period'}
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
