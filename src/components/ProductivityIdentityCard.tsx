import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getPillarSpecificTitle, categorizeTaskPillar, parseTaskHours } from '../lib/rpgUtils';
import { 
  Sparkles, 
  BookOpen, 
  Terminal, 
  Paintbrush, 
  Award, 
  TrendingUp, 
  Bot, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Brain,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { authedFetch } from '../lib/firebase';
import { Task } from '../types';

interface AuditResult {
  summary: string;
  highlight: string;
  nextGoal: string;
}

export function ProductivityIdentityCard() {
  const { tasks, profile, language } = useApp();
  const isAr = language === 'ar';

  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Compute Weekly Productivity Breakdown (Last 7 Days)
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter tasks completed in last 7 days (or fallback to all completed if user is new)
    let completedTasks = tasks.filter(t => t.status === 'done');
    let recentDoneTasks = completedTasks.filter(t => {
      if (!t.createdAt) return false;
      const created = new Date(t.createdAt);
      return created >= sevenDaysAgo;
    });

    // If less than 3 recent tasks, fallback to all completed tasks so the card is always rich & active
    if (recentDoneTasks.length < 3 && completedTasks.length > 0) {
      recentDoneTasks = completedTasks;
    }

    let studyHours = 0;
    let codeHours = 0;
    let designHours = 0;
    let generalHours = 0;

    let studyCount = 0;
    let codeCount = 0;
    let designCount = 0;
    let generalCount = 0;

    recentDoneTasks.forEach(t => {
      const pillar = categorizeTaskPillar(t.title, t.description);
      const hours = t.estimatedHours && t.estimatedHours > 0 
        ? t.estimatedHours 
        : parseTaskHours(t.title, t.description, 1.0);

      if (pillar === 'study') {
        studyHours += hours;
        studyCount++;
      } else if (pillar === 'code') {
        codeHours += hours;
        codeCount++;
      } else if (pillar === 'design') {
        designHours += hours;
        designCount++;
      } else {
        generalHours += hours;
        generalCount++;
      }
    });

    // Determine Dominant Pillar strictly from task output
    let dominantPillar: 'study' | 'code' | 'design' | 'general' = 'study';

    if (recentDoneTasks.length > 0) {
      let maxHours = -1;
      if (codeHours > maxHours) {
        dominantPillar = 'code';
        maxHours = codeHours;
      }
      if (designHours > maxHours) {
        dominantPillar = 'design';
        maxHours = designHours;
      }
      if (studyHours > maxHours) {
        dominantPillar = 'study';
        maxHours = studyHours;
      }
      if (generalHours > maxHours && generalHours > (maxHours + 1)) {
        dominantPillar = 'general';
      }
    } else {
      const { code = 0, design = 0, study = 0 } = profile.pillars || {};
      if (code >= study && code >= design) dominantPillar = 'code';
      else if (design >= code && design >= study) dominantPillar = 'design';
      else if (study >= code && study >= design) dominantPillar = 'study';
    }

    const totalHours = Math.max(0.1, studyHours + codeHours + designHours + generalHours);
    const studyPct = Math.round((studyHours / totalHours) * 100);
    const codePct = Math.round((codeHours / totalHours) * 100);
    const designPct = Math.round((designHours / totalHours) * 100);
    const generalPct = Math.max(0, 100 - (studyPct + codePct + designPct));

    return {
      dominantPillar,
      totalHours: Number(totalHours.toFixed(1)),
      taskCount: recentDoneTasks.length,
      breakdownHours: {
        study: Number(studyHours.toFixed(1)),
        code: Number(codeHours.toFixed(1)),
        design: Number(designHours.toFixed(1)),
        general: Number(generalHours.toFixed(1))
      },
      breakdownPct: {
        study: studyPct,
        code: codePct,
        design: designPct,
        general: generalPct
      },
      recentDoneTasks
    };
  }, [tasks, profile.pillars]);

  // Pillar Titles and Styling
  const pillarDetails = useMemo(() => {
    switch (weeklyStats.dominantPillar) {
      case 'study':
        return {
          name: isAr ? 'باحث الحكمة والمعرفة' : 'Wisdom & Knowledge Seeker',
          icon: BookOpen,
          bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-600 dark:text-amber-400',
          gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
          badgeBg: 'bg-amber-500 text-slate-950'
        };
      case 'code':
        return {
          name: isAr ? 'ساحر الكود والهندسة' : 'Code & Software Sorcerer',
          icon: Terminal,
          bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/15',
          borderColor: 'border-indigo-500/30',
          textColor: 'text-indigo-600 dark:text-indigo-400',
          gradient: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
          badgeBg: 'bg-indigo-600 text-white'
        };
      case 'design':
        return {
          name: isAr ? 'إتقان الإبداع والتصميم' : 'Creative Design Master',
          icon: Paintbrush,
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
          badgeBg: 'bg-emerald-600 text-white'
        };
      default:
        return {
          name: isAr ? 'الحيوية والانضباط الشخصي' : 'General Discipline & Vitality',
          icon: Zap,
          bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/15',
          borderColor: 'border-cyan-500/30',
          textColor: 'text-cyan-600 dark:text-cyan-400',
          gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
          badgeBg: 'bg-cyan-600 text-white'
        };
    }
  }, [weeklyStats.dominantPillar, isAr]);

  // Specific Dynamic Pillar Title based on user level & active dominant pillar
  const dynamicPillarTitle = useMemo(() => {
    return getPillarSpecificTitle(profile.level, weeklyStats.dominantPillar, language);
  }, [profile.level, weeklyStats.dominantPillar, language]);

  // Trigger Weekly AI Audit
  const fetchWeeklyAudit = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await authedFetch('/api/weekly-audit', {
        method: 'POST',
        body: JSON.stringify({
          dominantPillar: weeklyStats.dominantPillar,
          dominantPillarName: pillarDetails.name,
          pillarTitle: dynamicPillarTitle,
          weeklyHours: weeklyStats.totalHours,
          weeklyTaskCount: weeklyStats.taskCount,
          breakdown: weeklyStats.breakdownHours,
          recentTasks: weeklyStats.recentDoneTasks.map(t => t.title),
          level: profile.level,
          lang: language
        })
      });

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setAuditResult(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch weekly audit:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchWeeklyAudit();
  }, [weeklyStats.dominantPillar, weeklyStats.taskCount]);

  const PillarIcon = pillarDetails.icon;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm space-y-6 relative overflow-hidden transition-all">
      {/* Subtle Background Glow */}
      <div className={cn("absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none bg-gradient-to-br opacity-50", pillarDetails.gradient)} />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg leading-tight flex items-center gap-2">
              <span>{isAr ? 'بطاقة الهوية الإنتاجية الحالية' : 'Current Productivity Identity'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {isAr ? 'تتغير ديناميكياً حسب أكثر نوع إنجاز للأسبوع الجاري' : 'Evolves weekly based on your most completed task type'}
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {isAr ? 'تقييم أسبوعي ديناميكي' : 'Weekly Dynamic Evaluation'}
        </span>
      </div>

      {/* Main Identity Banner */}
      <div className={cn("p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5 relative", pillarDetails.bgColor, pillarDetails.borderColor)}>
        <div className="flex items-start gap-4">
          <div className={cn("p-3.5 rounded-2xl shadow-md text-white shrink-0", pillarDetails.badgeBg)}>
            <PillarIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {isAr ? 'الركيزة السائدة' : 'DOMINANT PILLAR'}:
              </span>
              <span className={cn("text-xs font-bold font-mono px-2 py-0.5 rounded-md", pillarDetails.textColor, "bg-white/60 dark:bg-slate-950/40")}>
                {pillarDetails.name}
              </span>
            </div>

            {/* Dynamic Pillar Specific Title */}
            <h4 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{dynamicPillarTitle}</span>
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              {isAr 
                ? `مرتبتك الإنتاجية الحالية ضمن ركيزة (${pillarDetails.name}). ترتفع مرتبتك كـ (${dynamicPillarTitle}) بالانضباط ورفع مستواك العام.` 
                : `Your current productivity rank under (${pillarDetails.name}). Promotes as (${dynamicPillarTitle}) as you level up and stay focused.`}
            </p>
          </div>
        </div>

        {/* Level & Weekly Summary badge */}
        <div className="bg-white/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shrink-0 text-left rtl:text-right space-y-1">
          <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
            {isAr ? 'إنجاز الأسبوع الجاري' : 'THIS WEEK\'S OUTPUT'}
          </div>
          <div className="text-lg font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span>{weeklyStats.totalHours} {isAr ? 'ساعة' : 'hrs'}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-indigo-600 dark:text-indigo-400">{weeklyStats.taskCount} {isAr ? 'مهمة' : 'tasks'}</span>
          </div>
        </div>
      </div>

      {/* Focus Distribution Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
          <span>{isAr ? 'توزيع التركيز الأسبوعي' : 'Weekly Focus Distribution'}</span>
          <span className="text-[10px] text-slate-400 font-normal">{isAr ? 'نسبة الساعات لكل ركيزة' : 'Hours ratio per pillar'}</span>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700/60">
          {weeklyStats.breakdownPct.study > 0 && (
            <div 
              style={{ width: `${weeklyStats.breakdownPct.study}%` }}
              className="bg-amber-500 h-full rounded-s-full transition-all duration-500"
              title={`المعرفة: ${weeklyStats.breakdownHours.study}س (${weeklyStats.breakdownPct.study}%)`}
            />
          )}
          {weeklyStats.breakdownPct.code > 0 && (
            <div 
              style={{ width: `${weeklyStats.breakdownPct.code}%` }}
              className="bg-indigo-600 h-full transition-all duration-500"
              title={`البرمجة: ${weeklyStats.breakdownHours.code}س (${weeklyStats.breakdownPct.code}%)`}
            />
          )}
          {weeklyStats.breakdownPct.design > 0 && (
            <div 
              style={{ width: `${weeklyStats.breakdownPct.design}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`التصميم: ${weeklyStats.breakdownHours.design}س (${weeklyStats.breakdownPct.design}%)`}
            />
          )}
          {weeklyStats.breakdownPct.general > 0 && (
            <div 
              style={{ width: `${weeklyStats.breakdownPct.general}%` }}
              className="bg-cyan-500 h-full rounded-e-full transition-all duration-500"
              title={`الانضباط العام: ${weeklyStats.breakdownHours.general}س (${weeklyStats.breakdownPct.general}%)`}
            />
          )}
        </div>

        {/* Key legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">{isAr ? 'المعرفة والحكمة' : 'Knowledge'}: <strong className="font-mono">{weeklyStats.breakdownHours.study}س</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
            <span className="truncate">{isAr ? 'البرمجة والكود' : 'Code'}: <strong className="font-mono">{weeklyStats.breakdownHours.code}س</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{isAr ? 'التصميم والإبداع' : 'Design'}: <strong className="font-mono">{weeklyStats.breakdownHours.design}س</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
            <span className="truncate">{isAr ? 'انضباط عام' : 'General'}: <strong className="font-mono">{weeklyStats.breakdownHours.general}س</strong></span>
          </div>
        </div>
      </div>

      {/* AI Weekly Audit Section */}
      <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              {isAr ? 'التقييم الأسبوعي الذكي (AI Audit)' : 'AI Weekly Productivity Audit'}
            </h4>
          </div>

          <button
            onClick={fetchWeeklyAudit}
            disabled={isLoadingAudit}
            className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoadingAudit && "animate-spin")} />
            <span>{isAr ? 'إعادة التقييم' : 'Re-audit'}</span>
          </button>
        </div>

        {isLoadingAudit ? (
          <div className="p-4 flex items-center justify-center gap-3 text-xs text-slate-500 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            <span>{isAr ? 'جاري تحليل إنجازات الأسبوع واستخراج التقييم الذكي...' : 'Analyzing weekly achievements...'}</span>
          </div>
        ) : auditResult ? (
          <div className="space-y-3 animate-fadeIn">
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              {auditResult.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {auditResult.highlight && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[10px] uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-400">{isAr ? 'أبرز إنجاز' : 'WEEK HIGHLIGHT'}</strong>
                    <span>{auditResult.highlight}</span>
                  </div>
                </div>
              )}

              {auditResult.nextGoal && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[10px] uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400">{isAr ? 'توصية الأسبوع القادم' : 'NEXT WEEK GOAL'}</strong>
                    <span>{auditResult.nextGoal}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
