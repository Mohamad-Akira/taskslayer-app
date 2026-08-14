import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../utils/translations';
import { sendTodayTasksReminder, isNotificationSupported, getNotificationPermission, requestNotificationPermission } from '../utils/notifications';
import { getLocalDateString } from '../lib/utils';
import { Task, ViewSortSettings } from '../types';

export interface SettingsContextType {
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  currentView: string;
  setCurrentView: (view: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isPomoOpen: boolean;
  setPomoOpen: (open: boolean) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  triggerTodayReminders: (tasks: Task[]) => void;

  viewSortSettings: ViewSortSettings;
  setViewSortSettings: React.Dispatch<React.SetStateAction<ViewSortSettings>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Theme & Language states
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('taskslayer_theme') || localStorage.getItem('ticktick_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('taskslayer_language') || localStorage.getItem('ticktick_language');
    return (saved as Language) || 'en';
  });

  // Navigation states
  const [currentView, setCurrentView] = useState<string>('today');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Responsive UI states
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isPomoOpen, setPomoOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('taskslayer_pomo_open') || localStorage.getItem('ticktick_pomo_open');
    if (saved !== null) {
      return saved === 'true';
    }
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  });

  // Web Notifications System
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('taskslayer_notifications_enabled') || localStorage.getItem('ticktick_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // View Sort & Group Settings state
  const [viewSortSettings, setViewSortSettings] = useState<ViewSortSettings>(() => {
    try {
      const saved = localStorage.getItem('taskslayer_view_sort_settings') || localStorage.getItem('ticktick_view_sort_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse view sort settings from localStorage', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('taskslayer_view_sort_settings', JSON.stringify(viewSortSettings));
    } catch (e) {
      console.error('Failed to save view sort settings to localStorage', e);
    }
  }, [viewSortSettings]);

  useEffect(() => {
    if (notificationsEnabled && isNotificationSupported() && getNotificationPermission() === 'default') {
      requestNotificationPermission().catch(() => {});
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('taskslayer_pomo_open', String(isPomoOpen));
  }, [isPomoOpen]);

  useEffect(() => {
    localStorage.setItem('taskslayer_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('taskslayer_language', language);
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, [language]);

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    localStorage.setItem('taskslayer_notifications_enabled', JSON.stringify(enabled));
  };

  const triggerTodayReminders = (tasks: Task[]) => {
    const todayStr = getLocalDateString();
    const todayTasks = tasks.filter(t => t.status === 'todo' && t.dueDate === todayStr);
    const pendingCount = todayTasks.length;
    const taskTitles = todayTasks.map(t => t.title);
    sendTodayTasksReminder(pendingCount, taskTitles, language);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const dict = translations[language];
    return (dict as any)[key] || (translations['en'] as any)[key] || key;
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        t,
        currentView,
        setCurrentView,
        selectedProjectId,
        setSelectedProjectId,
        isSidebarOpen,
        setSidebarOpen,
        isPomoOpen,
        setPomoOpen,
        notificationsEnabled,
        setNotificationsEnabled,
        triggerTodayReminders,
        viewSortSettings,
        setViewSortSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
