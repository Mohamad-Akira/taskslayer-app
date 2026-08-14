import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function compressImage(dataUrlOrFile: string | File, maxDimension = 256, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    try {
      const processSrc = (src: string) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : 'default');
        img.src = src;
      };

      if (dataUrlOrFile instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            processSrc(e.target.result as string);
          } else {
            resolve('default');
          }
        };
        reader.onerror = () => resolve('default');
        reader.readAsDataURL(dataUrlOrFile);
      } else {
        processSrc(dataUrlOrFile);
      }
    } catch {
      resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : 'default');
    }
  });
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextRepeatDate(currentDueDate?: string, repeatRule?: string): string {
  let baseDate = currentDueDate ? new Date(currentDueDate + 'T00:00:00') : new Date();
  if (isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }

  const d = new Date(baseDate);

  switch (repeatRule) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      break;
  }

  return getLocalDateString(d);
}

export function calculateDailyStreak(
  tasks: Array<{ status: string; dueDate?: string; createdAt?: string; completedAt?: string }>,
  pomodoroHistory?: Record<string, { completedSessions: number; totalMinutes: number }>
): number {
  const activeDates = new Set<string>();
  const today = new Date();
  const todayStr = getLocalDateString(today);

  // Condition 1: Completed tasks (prefer explicit completedAt)
  if (Array.isArray(tasks)) {
    tasks.forEach(t => {
      if (t.status === 'done') {
        let completionDate = t.completedAt;
        if (!completionDate) {
          // If completedAt is missing, fallback to past due date or past createdAt
          const fallbackDate = t.dueDate || (t.createdAt ? t.createdAt.split('T')[0] : '');
          if (fallbackDate && fallbackDate !== todayStr) {
            completionDate = fallbackDate;
          }
        }
        if (completionDate) {
          activeDates.add(completionDate);
        }
      }
    });
  }

  // Condition 2: At least 1 completed Pomodoro session on that day
  if (pomodoroHistory && typeof pomodoroHistory === 'object') {
    Object.entries(pomodoroHistory).forEach(([date, stats]) => {
      if (stats && stats.completedSessions > 0) {
        activeDates.add(date);
      }
    });
  }

  if (activeDates.size === 0) return 0;

  const formatDate = (d: Date) => getLocalDateString(d);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let streak = 0;
  let checkDate = new Date(today);

  // Rule 1: If user completed at least 1 task/pomodoro TODAY, count streak including today (+1 day).
  if (activeDates.has(todayStr)) {
    checkDate = new Date(today);
    while (activeDates.has(formatDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } 
  // Rule 2: If user has NOT completed a task TODAY yet, but completed yesterday, keep yesterday's streak.
  else if (activeDates.has(yesterdayStr)) {
    checkDate = new Date(yesterday);
    while (activeDates.has(formatDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } 
  // Rule 3: If neither today nor yesterday had any completions, streak resets to 0.
  else {
    streak = 0;
  }

  return streak;
}

export function formatTaskDateLabel(dueDate?: string, language: string = 'ar'): { label: string; isToday: boolean; isTomorrow: boolean; isOverdue: boolean } {
  if (!dueDate) return { label: '', isToday: false, isTomorrow: false, isOverdue: false };

  const todayStr = getLocalDateString(new Date());
  
  if (dueDate === todayStr) {
    return { label: language === 'ar' ? 'اليوم' : 'Today', isToday: true, isTomorrow: false, isOverdue: false };
  }

  const todayParts = todayStr.split('-').map(Number);
  const dueParts = dueDate.split('-').map(Number);

  if (dueParts.length < 3 || isNaN(dueParts[0])) {
    return { label: dueDate, isToday: false, isTomorrow: false, isOverdue: false };
  }

  const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
  const taskDate = new Date(dueParts[0], dueParts[1] - 1, dueParts[2]);

  const diffTime = taskDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;
  const isOverdue = diffDays < 0;

  if (isToday) {
    return { label: language === 'ar' ? 'اليوم' : 'Today', isToday, isTomorrow, isOverdue };
  }
  if (isTomorrow) {
    return { label: language === 'ar' ? 'غداً' : 'Tomorrow', isToday, isTomorrow, isOverdue };
  }

  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const year = dueParts[0];
  const isDifferentYear = year !== todayParts[0];

  const day = dueParts[2];
  const monthIdx = dueParts[1] - 1;

  if (language === 'ar') {
    const base = `${day} ${monthsAr[monthIdx] || ''}`;
    return { label: isDifferentYear ? `${base} ${year}` : base, isToday, isTomorrow, isOverdue };
  } else {
    const base = `${monthsEn[monthIdx] || ''} ${day}`;
    return { label: isDifferentYear ? `${base}, ${year}` : base, isToday, isTomorrow, isOverdue };
  }
}

export function formatDurationHours(hours?: number, language: string = 'ar'): string {
  if (!hours || hours <= 0) return '';
  if (language === 'ar') {
    if (hours === 0.5) return '30 دقيقة';
    if (hours === 1) return 'ساعة واحدة';
    if (hours === 1.5) return 'ساعة و 30 دقيقة';
    if (hours === 2) return 'ساعتان';
    if (hours === 2.5) return 'ساعتان و 30 دقيقة';
    
    const whole = Math.floor(hours);
    const hasHalf = hours % 1 === 0.5;
    
    let hoursText = '';
    if (whole >= 3 && whole <= 10) {
      hoursText = `${whole} ساعات`;
    } else {
      hoursText = `${whole} ساعة`;
    }
    
    return hasHalf ? `${hoursText} و 30 دقيقة` : hoursText;
  } else {
    if (hours === 0.5) return '30 mins';
    if (hours === 1) return '1 hour';
    if (hours % 1 === 0.5) {
      return `${Math.floor(hours)} hr 30 mins`;
    }
    return `${hours} hours`;
  }
}

