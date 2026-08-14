import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { Task, RPGProfile, ShopItem, GameLog, ViewSortSettings } from '../types';
import { sanitizeProfile, DEFAULT_TASKS, DEFAULT_PROFILE, DEFAULT_SHOP } from '../lib/rpgUtils';
import {
  safeParseProfile,
  safeParseShopItems,
  safeParseGameLogs,
  safeParsePomodoroStats,
  safeParseTasks,
  safeParseViewSortSettings,
} from '../lib/schemas';
import { compressImage, calculateDailyStreak } from '../lib/utils';

export interface AuthSyncContextType {
  syncKey: string | null;
  setSyncKey: React.Dispatch<React.SetStateAction<string | null>>;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  lastSyncTime: string | null;
  setLastSyncTime: React.Dispatch<React.SetStateAction<string | null>>;
  syncError: string | null;
  setSyncError: React.Dispatch<React.SetStateAction<string | null>>;
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  userName: string | null;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>;
  userAvatar: string;
  setUserAvatar: React.Dispatch<React.SetStateAction<string>>;
  updateUserProfile: (name: string, avatar: string, onSync?: () => void) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  generateSyncKey: () => Promise<string | null>;
  connectSyncKey: (
    key: string,
    callbacks?: {
      setProfile: React.Dispatch<React.SetStateAction<RPGProfile>>;
      setShopItems: React.Dispatch<React.SetStateAction<ShopItem[]>>;
      setGameLogs: React.Dispatch<React.SetStateAction<GameLog[]>>;
      setPomodoroStats: React.Dispatch<React.SetStateAction<{
        completedSessions: number;
        totalMinutes: number;
        history?: Record<string, { completedSessions: number; totalMinutes: number }>;
      }>>;
      setTheme: (theme: 'light' | 'dark') => void;
      setLanguage: (lang: any) => void;
      setIsDead: (dead: boolean) => void;
      setDeathStats: (stats: any) => void;
      setNotificationsEnabled: (enabled: boolean) => void;
      setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
      setViewSortSettings?: React.Dispatch<React.SetStateAction<ViewSortSettings>>;
      language: string;
    }
  ) => Promise<boolean>;

  syncData: (
    data: {
      profile: RPGProfile;
      shopItems: ShopItem[];
      gameLogs: GameLog[];
      pomodoroStats: {
        completedSessions: number;
        totalMinutes: number;
        history?: Record<string, { completedSessions: number; totalMinutes: number }>;
      };
      isDead: boolean;
      deathStats: { goldTax: number; xpLoss: number } | null;
      theme: 'light' | 'dark';
      language: string;
      notificationsEnabled: boolean;
      viewSortSettings?: ViewSortSettings;
      tasks: Task[];
    }
  ) => Promise<boolean>;

  disconnectSync: (resetStateCallbacks?: () => void) => void;
}

const AuthSyncContext = createContext<AuthSyncContextType | undefined>(undefined);

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const [syncKey, setSyncKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem('taskslayer_user_name') || localStorage.getItem('ticktick_user_name') || null;
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('taskslayer_user_avatar') || localStorage.getItem('ticktick_user_avatar') || 'default';
  });
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const isSyncingRef = useRef<boolean>(false);
  const lastSyncedDataRef = useRef<string>('');

  const updateUserProfile = async (name: string, avatar: string, onSync?: () => void) => {
    setUserName(name);
    let finalAvatar = avatar;
    if (avatar && avatar.startsWith('data:image') && avatar.length > 200000) {
      try {
        finalAvatar = await compressImage(avatar, 256, 0.8);
      } catch (err) {
        console.error('Failed to compress avatar:', err);
      }
    }
    setUserAvatar(finalAvatar);
    localStorage.setItem('taskslayer_user_name', name);
    localStorage.setItem('taskslayer_user_avatar', finalAvatar);

    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: finalAvatar.length < 2000 ? finalAvatar : auth.currentUser.photoURL
        });
      } catch (err) {
        console.warn('Could not update Firebase Auth profile:', err);
      }
    }

    if (onSync) {
      setTimeout(() => {
        onSync();
      }, 100);
    }
  };

  const generateSyncKey = async (): Promise<string | null> => {
    return null;
  };

  const connectSyncKey: AuthSyncContextType['connectSyncKey'] = async (key, callbacks) => {
    const user = auth.currentUser;
    if (!user) return false;

    setIsSyncing(true);
    setSyncError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const cloudData = userDocSnap.data();
        const localSavedName = localStorage.getItem('taskslayer_user_name') || localStorage.getItem('ticktick_user_name');
        const localSavedAvatar = localStorage.getItem('taskslayer_user_avatar') || localStorage.getItem('ticktick_user_avatar');

        const resolvedName = cloudData.userName || localSavedName || user.displayName || null;
        if (resolvedName) {
          setUserName(resolvedName);
          localStorage.setItem('taskslayer_user_name', resolvedName);
        }

        const resolvedAvatar = (cloudData.userAvatar && cloudData.userAvatar !== 'default' ? cloudData.userAvatar : null) || (localSavedAvatar && localSavedAvatar !== 'default' ? localSavedAvatar : null) || user.photoURL || 'default';
        setUserAvatar(resolvedAvatar);
        localStorage.setItem('taskslayer_user_avatar', resolvedAvatar);

        if (callbacks) {
          if (cloudData.profile) callbacks.setProfile(safeParseProfile(cloudData.profile));
          if (Array.isArray(cloudData.shopItems)) callbacks.setShopItems(safeParseShopItems(cloudData.shopItems));
          if (Array.isArray(cloudData.gameLogs)) callbacks.setGameLogs(safeParseGameLogs(cloudData.gameLogs));
          if (cloudData.pomodoroStats) callbacks.setPomodoroStats(safeParsePomodoroStats(cloudData.pomodoroStats));
          if (cloudData.theme) callbacks.setTheme(cloudData.theme as any);
          if (cloudData.language) callbacks.setLanguage(cloudData.language as any);
          if (cloudData.isDead !== undefined) callbacks.setIsDead(Boolean(cloudData.isDead));
          if (cloudData.deathStats) callbacks.setDeathStats(cloudData.deathStats);
          if (cloudData.notificationsEnabled !== undefined) callbacks.setNotificationsEnabled(Boolean(cloudData.notificationsEnabled));
          if (cloudData.viewSortSettings && callbacks.setViewSortSettings) {
            callbacks.setViewSortSettings(safeParseViewSortSettings(cloudData.viewSortSettings));
          }

          // Load tasks with Zod schema validation
          const tasksRef = collection(db, 'users', user.uid, 'tasks');
          const tasksSnap = await getDocs(tasksRef);
          const rawCloudTasks = tasksSnap.docs.map(d => d.data());
          if (rawCloudTasks.length > 0) {
            callbacks.setTasks(safeParseTasks(rawCloudTasks));
          }
        }

        const currentLang = callbacks?.language || 'en';
        const nowStr = new Date().toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        setLastSyncTime(nowStr);
        setSyncKey(user.uid);
        return true;
      }
      return false;
    } catch (err: any) {
      setSyncError(err.message || 'Error connecting to Firestore.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncData: AuthSyncContextType['syncData'] = async (data) => {
    const user = auth.currentUser;
    if (!user) return false;

    // Build hashable data representation (without dynamic timestamps) to check if anything actually changed
    const dataSnapshot = JSON.stringify({
      userId: user.uid,
      userName: userName || user.displayName || '',
      userAvatar: userAvatar && userAvatar !== 'default' ? userAvatar : (user.photoURL || 'default'),
      userEmail: userEmail || user.email || '',
      profile: data.profile,
      shopItems: data.shopItems,
      gameLogs: data.gameLogs,
      pomodoroStats: data.pomodoroStats,
      isDead: data.isDead,
      deathStats: data.deathStats || {},
      theme: data.theme,
      language: data.language,
      notificationsEnabled: data.notificationsEnabled,
      viewSortSettings: data.viewSortSettings || {},
      tasks: data.tasks,
    });

    if (dataSnapshot === lastSyncedDataRef.current) {
      // Nothing changed since last sync, avoid redundant Firestore writes
      return true;
    }

    if (isSyncingRef.current) {
      // Already syncing, avoid exhausting Firestore write stream
      return false;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);
    try {
      let activeAvatar = userAvatar && userAvatar !== 'default' ? userAvatar : (user.photoURL || 'default');
      if (activeAvatar.startsWith('data:image') && activeAvatar.length > 200000) {
        try {
          activeAvatar = await compressImage(activeAvatar, 256, 0.8);
          setUserAvatar(activeAvatar);
        } catch {
          activeAvatar = 'default';
        }
      }

      const userDocRef = doc(db, 'users', user.uid);
      const calculatedStreak = calculateDailyStreak(data.tasks, data.pomodoroStats?.history);
      const userProfilePayload = JSON.parse(JSON.stringify({
        userId: user.uid,
        userName: userName || user.displayName || '',
        userAvatar: activeAvatar,
        userEmail: userEmail || user.email || '',
        streak: calculatedStreak,
        profile: {
          ...data.profile,
          streak: calculatedStreak
        },
        shopItems: data.shopItems,
        gameLogs: data.gameLogs,
        pomodoroStats: data.pomodoroStats,
        isDead: data.isDead,
        deathStats: data.deathStats || {},
        theme: data.theme,
        language: data.language,
        notificationsEnabled: data.notificationsEnabled,
        viewSortSettings: data.viewSortSettings || JSON.parse(localStorage.getItem('taskslayer_view_sort_settings') || localStorage.getItem('ticktick_view_sort_settings') || '{}'),
        viewsOrder: JSON.parse(localStorage.getItem('taskslayer_views_order') || localStorage.getItem('ticktick_views_order') || '[]'),
        updatedAt: new Date().toISOString()
      }));

      await setDoc(userDocRef, userProfilePayload, { merge: true });

      // Sync Tasks
      const batch = writeBatch(db);
      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      const existingTasksSnap = await getDocs(tasksRef);
      const existingIds = new Set(existingTasksSnap.docs.map(d => d.id));
      const currentIds = new Set(data.tasks.map(t => t.id));

      existingIds.forEach(id => {
        if (!currentIds.has(id)) {
          batch.delete(doc(db, 'users', user.uid, 'tasks', id));
        }
      });

      data.tasks.forEach(task => {
        const cleanTask = JSON.parse(JSON.stringify({
          ...task,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        }));
        batch.set(doc(db, 'users', user.uid, 'tasks', task.id), cleanTask);
      });

      await batch.commit();

      lastSyncedDataRef.current = dataSnapshot;

      const nowStr = new Date().toLocaleTimeString(data.language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      setLastSyncTime(nowStr);
      return true;
    } catch (err: any) {
      console.error('Firestore Sync error:', err);
      setSyncError(err.message || 'Network error.');
      return false;
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  };

  const disconnectSync = (resetStateCallbacks?: () => void) => {
    lastSyncedDataRef.current = '';
    isSyncingRef.current = false;
    setSyncKey(null);
    setLastSyncTime(null);
    setUserEmail(null);
    setUserName(null);
    setUserAvatar('default');
    if (resetStateCallbacks) {
      resetStateCallbacks();
    }
  };

  return (
    <AuthSyncContext.Provider
      value={{
        syncKey,
        setSyncKey,
        isSyncing,
        setIsSyncing,
        lastSyncTime,
        setLastSyncTime,
        syncError,
        setSyncError,
        userEmail,
        setUserEmail,
        userName,
        setUserName,
        userAvatar,
        setUserAvatar,
        updateUserProfile,
        isAuthModalOpen,
        setAuthModalOpen,
        generateSyncKey,
        connectSyncKey,
        syncData,
        disconnectSync,
      }}
    >
      {children}
    </AuthSyncContext.Provider>
  );
}

export function useAuthSync() {
  const context = useContext(AuthSyncContext);
  if (!context) {
    throw new Error('useAuthSync must be used within an AuthSyncProvider');
  }
  return context;
}
