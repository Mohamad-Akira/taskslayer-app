import { z } from 'zod';
import { Task, Project, RPGProfile, ShopItem, GameLog, ViewSortSettings } from '../types';
import { DEFAULT_PROFILE, DEFAULT_TASKS, DEFAULT_SHOP, sanitizeProfile, deduplicateTasks } from './rpgUtils';

export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const StatusSchema = z.enum(['todo', 'in_progress', 'done', 'skipped']);
export const RepeatSchema = z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']);

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().default('Untitled Task'),
  description: z.string().optional(),
  status: StatusSchema.default('todo'),
  priority: PrioritySchema.default('medium'),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  reminder: z.string().optional(),
  repeat: RepeatSchema.optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
  isCustomQuest: z.boolean().optional(),
  earnedXp: z.number().optional(),
  earnedGold: z.number().optional(),
  earnedHp: z.number().optional(),
  earnedMp: z.number().optional(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

export const RPGProfileSchema = z.object({
  level: z.number().catch(1),
  xp: z.number().catch(0),
  xpToNextLevel: z.number().catch(100),
  hp: z.number().catch(100),
  maxHp: z.number().catch(100),
  mp: z.number().catch(100),
  maxMp: z.number().catch(100),
  gold: z.number().catch(50),
  classTitle: z.string().catch('Novice Adventurer'),
  pillars: z.object({
    design: z.number().catch(0),
    code: z.number().catch(0),
    study: z.number().catch(0),
  }).catch({ design: 0, code: 0, study: 0 }),
  entertainment: z.object({
    gamesHours: z.number().catch(0),
    animeEpisodes: z.number().catch(0),
  }).catch({ gamesHours: 0, animeEpisodes: 0 }),
});

export const ShopItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  cost: z.number().default(10),
  type: z.enum(['gold', 'mp']).default('gold'),
  icon: z.string().default('Gift'),
});

export const GameLogSchema = z.object({
  id: z.string(),
  message: z.string(),
  timestamp: z.string().default(() => new Date().toISOString()),
  type: z.enum(['xp', 'level_up', 'gold', 'damage', 'heal', 'purchase']).default('xp'),
});

export const PomodoroStatsSchema = z.object({
  completedSessions: z.number().default(0),
  totalMinutes: z.number().default(0),
  history: z.record(z.string(), z.object({
    completedSessions: z.number(),
    totalMinutes: z.number(),
  })).optional(),
});

// Safe parsers for localStorage and cloud sync recovery

export function safeParseJSON<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (err) {
    console.warn('JSON parsing failed, returning fallback:', err);
    return fallback;
  }
}

export function safeParseTasks(data: unknown): Task[] {
  if (!Array.isArray(data)) return [];
  const validTasks: Task[] = [];
  for (const item of data) {
    const result = TaskSchema.safeParse(item);
    if (result.success) {
      validTasks.push(result.data as Task);
    }
  }
  return deduplicateTasks(validTasks);
}

export function safeParseProfile(data: unknown): RPGProfile {
  const result = RPGProfileSchema.safeParse(data);
  if (result.success) {
    return sanitizeProfile(result.data);
  }
  return DEFAULT_PROFILE;
}

export function safeParseShopItems(data: unknown): ShopItem[] {
  if (!Array.isArray(data)) return DEFAULT_SHOP;
  const items: ShopItem[] = [];
  for (const item of data) {
    const result = ShopItemSchema.safeParse(item);
    if (result.success) {
      items.push(result.data as ShopItem);
    }
  }
  return items.length > 0 ? items : DEFAULT_SHOP;
}

export function safeParseGameLogs(data: unknown): GameLog[] {
  if (!Array.isArray(data)) return [];
  const logs: GameLog[] = [];
  for (const item of data) {
    const result = GameLogSchema.safeParse(item);
    if (result.success) {
      logs.push(result.data as GameLog);
    }
  }
  return logs;
}

export function safeParsePomodoroStats(data: unknown): {
  completedSessions: number;
  totalMinutes: number;
  history?: Record<string, { completedSessions: number; totalMinutes: number }>;
} {
  const result = PomodoroStatsSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return { completedSessions: 0, totalMinutes: 0 };
}

export function safeParseViewSortSettings(data: unknown): ViewSortSettings {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as ViewSortSettings;
  }
  return {};
}
