/**
 * Utility to manage browser Web Notifications (Web Notifications API)
 * Handles permissions, checking if inside an iframe, and sending structured notifications.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Notification permission request failed. This often happens inside cross-origin iframes. Users may need to open the app in a new tab.', error);
    // Return standard permission state if possible
    return 'default';
  }
}

interface NotificationOptionsExtended extends NotificationOptions {
  requireInteraction?: boolean;
  type?: 'warning' | 'error' | 'success' | 'info';
}

export async function sendWebNotification(title: string, options?: NotificationOptionsExtended) {
  // Always trigger the in-app custom event fallback so the user receives the notification 
  // instantly inside the preview iframe, even if browser permissions are blocked or unsupported.
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('app-toast-notification', {
      detail: { 
        title, 
        body: options?.body || '', 
        requireInteraction: !!options?.requireInteraction,
        type: options?.type
      }
    });
    window.dispatchEvent(event);
  }

  if (!isNotificationSupported()) return false;
  
  if (Notification.permission === 'granted') {
    try {
      const defaultOptions: NotificationOptionsExtended = {
        icon: '/pwa-192x192.png',
        badge: '/favicon-32x32.png',
        dir: 'auto',
        ...options,
      };

      // Prefer Service Worker notification display for native OS & background persistence
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
            await registration.showNotification(title, defaultOptions);
            return true;
          }
        } catch (swErr) {
          console.warn('Service worker showNotification fallback to window.Notification:', swErr);
        }
      }

      // Standard window.Notification fallback
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 5s if not requiring interaction
      if (!options?.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to trigger native browser notification:', err);
      return false;
    }
  }
  return false;
}

/**
 * Sends a reminder about today's remaining tasks
 */
export function sendTodayTasksReminder(pendingCount: number, taskTitles: string[], language: 'en' | 'ar') {
  if (pendingCount === 0) {
    const title = language === 'ar' ? 'يومك ممتاز! 🌟' : 'Excellent Day! 🌟';
    const body = language === 'ar' 
      ? 'لقد أنجزت جميع مهامك اليومية. استمر في التقدم الرائع!' 
      : 'You have completed all your tasks for today. Keep up the amazing work!';
    
    sendWebNotification(title, { body });
    return;
  }

  const title = language === 'ar' ? 'تذكير بمهام اليوم ⏰' : 'Today\'s Task Reminder ⏰';
  
  let body = '';
  if (language === 'ar') {
    body = `لديك ${pendingCount} مهمة متبقية اليوم:\n` + taskTitles.slice(0, 3).map(t => `• ${t}`).join('\n');
    if (taskTitles.length > 3) {
      body += `\n+ ${taskTitles.length - 3} مهام أخرى...`;
    }
  } else {
    body = `You have ${pendingCount} task${pendingCount > 1 ? 's' : ''} remaining today:\n` + taskTitles.slice(0, 3).map(t => `• ${t}`).join('\n');
    if (taskTitles.length > 3) {
      body += `\n+ ${taskTitles.length - 3} other tasks...`;
    }
  }

  sendWebNotification(title, {
    body,
    requireInteraction: true,
  });
}
