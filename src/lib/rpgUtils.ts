import { RPGProfile, ShopItem, Project, Task } from '../types';
import { Language } from '../utils/translations';
import { getLocalDateString } from './utils';

export function getMaxHpForLevel(level: number): number {
  if (level <= 1) return 100;
  if (level <= 10) {
    return 100 + (level - 1) * 100;
  }
  if (level <= 20) {
    return 1000 + (level - 10) * 200;
  }
  if (level <= 30) {
    return 3000 + (level - 20) * 500;
  }
  if (level <= 40) {
    return 8000 + (level - 30) * 200;
  }
  if (level <= 50) {
    return 10000 + (level - 40) * 1000;
  }
  if (level <= 100) {
    return 20000 + (level - 50) * 600;
  }
  return 50000 + (level - 100) * 1000;
}

export function getMaxMpForLevel(level: number): number {
  if (level <= 1) return 100;
  if (level <= 10) {
    return 100 + Math.round((level - 1) * (500 - 100) / 9);
  }
  if (level <= 20) {
    return 500 + (level - 10) * 100;
  }
  if (level <= 30) {
    return 1500 + (level - 20) * 250;
  }
  if (level <= 40) {
    return 4000 + (level - 30) * 100;
  }
  if (level <= 50) {
    return 5000 + (level - 40) * 500;
  }
  if (level <= 100) {
    return 10000 + (level - 50) * 300;
  }
  return 25000 + (level - 100) * 500;
}

export function getXpToNextForLevel(level: number): number {
  if (level <= 50) {
    return Math.floor(100 * Math.pow(1.15, level - 1));
  }
  const baseLevel50 = Math.floor(100 * Math.pow(1.15, 49)); // ~102137 XP
  const levelDiff = level - 50;
  return baseLevel50 + (levelDiff * 5000) + (levelDiff * levelDiff * 50);
}

export function parseTaskHours(title: string, description: string = '', fallback: number = 0.5): number {
  const fullText = `${title} ${description}`.toLowerCase();
  const match = fullText.match(/(\d+(?:\.\d+)?)\s*(hours|hour|hrs|hr|ساعات|ساعة|س)/i);
  if (match && match[1]) {
    const parsed = parseFloat(match[1]);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 24) {
      return parsed;
    }
  }
  return fallback;
}

export function categorizeTaskPillar(title: string, description: string = ''): 'study' | 'code' | 'design' | 'general' {
  const fullText = `${title} ${description}`.toLowerCase();
  
  // 1. Code / Programming / Tech / Software Development (Checked first so "Learn C++" -> code)
  if (/(برمجة|كود|تطوير|تطبيق|مشروع|ميزة|تحديث|سيرفر|قاعدة بيانات|خوارزميات|هندسة|موقع|برمجيات|bug|feature|code|coding|dev|developer|programming|react|typescript|python|c\+\+|cpp|c#|java|javascript|js|ts|html|css|php|sql|api|git|github|web|backend|frontend|fullstack|flutter|android|ios|node|express|vue|nextjs|linux|terminal)/i.test(fullText)) {
    return 'code';
  }

  // 2. Design / UI/UX / Video / Creative / Art
  if (/(تصميم|بوستر|كاروسيل|ثمنيل|شعار|رسم|فيديو|مونتاج|إعلان|جرافيك|فوتوشوب|إليستريتور|design|poster|thumbnail|carousel|ui|ux|figma|art|video|edit|graphic|banner|photoshop|illustrator|3d|animation|render|canvas)/i.test(fullText)) {
    return 'design';
  }

  // 3. Academic Study / Religion / Quran / Reading / General Knowledge
  if (/(قرآن|القرآن|مصحف|دراسة|مذاكرة|قراءة|تعلم|كتاب|شرح|درس|بحث|جامعة|مدرسة|سورة|آية|تفسير|حديث|عبادة|فقه|تاريخ|فلسفة|فيزياء|كيمياء|رياضيات|علوم|quran|koran|study|reading|book|learn|lecture|course|exam|math|physics|science|history|philosophy|academic)/i.test(fullText)) {
    return 'study';
  }

  return 'general';
}

export function getHeroClassTitle(
  level: number,
  _pillars?: { code: number; design: number; study: number },
  lang: Language = 'ar'
): string {
  const isAr = lang === 'ar';

  if (level <= 5) {
    return isAr ? 'مغامر مبتدئ' : 'Novice Adventurer';
  }

  if (level <= 15) {
    return isAr ? 'مغامر متدرب' : 'Apprentice Adventurer';
  }

  if (level <= 30) {
    return isAr ? 'مغامر مخضرم' : 'Seasoned Adventurer';
  }

  if (level <= 50) {
    return isAr ? 'بطل المملكة' : 'Kingdom Hero';
  }

  if (level <= 70) {
    return isAr ? 'البطل الخارق' : 'Mythic Hero';
  }

  if (level <= 85) {
    return isAr ? 'البطل القدير' : 'High Hero';
  }

  return isAr ? 'البطل الأسطوري' : 'Legendary Hero';
}

export function getPillarSpecificTitle(
  level: number,
  dominantPillar: 'study' | 'code' | 'design' | 'general' = 'study',
  lang: Language = 'ar'
): string {
  const isAr = lang === 'ar';

  if (dominantPillar === 'study') {
    if (level <= 5) return isAr ? 'متدرب معرفة' : 'Knowledge Apprentice';
    if (level <= 15) return isAr ? 'طالب المعرفة' : 'Knowledge Seeker';
    if (level <= 30) return isAr ? 'باحث المعرفة' : 'Knowledge Scholar';
    if (level <= 50) return isAr ? 'حكيم المعرفة' : 'Wisdom Master';
    if (level <= 70) return isAr ? 'عالم العصر' : 'Sage of Epochs';
    return isAr ? 'أركون الحكمة العظيم' : 'Grand Wisdom Archon';
  }

  if (dominantPillar === 'code') {
    if (level <= 5) return isAr ? 'متدرب برمجة' : 'Code Apprentice';
    if (level <= 15) return isAr ? 'مستكشف الكود' : 'Code Scout';
    if (level <= 30) return isAr ? 'محارب الكود' : 'Code Warrior';
    if (level <= 50) return isAr ? 'فارس البرمجة' : 'Code Knight';
    if (level <= 70) return isAr ? 'سيد الكود' : 'Master Coder';
    return isAr ? 'أركون البرمجة العظيم' : 'Grand Code Archon';
  }

  if (dominantPillar === 'design') {
    if (level <= 5) return isAr ? 'متدرب تصميم' : 'Design Apprentice';
    if (level <= 15) return isAr ? 'مستكشف التصميم' : 'Design Scout';
    if (level <= 30) return isAr ? 'فنان رقمي' : 'Digital Artist';
    if (level <= 50) return isAr ? 'خبير الإبداع' : 'Creative Master';
    if (level <= 70) return isAr ? 'سيد الفنون العظيم' : 'Grand Visual Sovereign';
    return isAr ? 'أركون التصميم العظيم' : 'Grand Design Archon';
  }

  // General / Discipline
  if (level <= 5) return isAr ? 'متدرب الانضباط' : 'Discipline Apprentice';
  if (level <= 15) return isAr ? 'مستكشف المهام' : 'Task Scout';
  if (level <= 30) return isAr ? 'محارب الإنجاز' : 'Achievement Warrior';
  if (level <= 50) return isAr ? 'فارس الانضباط' : 'Discipline Knight';
  if (level <= 70) return isAr ? 'سيد الإنجاز' : 'Master Achiever';
  return isAr ? 'أركون الانضباط العظيم' : 'Grand Discipline Archon';
}

export const DEFAULT_PROFILE: RPGProfile = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  hp: 100,
  maxHp: 100,
  mp: 100,
  maxMp: 100,
  gold: 50,
  classTitle: 'Novice Adventurer',
  pillars: {
    design: 0,
    code: 0,
    study: 0,
  },
  entertainment: {
    gamesHours: 0,
    animeEpisodes: 0,
  }
};

export const DEFAULT_SHOP: ShopItem[] = [
  { id: '1', title: 'Coffee Elixir', description: 'Take a premium specialty coffee break to energize your mind.', cost: 15, type: 'gold', icon: 'Coffee' },
  { id: 'shop-game-hr', title: '1 Hour Video Games', description: 'Unlock 1 hour of video game entertainment.', cost: 30, type: 'gold', icon: 'Gamepad2' },
  { id: 'shop-anime-ep', title: '1 Anime Episode', description: 'Unlock 1 episode of anime.', cost: 20, type: 'gold', icon: 'Tv' },
  { id: '3', title: 'Mana Feast (Cheat Meal)', description: 'Indulge in a delicious cheat meal or high-calorie snack guilt-free.', cost: 80, type: 'gold', icon: 'Utensils' },
  { id: '4', title: 'Health Potion (Heal +50 HP)', description: 'Immediately restore 50 HP of damage from failed or skipped quests.', cost: 20, type: 'gold', icon: 'HeartPulse' },
  { id: '5', title: 'Empowered Focus Spell', description: 'Consume 40 MP to boost your motivation and skip a task without penalty.', cost: 40, type: 'mp', icon: 'Zap' },
];

export const DEFAULT_PROJECTS: Project[] = [
  { id: 'proj-work', name: 'Work', color: 'bg-indigo-500' },
  { id: 'proj-personal', name: 'Personal', color: 'bg-emerald-500' },
  { id: 'proj-study', name: 'Study', color: 'bg-amber-500' },
];

export const DEFAULT_TASKS: Task[] = [];

export function sanitizeProfile(p: any): RPGProfile {
  if (!p) return DEFAULT_PROFILE;
  
  const parsed = { ...p };
  
  if (!parsed.entertainment) {
    parsed.entertainment = { gamesHours: 0, animeEpisodes: 0 };
  }
  
  const expectedMaxHp = getMaxHpForLevel(parsed.level);
  const expectedMaxMp = getMaxMpForLevel(parsed.level);
  
  if (!parsed.maxHp || parsed.maxHp !== expectedMaxHp || !parsed.maxMp || parsed.maxMp !== expectedMaxMp) {
    const oldMaxHp = parsed.maxHp || 100;
    const oldMaxMp = parsed.maxMp || 100;
    parsed.maxHp = expectedMaxHp;
    parsed.maxMp = expectedMaxMp;
    parsed.hp = Math.min(expectedMaxHp, (parsed.hp || 100) + (expectedMaxHp - oldMaxHp));
    parsed.mp = Math.min(expectedMaxMp, (parsed.mp || 100) + (expectedMaxMp - oldMaxMp));
  }
  
  const expectedXpToNext = getXpToNextForLevel(parsed.level);
  parsed.xpToNextLevel = expectedXpToNext;
  
  if (parsed.xp >= expectedXpToNext) {
    let newXp = parsed.xp;
    let newLevel = parsed.level;
    let newXpToNext = expectedXpToNext;
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel += 1;
      newXpToNext = getXpToNextForLevel(newLevel);
    }
    parsed.level = newLevel;
    parsed.xp = newXp;
    parsed.xpToNextLevel = newXpToNext;
    
    const finalMaxHp = getMaxHpForLevel(parsed.level);
    const finalMaxMp = getMaxMpForLevel(parsed.level);
    parsed.maxHp = finalMaxHp;
    parsed.maxMp = finalMaxMp;
    parsed.hp = finalMaxHp;
    parsed.mp = finalMaxMp;
  }
  
  parsed.classTitle = getHeroClassTitle(parsed.level, parsed.pillars);
  
  return parsed;
}

export function deduplicateTasks(taskList: Task[]): Task[] {
  if (!taskList || taskList.length === 0) return [];
  const seenActiveKeys = new Set<string>();
  const result: Task[] = [];

  for (const task of taskList) {
    if (task.status === 'todo') {
      const titleKey = task.title.trim().toLowerCase();
      const dateKey = task.dueDate || 'no-date';
      const projKey = task.projectId || 'no-proj';
      const key = `${titleKey}|${dateKey}|${projKey}`;

      if (seenActiveKeys.has(key)) {
        continue;
      }
      seenActiveKeys.add(key);
    }
    result.push(task);
  }

  return result;
}
