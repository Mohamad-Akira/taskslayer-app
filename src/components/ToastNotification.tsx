import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle, Info, Calendar, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Toast {
  id: string;
  title: string;
  body: string;
  requireInteraction?: boolean;
  type?: 'warning' | 'error' | 'success' | 'info';
}

function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play a delightful 3-tone game-like alert chime
    // Tone 1 (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.1, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Tone 2 (E5) after 0.08s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    // Tone 3 (G5) after 0.16s
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
    gain3.gain.setValueAtTime(0, ctx.currentTime);
    gain3.gain.setValueAtTime(0.15, ctx.currentTime + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);
    
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.4);
    
    osc3.start(ctx.currentTime + 0.16);
    osc3.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('Web Audio API chime could not play:', err);
  }
}

export function ToastNotification() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { language } = useApp();

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; body: string; requireInteraction?: boolean; type?: 'warning' | 'error' | 'success' | 'info' }>;
      const { title, body, requireInteraction, type } = customEvent.detail;
      
      const newToast: Toast = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        body,
        requireInteraction,
        type,
      };

      setToasts(prev => [...prev, newToast]);
      
      // Play high-fidelity synthesized game chime!
      playNotificationChime();
    };

    window.addEventListener('app-toast-notification', handleNotification);
    return () => {
      window.removeEventListener('app-toast-notification', handleNotification);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div 
      className="fixed top-4 md:top-6 right-4 md:right-6 left-4 md:left-auto z-50 flex flex-col gap-3 max-w-sm pointer-events-none select-none text-left"
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)} 
            language={language}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  key?: string;
  toast: Toast;
  onClose: () => void;
  language: 'en' | 'ar';
}

function ToastCard({ toast, onClose, language }: ToastCardProps) {
  useEffect(() => {
    if (!toast.requireInteraction) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  // Determine a nice icon based on the content
  const getIcon = () => {
    if (toast.type === 'warning') {
      return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />;
    }
    const text = (toast.title + ' ' + toast.body).toLowerCase();
    if (text.includes('نجاح') || text.includes('success') || text.includes('ممتاز') || text.includes('🌟')) {
      return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
    }
    if (text.includes('بومودورو') || text.includes('جلسة') || text.includes('استراحة') || text.includes('focus') || text.includes('break')) {
      return <Bell className="w-5 h-5 text-indigo-400 shrink-0 animate-bounce" />;
    }
    if (text.includes('تذكير') || text.includes('reminder') || text.includes('مهام') || text.includes('task')) {
      return <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />;
    }
    return <Info className="w-5 h-5 text-indigo-400 shrink-0" />;
  };

  const isWarning = toast.type === 'warning';
  const borderClass = isWarning 
    ? 'border-amber-500/50 dark:border-amber-500/40' 
    : 'border-indigo-500/30 dark:border-indigo-500/20';
  const shadowClass = isWarning 
    ? 'shadow-[0_10px_30px_-5px_rgba(245,158,11,0.3)]' 
    : 'shadow-[0_10px_30px_-5px_rgba(99,102,241,0.25)]';
  const glowBg = isWarning 
    ? 'bg-amber-500/10' 
    : 'bg-indigo-500/10';
  const progressGradient = isWarning 
    ? 'from-amber-500 to-amber-400' 
    : 'from-indigo-500 to-indigo-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      className={`pointer-events-auto bg-slate-900/95 dark:bg-[#090d23]/95 backdrop-blur-md border ${borderClass} text-white rounded-2xl ${shadowClass} p-4 pr-10 rtl:pr-4 rtl:pl-10 relative overflow-hidden`}
    >
      {/* Visual background glow */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${glowBg} rounded-full blur-2xl pointer-events-none`} />

      <div className="flex gap-3">
        {getIcon()}
        <div className="space-y-1 select-text">
          <h4 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 leading-snug">
            {toast.title}
          </h4>
          {toast.body && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {toast.body}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-3 right-3 rtl:left-3 rtl:right-auto text-slate-400 hover:text-white hover:bg-slate-800/50 p-1 rounded-lg transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress timer bar */}
      {!toast.requireInteraction && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className={`h-full bg-gradient-to-r ${progressGradient}`}
          />
        </div>
      )}
    </motion.div>
  );
}
