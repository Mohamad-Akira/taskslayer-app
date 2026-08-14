import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, Status, Priority } from '../types';
import { Plus, ArrowRight, ArrowLeft, Play, CheckCircle, Trash2, Calendar as CalendarIcon, Tag, XCircle, Kanban } from 'lucide-react';
import { cn, getLocalDateString } from '../lib/utils';

export function KanbanView() {
  const {
    tasks,
    projects,
    selectedProjectId,
    addTask,
    updateTask,
    deleteTask,
    skipTaskForToday,
    setActiveTaskId,
    activeTaskId,
    t,
    language
  } = useApp();

  const [addingToStatus, setAddingToStatus] = useState<Status | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  // Filter tasks based on project
  const filteredTasks = selectedProjectId
    ? tasks.filter(t => t.projectId === selectedProjectId)
    : tasks;

  const columns: { id: Status; title: string; color: string; border: string; bg: string }[] = [
    { id: 'todo', title: t('todo'), color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-800', bg: 'bg-slate-50 dark:bg-slate-900/40' },
    { id: 'in_progress', title: t('in_progress'), color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40', border: 'border-indigo-100 dark:border-indigo-900', bg: 'bg-indigo-50/10 dark:bg-indigo-950/5' },
    { id: 'done', title: t('done'), color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40', border: 'border-emerald-100 dark:border-emerald-900', bg: 'bg-emerald-50/10 dark:bg-emerald-950/5' },
  ];

  const handleAddTask = (status: Status) => {
    if (!newTitle.trim()) return;
    const project = selectedProjectId || 'proj-work';
    // We add task, then update its status to the column status
    addTask(newTitle, newPriority, project, getLocalDateString());
    // Find the latest task added and update its status
    setNewTitle('');
    setAddingToStatus(null);
  };

  const moveTask = (taskId: string, currentStatus: Status, direction: 'forward' | 'backward') => {
    let nextStatus: Status;
    if (direction === 'forward') {
      nextStatus = currentStatus === 'todo' ? 'in_progress' : 'done';
    } else {
      nextStatus = currentStatus === 'done' ? 'in_progress' : 'todo';
    }
    updateTask(taskId, { status: nextStatus });
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900';
      case 'medium': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700';
    }
  };

  return (
    <div 
      className="flex-1 overflow-x-auto p-4 sm:p-8 bg-slate-50 dark:bg-slate-950"
    >
      <div className="max-w-6xl mx-auto h-full flex flex-col text-left rtl:text-right">
        {/* Kanban Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Kanban className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{t('kanban_title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedProjectId 
                ? `${t('kanban_project_tasks')}${projects.find(p => p.id === selectedProjectId)?.id === 'proj-work' ? t('work') : projects.find(p => p.id === selectedProjectId)?.id === 'proj-personal' ? t('personal') : projects.find(p => p.id === selectedProjectId)?.id === 'proj-study' ? t('study') : projects.find(p => p.id === selectedProjectId)?.name}` 
                : t('kanban_all_tasks')}
            </p>
          </div>
        </div>

        {/* Board Columns Grid */}
        <div className="flex lg:grid lg:grid-cols-3 gap-4 sm:gap-6 flex-1 items-start overflow-x-auto pb-4 snap-x snap-mandatory lg:overflow-x-visible">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter(t => 
              t.status === column.id || (column.id === 'todo' && t.status === 'skipped')
            );
            return (
              <div 
                key={column.id} 
                className={cn(
                  "flex flex-col rounded-2xl border p-4 h-[calc(100vh-220px)] w-[85vw] sm:w-[320px] lg:w-auto shrink-0 snap-center lg:snap-align-none", 
                  column.bg, 
                  column.border
                )}
              >
                {/* Column Title */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono", column.color)}>
                      {column.title}
                    </span>
                    <span className="text-sm text-slate-400 dark:text-slate-500 font-bold font-mono">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => setAddingToStatus(column.id)}
                    className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Inline Quick Add Task Form */}
                {addingToStatus === column.id && (
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm mb-4 space-y-3 animate-fade-in">
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'عنوان المهمة...' : 'Task Title...'}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-sm font-medium border-0 bg-transparent focus:ring-0 p-0 text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <span>🤖</span>
                        <span>{language === 'ar' ? 'تقييم AI تلقائي' : 'Auto AI Rating'}</span>
                      </span>
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => setAddingToStatus(null)}
                          className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={() => {
                            addTask(newTitle, 'medium', selectedProjectId || 'proj-work', getLocalDateString());
                            setNewTitle('');
                            setAddingToStatus(null);
                          }}
                          className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-[0_0_12px_rgba(99,102,241,0.4)] hover:shadow-[0_0_16px_rgba(99,102,241,0.6)] transition-all"
                        >
                          {t('add')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Column Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-600">
                      {language === 'ar' ? 'لا توجد مهام هنا' : 'No Tasks Here'}
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const taskProj = projects.find(p => p.id === task.projectId);
                      const isTaskActive = activeTaskId === task.id;
                      return (
                        <div 
                          key={task.id}
                          className={cn(
                            "group p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 relative",
                            task.status === 'done'
                              ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 opacity-65"
                              : task.status === 'skipped'
                              ? "bg-red-50/20 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/40 opacity-60"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80",
                            isTaskActive && "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={cn(
                              "text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug",
                              task.status === 'done' && "line-through text-slate-400 dark:text-slate-500",
                              task.status === 'skipped' && "line-through text-red-500/80 dark:text-red-400/80"
                            )}>
                              {task.title}
                            </h3>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-red-500 p-1 rounded transition-all shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Task Badges & Actions */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-1.5 rtl:space-x-reverse flex-wrap gap-y-1">
                              {task.status === 'skipped' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-300 dark:border-red-800 bg-red-100/80 dark:bg-red-950/70 text-red-600 dark:text-red-400 font-bold font-mono shrink-0">
                                  {language === 'ar' ? 'ملغية لليوم' : 'Skipped'}
                                </span>
                              )}
                              <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold tracking-tight shrink-0", getPriorityBadge(task.priority))}>
                                {task.priority === 'urgent' && `🏆 ${language === 'ar' ? 'زعيم' : 'BOSS'}`}
                                {task.priority === 'high' && `⚔️ ${language === 'ar' ? 'ملحمية' : 'EPIC'}`}
                                {task.priority === 'medium' && `🛡️ ${language === 'ar' ? 'مهمة' : 'QUEST'}`}
                                {task.priority === 'low' && `☘️ ${language === 'ar' ? 'ثانوية' : 'MINOR'}`}
                              </span>
                              <span className={cn(
                                "text-[9px] px-1 py-0.5 rounded border font-bold font-mono shrink-0",
                                task.priority === 'urgent' && "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
                                task.priority === 'high' && "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
                                task.priority === 'medium' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                                task.priority === 'low' && "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
                              )}>
                                {task.priority === 'urgent' && `+80 XP | -25 HP`}
                                {task.priority === 'high' && `+40 XP | -15 HP`}
                                {task.priority === 'medium' && `+20 XP | +5 HP`}
                                {task.priority === 'low' && `+10 XP | +10 HP`}
                              </span>
                              {taskProj && (
                                <span className={cn("w-2 h-2 rounded-full shrink-0", taskProj.color)} title={taskProj.id === 'proj-work' ? t('work') : taskProj.id === 'proj-personal' ? t('personal') : taskProj.id === 'proj-study' ? t('study') : taskProj.name} />
                              )}
                            </div>

                            {/* Column Transition Controls */}
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              {task.status !== 'todo' && (
                                <button
                                  onClick={() => moveTask(task.id, task.status, 'backward')}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                  title={language === 'ar' ? 'نقل للخلف' : 'Move Backward'}
                                >
                                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                                </button>
                              )}
                              
                              {task.status !== 'done' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    skipTaskForToday(task.id);
                                  }}
                                  className={cn(
                                    "p-1 rounded transition-colors",
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
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {task.status !== 'done' && (
                                <button
                                  onClick={() => setActiveTaskId(task.id)}
                                  className={cn(
                                    "p-1 rounded transition-colors",
                                    isTaskActive 
                                      ? "bg-indigo-50 dark:bg-indigo-950/55 text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse" 
                                      : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  )}
                                  title={language === 'ar' ? 'تركيز بومودورو' : 'Focus with Pomodoro'}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}

                              {task.status !== 'done' ? (
                                <button
                                  onClick={() => moveTask(task.id, task.status, 'forward')}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                  title={language === 'ar' ? 'نقل للأمام' : 'Move Forward'}
                                >
                                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                                </button>
                              ) : (
                                <span className="text-emerald-500 p-1 shrink-0">
                                  <CheckCircle className="w-4 h-4 fill-emerald-50 dark:fill-emerald-950/20" />
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {task.dueDate && (
                            <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                              <CalendarIcon className="w-3 h-3 mr-1 ml-1 shrink-0" />
                              <span>{task.dueDate}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
