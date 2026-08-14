import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, Priority } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { cn, getLocalDateString } from '../lib/utils';

export function CalendarView() {
  const { tasks, projects, selectedProjectId, addTask, updateTask, t, language } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    getLocalDateString()
  );
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names localized
  const monthNames = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Days of week localized
  const daysOfWeek = language === 'ar'
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper for total days in month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  // Helper for starting day of month
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonthDays = getDaysInMonth(year, month - 1);

  // Generate Calendar Grid items
  const calendarCells: { dateString: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, d);
    calendarCells.push({
      dateString: prevMonthDate.toISOString().split('T')[0],
      dayNum: d,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const currentMonthDate = new Date(year, month, d + 1); // offset for timezone safely
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateString,
      dayNum: d,
      isCurrentMonth: true
    });
  }

  // Next month leading days to round to multiples of 7
  const totalCells = Math.ceil(calendarCells.length / 7) * 7;
  const nextMonthLeadingCount = totalCells - calendarCells.length;
  for (let d = 1; d <= nextMonthLeadingCount; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    calendarCells.push({
      dateString: nextMonthDate.toISOString().split('T')[0],
      dayNum: d,
      isCurrentMonth: false
    });
  }

  const navigateMonth = (direction: 'next' | 'prev') => {
    setCurrentDate(new Date(year, direction === 'next' ? month + 1 : month - 1, 1));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask(
      newTaskTitle,
      newTaskPriority,
      selectedProjectId || 'proj-work',
      selectedDateStr
    );
    setNewTaskTitle('');
  };

  const doesTaskRecurOnDate = (task: Task, dateStr: string): boolean => {
    if (!task.dueDate || !task.repeat || task.repeat === 'none') return false;
    if (dateStr < task.dueDate) return false;
    if (dateStr === task.dueDate) return true;

    const baseDate = new Date(task.dueDate + 'T00:00:00');
    const targetDate = new Date(dateStr + 'T00:00:00');

    if (isNaN(baseDate.getTime()) || isNaN(targetDate.getTime())) return false;

    switch (task.repeat) {
      case 'daily':
        return true;
      case 'weekly': {
        const diffTime = targetDate.getTime() - baseDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        return diffDays % 7 === 0;
      }
      case 'monthly': {
        return targetDate.getDate() === baseDate.getDate();
      }
      case 'yearly': {
        return targetDate.getMonth() === baseDate.getMonth() && targetDate.getDate() === baseDate.getDate();
      }
      default:
        return false;
    }
  };

  // Filter tasks by date and optionally project, including projected recurring tasks for future dates
  const getTasksForDate = (dateStr: string) => {
    const directTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const isSameDate = task.dueDate === dateStr;
      const isSameProject = selectedProjectId ? task.projectId === selectedProjectId : true;
      return isSameDate && isSameProject;
    });

    const directTitles = new Set(directTasks.map((t) => t.title.trim().toLowerCase()));

    const projectedTasks: Task[] = [];
    const recurringMap = new Map<string, Task>();

    for (const task of tasks) {
      if (!task.repeat || task.repeat === 'none' || !task.dueDate) continue;
      if (selectedProjectId && task.projectId !== selectedProjectId) continue;
      if (task.dueDate > dateStr) continue;

      const key = task.title.trim().toLowerCase();
      const existing = recurringMap.get(key);
      if (!existing || task.dueDate > existing.dueDate!) {
        recurringMap.set(key, task);
      }
    }

    for (const [titleKey, baseTask] of recurringMap.entries()) {
      if (directTitles.has(titleKey)) continue;

      if (doesTaskRecurOnDate(baseTask, dateStr)) {
        projectedTasks.push({
          ...baseTask,
          id: `projected-${baseTask.id}-${dateStr}`,
          dueDate: dateStr,
          status: 'todo',
        });
      }
    }

    return [...directTasks, ...projectedTasks];
  };

  const toggleTask = (taskId: string, currentStatus: string) => {
    if (taskId.startsWith('projected-')) {
      const parts = taskId.split('-');
      const targetDate = parts.slice(-3).join('-');
      const baseTaskId = parts.slice(1, -3).join('-');
      const baseTask = tasks.find((t) => t.id === baseTaskId);

      if (baseTask) {
        addTask(
          baseTask.title,
          baseTask.priority,
          baseTask.projectId,
          targetDate,
          baseTask.description,
          baseTask.reminder,
          baseTask.repeat
        );
      }
    } else {
      updateTask(taskId, { status: currentStatus === 'done' ? 'todo' : 'done' });
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  // Active day tasks
  const activeDayTasks = getTasksForDate(selectedDateStr);

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row gap-6 sm:gap-8 text-left rtl:text-right"
    >
      {/* Calendar Grid side */}
      <div className="flex-1 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <CalendarIcon className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{t('calendar_title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{t('calendar_subtitle')}</p>
          </div>
          
          <div className="flex items-center justify-between sm:justify-start space-x-2 rtl:space-x-reverse bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-300 transition-all"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <span className="text-xs sm:text-sm font-semibold px-4 text-slate-800 dark:text-slate-200 font-mono min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-300 transition-all"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 py-1 sm:py-2 uppercase tracking-wider font-mono">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell, idx) => {
            const dateTasks = getTasksForDate(cell.dateString);
            const isSelected = selectedDateStr === cell.dateString;
            const isToday = getLocalDateString() === cell.dateString;
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDateStr(cell.dateString)}
                className={cn(
                  "h-14 sm:h-24 p-1 sm:p-2 rounded-xl sm:rounded-2xl border text-left rtl:text-right flex flex-col justify-between transition-all duration-200 relative",
                  cell.isCurrentMonth 
                    ? "bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800" 
                    : "bg-slate-100/30 dark:bg-slate-800/10 border-slate-50 dark:border-slate-800/40 text-slate-400 dark:text-slate-600",
                  isSelected 
                    ? "ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900" 
                    : "hover:bg-slate-100/60 dark:hover:bg-slate-800/55",
                  isToday && !isSelected && "border-indigo-400/80 bg-indigo-50/10 dark:bg-indigo-950/10"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={cn(
                    "text-xs sm:text-sm font-semibold rounded-md w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-mono",
                    isToday ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {cell.dayNum}
                  </span>
                  
                  {dateTasks.length > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 px-1 sm:px-1.5 py-0.5 rounded-full font-mono shrink-0">
                      {dateTasks.length}
                    </span>
                  )}
                </div>

                {/* Desktop mini task lines */}
                <div className="hidden sm:block space-y-1 mt-2 w-full overflow-hidden">
                  {dateTasks.slice(0, 2).map((task) => {
                    const isPast = cell.dateString < getLocalDateString();
                    const isFailed = isPast && task.status !== 'done';
                    return (
                      <div 
                        key={task.id} 
                        className={cn(
                          "text-[9px] truncate px-1 py-0.5 rounded font-medium flex items-center space-x-1 rtl:space-x-reverse border",
                          task.status === 'done' 
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60 line-through" 
                            : isFailed
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 line-through"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isFailed ? "bg-red-500" : getPriorityColor(task.priority))} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    );
                  })}
                  {dateTasks.length > 2 && (
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 text-center font-mono font-bold">
                      +{dateTasks.length - 2} {language === 'ar' ? 'أخرى' : 'more'}
                    </div>
                  )}
                </div>

                {/* Mobile tiny task dots */}
                <div className="flex sm:hidden space-x-0.5 mt-1 justify-center w-full">
                  {dateTasks.slice(0, 3).map((task) => {
                    const isPast = cell.dateString < getLocalDateString();
                    const isFailed = isPast && task.status !== 'done';
                    return (
                      <span 
                        key={task.id}
                        className={cn(
                          "w-1 h-1 rounded-full shrink-0",
                          task.status === 'done' ? "bg-emerald-500" : isFailed ? "bg-red-500" : getPriorityColor(task.priority)
                        )}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Details & Creator Pane */}
      <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 flex flex-col shrink-0">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-slate-800 dark:text-slate-200 mb-6">
          <CalendarIcon className="w-5 h-5 text-indigo-600 shrink-0" />
          <h2 className="font-bold text-lg font-mono">
            {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
        </div>

        {/* Task Creator */}
        <form onSubmit={handleAddTask} className="mb-6 space-y-3">
          <input
            type="text"
            placeholder={language === 'ar' ? 'أضف مهمة لهذا اليوم...' : 'Add a task for this day...'}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 text-slate-700 dark:text-slate-100 font-medium"
          />
          <div className="flex justify-between items-center gap-2">
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="low">{language === 'ar' ? 'ثانوية' : 'Priority: Low'}</option>
              <option value="medium">{language === 'ar' ? 'متوسطة' : 'Priority: Medium'}</option>
              <option value="high">{language === 'ar' ? 'ملحمية' : 'Priority: High'}</option>
              <option value="urgent">{language === 'ar' ? 'زعيم' : 'Priority: Urgent'}</option>
            </select>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all shrink-0"
            >
              {language === 'ar' ? 'إضافة' : 'Add Task'}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-200/60 dark:border-slate-700/60 my-4" />

        {/* Day's Tasks list */}
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-3">
          {language === 'ar' ? 'المهام المقررة لهذا اليوم' : 'Tasks for this day'}
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {activeDayTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              {t('no_quests_this_day')}
            </div>
          ) : (
            activeDayTasks.map((task) => {
              const isPastDay = selectedDateStr < getLocalDateString();
              const isFailed = isPastDay && task.status !== 'done';

              return (
                <div 
                  key={task.id}
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between space-x-3 rtl:space-x-reverse bg-white dark:bg-slate-900 transition-all",
                    task.status === 'done' 
                      ? "opacity-60 border-slate-100 dark:border-slate-800" 
                      : isFailed
                      ? "border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700/60 shadow-sm"
                  )}
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                    <button 
                      onClick={() => toggleTask(task.id, task.status)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isFailed || task.status === 'skipped' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <span className={cn(
                      "text-xs font-semibold text-slate-700 dark:text-slate-200 truncate",
                      (task.status === 'done' || isFailed) && "line-through text-slate-400 dark:text-slate-500"
                    )}>
                      {task.title}
                    </span>
                  </div>

                  {isFailed && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 shrink-0 font-mono">
                      {task.status === 'skipped' ? (language === 'ar' ? 'ملغية' : 'Skipped') : (language === 'ar' ? 'فشلت (غير منجزة)' : 'Failed')}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
