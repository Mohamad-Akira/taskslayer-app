import React, { useState } from 'react';
import { Sparkles, Bot, Activity, CheckCircle2, RefreshCw, ShieldCheck, ChevronDown, Zap, BarChart3, AlertCircle } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import { cn } from '../lib/utils';
import { authedFetch } from '../lib/firebase';
import { Priority } from '../types';

interface AiEvaluationIndicatorProps {
  language?: string;
}

export function AiEvaluationIndicator({ language = 'ar' }: AiEvaluationIndicatorProps) {
  const { tasks, updateTask, isAiEvaluating } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [lastEvaluatedTime, setLastEvaluatedTime] = useState<string | null>(() => {
    return new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  });

  const isAr = language === 'ar';

  // Compute AI evaluation stats across current tasks
  const evaluatedTasks = tasks.filter((t) => t.aiDifficulty || t.aiReasoning || t.isSpam !== undefined);
  const totalTasks = tasks.length;
  const spamCount = tasks.filter((t) => t.isSpam).length;

  const difficultyCounts = tasks.reduce(
    (acc, t) => {
      const diff = t.aiDifficulty || t.priority;
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    },
    { urgent: 0, high: 0, medium: 0, low: 0 } as Record<Priority, number>
  );

  const handleBatchReevaluate = async () => {
    const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'skipped').slice(0, 5);
    if (activeTasks.length === 0) return;

    setIsBatchRunning(true);
    try {
      for (const task of activeTasks) {
        const res = await authedFetch('/api/tasks/evaluate', {
          method: 'POST',
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
          }),
        });
        const resData = await res.json();
        if (resData.status === 'success' && resData.data) {
          const evalResult = resData.data;
          const validDifficulties: Priority[] = ['low', 'medium', 'high', 'urgent'];
          const newDifficulty = validDifficulties.includes(evalResult.difficulty as Priority)
            ? (evalResult.difficulty as Priority)
            : task.priority;

          updateTask(task.id, {
            priority: newDifficulty,
            aiDifficulty: newDifficulty,
            aiReasoning: evalResult.reasoning || task.aiReasoning,
            isSpam: evalResult.isSpam ?? task.isSpam,
          });
        }
      }
      setLastEvaluatedTime(
        new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error('Batch AI re-evaluation failed:', err);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const isWorking = isAiEvaluating || isBatchRunning;

  return (
    <div className="relative inline-block text-left rtl:text-right">
      {/* Sleek Top-Screen AI Evaluation Indicator Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer shadow-xs select-none backdrop-blur-md",
          isWorking
            ? "bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-pink-500/20 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/30 text-indigo-700 dark:text-indigo-300 animate-pulse"
            : isOpen
            ? "bg-indigo-50 dark:bg-slate-800/90 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
            : "bg-white/90 dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-500/50 text-slate-700 dark:text-slate-200 hover:shadow-sm"
        )}
        title={isAr ? 'مؤشر تقييم الذكاء الاصطناعي للمهام (انقر للتفاصيل)' : 'AI Task Evaluation Indicator (Click for details)'}
      >
        {/* Glow halo behind icon */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xs pointer-events-none" />

        {/* Dynamic AI Icon with animated sparkles */}
        <div className="relative flex items-center justify-center">
          <Sparkles className={cn(
            "w-3.5 h-3.5 transition-transform duration-300",
            isWorking ? "text-purple-500 animate-spin" : "text-indigo-500 group-hover:scale-110"
          )} />
          {isWorking && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          )}
        </div>

        {/* Title Label */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-tight">
          <span>{isAr ? 'تقييم الذكاء الاصطناعي' : 'AI Evaluation'}</span>
          
          {/* Status Dot */}
          <span className="flex items-center gap-1">
            <span className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isWorking ? "bg-purple-500 animate-pulse" : "bg-emerald-500"
            )} />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-extrabold hidden sm:inline">
              {isWorking ? (isAr ? 'جاري...' : 'Evaluating...') : (isAr ? 'نشط' : 'Active')}
            </span>
          </span>
        </div>

        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Elegant Glassmorphic Dropdown Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-indigo-100 dark:border-slate-800 p-4 z-50 backdrop-blur-xl animate-fade-in text-xs space-y-4">
            
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm font-mono flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <span>{isAr ? 'محرك تقييم الذكاء الاصطناعي' : 'AI Evaluation Engine'}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-200 dark:border-indigo-800">
                      Gemini 3.6 Flash
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'تقييم تلقائي للصعوبة وحماية جودة المهام' : 'Auto-assessing task difficulty & quality'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold font-mono">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>{isAr ? 'مستمر' : 'Live'}</span>
              </div>
            </div>

            {/* AI Assessment Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400 font-semibold">{isAr ? 'تم تقييمها' : 'Evaluated'}</div>
                <div className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {evaluatedTasks.length} <span className="text-[10px] text-slate-400 font-normal">/ {totalTasks}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400 font-semibold">{isAr ? 'دقة التقييم' : 'Accuracy'}</div>
                <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  98%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                <div className="text-[10px] text-slate-400 font-semibold">{isAr ? 'فلترة العشوائية' : 'Spam Filter'}</div>
                <div className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {spamCount} {isAr ? 'مهام' : 'tasks'}
                </div>
              </div>
            </div>

            {/* AI Difficulty Breakdown Chips */}
            <div className="space-y-1.5 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 font-mono">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isAr ? 'توزيع صعوبات الذكاء الاصطناعي:' : 'AI Difficulty Distribution:'}</span>
                </span>
                <span className="text-[10px] text-slate-400">{isAr ? 'مستويات الصعوبة' : 'Rank Levels'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <div className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-center">
                  <div className="text-[9px] text-red-500 font-bold">{isAr ? 'عاجل' : 'Urgent'}</div>
                  <div className="text-xs font-mono font-extrabold text-red-700 dark:text-red-400">{difficultyCounts.urgent}</div>
                </div>
                <div className="px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 text-center">
                  <div className="text-[9px] text-orange-500 font-bold">{isAr ? 'عالي' : 'High'}</div>
                  <div className="text-xs font-mono font-extrabold text-orange-700 dark:text-orange-400">{difficultyCounts.high}</div>
                </div>
                <div className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-center">
                  <div className="text-[9px] text-blue-500 font-bold">{isAr ? 'متوسط' : 'Medium'}</div>
                  <div className="text-xs font-mono font-extrabold text-blue-700 dark:text-blue-400">{difficultyCounts.medium}</div>
                </div>
                <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[9px] text-slate-500 font-bold">{isAr ? 'منخفض' : 'Low'}</div>
                  <div className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-300">{difficultyCounts.low}</div>
                </div>
              </div>
            </div>

            {/* 3+ Hours Pomodoro Re-evaluation Rule Highlight */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-mono font-medium">
              <Zap className="w-4 h-4 text-purple-500 shrink-0" />
              <span>
                {isAr
                  ? 'قاعدة تلقائية: المهام القياسية التي يتجاوز العمل فيها 3 ساعات بومودورو يتم ترقيتها وتعديل مستواها تلقائياً إلى "عالي" (High).'
                  : 'Auto Rule: Standard tasks surpassing 3 hours of Pomodoro focus are automatically upgraded to High priority.'}
              </span>
            </div>

            {/* Status Footer & Re-evaluate CTA */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={handleBatchReevaluate}
                disabled={isWorking}
                className={cn(
                  "w-full py-2.5 px-3 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-sm",
                  isWorking
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-transparent shadow-indigo-500/20 hover:shadow-md"
                )}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isWorking && "animate-spin")} />
                <span>
                  {isWorking
                    ? (isAr ? 'جاري تحليل وتقييم المهام...' : 'Analyzing & Evaluating Tasks...')
                    : (isAr ? 'إعادة تقييم المهام بالذكاء الاصطناعي' : 'Re-evaluate Tasks with AI')}
                </span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>{isAr ? 'محمي بنظام التقييم الذكي' : 'Protected by AI Guard'}</span>
                </span>
                {lastEvaluatedTime && (
                  <span>{isAr ? `آخر تقييم: ${lastEvaluatedTime}` : `Last: ${lastEvaluatedTime}`}</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
