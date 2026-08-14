export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in_progress' | 'done' | 'skipped';

export type SortBy = 'name' | 'date' | 'priority' | 'custom';
export type SortOrder = 'asc' | 'desc';
export type GroupBy = 'none' | 'priority' | 'project' | 'date';

export interface ViewSortSetting {
  sortBy: SortBy;
  sortOrder: SortOrder;
  groupBy: GroupBy;
}

export type ViewSortSettings = Record<string, ViewSortSetting>;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  projectId?: string;
  dueDate?: string;
  reminder?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
  isCustomQuest?: boolean;
  earnedXp?: number;
  earnedGold?: number;
  earnedHp?: number;
  earnedMp?: number;
  isSpam?: boolean;
  aiReasoning?: string;
  aiDifficulty?: Priority;
  estimatedHours?: number;
  pomodoroWorkSeconds?: number;
  pomodoroWorkMinutes?: number;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface RPGProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  classTitle: string;
  pillars: {
    design: number; // Experience hours or skill points
    code: number;
    study: number;
  };
  entertainment: {
    gamesHours: number;
    animeEpisodes: number;
  };
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: 'gold' | 'mp';
  icon: string;
}

export interface GameLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'xp' | 'level_up' | 'gold' | 'damage' | 'heal' | 'purchase';
}
