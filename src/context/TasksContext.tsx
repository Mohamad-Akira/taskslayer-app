import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project, Priority } from '../types';
import { DEFAULT_TASKS, DEFAULT_PROJECTS, deduplicateTasks } from '../lib/rpgUtils';
import { getLocalDateString, getNextRepeatDate } from '../lib/utils';
import { safeParseJSON, safeParseTasks, safeParsePomodoroStats } from '../lib/schemas';
import { Language } from '../utils/translations';
import { playTaskCompletionSound, playSkipSound } from '../lib/audio';
import { sendWebNotification } from '../utils/notifications';
import { checkTaskSpamClient } from '../lib/taskValidation';
import { authedFetch } from '../lib/firebase';

export interface TasksContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  pomodoroStats: {
    completedSessions: number;
    totalMinutes: number;
    history?: Record<string, { completedSessions: number; totalMinutes: number }>;
  };
  setPomodoroStats: React.Dispatch<React.SetStateAction<{
    completedSessions: number;
    totalMinutes: number;
    history?: Record<string, { completedSessions: number; totalMinutes: number }>;
  }>>;
  incrementPomodoroStats: (minutes: number) => void;

  addTask: (
    title: string,
    priority?: Priority,
    projectId?: string,
    dueDate?: string,
    description?: string,
    reminder?: string,
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    estimatedHours?: number,
    options?: { selectedProjectId?: string | null; addLog?: (msg: string, type: any) => void }
  ) => void;

  updateTask: (
    taskId: string,
    updates: Partial<Task>,
    options?: {
      mp: number;
      setShowMpZeroModal: (show: boolean) => void;
      awardRPG: (priority: Priority, projId?: string, isPomodoro?: boolean, language?: Language, taskTitle?: string, taskDesc?: string) => { xpGain: number; goldGain: number; hpChange: number; mpGain: number };
      revokeRPG: (earnedXp: number, earnedGold: number, earnedHp: number, earnedMp: number, priority: Priority, projId?: string, language?: Language) => void;
      addLog: (msg: string, type: any) => void;
      language?: Language;
    }
  ) => void;

  deleteTask: (taskId: string, options?: { addLog?: (msg: string, type: any) => void }) => void;

  skipTaskForToday: (
    taskId: string,
    options?: {
      revokeRPG?: (earnedXp: number, earnedGold: number, earnedHp: number, earnedMp: number, priority: Priority, projId?: string, language?: Language) => void;
      addLog?: (msg: string, type: any) => void;
      language?: Language;
    }
  ) => void;

  completeTaskPomodoro: (
    taskId: string,
    options?: {
      mp: number;
      setShowMpZeroModal: (show: boolean) => void;
      awardRPG: (priority: Priority, projId?: string, isPomodoro?: boolean, language?: Language, taskTitle?: string, taskDesc?: string) => { xpGain: number; goldGain: number; hpChange: number; mpGain: number };
      language?: Language;
    }
  ) => void;

  recordTaskPomodoroTime: (
    taskId: string,
    secondsToAdd: number,
    addLog?: (msg: string, type: any) => void,
    language?: string
  ) => void;

  spamFreezeUntil: number | null;
  setSpamFreezeUntil: React.Dispatch<React.SetStateAction<number | null>>;
  showSpamModal: boolean;
  setShowSpamModal: (show: boolean) => void;
  isAiEvaluating: boolean;
  setIsAiEvaluating: React.Dispatch<React.SetStateAction<boolean>>;

  // Global Pomodoro Timer States
  workDuration: number;
  setWorkDuration: React.Dispatch<React.SetStateAction<number>>;
  breakDuration: number;
  setBreakDuration: React.Dispatch<React.SetStateAction<number>>;
  workTimeLeft: number;
  setWorkTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  workIsRunning: boolean;
  setWorkIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  breakTimeLeft: number;
  setBreakTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  breakIsRunning: boolean;
  setBreakIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  mode: 'work' | 'break';
  setMode: React.Dispatch<React.SetStateAction<'work' | 'break'>>;
  workMaxDuration: number;
  setWorkMaxDuration: React.Dispatch<React.SetStateAction<number>>;
  breakMaxDuration: number;
  setBreakMaxDuration: React.Dispatch<React.SetStateAction<number>>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const raw = safeParseJSON(localStorage.getItem('taskslayer_tasks') || localStorage.getItem('ticktick_tasks'), null);
    return safeParseTasks(raw);
  });

  const taskCompletionsRef = React.useRef<number[]>([]);
  const [showSpamModal, setShowSpamModal] = useState<boolean>(() => {
    const stored = localStorage.getItem('taskslayer_spam_freeze') || localStorage.getItem('ticktick_spam_freeze');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (Date.now() < parsed) return true;
    }
    return false;
  });
  const [spamFreezeUntil, setSpamFreezeUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem('taskslayer_spam_freeze') || localStorage.getItem('ticktick_spam_freeze');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (Date.now() < parsed) return parsed;
      localStorage.removeItem('taskslayer_spam_freeze');
      localStorage.removeItem('ticktick_spam_freeze');
    }
    return null;
  });

  useEffect(() => {
    if (spamFreezeUntil) {
      localStorage.setItem('taskslayer_spam_freeze', spamFreezeUntil.toString());
      const timeout = setTimeout(() => {
        setSpamFreezeUntil(null);
        localStorage.removeItem('taskslayer_spam_freeze');
        localStorage.removeItem('ticktick_spam_freeze');
      }, spamFreezeUntil - Date.now());
      return () => clearTimeout(timeout);
    } else {
      localStorage.removeItem('taskslayer_spam_freeze');
      localStorage.removeItem('ticktick_spam_freeze');
    }
  }, [spamFreezeUntil]);

  const [projects] = useState<Project[]>(DEFAULT_PROJECTS);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    return localStorage.getItem('taskslayer_active_task_id') || localStorage.getItem('ticktick_active_task_id') || null;
  });

  const [pomodoroStats, setPomodoroStats] = useState<{
    completedSessions: number;
    totalMinutes: number;
    history?: Record<string, { completedSessions: number; totalMinutes: number }>;
  }>(() => {
    const raw = safeParseJSON(localStorage.getItem('taskslayer_pomodoro_stats') || localStorage.getItem('ticktick_pomodoro_stats'), null);
    return safeParsePomodoroStats(raw);
  });

  const [isAiEvaluating, setIsAiEvaluating] = useState<boolean>(false);

  // Global Pomodoro states in provider
  const [workDuration, setWorkDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [workTimeLeft, setWorkTimeLeft] = useState<number>(25 * 60);
  const [workIsRunning, setWorkIsRunning] = useState<boolean>(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState<number>(5 * 60);
  const [breakIsRunning, setBreakIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [workMaxDuration, setWorkMaxDuration] = useState<number>(25 * 60);
  const [breakMaxDuration, setBreakMaxDuration] = useState<number>(5 * 60);

  useEffect(() => {
    localStorage.setItem('taskslayer_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('taskslayer_active_task_id', activeTaskId);
    } else {
      localStorage.removeItem('taskslayer_active_task_id');
      localStorage.removeItem('ticktick_active_task_id');
    }
  }, [activeTaskId]);

  useEffect(() => {
    localStorage.setItem('taskslayer_pomodoro_stats', JSON.stringify(pomodoroStats));
  }, [pomodoroStats]);

  // Auto catch-up recurring tasks for today if past due date exists without a current instance
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const todayStr = getLocalDateString();

    setTasks((prevTasks) => {
      let modified = false;
      const cleaned = deduplicateTasks(prevTasks);
      if (cleaned.length !== prevTasks.length) {
        modified = true;
      }

      const tasksToAdd: Task[] = [];
      const recurringBaseMap = new Map<string, Task>();

      for (const t of cleaned) {
        if (t.repeat && t.repeat !== 'none') {
          const key = t.title.trim().toLowerCase();
          const existing = recurringBaseMap.get(key);
          if (!existing || (t.dueDate && existing.dueDate && t.dueDate > existing.dueDate)) {
            recurringBaseMap.set(key, t);
          }
        }
      }

      for (const [titleKey, baseTask] of recurringBaseMap.entries()) {
        if (!baseTask.dueDate) continue;

        const hasCurrentOrFutureInstance = cleaned.some(
          (other) =>
            other.title.trim().toLowerCase() === titleKey &&
            other.dueDate &&
            other.dueDate >= todayStr
        );

        if (!hasCurrentOrFutureInstance && baseTask.dueDate < todayStr) {
          let targetDate = baseTask.dueDate;
          while (targetDate < todayStr) {
            targetDate = getNextRepeatDate(targetDate, baseTask.repeat);
          }

          const alreadyExists = cleaned.some(
            (o) =>
              o.title.trim().toLowerCase() === titleKey &&
              o.dueDate === targetDate &&
              o.status === 'todo'
          );

          if (!alreadyExists) {
            const newTask: Task = {
              id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              title: baseTask.title,
              description: baseTask.description,
              status: 'todo',
              priority: baseTask.priority,
              projectId: baseTask.projectId,
              dueDate: targetDate,
              reminder: baseTask.reminder,
              repeat: baseTask.repeat,
              createdAt: new Date().toISOString(),
            };

            tasksToAdd.push(newTask);
            modified = true;
          }
        }
      }

      if (modified) {
        return deduplicateTasks([...tasksToAdd, ...cleaned]);
      }
      return prevTasks;
    });
  }, [tasks.length]);

  const incrementPomodoroStats = (minutes: number) => {
    const todayStr = getLocalDateString();
    setPomodoroStats((prev) => {
      const history = prev.history ? { ...prev.history } : {};
      const todayStats = history[todayStr] || { completedSessions: 0, totalMinutes: 0 };
      history[todayStr] = {
        completedSessions: todayStats.completedSessions + 1,
        totalMinutes: todayStats.totalMinutes + minutes,
      };
      return {
        completedSessions: prev.completedSessions + 1,
        totalMinutes: prev.totalMinutes + minutes,
        history,
      };
    });
  };

  const addTask: TasksContextType['addTask'] = (
    title,
    priority = 'medium',
    projectId,
    dueDate,
    description,
    reminder,
    repeat,
    estimatedHours,
    options
  ) => {
    // 1. Dual Validation: Step 1 - Client Heuristic Check
    const clientCheck = checkTaskSpamClient(title);

    const taskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      title,
      description,
      status: 'todo',
      priority,
      projectId: projectId || options?.selectedProjectId || undefined,
      dueDate,
      reminder,
      repeat: repeat && repeat !== 'none' ? repeat : undefined,
      estimatedHours,
      createdAt: new Date().toISOString(),
      isSpam: clientCheck.isSpam,
      aiReasoning: clientCheck.isSpam ? (clientCheck.reason || 'مهمة عشوائية غير مسجلة للنقاط') : undefined,
    };

    setTasks((prev) => deduplicateTasks([newTask, ...prev]));

    if (options?.addLog) {
      if (clientCheck.isSpam) {
        options.addLog(`⚠️ مهمة قد تكون عشوائية: "${title}" (لن تمنح نقاط XP عند الإكمال)`, 'damage');
      } else {
        options.addLog(`New Quest Posted: "${title}" (Rank: ${priority.toUpperCase()})`, 'xp');
      }
    }

    // 2. Dual Validation: Step 2 - Server AI Evaluation (Gemini)
    setIsAiEvaluating(true);
    authedFetch('/api/tasks/evaluate', {
      method: 'POST',
      body: JSON.stringify({ title, description, priority, estimatedHours }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.status === 'success' && resData.data) {
          const evalResult = resData.data;
          const validDifficulties: Priority[] = ['low', 'medium', 'high', 'urgent'];
          const newPriority = validDifficulties.includes(evalResult.difficulty as Priority)
            ? (evalResult.difficulty as Priority)
            : validDifficulties.includes(evalResult.suggestedPriority as Priority)
            ? (evalResult.suggestedPriority as Priority)
            : priority;

          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    isSpam: evalResult.isSpam || clientCheck.isSpam,
                    aiReasoning: evalResult.reasoning || t.aiReasoning,
                    aiDifficulty: newPriority,
                    priority: newPriority,
                  }
                : t
            )
          );

          if (options?.addLog && newPriority !== priority) {
            const pAr: Record<Priority, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة جداً' };
            options.addLog(`🤖 قيّم الذكاء الاصطناعي صعوبة "${title}" إلى (${pAr[newPriority]})`, 'xp');
          }
        }
      })
      .catch((err) => {
        console.warn('AI task evaluation fetch error:', err);
      })
      .finally(() => {
        setIsAiEvaluating(false);
      });
  };

  const updateTask: TasksContextType['updateTask'] = (
    taskId,
    updates,
    options
  ) => {
    const previousTask = tasks.find((t) => t.id === taskId);
    if (!previousTask) return;

    let extraUpdates: Partial<Task> = {};

    if (updates.status === 'done' && previousTask.status !== 'done') {
      if (options && options.mp <= 0) {
        options.setShowMpZeroModal(true);
        return;
      }
      
      const now = Date.now();
      let isSpam = false;
      let isCreationCooldown = false;

      if (spamFreezeUntil && now < spamFreezeUntil) {
        isSpam = true;
        setShowSpamModal(true);
        sendWebNotification(options?.language === 'ar' ? 'تجميد المؤشرات' : 'Points Frozen', {
          body: options?.language === 'ar' 
            ? 'لا تزال مكاسبك مجمدة بسبب إنجاز المهام بسرعة كبيرة.' 
            : 'Your gains are still frozen due to rapid task completions.',
          requireInteraction: true
        });
      } else {
        taskCompletionsRef.current.push(now);
        taskCompletionsRef.current = taskCompletionsRef.current.filter(t => now - t < 10000); // 10 seconds
        
        if (taskCompletionsRef.current.length > 6) {
          isSpam = true;
          const freezeTime = now + 15 * 60 * 1000;
          setSpamFreezeUntil(freezeTime);
          setShowSpamModal(true);
          taskCompletionsRef.current = [];
          sendWebNotification(options?.language === 'ar' ? 'تم اكتشاف تكرار سريع' : 'Spam Detected', {
            body: options?.language === 'ar' 
              ? 'لقد أنجزت المهام بسرعة كبيرة. تم تجميد نقاطك لمدة 15 دقيقة.' 
              : 'You completed tasks too quickly. Your points are frozen for 15 minutes.',
            requireInteraction: true
          });
        }
      }

      if (!isSpam && previousTask.createdAt) {
        const createdTime = new Date(previousTask.createdAt).getTime();
        if (now - createdTime < 60000) { // 60 seconds
          isCreationCooldown = true;
          sendWebNotification(options?.language === 'ar' ? 'إنجاز سريع جداً' : 'Too Fast!', {
            body: options?.language === 'ar' 
              ? 'لقد أنجزت المهمة بعد إنشائها مباشرة. لن تحصل على نقاط.' 
              : 'You completed the task immediately after creating it. No points awarded.',
            type: 'warning'
          });
        }
      }

      playTaskCompletionSound();

      const isTaskSpam = previousTask.isSpam || (spamFreezeUntil && now < spamFreezeUntil);

      if (!isTaskSpam && !isSpam && !isCreationCooldown) {
        if (options?.awardRPG) {
          const rewards = options.awardRPG(previousTask.priority, previousTask.projectId, false, options.language, previousTask.title, previousTask.description);
          extraUpdates = {
            earnedXp: rewards.xpGain,
            earnedGold: rewards.goldGain,
            earnedHp: rewards.hpChange,
            earnedMp: rewards.mpGain,
            completedAt: getLocalDateString(new Date()),
          };
        }
      } else {
        extraUpdates = {
          earnedXp: 0,
          earnedGold: 0,
          earnedHp: 0,
          earnedMp: 0,
          completedAt: getLocalDateString(new Date()),
        };
        if (previousTask.isSpam && options?.addLog) {
          options.addLog(`⚠️ أُنجزت مهمة غير مسجلة للنقاط ("${previousTask.title}"): 0 XP / 0 Gold`, 'damage');
        }
      }

      if (previousTask.repeat && previousTask.repeat !== 'none') {
        const todayStr = getLocalDateString();
        let baseDate = previousTask.dueDate || todayStr;
        let nextDueDate = getNextRepeatDate(baseDate, previousTask.repeat);
        while (nextDueDate < todayStr) {
          nextDueDate = getNextRepeatDate(nextDueDate, previousTask.repeat);
        }
        const nextTask: Task = {
          id: `task-${Date.now() + 1}`,
          title: previousTask.title,
          description: previousTask.description,
          status: 'todo',
          priority: previousTask.priority,
          projectId: previousTask.projectId,
          dueDate: nextDueDate,
          reminder: previousTask.reminder,
          repeat: previousTask.repeat,
          createdAt: new Date().toISOString(),
        };
        setTimeout(() => {
          setTasks((prev) => {
            const key = nextTask.title.trim().toLowerCase();
            const exists = prev.some(
              (t) =>
                t.title.trim().toLowerCase() === key &&
                t.dueDate === nextDueDate &&
                t.status === 'todo'
            );
            if (exists) return prev;
            return deduplicateTasks([nextTask, ...prev]);
          });
        }, 50);
        if (options?.addLog) {
          options.addLog(`Recurring Quest Scheduled: "${previousTask.title}" for ${nextDueDate}`, 'xp');
        }
      }
    }

    if (updates.status && updates.status !== 'done' && previousTask.status === 'done') {
      let xpToRevoke = previousTask.earnedXp;
      let goldToRevoke = previousTask.earnedGold;
      let hpToRevoke = previousTask.earnedHp;
      let mpToRevoke = previousTask.earnedMp;

      if (goldToRevoke === undefined) {
        switch (previousTask.priority) {
          case 'urgent': goldToRevoke = 40; break;
          case 'high': goldToRevoke = 20; break;
          case 'medium': goldToRevoke = 10; break;
          case 'low': default: goldToRevoke = 5; break;
        }
      }

      if (xpToRevoke === undefined) {
        switch (previousTask.priority) {
          case 'urgent': xpToRevoke = 80; break;
          case 'high': xpToRevoke = 40; break;
          case 'medium': xpToRevoke = 20; break;
          case 'low': default: xpToRevoke = 10; break;
        }
      }

      if (hpToRevoke === undefined) hpToRevoke = 0;
      if (mpToRevoke === undefined) mpToRevoke = 0;

      if (options?.revokeRPG) {
        options.revokeRPG(xpToRevoke, goldToRevoke, hpToRevoke, mpToRevoke, previousTask.priority, previousTask.projectId, options.language);
      }

      extraUpdates = {
        earnedXp: undefined,
        earnedGold: undefined,
        earnedHp: undefined,
        earnedMp: undefined,
        completedAt: undefined,
      };
    }

    setTasks((prev) =>
      deduplicateTasks(
        prev.map((t) => (t.id === taskId ? { ...t, ...updates, ...extraUpdates } : t))
      )
    );

    // If title or description changed, trigger AI re-evaluation automatically!
    const titleToEval = updates.title !== undefined ? updates.title : previousTask.title;
    const descToEval = updates.description !== undefined ? updates.description : previousTask.description;

    if (
      (updates.title !== undefined && updates.title !== previousTask.title) ||
      (updates.description !== undefined && updates.description !== previousTask.description)
    ) {
      if (titleToEval.trim()) {
        const clientCheck = checkTaskSpamClient(titleToEval);
        
        authedFetch('/api/tasks/evaluate', {
          method: 'POST',
          body: JSON.stringify({ title: titleToEval, description: descToEval }),
        })
          .then((res) => res.json())
          .then((resData) => {
            if (resData.status === 'success' && resData.data) {
              const evalResult = resData.data;
              const validDifficulties: Priority[] = ['low', 'medium', 'high', 'urgent'];
              const newPriority = validDifficulties.includes(evalResult.difficulty as Priority)
                ? (evalResult.difficulty as Priority)
                : validDifficulties.includes(evalResult.suggestedPriority as Priority)
                ? (evalResult.suggestedPriority as Priority)
                : previousTask.priority;

              setTasks((prev) =>
                prev.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        priority: newPriority,
                        aiDifficulty: newPriority,
                        isSpam: evalResult.isSpam || clientCheck.isSpam,
                        aiReasoning: evalResult.reasoning || t.aiReasoning,
                      }
                    : t
                )
              );

              if (options?.addLog && newPriority !== previousTask.priority) {
                const pAr: Record<Priority, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة جداً' };
                options.addLog(`🤖 أعاد الذكاء الاصطناعي تقييم صعوبة "${titleToEval}" إلى (${pAr[newPriority]})`, 'xp');
              }
            }
          })
          .catch((err) => console.warn('AI re-evaluation on update error:', err));
      }
    }
  };

  const deleteTask: TasksContextType['deleteTask'] = (taskId, options) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
    if (taskToDelete && options?.addLog) {
      options.addLog(`Quest Cancelled: "${taskToDelete.title}"`, 'damage');
    }
  };

  const skipTaskForToday: TasksContextType['skipTaskForToday'] = (taskId, options) => {
    const taskToSkip = tasks.find((t) => t.id === taskId);
    if (!taskToSkip) return;

    let penaltyXp = 10;
    switch (taskToSkip.priority) {
      case 'urgent': penaltyXp = 40; break;
      case 'high': penaltyXp = 20; break;
      case 'medium': penaltyXp = 10; break;
      case 'low': default: penaltyXp = 5; break;
    }

    const isCurrentlySkipped = taskToSkip.status === 'skipped';

    if (isCurrentlySkipped) {
      // UN-SKIP: restore status back to 'todo'
      playTaskCompletionSound();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'todo' } : t))
      );
      if (options?.addLog) {
        const isAr = options?.language === 'ar';
        const msg = isAr
          ? `تم إلغاء تخطي المهمة لليوم وإعادتها: "${taskToSkip.title}"`
          : `Restored quest from skipped: "${taskToSkip.title}"`;
        options.addLog(msg, 'xp');
      }
    } else {
      // SKIP: set status to 'skipped' and deduct XP penalty
      if (options?.revokeRPG) {
        options.revokeRPG(penaltyXp, 0, 0, 0, taskToSkip.priority, taskToSkip.projectId, options.language);
      }

      playSkipSound();

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'skipped' } : t))
      );

      if (taskToSkip.repeat && taskToSkip.repeat !== 'none') {
        const todayStr = getLocalDateString();
        let baseDate = taskToSkip.dueDate || todayStr;
        let nextDueDate = getNextRepeatDate(baseDate, taskToSkip.repeat);
        while (nextDueDate < todayStr) {
          nextDueDate = getNextRepeatDate(nextDueDate, taskToSkip.repeat);
        }
        const nextTask: Task = {
          id: `task-${Date.now() + 1}`,
          title: taskToSkip.title,
          description: taskToSkip.description,
          status: 'todo',
          priority: taskToSkip.priority,
          projectId: taskToSkip.projectId,
          dueDate: nextDueDate,
          reminder: taskToSkip.reminder,
          repeat: taskToSkip.repeat,
          createdAt: new Date().toISOString(),
        };
        setTimeout(() => {
          setTasks((prev) => {
            const key = nextTask.title.trim().toLowerCase();
            const exists = prev.some(
              (t) =>
                t.title.trim().toLowerCase() === key &&
                t.dueDate === nextDueDate &&
                t.status === 'todo'
            );
            if (exists) return prev;
            return deduplicateTasks([nextTask, ...prev]);
          });
        }, 50);
      }

      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }

      if (options?.addLog) {
        const isAr = options?.language === 'ar';
        const msg = isAr
          ? `تم إلغاء/تخطي المهمة لليوم: "${taskToSkip.title}" (خصم -${penaltyXp} XP)`
          : `Skipped quest for today: "${taskToSkip.title}" (-${penaltyXp} XP Penalty)`;
        options.addLog(msg, 'damage');
      }
    }
  };

  const completeTaskPomodoro: TasksContextType['completeTaskPomodoro'] = (taskId, options) => {
    const focusedTask = tasks.find((t) => t.id === taskId);
    if (!focusedTask) return;
    if (options && options.mp <= 0) {
      options.setShowMpZeroModal(true);
      return;
    }

    playTaskCompletionSound();

    let extraUpdates: Partial<Task> = {};
    if (!focusedTask.isSpam && options?.awardRPG) {
      const rewards = options.awardRPG(focusedTask.priority, focusedTask.projectId, true, options.language, focusedTask.title, focusedTask.description);
      extraUpdates = {
        earnedXp: rewards.xpGain,
        earnedGold: rewards.goldGain,
        earnedHp: rewards.hpChange,
        earnedMp: rewards.mpGain,
        completedAt: getLocalDateString(new Date()),
      };
    } else {
      extraUpdates = {
        earnedXp: 0,
        earnedGold: 0,
        earnedHp: 0,
        earnedMp: 0,
        completedAt: getLocalDateString(new Date()),
      };
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'done',
              ...extraUpdates,
            }
          : t
      )
    );

    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const recordTaskPomodoroTime: TasksContextType['recordTaskPomodoroTime'] = (
    taskId,
    secondsToAdd,
    addLog,
    language = 'ar'
  ) => {
    setTasks((prevTasks) => {
      let newlyUpgradedTask: Task | null = null;

      const nextTasks = prevTasks.map((task) => {
        if (task.id !== taskId) return task;

        const currentSecs = task.pomodoroWorkSeconds || 0;
        const newSecs = currentSecs + secondsToAdd;
        const newMins = Math.floor(newSecs / 60);

        // 3 hours = 10,800 seconds (or 180 minutes)
        const THREE_HOURS_SECS = 10800;
        const isStandardTask = task.priority === 'low' || task.priority === 'medium';
        const exceeds3Hours = newSecs >= THREE_HOURS_SECS;

        if (exceeds3Hours && isStandardTask) {
          const isAr = language === 'ar';
          const reasonMsg = isAr
            ? '🤖 تم إعادة تقييم المهمة وتحديث مستواها تلقائياً إلى "عالي" (High) لتجاوز 3 ساعات عمل في البومودورو.'
            : '🤖 Priority automatically re-evaluated to High level due to exceeding 3 hours of Pomodoro focus.';

          newlyUpgradedTask = {
            ...task,
            pomodoroWorkSeconds: newSecs,
            pomodoroWorkMinutes: newMins,
            priority: 'high',
            aiDifficulty: 'high',
            aiReasoning: reasonMsg,
          };

          return newlyUpgradedTask;
        }

        return {
          ...task,
          pomodoroWorkSeconds: newSecs,
          pomodoroWorkMinutes: newMins,
        };
      });

      if (newlyUpgradedTask) {
        const isAr = language === 'ar';
        const title = (newlyUpgradedTask as Task).title;
        const logMsg = isAr
          ? `⚡ إعادة تقييم الذكاء الاصطناعي: المهمة "${title}" تجاوزت 3 ساعات عمل بومودورو وتم ترفيعها إلى المستوى العالي (High - 40 XP)!`
          : `⚡ AI Re-evaluation: Quest "${title}" passed 3+ hours of Pomodoro focus and was upgraded to High rank (+40 XP)!`;

        if (addLog) {
          addLog(logMsg, 'xp');
        }

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(
              isAr ? '✨ إعادة تقييم المهمة بالذكاء الاصطناعي' : '✨ AI Task Re-evaluated',
              {
                body: isAr
                  ? `المهمة "${title}" تم رفع تقييمها إلى المستوى "عالي" (High) لتجاوز 3 ساعات بومودورو.`
                  : `Task "${title}" priority upgraded to High after 3+ hours of Pomodoro focus.`,
              }
            );
          } catch (e) {}
        }
      }

      return nextTasks;
    });
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        setTasks,
        projects,
        activeTaskId,
        setActiveTaskId,
        pomodoroStats,
        setPomodoroStats,
        incrementPomodoroStats,
        addTask,
        updateTask,
        deleteTask,
        skipTaskForToday,
        completeTaskPomodoro,
        recordTaskPomodoroTime,
        spamFreezeUntil,
        setSpamFreezeUntil,
        showSpamModal,
        setShowSpamModal,
        isAiEvaluating,
        setIsAiEvaluating,
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
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
