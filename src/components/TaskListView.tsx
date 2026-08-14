import React, { useState } from 'react';
import { Plus, Circle, CheckCircle2, Calendar as CalendarIcon, Tag, Play, CheckCircle, Trash2, Edit, Bell, Folder, X, XCircle, Clock, Save, FileText, ChevronDown, ChevronUp, ChevronRight, RotateCcw, GripVertical, ArrowUpDown, Check, SlidersHorizontal, Layers, Sparkles, Bot, Inbox, CheckSquare, Briefcase, Heart, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTasks } from '../context/TasksContext';
import { useSettings } from '../context/SettingsContext';
import { CompactHeroStats } from './CompactHeroStats';
import { AiEvaluationIndicator } from './AiEvaluationIndicator';
import { Task, Priority } from '../types';
import { cn, getLocalDateString, formatDurationHours, formatTaskDateLabel } from '../lib/utils';
import { authedFetch } from '../lib/firebase';

type SortBy = 'custom' | 'name' | 'date' | 'priority';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'project' | 'priority' | 'date';

interface WorkDurationSelectorProps {
  hasDuration: boolean;
  onToggleDuration: (enabled: boolean) => void;
  hours: number;
  onChangeHours: (hours: number) => void;
  language: string;
}

function WorkDurationSelector({
  hasDuration,
  onToggleDuration,
  hours,
  onChangeHours,
  language,
}: WorkDurationSelectorProps) {
  const isAr = language === 'ar';

  return (
    <div
      className={cn(
        "space-y-3.5 p-4 rounded-2xl border transition-all duration-300",
        hasDuration
          ? "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-900 border-indigo-500/30 shadow-sm"
          : "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800"
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-2 rounded-xl transition-colors shrink-0",
            hasDuration
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          )}>
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono tracking-wide">
                {isAr ? 'مدة العمل المتوقعة' : 'Expected Work Duration'}
              </span>
              {hasDuration && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-fade-in">
                  ⏱️ {formatDurationHours(hours, language)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {hasDuration
                ? (isAr ? 'تخمين الوقت المحدد للمهمة' : 'Duration estimate is active')
                : (isAr ? 'مهمة مفتوحة بدون حد زمني' : 'Open-ended task with no timer')}
            </p>
          </div>
        </div>

        {/* Custom iOS-style Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={hasDuration}
          onClick={() => onToggleDuration(!hasDuration)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
            hasDuration ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[11px]",
              hasDuration
                ? (isAr ? "-translate-x-5" : "translate-x-5")
                : "translate-x-0"
            )}
          >
            {hasDuration ? '⏱️' : '♾️'}
          </span>
        </button>
      </div>

      {/* Expanded Controls when Duration is Active */}
      {hasDuration ? (
        <div className="space-y-3 pt-2 border-t border-indigo-100 dark:border-indigo-950/50 animate-fade-in">
          {/* Range Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              <span className="text-[11px] text-slate-400">{isAr ? 'تعديل الساعات:' : 'Adjust hours:'}</span>
              <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                {formatDurationHours(hours, language)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15"
              step="0.5"
              value={hours}
              onChange={(e) => onChangeHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold px-0.5">
              <span>{isAr ? '30 دقيقة' : '30 mins'}</span>
              <span>{isAr ? '5 ساعات' : '5 hrs'}</span>
              <span>{isAr ? '10 ساعات' : '10 hrs'}</span>
              <span>{isAr ? '15 ساعة' : '15 hrs'}</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-semibold me-1">{isAr ? 'اختيار سريع:' : 'Quick:'}</span>
            {[0.5, 1, 2, 3, 5, 8, 12, 15].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onChangeHours(h)}
                className={cn(
                  "text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                  hours === h
                    ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500 shadow-sm scale-105"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
              >
                {formatDurationHours(h, language)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
          <span className="text-[11px] italic">
            {isAr ? 'المهمة لن تستهلك وقتا متوقعا محدد.' : 'Task has no target time estimate.'}
          </span>
          <button
            type="button"
            onClick={() => {
              onToggleDuration(true);
              if (!hours) onChangeHours(1);
            }}
            className="text-[11px] font-bold font-mono text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>+</span>
            <span>{isAr ? 'تحديد مدة عمل' : 'Set Duration'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskListView() {
  const {
    tasks,
    projects,
    currentView,
    selectedProjectId,
    addTask,
    updateTask,
    deleteTask,
    skipTaskForToday,
    activeTaskId,
    setActiveTaskId,
    t,
    language,
  } = useApp();

  const { setTasks } = useTasks();

  // Basic task title state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Advanced task options states
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority | 'auto'>('auto');
  const [newTaskProjectId, setNewTaskProjectId] = useState('proj-work');
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => getLocalDateString());
  const [newTaskReminder, setNewTaskReminder] = useState('none');
  const [newTaskRepeat, setNewTaskRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskHours, setNewTaskHours] = useState<number>(1);
  const [hasNewTaskHours, setHasNewTaskHours] = useState<boolean>(false);

  // Edit Task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editProjectId, setEditProjectId] = useState('proj-work');
  const [editDueDate, setEditDueDate] = useState('');
  const [editReminder, setEditReminder] = useState('none');
  const [editRepeat, setEditRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [editHours, setEditHours] = useState<number>(1);
  const [hasEditHours, setHasEditHours] = useState<boolean>(false);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);

  const handleAiReevaluate = async () => {
    if (!editTitle.trim()) return;
    setIsEvaluatingAi(true);
    try {
      const res = await authedFetch('/api/tasks/evaluate', {
        method: 'POST',
        body: JSON.stringify({ title: editTitle, description: editDescription, priority: editPriority, estimatedHours: hasEditHours ? editHours : undefined }),
      });
      const resData = await res.json();
      if (resData.status === 'success' && resData.data) {
        const evalResult = resData.data;
        const validDifficulties: Priority[] = ['low', 'medium', 'high', 'urgent'];
        if (validDifficulties.includes(evalResult.difficulty as Priority)) {
          setEditPriority(evalResult.difficulty as Priority);
        }
        if (editingTask) {
          updateTask(editingTask.id, {
            priority: (validDifficulties.includes(evalResult.difficulty as Priority) ? evalResult.difficulty : editPriority) as Priority,
            isSpam: evalResult.isSpam,
            aiReasoning: evalResult.reasoning,
            aiDifficulty: evalResult.difficulty as Priority,
          });
        }
      }
    } catch (err) {
      console.error('AI Re-evaluation failed:', err);
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  // Overdue section collapse state
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(true);

  // Sorting & Grouping State per View (Inbox, Today, Projects) with cloud & localStorage persistence
  const { viewSortSettings, setViewSortSettings } = useSettings();

  const activeViewKey = selectedProjectId || currentView;

  const currentSortSettings = viewSortSettings[activeViewKey] || viewSortSettings['global'] || {
    sortBy: 'custom',
    sortOrder: 'asc',
    groupBy: 'none',
  };

  const sortBy = currentSortSettings.sortBy as SortBy;
  const sortOrder = currentSortSettings.sortOrder as SortOrder;
  const groupBy = currentSortSettings.groupBy as GroupBy;

  const updateSortSettings = (
    updater: (current: { sortBy: SortBy; sortOrder: SortOrder; groupBy: GroupBy }) => {
      sortBy: SortBy;
      sortOrder: SortOrder;
      groupBy: GroupBy;
    }
  ) => {
    setViewSortSettings((prev) => {
      const current = prev[activeViewKey] || prev['global'] || { sortBy: 'custom', sortOrder: 'asc', groupBy: 'none' };
      const updated = updater(current);
      return {
        ...prev,
        [activeViewKey]: updated,
        global: updated,
      };
    });
  };

  const setSortBy = (newSortBy: SortBy) => {
    updateSortSettings((curr) => ({ ...curr, sortBy: newSortBy }));
  };

  const setSortOrder = (newSortOrder: SortOrder) => {
    updateSortSettings((curr) => ({ ...curr, sortOrder: newSortOrder }));
  };

  const setGroupBy = (newGroupBy: GroupBy) => {
    updateSortSettings((curr) => ({ ...curr, groupBy: newGroupBy }));
  };

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const todayStr = getLocalDateString();

  // Filter tasks based on view & selected project
  const filteredTasks = tasks.filter((task) => {
    // If we've selected a project from the sidebar
    if (selectedProjectId) {
      return task.projectId === selectedProjectId;
    }
    // If we are on the 'Today' view
    if (currentView === 'today') {
      return (
        task.dueDate === todayStr ||
        !task.dueDate ||
        (task.dueDate ? task.dueDate < todayStr && task.status === 'todo' : false)
      );
    }
    // Default 'Inbox' view shows all
    return true;
  });

  const overdueTasks = filteredTasks.filter(
    (task) => task.dueDate && task.dueDate < todayStr && task.status === 'todo'
  );

  const regularTasks = filteredTasks.filter(
    (task) => !(task.dueDate && task.dueDate < todayStr && task.status === 'todo')
  );

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, taskId: string) => {
    if (dragOverTaskId === taskId) {
      setDragOverTaskId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    setTasks((prevTasks) => {
      const sourceIndex = prevTasks.findIndex((t) => t.id === draggedTaskId);
      const targetIndex = prevTasks.findIndex((t) => t.id === targetTaskId);

      if (sourceIndex === -1 || targetIndex === -1) return prevTasks;

      const updated = [...prevTasks];
      const [movedTask] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedTask);
      return updated;
    });

    if (sortBy !== 'custom') {
      setSortBy('custom');
    }

    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // Sorting Helper
  const sortTaskList = (taskList: Task[]) => {
    if (sortBy === 'custom') return taskList;

    const pRank: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

    return [...taskList].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.title.localeCompare(b.title, language === 'ar' ? 'ar' : 'en', { sensitivity: 'base' });
      } else if (sortBy === 'date') {
        const dateA = a.dueDate || (sortOrder === 'asc' ? '9999-99-99' : '0000-00-00');
        const dateB = b.dueDate || (sortOrder === 'asc' ? '9999-99-99' : '0000-00-00');
        cmp = dateA.localeCompare(dateB);
      } else if (sortBy === 'priority') {
        cmp = (pRank[a.priority] || 0) - (pRank[b.priority] || 0);
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });
  };

  const processedOverdueTasks = sortTaskList(overdueTasks);
  const processedRegularTasks = sortTaskList(regularTasks);

  const getOverdueBadgeLabel = (dueDateStr: string) => {
    const due = new Date(dueDateStr + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      return language === 'ar' ? 'الأمس' : 'Yesterday';
    } else if (diffDays > 1) {
      return language === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    }
    return dueDateStr;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const initialPriority: Priority = newTaskPriority === 'auto' ? 'medium' : newTaskPriority;

    addTask(
      newTaskTitle,
      initialPriority,
      newTaskProjectId || selectedProjectId || 'proj-work',
      newTaskDueDate || undefined,
      newTaskDescription || undefined,
      newTaskReminder !== 'none' ? newTaskReminder : undefined,
      newTaskRepeat !== 'none' ? newTaskRepeat : undefined,
      hasNewTaskHours ? newTaskHours : undefined
    );

    // Reset states
    setNewTaskTitle('');
    setNewTaskPriority('auto');
    setNewTaskDescription('');
    setNewTaskReminder('none');
    setNewTaskRepeat('none');
    setNewTaskHours(1);
    setHasNewTaskHours(false);
    // Keep standard due date as today
    setNewTaskDueDate(getLocalDateString());
    setIsExpanded(false);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditProjectId(task.projectId || 'proj-work');
    setEditDueDate(task.dueDate || getLocalDateString());
    setEditReminder(task.reminder || 'none');
    setEditRepeat(task.repeat || 'none');
    if (task.estimatedHours && task.estimatedHours > 0) {
      setHasEditHours(true);
      setEditHours(task.estimatedHours);
    } else {
      setHasEditHours(false);
      setEditHours(1);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    updateTask(editingTask.id, {
      title: editTitle,
      description: editDescription || undefined,
      priority: editPriority,
      projectId: editProjectId,
      dueDate: editDueDate || undefined,
      reminder: editReminder !== 'none' ? editReminder : undefined,
      repeat: editRepeat !== 'none' ? editRepeat : undefined,
      estimatedHours: hasEditHours ? editHours : undefined,
    });

    setEditingTask(null);
  };

  const toggleTask = (taskId: string, currentStatus: string) => {
    updateTask(taskId, { status: currentStatus === 'done' ? 'todo' : 'done' });
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      case 'high': return 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';
      case 'medium': return 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      default: return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
    }
  };

  const getReminderLabel = (val: string) => {
    if (!val || val === 'none') return '';
    const isAr = language === 'ar';
    switch (val) {
      case 'at_time': return isAr ? 'في وقت المهمة' : 'At time of quest';
      case '15m': return isAr ? 'قبل ١٥ دقيقة' : '15 mins before';
      case '30m': return isAr ? 'قبل ٣٠ دقيقة' : '30 mins before';
      case '1h': return isAr ? 'قبل ساعة واحدة' : '1 hour before';
      case '9am': return isAr ? 'التذكير اليومي 9:00 ص' : 'Daily reminder 9:00 AM';
      case '12pm': return isAr ? 'التذكير اليومي 12:00 م' : 'Daily reminder 12:00 PM';
      case '6pm': return isAr ? 'التذكير اليومي 6:00 م' : 'Daily reminder 6:00 PM';
      default: return val;
    }
  };

  const getRepeatLabel = (val?: string) => {
    if (!val || val === 'none') return '';
    const isAr = language === 'ar';
    switch (val) {
      case 'daily': return isAr ? 'تكرار يومي' : 'Daily repeat';
      case 'weekly': return isAr ? 'تكرار أسبوعي' : 'Weekly repeat';
      case 'monthly': return isAr ? 'تكرار شهري' : 'Monthly repeat';
      case 'yearly': return isAr ? 'تكرار سنوي' : 'Yearly repeat';
      default: return val;
    }
  };

  const getProjectName = (id: string, name: string) => {
    if (id === 'proj-work') return t('work');
    if (id === 'proj-personal') return t('personal');
    if (id === 'proj-study') return t('study');
    return name;
  };

  const renderTaskCard = (task: Task, isOverdue: boolean = false) => {
    const taskProj = projects.find((p) => p.id === task.projectId);
    const isTaskActive = activeTaskId === task.id;
    const isBeingDragged = draggedTaskId === task.id;
    const isBeingDraggedOver = dragOverTaskId === task.id;

    return (
      <div 
        key={task.id}
        onDragOver={(e) => handleDragOver(e, task.id)}
        onDragLeave={(e) => handleDragLeave(e, task.id)}
        onDrop={(e) => handleDrop(e, task.id)}
        className={cn(
          "group p-3.5 sm:p-4 border rounded-2xl transition-all duration-200 relative space-y-3",
          task.status === 'done' 
            ? "bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-65" 
            : task.status === 'skipped'
            ? "bg-red-50/20 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/40 opacity-60"
            : isOverdue
            ? "bg-red-50/20 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 shadow-sm hover:shadow-md"
            : "bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 hover:shadow-md",
          isTaskActive && "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900",
          isBeingDragged && "opacity-40 border-dashed border-indigo-400 dark:border-indigo-500 scale-[0.99]",
          isBeingDraggedOver && "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/50 shadow-lg"
        )}
      >
        {/* Top Header Row: Date & Project Category + Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/80 dark:border-slate-800/60 pb-2">
          {/* Metadata Badges: Date & Category ONLY */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            {/* TaskSlayer-style Task Date Indicator */}
            {task.dueDate && (() => {
              const dateInfo = formatTaskDateLabel(task.dueDate, language);
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(task);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-bold font-mono px-2 py-0.5 rounded-lg transition-all cursor-pointer select-none border shadow-2xs shrink-0",
                    dateInfo.isOverdue
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/80"
                      : dateInfo.isToday
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/80"
                      : dateInfo.isTomorrow
                      ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80"
                      : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                  title={language === 'ar' ? 'تاريخ المهمة (انقر للتعديل)' : 'Task Date (Click to edit)'}
                >
                  {task.repeat && task.repeat !== 'none' && (
                    <RotateCcw className="w-3 h-3 text-current opacity-80 shrink-0" />
                  )}
                  <span>{dateInfo.label}</span>
                </button>
              );
            })()}

            {/* Category / Project Badge */}
            {taskProj && (() => {
              const projName = getProjectName(taskProj.id, taskProj.name);
              let colorClasses = "text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60";
              
              if (taskProj.id === 'proj-work' || projName === 'العمل' || projName.toLowerCase() === 'work') {
                colorClasses = "text-purple-700 dark:text-purple-300 bg-purple-50/90 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-800/60";
              } else if (taskProj.id === 'proj-personal' || projName === 'الشخصي' || projName.toLowerCase() === 'personal') {
                colorClasses = "text-orange-700 dark:text-orange-300 bg-orange-50/90 dark:bg-orange-950/50 border-orange-200/80 dark:border-orange-800/60";
              } else if (taskProj.id === 'proj-study' || projName === 'الدراسة' || projName.toLowerCase() === 'study') {
                colorClasses = "text-amber-700 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/60";
              }

              return (
                <span className={cn(
                  "flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-lg border shadow-2xs select-none shrink-0",
                  colorClasses
                )}>
                  <Folder className="w-3 h-3 text-current opacity-70 shrink-0" />
                  <span>{projName}</span>
                </span>
              );
            })()}
          </div>

          {/* Action Icons Toolbar */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
            {task.status !== 'done' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skipTaskForToday(task.id);
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  task.status === 'skipped'
                    ? "text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm"
                    : "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                )}
                title={
                  task.status === 'skipped'
                    ? (language === 'ar' ? 'إلغاء التخطي وإعادة المهمة' : 'Restore Task (Undo Skip)')
                    : (language === 'ar'
                        ? `إلغاء المهمة لليوم (خصم -${task.priority === 'urgent' ? 40 : task.priority === 'high' ? 20 : task.priority === 'medium' ? 10 : 5} XP)`
                        : `Skip quest for today (-${task.priority === 'urgent' ? 40 : task.priority === 'high' ? 20 : task.priority === 'medium' ? 10 : 5} XP)`)
                }
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => handleOpenEditModal(task)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              title={t('edit')}
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
              title={t('delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Main Row: Drag Handle + Checkbox + Full Width Task Title & Description */}
        <div className="flex items-start gap-2.5 min-w-0 w-full pt-1">
          {/* Drag Handle */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors opacity-50 group-hover:opacity-100 flex items-center justify-center shrink-0 mt-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700/60"
            title={language === 'ar' ? 'اسحب لتغيير الترتيب' : 'Drag to reorder'}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Checkbox Button */}
          <button 
            onClick={() => {
              if (task.status === 'skipped') {
                skipTaskForToday(task.id);
              } else {
                toggleTask(task.id, task.status);
              }
            }}
            className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors mt-0.5"
            title={
              task.status === 'skipped'
                ? (language === 'ar' ? 'إلغاء التخطي وإعادة المهمة' : 'Restore Task')
                : (language === 'ar' ? 'إكمال المهمة' : 'Complete Task')
            }
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 animate-fade-in" />
            ) : task.status === 'skipped' ? (
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 dark:text-red-400 animate-fade-in" />
            ) : (
              <Circle className={cn("w-5 h-5 sm:w-6 sm:h-6 hover:scale-105 transition-transform", isOverdue && "text-red-400 dark:text-red-500")} />
            )}
          </button>
          
          {/* Task Title & Description - Full Width */}
          <div className="flex-1 min-w-0 text-left rtl:text-right">
            <h3 className={cn(
              "text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg tracking-tight leading-snug break-words [word-break:break-word] min-w-0",
              task.status === 'done' && "line-through text-slate-400 dark:text-slate-500 font-normal",
              task.status === 'skipped' && "line-through text-red-500/80 dark:text-red-400/80 font-normal"
            )}>
              {task.title}
            </h3>

            {task.description && (
              <p className={cn(
                "text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed line-clamp-3 break-words [word-break:break-word]",
                (task.status === 'done' || task.status === 'skipped') && "line-through text-slate-400 dark:text-slate-500"
              )}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Row: Secondary Badges (Priority, XP, Reminder, Repeat, etc.) + Focus CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100/80 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {task.status === 'skipped' && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg border border-red-300 dark:border-red-800 bg-red-100/80 dark:bg-red-950/70 text-red-600 dark:text-red-400 font-bold font-mono shrink-0 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>{language === 'ar' ? 'ملغية لليوم' : 'Skipped Today'}</span>
              </span>
            )}

            <span className={cn("text-[10px] px-2 py-0.5 rounded-lg border font-bold font-mono shrink-0", getPriorityColor(task.priority))}>
              {task.priority === 'urgent' && `🏆 ${t('urgent_short')}`}
              {task.priority === 'high' && `⚔️ ${t('high_short')}`}
              {task.priority === 'medium' && `🛡️ ${t('medium_short')}`}
              {task.priority === 'low' && `☘️ ${t('low_short')}`}
            </span>

            {task.aiReasoning && !task.isSpam && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-lg border bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold font-mono shrink-0 flex items-center gap-1 cursor-help"
                title={`🤖 ${language === 'ar' ? 'سبب تقييم الذكاء الاصطناعي' : 'AI Evaluation Reason'}: ${task.aiReasoning}`}
              >
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>{language === 'ar' ? 'تقييم AI' : 'AI Evaluated'}</span>
              </span>
            )}
            
            {task.isSpam ? (
              <span
                className="text-[10px] px-2 py-0.5 rounded-lg font-bold font-mono shrink-0 border bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-help"
                title={task.aiReasoning || (language === 'ar' ? 'هذه المهمة تم تصنيفها كعشوائية ولن تمنح أي نقاط عند الإكمال.' : 'This task was flagged as spam/gibberish and will award no points.')}
              >
                <span>⚠️ {language === 'ar' ? 'مهمة غير مسجلة للنقاط (0 XP)' : 'Unrewarded Quest (0 XP)'}</span>
              </span>
            ) : (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-lg font-bold font-mono shrink-0 border",
                task.priority === 'urgent' && "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
                task.priority === 'high' && "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
                task.priority === 'medium' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                task.priority === 'low' && "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
              )}>
                {task.priority === 'urgent' && `+80 XP | +40${language === 'ar' ? 'ذ' : 'g'} | -25 HP`}
                {task.priority === 'high' && `+40 XP | +20${language === 'ar' ? 'ذ' : 'g'} | -15 HP`}
                {task.priority === 'medium' && `+20 XP | +10${language === 'ar' ? 'ذ' : 'g'} | +5 HP`}
                {task.priority === 'low' && `+10 XP | +5${language === 'ar' ? 'ذ' : 'g'} | +10 HP`}
              </span>
            )}

            {isOverdue && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTask(task.id, { dueDate: todayStr });
                }}
                className="flex items-center text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/80 px-2 py-0.5 rounded-lg font-bold font-mono border border-amber-200 dark:border-amber-800 transition-colors shrink-0 cursor-pointer"
                title={language === 'ar' ? 'تأجيل هذه المهمة لليوم' : 'Postpone to today'}
              >
                <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 text-amber-500" />
                <span>{language === 'ar' ? 'تأجيل لليوم' : 'Postpone'}</span>
              </button>
            )}

            {task.reminder && task.reminder !== 'none' && (
              <span className="flex items-center text-[10px] text-indigo-500 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-2 py-0.5 border border-indigo-100 dark:border-indigo-900 rounded-lg font-bold font-mono shrink-0">
                <Bell className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                <span>{language === 'ar' ? 'تنبيه:' : 'Alert:'} {getReminderLabel(task.reminder)}</span>
              </span>
            )}

            {task.repeat && task.repeat !== 'none' && (
              <span className="flex items-center text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/40 px-2 py-0.5 border border-purple-200 dark:border-purple-800 rounded-lg font-bold font-mono shrink-0">
                <RotateCcw className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                <span>{getRepeatLabel(task.repeat)}</span>
              </span>
            )}

            {task.estimatedHours && task.estimatedHours > 0 && (
              <span className="flex items-center text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-0.5 border border-indigo-200 dark:border-indigo-800/60 rounded-lg font-bold font-mono shrink-0">
                <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 text-indigo-500" />
                <span>{formatDurationHours(task.estimatedHours, language)}</span>
              </span>
            )}

            {((task.pomodoroWorkSeconds || 0) > 0 || (task.pomodoroWorkMinutes || 0) > 0) && (
              <span className={cn(
                "flex items-center text-[10px] px-2 py-0.5 border rounded-lg font-bold font-mono shrink-0",
                (task.pomodoroWorkSeconds || (task.pomodoroWorkMinutes || 0) * 60) >= 10800
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/20 shadow-xs"
                  : "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
              )}
              title={
                (task.pomodoroWorkSeconds || (task.pomodoroWorkMinutes || 0) * 60) >= 10800
                  ? (language === 'ar' ? 'تجاوزت 3 ساعات عمل بومودورو - تم إعادة التقييم تلقائياً إلى عالي (High)' : 'Exceeded 3+ hrs Pomodoro work - Re-evaluated to High level')
                  : (language === 'ar' ? 'إجمالي وقت العمل في البومودورو' : 'Total Pomodoro Work Time')
              }
              >
                <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1 text-purple-500" />
                <span>
                  ⏱️ {formatDurationHours(((task.pomodoroWorkSeconds || 0) > 0 ? (task.pomodoroWorkSeconds || 0) / 3600 : (task.pomodoroWorkMinutes || 0) / 60), language)}
                  {(task.pomodoroWorkSeconds || (task.pomodoroWorkMinutes || 0) * 60) >= 10800 && (
                    <span className="ml-1 rtl:ml-0 rtl:mr-1 text-purple-600 dark:text-purple-400 font-extrabold">
                      (⚡ High)
                    </span>
                  )}
                </span>
              </span>
            )}
          </div>

          {/* Focus CTA Button */}
          {task.status !== 'done' && task.status !== 'skipped' && (
            <button
              onClick={() => setActiveTaskId(isTaskActive ? null : task.id)}
              className={cn(
                "w-full sm:w-auto px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer",
                isTaskActive 
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 animate-pulse shadow-sm border border-indigo-200 dark:border-indigo-900" 
                  : "bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white border border-slate-200/80 dark:border-slate-600/80"
              )}
              title="Start Pomodoro Session"
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>{isTaskActive ? (language === 'ar' ? 'جاري التركيز' : 'Focusing') : (language === 'ar' ? 'تركيز' : 'Focus')}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 relative"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header with Title and Sort Bar */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left rtl:text-right">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                {selectedProjectId ? (
                  projects.find(p => p.id === selectedProjectId)?.id === 'proj-work' ? (
                    <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  ) : projects.find(p => p.id === selectedProjectId)?.id === 'proj-personal' ? (
                    <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500 dark:text-rose-400 shrink-0" />
                  ) : projects.find(p => p.id === selectedProjectId)?.id === 'proj-study' ? (
                    <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 dark:text-amber-400 shrink-0" />
                  ) : (
                    <Folder className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  )
                ) : currentView === 'today' ? (
                  <CheckSquare className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
                ) : (
                  <Inbox className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
                <span>
                  {selectedProjectId 
                    ? (projects.find(p => p.id === selectedProjectId)?.id === 'proj-work' ? t('work') : projects.find(p => p.id === selectedProjectId)?.id === 'proj-personal' ? t('personal') : projects.find(p => p.id === selectedProjectId)?.id === 'proj-study' ? t('study') : projects.find(p => p.id === selectedProjectId)?.name)
                    : currentView === 'today' ? t('today') : t('inbox')}
                </span>
              </h1>

              {/* AI Evaluation Indicator Badge */}
              <AiEvaluationIndicator language={language} />
            </div>
          </div>

          {/* Sort & Reorder Controls Button */}
          <div className="relative shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer",
                isSortMenuOpen || sortBy !== 'custom'
                  ? "bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                  : "bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80"
              )}
            >
              <ArrowUpDown className="w-4 h-4 text-indigo-500" />
              <span>{language === 'ar' ? 'فرز' : 'Sort'}</span>
              {sortBy !== 'custom' && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isSortMenuOpen && "rotate-180")} />
            </button>

            {/* Sort Popover Menu (Matching Screenshot 2) */}
            {isSortMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsSortMenuOpen(false)} 
                />
                <div className="absolute left-0 rtl:right-0 rtl:left-auto sm:left-auto sm:right-0 sm:rtl:left-0 sm:rtl:right-auto mt-2 w-56 bg-slate-900/95 dark:bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 p-2 z-40 backdrop-blur-md text-xs font-medium space-y-1 animate-fade-in">
                  
                  {/* Sorting Criteria Section */}
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'الفرز حسب' : 'Sort By'}
                  </div>

                  <button
                    onClick={() => { setSortBy('name'); setIsSortMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left rtl:text-right cursor-pointer",
                      sortBy === 'name' ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", sortBy === 'name' ? "bg-indigo-400" : "bg-transparent")} />
                      {language === 'ar' ? 'الاسم (Name)' : 'Name'}
                    </span>
                    {sortBy === 'name' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <button
                    onClick={() => { setSortBy('date'); setIsSortMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left rtl:text-right cursor-pointer",
                      sortBy === 'date' ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", sortBy === 'date' ? "bg-indigo-400" : "bg-transparent")} />
                      {language === 'ar' ? 'التاريخ (Date)' : 'Date'}
                    </span>
                    {sortBy === 'date' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <button
                    onClick={() => { setSortBy('priority'); setIsSortMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left rtl:text-right cursor-pointer",
                      sortBy === 'priority' ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", sortBy === 'priority' ? "bg-indigo-400" : "bg-transparent")} />
                      {language === 'ar' ? 'النوع / الأولوية (Priority)' : 'Type / Priority'}
                    </span>
                    {sortBy === 'priority' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <button
                    onClick={() => { setSortBy('custom'); setIsSortMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left rtl:text-right cursor-pointer",
                      sortBy === 'custom' ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", sortBy === 'custom' ? "bg-indigo-400" : "bg-transparent")} />
                      {language === 'ar' ? 'السحب وإعادة الترتيب (Custom)' : 'Custom (Drag & Drop)'}
                    </span>
                    {sortBy === 'custom' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <hr className="border-slate-800 my-1" />

                  {/* Order direction */}
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'الاتجاه' : 'Direction'}
                  </div>

                  <button
                    onClick={() => { setSortOrder('asc'); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left rtl:text-right cursor-pointer",
                      sortOrder === 'asc' ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", sortOrder === 'asc' ? "bg-indigo-400" : "bg-transparent")} />
                      {language === 'ar' ? 'تصاعدي (Ascending)' : 'Ascending'}
                    </span>
                    {sortOrder === 'asc' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <button
                    onClick={() => { setSortOrder('desc'); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left rtl:text-right cursor-pointer",
                      sortOrder === 'desc' ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800/60 text-slate-300"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", sortOrder === 'desc' ? "bg-indigo-400" : "bg-transparent")} />
                      {language === 'ar' ? 'تنازلي (Descending)' : 'Descending'}
                    </span>
                    {sortOrder === 'desc' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <hr className="border-slate-800 my-1" />

                  {/* Grouping option */}
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'تجميع حسب' : 'Group By'}
                  </div>

                  <div className="grid grid-cols-2 gap-1 p-1">
                    <button
                      onClick={() => setGroupBy('none')}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-center text-[11px] font-bold transition-colors cursor-pointer",
                        groupBy === 'none' ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {language === 'ar' ? 'بدون' : 'None'}
                    </button>
                    <button
                      onClick={() => setGroupBy('priority')}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-center text-[11px] font-bold transition-colors cursor-pointer",
                        groupBy === 'priority' ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {language === 'ar' ? 'الأولوية' : 'Priority'}
                    </button>
                    <button
                      onClick={() => setGroupBy('project')}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-center text-[11px] font-bold transition-colors cursor-pointer",
                        groupBy === 'project' ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {language === 'ar' ? 'المشروع' : 'Project'}
                    </button>
                    <button
                      onClick={() => setGroupBy('date')}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-center text-[11px] font-bold transition-colors cursor-pointer",
                        groupBy === 'date' ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>

        {/* Compact Hero/RPG Profile stats section for Today page */}
        {currentView === 'today' && !selectedProjectId && <CompactHeroStats />}

        {/* Form to Add Task with Advanced parameters */}
        <form onSubmit={handleAddTask} className="mb-6 sm:mb-8 bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm space-y-4">
          <div className="relative flex items-center">
            <Plus className={cn("absolute w-5 h-5 text-slate-400 z-10", language === 'ar' ? "right-4" : "left-4")} />
            <input
              type="text"
              placeholder={t('what_needs_done')}
              value={newTaskTitle}
              onFocus={() => setIsExpanded(true)}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className={cn(
                "w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-100 font-semibold text-sm",
                language === 'ar' ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
              )}
              required
            />
          </div>

          {/* Collapsible advanced options panel */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 animate-fade-in text-slate-600 dark:text-slate-300">
              {/* Description */}
              <div className="md:col-span-2 space-y-1 text-left rtl:text-right">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center space-x-1 rtl:space-x-reverse">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('quest_description')}</span>
                </label>
                <textarea
                  rows={2}
                  placeholder={t('optional_desc')}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-100 font-medium text-left rtl:text-right"
                />
              </div>

              {/* Work Duration Selector */}
              <div className="md:col-span-2">
                <WorkDurationSelector
                  hasDuration={hasNewTaskHours}
                  onToggleDuration={setHasNewTaskHours}
                  hours={newTaskHours}
                  onChangeHours={(h) => {
                    setNewTaskHours(h);
                    setHasNewTaskHours(true);
                  }}
                  language={language}
                />
              </div>

              {/* Category Project Type */}
              <div className="space-y-1 text-left rtl:text-right">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center space-x-1 rtl:space-x-reverse">
                  <Folder className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'ar' ? 'فئة المهمة / المشروع' : 'Task Category / Project'}</span>
                </label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id === 'proj-work' ? t('work') : p.id === 'proj-personal' ? t('personal') : p.id === 'proj-study' ? t('study') : p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty (AI Managed Only) */}
              <div className="space-y-1 text-left rtl:text-right">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span className="flex items-center space-x-1 rtl:space-x-reverse">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('quest_difficulty')}</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-sans font-bold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span>{language === 'ar' ? 'تقييم ذكي حصري' : 'Exclusive AI Eval'}</span>
                  </span>
                </label>
                <div className="w-full px-3 py-2 text-xs bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
                  <Bot className="w-4 h-4 shrink-0 text-indigo-500" />
                  <span>
                    {language === 'ar'
                      ? 'يتم تقييم الصعوبة تلقائياً بواسطة النظام (System)'
                      : 'Difficulty is automatically evaluated by the System'}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1 text-left rtl:text-right">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center space-x-1 rtl:space-x-reverse">
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('due_date')}</span>
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-bold font-mono"
                />
              </div>

              {/* Reminder option */}
              <div className="space-y-1 text-left rtl:text-right">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center space-x-1 rtl:space-x-reverse">
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('alert_reminder')}</span>
                </label>
                <select
                  value={newTaskReminder}
                  onChange={(e) => setNewTaskReminder(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  <option value="none">{language === 'ar' ? 'بدون تذكير' : 'No reminder'}</option>
                  <option value="at_time">{getReminderLabel('at_time')}</option>
                  <option value="15m">{getReminderLabel('15m')}</option>
                  <option value="30m">{getReminderLabel('30m')}</option>
                  <option value="1h">{getReminderLabel('1h')}</option>
                  <option value="9am">{getReminderLabel('9am')}</option>
                  <option value="12pm">{getReminderLabel('12pm')}</option>
                  <option value="6pm">{getReminderLabel('6pm')}</option>
                </select>
              </div>

              {/* Repeat option */}
              <div className="space-y-1 text-left rtl:text-right">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center space-x-1 rtl:space-x-reverse">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'ar' ? 'التكرار' : 'Repeat'}</span>
                </label>
                <select
                  value={newTaskRepeat}
                  onChange={(e) => setNewTaskRepeat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  <option value="none">{language === 'ar' ? 'لا يكرر' : 'No repeat'}</option>
                  <option value="daily">{language === 'ar' ? 'يومياً (Daily)' : 'Daily'}</option>
                  <option value="weekly">{language === 'ar' ? 'أسبوعياً (Weekly)' : 'Weekly'}</option>
                  <option value="monthly">{language === 'ar' ? 'شهرياً (Monthly)' : 'Monthly'}</option>
                  <option value="yearly">{language === 'ar' ? 'سنوياً (Yearly)' : 'Yearly'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Form Actions footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
            {isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs font-mono font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center space-x-1.5 rtl:space-x-reverse"
              >
                <ChevronUp className="w-4 h-4 shrink-0" />
                <span>{language === 'ar' ? 'إخفاء الخيارات' : 'Hide options'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-xs font-mono font-semibold text-slate-400 hover:text-indigo-500 flex items-center space-x-1.5 rtl:space-x-reverse"
              >
                <ChevronDown className="w-4 h-4 shrink-0" />
                <span>{language === 'ar' ? 'إظهار الخيارات المتقدمة' : 'Show advanced options'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isExpanded && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTaskTitle('');
                    setNewTaskDescription('');
                    setIsExpanded(false);
                  }}
                  className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-xl font-semibold transition-all"
                >
                  {language === 'ar' ? 'مسح' : 'Clear'}
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] w-full sm:w-auto text-center"
              >
                {t('add_quest')}
              </button>
            </div>
          </div>
        </form>

        {/* Overdue Section Block */}
        {processedOverdueTasks.length > 0 && (
          <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsOverdueExpanded(!isOverdueExpanded)}
                className="flex items-center space-x-2 rtl:space-x-reverse text-slate-900 dark:text-slate-100 font-bold text-sm sm:text-base hover:opacity-80 transition-opacity cursor-pointer"
              >
                {isOverdueExpanded ? (
                  <ChevronDown className="w-4 h-4 text-red-500" />
                ) : (
                  <ChevronRight className={cn("w-4 h-4 text-red-500", language === 'ar' && "rotate-180")} />
                )}
                <span className="text-red-600 dark:text-red-400 font-bold tracking-tight">
                  {language === 'ar' ? 'متأخرة' : 'Overdue'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-mono font-bold">
                  {processedOverdueTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  processedOverdueTasks.forEach((t) => updateTask(t.id, { dueDate: todayStr }));
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center space-x-1 rtl:space-x-reverse transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تأجيل الكل لليوم' : 'Postpone All'}</span>
              </button>
            </div>

            {isOverdueExpanded && (
              <div className="space-y-3 pt-1">
                {processedOverdueTasks.map((task) => renderTaskCard(task, true))}
              </div>
            )}
          </div>
        )}

        {/* Regular Task List with Grouping Support */}
        <div className="space-y-3">
          {processedRegularTasks.length === 0 && processedOverdueTasks.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">{t('no_active_quests')}</p>
            </div>
          ) : groupBy === 'none' ? (
            processedRegularTasks.map((task) => renderTaskCard(task, false))
          ) : (
            (() => {
              const groups: Record<string, Task[]> = {};
              processedRegularTasks.forEach((task) => {
                let key = 'Other';
                if (groupBy === 'priority') {
                  key = task.priority === 'urgent' ? (language === 'ar' ? '🏆 عاجل جداً' : '🏆 Urgent')
                      : task.priority === 'high' ? (language === 'ar' ? '⚔️ هام' : '⚔️ High')
                      : task.priority === 'medium' ? (language === 'ar' ? '🛡️ متوسط' : '🛡️ Medium')
                      : (language === 'ar' ? '☘️ منخفض' : '☘️ Low');
                } else if (groupBy === 'project') {
                  const proj = projects.find((p) => p.id === task.projectId);
                  key = proj ? getProjectName(proj.id, proj.name) : (language === 'ar' ? 'بدون مشروع' : 'No Project');
                } else if (groupBy === 'date') {
                  key = task.dueDate ? task.dueDate : (language === 'ar' ? 'بدون تاريخ' : 'No Due Date');
                }

                if (!groups[key]) groups[key] = [];
                groups[key].push(task);
              });

              return Object.entries(groups).map(([groupTitle, groupTasks]) => (
                <div key={groupTitle} className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {groupTitle} ({groupTasks.length})
                    </h3>
                  </div>
                  {groupTasks.map((task) => renderTaskCard(task, false))}
                </div>
              ));
            })()
          )}
        </div>
      </div>

      {/* Elegant Edit Task Modal Overlay */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse text-indigo-600">
                <Edit className="w-5 h-5 shrink-0" />
                <h2 className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">
                  {language === 'ar' ? 'تعديل مواصفات المهمة' : 'Modify Quest Specs'}
                </h2>
              </div>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-left rtl:text-right">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 block">
                  {language === 'ar' ? 'اسم المهمة / الطلب' : 'Quest / Task Name'}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 dark:text-slate-100 text-left rtl:text-right"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 block">
                  {t('quest_description')}
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-700 dark:text-slate-200 text-left rtl:text-right"
                  placeholder={t('optional_desc')}
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 block">
                    {language === 'ar' ? 'المشروع (الفئة)' : 'Category (Project)'}
                  </label>
                  <select
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id === 'proj-work' ? t('work') : p.id === 'proj-personal' ? t('personal') : p.id === 'proj-study' ? t('study') : p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 block">
                      {t('quest_difficulty')}
                    </label>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-sans font-bold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>{language === 'ar' ? 'تقييم الذكاء الاصطناعي' : 'AI Rating'}</span>
                    </span>
                  </div>
                  <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {editPriority === 'urgent' && `🏆 ${t('urgent')} (+80 XP)`}
                      {editPriority === 'high' && `⚔️ ${t('high')} (+40 XP)`}
                      {editPriority === 'medium' && `🛡️ ${t('medium')} (+20 XP)`}
                      {editPriority === 'low' && `☘️ ${t('low')} (+10 XP)`}
                    </span>
                    <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                      {language === 'ar' ? '(يتغير أوتوماتيكياً عند تعديل الاسم)' : '(Auto updates on title change)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Due Date, Reminder & Repeat Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 block">
                    {t('due_date')}
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 block">
                    {t('alert_reminder')}
                  </label>
                  <select
                    value={editReminder}
                    onChange={(e) => setEditReminder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    <option value="none">{language === 'ar' ? 'بدون تذكير' : 'No reminder'}</option>
                    <option value="at_time">{getReminderLabel('at_time')}</option>
                    <option value="15m">{getReminderLabel('15m')}</option>
                    <option value="30m">{getReminderLabel('30m')}</option>
                    <option value="1h">{getReminderLabel('1h')}</option>
                    <option value="9am">{getReminderLabel('9am')}</option>
                    <option value="12pm">{getReminderLabel('12pm')}</option>
                    <option value="6pm">{getReminderLabel('6pm')}</option>
                  </select>
                </div>
              </div>

              {/* Work Duration Selector in Edit Modal */}
              <WorkDurationSelector
                hasDuration={hasEditHours}
                onToggleDuration={setHasEditHours}
                hours={editHours}
                onChangeHours={(h) => {
                  setEditHours(h);
                  setHasEditHours(true);
                }}
                language={language}
              />

              {/* Repeat Option */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 block">
                  {language === 'ar' ? 'تكرار المهمة' : 'Task Repeat'}
                </label>
                <select
                  value={editRepeat}
                  onChange={(e) => setEditRepeat(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <option value="none">{language === 'ar' ? 'لا يكرر' : 'No repeat'}</option>
                  <option value="daily">{language === 'ar' ? 'يومياً (Daily)' : 'Daily'}</option>
                  <option value="weekly">{language === 'ar' ? 'أسبوعياً (Weekly)' : 'Weekly'}</option>
                  <option value="monthly">{language === 'ar' ? 'شهرياً (Monthly)' : 'Monthly'}</option>
                  <option value="yearly">{language === 'ar' ? 'سنوياً (Yearly)' : 'Yearly'}</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 rtl:space-x-reverse shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all"
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'ar' ? 'تحديث المواصفات' : 'Update Specs'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
