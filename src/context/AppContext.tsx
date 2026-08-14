import React, { createContext, useContext, useEffect } from 'react';
import { Task, Project, Priority, RPGProfile, ShopItem, GameLog } from '../types';
import { Language } from '../utils/translations';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { sendWebNotification } from '../utils/notifications';

import { SettingsProvider, useSettings } from './SettingsContext';
import { AuthSyncProvider, useAuthSync } from './AuthSyncContext';
import { RPGProvider, useRPG } from './RPGContext';
import { TasksProvider, useTasks } from './TasksContext';

import {
  getMaxHpForLevel,
  getMaxMpForLevel,
  getXpToNextForLevel,
  getHeroClassTitle,
  sanitizeProfile,
  DEFAULT_TASKS,
  DEFAULT_PROFILE,
  DEFAULT_SHOP,
} from '../lib/rpgUtils';

// Re-export utility functions and sub-hooks/providers for modular access across the app
export {
  getMaxHpForLevel,
  getMaxMpForLevel,
  getXpToNextForLevel,
  getHeroClassTitle,
  sanitizeProfile,
};
export { SettingsProvider, useSettings } from './SettingsContext';
export { AuthSyncProvider, useAuthSync } from './AuthSyncContext';
export { RPGProvider, useRPG } from './RPGContext';
export { TasksProvider, useTasks } from './TasksContext';

export interface AppContextType {
  tasks: Task[];
  projects: Project[];
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  addTask: (
    title: string,
    priority?: Priority,
    projectId?: string,
    dueDate?: string,
    description?: string,
    reminder?: string,
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  ) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  skipTaskForToday: (taskId: string) => void;
  completeTaskPomodoro: (taskId: string) => void;
  pomodoroStats: {
    completedSessions: number;
    totalMinutes: number;
    history?: Record<string, { completedSessions: number; totalMinutes: number }>;
  };
  incrementPomodoroStats: (minutes: number) => void;

  // RPG State & Functions
  profile: RPGProfile;
  setProfile: React.Dispatch<React.SetStateAction<RPGProfile>>;
  shopItems: ShopItem[];
  addShopItem: (title: string, cost: number, type: 'gold' | 'mp', description: string, icon: string) => void;
  buyShopItem: (itemId: string) => boolean;
  useEntertainment: (type: 'games' | 'anime') => void;
  gameLogs: GameLog[];
  addLog: (message: string, type: GameLog['type']) => void;
  clearLogs: () => void;
  showMpZeroModal: boolean;
  setShowMpZeroModal: (show: boolean) => void;
  isDead: boolean;
  setIsDead: (dead: boolean) => void;
  deathStats: { goldTax: number; xpLoss: number } | null;
  respawnHero: () => void;
  meditateRest: () => void;

  // Responsive state handlers
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isPomoOpen: boolean;
  setPomoOpen: (open: boolean) => void;

  // Theme & Language State
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Cloud Sync System
  syncKey: string | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  generateSyncKey: () => Promise<string | null>;
  connectSyncKey: (key: string) => Promise<boolean>;
  syncData: (forcePush?: boolean) => Promise<boolean>;
  disconnectSync: () => void;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string;
  updateUserProfile: (name: string, avatar: string) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  // Web Notifications System
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  triggerTodayReminders: () => void;

  // Reset to Defaults
  resetToDefaults: () => void;

  // Delete Account
  deleteAccount: () => Promise<void>;

  // Spam rate limiting
  spamFreezeUntil: number | null;
  setSpamFreezeUntil: React.Dispatch<React.SetStateAction<number | null>>;
  showSpamModal: boolean;
  setShowSpamModal: (show: boolean) => void;

  // Global Pomodoro states
  workDuration: number;
  setWorkDuration: React.Dispatch<React.SetStateAction<number>>;
  breakDuration: number;
  setBreakDuration: React.Dispatch<React.SetStateAction<number>>;
  workTimeLeft: number;
  setWorkTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  workIsRunning: boolean;
  setWorkIsRunning: (running: boolean) => void;
  breakTimeLeft: number;
  setBreakTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  breakIsRunning: boolean;
  setBreakIsRunning: (running: boolean) => void;
  mode: 'work' | 'break';
  setMode: (mode: 'work' | 'break') => void;
  workMaxDuration: number;
  setWorkMaxDuration: React.Dispatch<React.SetStateAction<number>>;
  breakMaxDuration: number;
  setBreakMaxDuration: React.Dispatch<React.SetStateAction<number>>;
}

const CombinedAppContext = createContext<AppContextType | undefined>(undefined);

function MasterAppBridgeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const authSync = useAuthSync();
  const rpg = useRPG();
  const tasks = useTasks();

  // Unified triggerReminders
  const triggerTodayReminders = () => {
    settings.triggerTodayReminders(tasks.tasks);
  };

  // Unified addTask
  const addTask = (
    title: string,
    priority: Priority = 'medium',
    projectId?: string,
    dueDate?: string,
    description?: string,
    reminder?: string,
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    estimatedHours?: number
  ) => {
    tasks.addTask(title, priority, projectId, dueDate, description, reminder, repeat, estimatedHours, {
      selectedProjectId: settings.selectedProjectId,
      addLog: rpg.addLog,
    });
  };

  // Unified updateTask
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    tasks.updateTask(taskId, updates, {
      mp: rpg.profile.mp,
      setShowMpZeroModal: rpg.setShowMpZeroModal,
      awardRPG: rpg.awardRPG,
      revokeRPG: rpg.revokeRPG,
      addLog: rpg.addLog,
      language: settings.language,
    });
  };

  // Unified deleteTask
  const deleteTask = (taskId: string) => {
    tasks.deleteTask(taskId, {
      addLog: rpg.addLog,
    });
  };

  // Unified skipTaskForToday
  const skipTaskForToday = (taskId: string) => {
    tasks.skipTaskForToday(taskId, {
      revokeRPG: rpg.revokeRPG,
      addLog: rpg.addLog,
      language: settings.language,
    });
  };

  // Unified completeTaskPomodoro
  const completeTaskPomodoro = (taskId: string) => {
    tasks.completeTaskPomodoro(taskId, {
      mp: rpg.profile.mp,
      setShowMpZeroModal: rpg.setShowMpZeroModal,
      awardRPG: rpg.awardRPG,
      language: settings.language,
    });
  };

  // Unified syncData
  const syncData = async (_forcePush?: boolean) => {
    return authSync.syncData({
      profile: rpg.profile,
      shopItems: rpg.shopItems,
      gameLogs: rpg.gameLogs,
      pomodoroStats: tasks.pomodoroStats,
      isDead: rpg.isDead,
      deathStats: rpg.deathStats,
      theme: settings.theme,
      language: settings.language,
      notificationsEnabled: settings.notificationsEnabled,
      viewSortSettings: settings.viewSortSettings,
      tasks: tasks.tasks,
    });
  };

  // Unified connectSyncKey
  const connectSyncKey = async (key: string) => {
    return authSync.connectSyncKey(key, {
      setProfile: rpg.setProfile,
      setShopItems: rpg.setShopItems,
      setGameLogs: rpg.setGameLogs,
      setPomodoroStats: tasks.setPomodoroStats,
      setTheme: settings.setTheme,
      setLanguage: settings.setLanguage,
      setIsDead: rpg.setIsDead,
      setDeathStats: rpg.setDeathStats,
      setNotificationsEnabled: settings.setNotificationsEnabled,
      setTasks: tasks.setTasks,
      setViewSortSettings: settings.setViewSortSettings,
      language: settings.language,
    });
  };

  // Unified disconnectSync
  const disconnectSync = () => {
    authSync.disconnectSync(() => {
      tasks.setTasks(DEFAULT_TASKS);
      rpg.setProfile(DEFAULT_PROFILE);
      rpg.setShopItems(DEFAULT_SHOP);
      rpg.setGameLogs([
        { id: '1', message: 'Welcome to your RPG Life Questboard! Level up by completing tasks.', timestamp: new Date().toISOString(), type: 'xp' }
      ]);
      tasks.setPomodoroStats({ completedSessions: 0, totalMinutes: 0 });
      rpg.setIsDead(false);
      rpg.setDeathStats(null);
    });
  };

  // Unified updateUserProfile
  const updateUserProfile = (name: string, avatar: string) => {
    authSync.updateUserProfile(name, avatar, () => {
      syncData();
    });
  };

  // Unified resetToDefaults
  const resetToDefaults = () => {
    tasks.setTasks(DEFAULT_TASKS);
    rpg.setProfile(DEFAULT_PROFILE);
    rpg.setShopItems(DEFAULT_SHOP);
    rpg.setGameLogs([
      { id: '1', message: 'Welcome to your RPG Life Questboard! Level up by completing tasks.', timestamp: new Date().toISOString(), type: 'xp' }
    ]);
    tasks.setPomodoroStats({ completedSessions: 0, totalMinutes: 0 });
    rpg.setIsDead(false);
    rpg.setDeathStats(null);
    localStorage.removeItem('taskslayer_death_stats');
    localStorage.removeItem('ticktick_death_stats');

    tasks.setActiveTaskId(null);
    settings.setSelectedProjectId(null);
    settings.setCurrentView('today');
    localStorage.removeItem('taskslayer_active_task_id');
    localStorage.removeItem('ticktick_active_task_id');

    settings.setPomoOpen(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
    settings.setTheme('dark');
    settings.setNotificationsEnabled(true);
    localStorage.removeItem('taskslayer_views_order');
    localStorage.removeItem('ticktick_views_order');

    setTimeout(() => {
      syncData();
    }, 100);
  };

  // Delete Account
  const deleteAccount = async () => {
    resetToDefaults();
    authSync.disconnectSync();
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear localStorage', e);
    }
    try {
      if (auth.currentUser) {
        await auth.currentUser.delete().catch((err) => {
          console.warn('Firebase user delete note:', err?.message || err);
        });
      }
      await auth.signOut();
    } catch (err) {
      console.warn('Sign-out error during account deletion:', err);
    }
  };

  // Firebase auth state change effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        authSync.setUserEmail(user.email || user.uid);

        const ok = await connectSyncKey(user.uid);
        if (!ok) {
          const userDocRef = doc(db, 'users', user.uid);
          const currentName = authSync.userName || localStorage.getItem('taskslayer_user_name') || localStorage.getItem('ticktick_user_name') || user.displayName || '';
          const currentAvatar = (authSync.userAvatar && authSync.userAvatar !== 'default') 
            ? authSync.userAvatar 
            : (localStorage.getItem('taskslayer_user_avatar') || localStorage.getItem('ticktick_user_avatar') || user.photoURL || 'default');

          const userProfilePayload = JSON.parse(JSON.stringify({
            userId: user.uid,
            userName: currentName,
            userAvatar: currentAvatar,
            userEmail: user.email || user.uid,
            profile: rpg.profile,
            shopItems: rpg.shopItems,
            gameLogs: rpg.gameLogs,
            pomodoroStats: tasks.pomodoroStats,
            theme: settings.theme,
            language: settings.language,
            viewSortSettings: settings.viewSortSettings,
            createdAt: new Date().toISOString()
          }));
          await setDoc(userDocRef, userProfilePayload);
          authSync.setSyncKey(user.uid);
        }
      } else {
        disconnectSync();
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto sync effect when key states change
  useEffect(() => {
    if (!authSync.syncKey) return;
    const timeout = setTimeout(() => {
      syncData();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [
    authSync.syncKey,
    tasks.tasks,
    rpg.profile,
    rpg.shopItems,
    rpg.gameLogs,
    tasks.pomodoroStats,
    rpg.isDead,
    settings.theme,
    settings.language,
    settings.viewSortSettings,
    authSync.userName,
    authSync.userAvatar,
  ]);

  // Global background Pomodoro timer tick effects
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) {
      console.warn('Audio chime failed to play due to gesture restriction or browser policy', e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tasks.workIsRunning && tasks.workTimeLeft > 0) {
      interval = setInterval(() => {
        tasks.setWorkTimeLeft((prev) => prev - 1);
        if (tasks.activeTaskId) {
          tasks.recordTaskPomodoroTime(tasks.activeTaskId, 1, rpg.addLog, settings.language);
        }
      }, 1000);
    } else if (tasks.workTimeLeft === 0 && tasks.workIsRunning) {
      tasks.setWorkIsRunning(false);
      playChime();
      
      tasks.incrementPomodoroStats(tasks.workDuration);
      
      const activeTask = tasks.tasks.find((t) => t.id === tasks.activeTaskId);
      if (settings.notificationsEnabled) {
        sendWebNotification(
          settings.language === 'ar' ? 'انتهت جلسة التركيز! 🌟' : 'Focus Session Finished! 🌟',
          {
            body: settings.language === 'ar'
              ? `عمل رائع! لقد أنهيت ${tasks.workDuration} دقيقة من التركيز${activeTask ? ` على "${activeTask.title}"` : ''}.`
              : `Great job! You finished ${tasks.workDuration} minutes of focus${activeTask ? ` on "${activeTask.title}"` : ''}.`,
            requireInteraction: true
          }
        );
      }

      // Reset the work timer back to its original duration (so the user can repeat it!)
      tasks.setWorkTimeLeft(tasks.workDuration * 60);
      tasks.setWorkMaxDuration(tasks.workDuration * 60);
    }
    return () => clearInterval(interval);
  }, [
    tasks.workIsRunning,
    tasks.workTimeLeft,
    tasks.activeTaskId,
    tasks.workDuration,
    settings.notificationsEnabled,
    settings.language,
    tasks.tasks,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tasks.breakIsRunning && tasks.breakTimeLeft > 0) {
      interval = setInterval(() => {
        tasks.setBreakTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (tasks.breakTimeLeft === 0 && tasks.breakIsRunning) {
      tasks.setBreakIsRunning(false);
      playChime();
      
      if (settings.notificationsEnabled) {
        sendWebNotification(
          settings.language === 'ar' ? 'انتهت الاستراحة! ⏰' : 'Break Finished! ⏰',
          {
            body: settings.language === 'ar'
              ? 'حان وقت التركيز ومواجهة تحدياتك التالية!'
              : 'Time to focus and conquer your next quests!',
            requireInteraction: true
          }
        );
      }

      tasks.setMode('work');
      if (!tasks.workIsRunning) {
        tasks.setWorkTimeLeft(tasks.workDuration * 60);
        tasks.setWorkMaxDuration(tasks.workDuration * 60);
      }
      tasks.setBreakTimeLeft(tasks.breakDuration * 60);
      tasks.setBreakMaxDuration(tasks.breakDuration * 60);
    }
    return () => clearInterval(interval);
  }, [
    tasks.breakIsRunning,
    tasks.breakTimeLeft,
    tasks.workDuration,
    tasks.breakDuration,
    settings.notificationsEnabled,
    settings.language,
    tasks.workIsRunning
  ]);

  const value: AppContextType = {
    tasks: tasks.tasks,
    projects: tasks.projects,
    currentView: settings.currentView,
    setCurrentView: settings.setCurrentView,
    selectedProjectId: settings.selectedProjectId,
    setSelectedProjectId: settings.setSelectedProjectId,
    activeTaskId: tasks.activeTaskId,
    setActiveTaskId: tasks.setActiveTaskId,
    addTask,
    updateTask,
    deleteTask,
    skipTaskForToday,
    completeTaskPomodoro,
    pomodoroStats: tasks.pomodoroStats,
    incrementPomodoroStats: tasks.incrementPomodoroStats,

    profile: rpg.profile,
    setProfile: rpg.setProfile,
    shopItems: rpg.shopItems,
    addShopItem: rpg.addShopItem,
    buyShopItem: rpg.buyShopItem,
    useEntertainment: rpg.useEntertainment,
    gameLogs: rpg.gameLogs,
    addLog: rpg.addLog,
    clearLogs: rpg.clearLogs,
    showMpZeroModal: rpg.showMpZeroModal,
    setShowMpZeroModal: rpg.setShowMpZeroModal,
    isDead: rpg.isDead,
    setIsDead: rpg.setIsDead,
    deathStats: rpg.deathStats,
    respawnHero: rpg.respawnHero,
    meditateRest: rpg.meditateRest,

    isSidebarOpen: settings.isSidebarOpen,
    setSidebarOpen: settings.setSidebarOpen,
    isPomoOpen: settings.isPomoOpen,
    setPomoOpen: settings.setPomoOpen,

    theme: settings.theme,
    toggleTheme: settings.toggleTheme,
    language: settings.language,
    setLanguage: settings.setLanguage,
    t: settings.t,

    syncKey: authSync.syncKey,
    isSyncing: authSync.isSyncing,
    lastSyncTime: authSync.lastSyncTime,
    syncError: authSync.syncError,
    generateSyncKey: authSync.generateSyncKey,
    connectSyncKey,
    syncData,
    disconnectSync,
    userEmail: authSync.userEmail,
    userName: authSync.userName,
    userAvatar: authSync.userAvatar,
    updateUserProfile,
    isAuthModalOpen: authSync.isAuthModalOpen,
    setAuthModalOpen: authSync.setAuthModalOpen,

    notificationsEnabled: settings.notificationsEnabled,
    setNotificationsEnabled: settings.setNotificationsEnabled,
    triggerTodayReminders,

    resetToDefaults,
    deleteAccount,

    spamFreezeUntil: tasks.spamFreezeUntil,
    setSpamFreezeUntil: tasks.setSpamFreezeUntil,
    showSpamModal: tasks.showSpamModal,
    setShowSpamModal: tasks.setShowSpamModal,

    // Expose Pomodoro States in AppContext
    workDuration: tasks.workDuration,
    setWorkDuration: tasks.setWorkDuration,
    breakDuration: tasks.breakDuration,
    setBreakDuration: tasks.setBreakDuration,
    workTimeLeft: tasks.workTimeLeft,
    setWorkTimeLeft: tasks.setWorkTimeLeft,
    workIsRunning: tasks.workIsRunning,
    setWorkIsRunning: tasks.setWorkIsRunning,
    breakTimeLeft: tasks.breakTimeLeft,
    setBreakTimeLeft: tasks.setBreakTimeLeft,
    breakIsRunning: tasks.breakIsRunning,
    setBreakIsRunning: tasks.setBreakIsRunning,
    mode: tasks.mode,
    setMode: tasks.setMode,
    workMaxDuration: tasks.workMaxDuration,
    setWorkMaxDuration: tasks.setWorkMaxDuration,
    breakMaxDuration: tasks.breakMaxDuration,
    setBreakMaxDuration: tasks.setBreakMaxDuration,
  };

  return (
    <CombinedAppContext.Provider value={value}>
      {children}
    </CombinedAppContext.Provider>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AuthSyncProvider>
        <RPGProvider>
          <TasksProvider>
            <MasterAppBridgeProvider>
              {children}
            </MasterAppBridgeProvider>
          </TasksProvider>
        </RPGProvider>
      </AuthSyncProvider>
    </SettingsProvider>
  );
}

export function useApp() {
  const context = useContext(CombinedAppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
