import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Smartphone, Share, MoreVertical, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function PWAInstallBanner() {
  const { language } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {language === 'ar' ? 'تثبيت التطبيق (PWA)' : 'Install Standalone App (PWA)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {language === 'ar'
                ? 'ثبّت التطبيق على جهازك أو هاتفك ليعمل حتى دون اتصال بالإنترنت.'
                : 'Install TaskSlayer on your device to access it offline with zero latency.'}
            </p>
          </div>
        </div>

        {isInstalled ? (
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{language === 'ar' ? 'مثبّت بالفعل' : 'App Installed'}</span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs font-mono tracking-wider transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'ar' ? 'تثبيت التطبيق الآن' : 'Install App'}</span>
          </button>
        )}
      </div>

      {/* Manual Installation Instructions */}
      {showInstructions && !isInstalled && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 relative animate-fade-in">
          <button 
            onClick={() => setShowInstructions(false)}
            className="absolute top-3 right-3 rtl:right-auto rtl:left-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
            {language === 'ar' ? 'كيفية التثبيت اليدوي:' : 'How to install manually:'}
          </h4>
          
          {isIOS ? (
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside font-mono">
              <li>{language === 'ar' ? 'انقر على زر المشاركة ' : 'Tap the Share button '} <Share className="inline w-3 h-3 mx-1" /> {language === 'ar' ? 'في أسفل المتصفح (Safari).' : 'at the bottom of Safari.'}</li>
              <li>{language === 'ar' ? 'اختر "إضافة إلى الصفحة الرئيسية" (Add to Home Screen).' : 'Select "Add to Home Screen".'}</li>
              <li>{language === 'ar' ? 'انقر على "إضافة" (Add) في الزاوية العلوية.' : 'Tap "Add" in the top corner.'}</li>
            </ol>
          ) : (
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside font-mono">
              <li>{language === 'ar' ? 'انقر على قائمة المتصفح ' : 'Click the browser menu '} <MoreVertical className="inline w-3 h-3 mx-1" /> {language === 'ar' ? 'في الزاوية العلوية.' : 'in the top corner.'}</li>
              <li>{language === 'ar' ? 'ابحث عن "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".' : 'Look for "Install app" or "Add to Home screen".'}</li>
              <li>{language === 'ar' ? 'إذا كنت على جهاز كمبيوتر، قد تجد أيقونة التثبيت في شريط العنوان.' : 'On desktop, you may find an install icon inside the address bar.'}</li>
            </ol>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {language === 'ar' ? 'يعمل بدون إنترنت (Offline Ready)' : 'Offline Ready'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {language === 'ar' ? 'تزامن تلقائي' : 'Cloud Sync'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {language === 'ar' ? 'بدون إعلانات ومستقل' : 'Zero ads & standalone'}
        </span>
      </div>
    </div>
  );
}
