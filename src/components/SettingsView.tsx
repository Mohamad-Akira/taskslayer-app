import React, { useState } from 'react';
import { useApp, getMaxHpForLevel, getMaxMpForLevel, getXpToNextForLevel } from '../context/AppContext';
import { cn, compressImage } from '../lib/utils';
import { Settings, Globe, Moon, Sun, User as UserIcon, LogOut, Bell, ShieldAlert, ExternalLink, Camera, Wrench, RotateCcw, AlertTriangle, Check, Mail, Lock, LogIn, UserPlus, Loader2, Trash2 } from 'lucide-react';
import { googleSignIn, appleSignIn, signInWithEmail, signUpWithEmail, logout } from '../lib/firebase';
import { isNotificationSupported, getNotificationPermission, requestNotificationPermission, sendWebNotification } from '../utils/notifications';
import { PWAInstallBanner } from './PWAInstallBanner';

export function SettingsView() {
  const { 
    theme, 
    toggleTheme, 
    language, 
    setLanguage, 
    t,
    syncKey,
    userEmail,
    userName,
    userAvatar,
    updateUserProfile,
    setAuthModalOpen,
    disconnectSync,
    syncError,
    notificationsEnabled,
    setNotificationsEnabled,
    triggerTodayReminders,
    profile,
    setProfile,
    addLog,
    resetToDefaults,
    deleteAccount,
  } = useApp();

  const [successMsg, setSuccessMsg] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(getNotificationPermission());
  
  const [editingName, setEditingName] = useState(userName || '');
  const [editingAvatar, setEditingAvatar] = useState(userAvatar || 'default');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAdmin = userEmail?.toLowerCase() === 'mahmad.shekh.omar@gmail.com' || userEmail?.toLowerCase() === 'ma7mad.kira@gmail.com';
  const [adminLevelInput, setAdminLevelInput] = useState(profile?.level?.toString() || '1');
  const [authError, setAuthError] = useState<string | null>(null);

  // Email & Password Auth State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        try {
          await signUpWithEmail(emailInput.trim(), passwordInput, nameInput.trim() || undefined);
        } catch (signUpErr: any) {
          if (signUpErr.code === 'auth/email-already-in-use') {
            // Automatically attempt sign-in with the provided password
            await signInWithEmail(emailInput.trim(), passwordInput);
          } else {
            throw signUpErr;
          }
        }
      } else {
        await signInWithEmail(emailInput.trim(), passwordInput);
      }
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
    } catch (err: any) {
      console.error('Email auth error:', err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthMode('signin');
        msg = language === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى إدخال كلمة المرور الصحيحة لتسجيل الدخول.' : 'This email is already registered. Please enter your password to sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = language === 'ar' ? 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)' : 'Password must be at least 6 characters';
      } else if (err.code === 'auth/invalid-email') {
        msg = language === 'ar' ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = language === 'ar' 
          ? 'تسجيل الدخول بالبريد غير مفعّل في مشروع Firebase. يرجى تفعيله من Firebase Console (Authentication > Sign-in method) أو استخدام الدخول بـ Google.' 
          : 'Email/Password sign-in is disabled in Firebase. Enable it in Firebase Console (Authentication > Sign-in method) or use Google Sign-In.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = language === 'ar' 
          ? 'فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت أو أداة حظر الإعلانات.' 
          : 'Network connection failed. Please check your internet connection or ad blocker.';
      }
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      disconnectSync();
      document.cookie = "oauth2_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      await logout();
    } catch (err: any) {
      console.error('Sign out error:', err);
      setAuthError(err.message || (language === 'ar' ? 'فشل تسجيل الخروج' : 'Failed to sign out'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Keep editingName and editingAvatar in sync with context when they load/change
  React.useEffect(() => {
    if (userName) {
      setEditingName(userName);
    }
    if (userAvatar) {
      setEditingAvatar(userAvatar);
    }
  }, [userName, userAvatar]);

  React.useEffect(() => {
    if (profile?.level) {
      setAdminLevelInput(profile.level.toString());
    }
  }, [profile?.level]);

  const handleLevelChange = (newLevel: number) => {
    if (newLevel < 1) return;
    const newMaxHp = getMaxHpForLevel(newLevel);
    const newMaxMp = getMaxMpForLevel(newLevel);
    const newXpToNext = getXpToNextForLevel(newLevel);

    setProfile(prev => ({
      ...prev,
      level: newLevel,
      xp: 0,
      xpToNextLevel: newXpToNext,
      hp: newMaxHp,
      maxHp: newMaxHp,
      mp: newMaxMp,
      maxMp: newMaxMp
    }));

    addLog(
      language === 'ar' 
        ? `⚙️ تم تعديل المستوى إلى ${newLevel} عبر لوحة التحكم` 
        : `⚙️ Level set to ${newLevel} via developer console`, 
      'level_up'
    );

    setSuccessMsg(
      language === 'ar'
        ? `تم تحديث المستوى إلى ${newLevel} بنجاح! 👑`
        : `Level successfully set to ${newLevel}! 👑`
    );
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div 
      className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" />
            {t('settings')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar' ? 'إدارة تفضيلات التطبيق' : 'Manage your app preferences.'}
          </p>
        </div>

        {/* PWA App Installation Card */}
        <PWAInstallBanner />

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  {language === 'ar' ? 'الملف الشخصي' : 'User Profile'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'تخصيص اسم المستخدم وصورة بطل القصة الخاصة بك' : 'Customize your username and hero avatar'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Avatar Selection & Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center overflow-hidden shadow-md select-none relative group">
                  {editingAvatar && editingAvatar.startsWith('emoji:') ? (
                    <span className="text-4xl">{editingAvatar.substring(6)}</span>
                  ) : editingAvatar && (editingAvatar.startsWith('data:image') || editingAvatar.startsWith('http')) ? (
                    <img src={editingAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Avatar" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-indigo-500" />
                  )}
                </div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500">
                  {language === 'ar' ? 'المظهر الحالي' : 'Current Vibe'}
                </span>
              </div>

              {/* Selection controls */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400 mb-2">
                    {language === 'ar' ? 'اختر رمز بطل القصة' : 'Choose Hero Avatar'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAvatar('default')}
                      title={language === 'ar' ? 'الافتراضي' : 'Default Profile'}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border",
                        editingAvatar === 'default'
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:scale-105 text-slate-500 hover:text-indigo-600"
                      )}
                    >
                      <UserIcon className="w-5 h-5" />
                    </button>
                    {[
                      { emoji: '🧙‍♂️', label: language === 'ar' ? 'ساحر' : 'Mage' },
                      { emoji: '⚔️', label: language === 'ar' ? 'محارب' : 'Warrior' },
                      { emoji: '🛡️', label: language === 'ar' ? 'فارس' : 'Paladin' },
                      { emoji: '🐱', label: language === 'ar' ? 'قط مبرمج' : 'Coder Cat' },
                      { emoji: '🦊', label: language === 'ar' ? 'ثعلب' : 'Swift Fox' },
                      { emoji: '🦄', label: language === 'ar' ? 'وحيد قرن' : 'Unicorn' },
                      { emoji: '🐉', label: language === 'ar' ? 'تنين' : 'Dragon' },
                      { emoji: '💻', label: language === 'ar' ? 'فارس بايت' : 'Byte Knight' },
                    ].map((item) => {
                      const itemKey = `emoji:${item.emoji}`;
                      const isSelected = editingAvatar === itemKey;
                      return (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => setEditingAvatar(itemKey)}
                          title={item.label}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer border",
                            isSelected 
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm" 
                              : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:scale-105"
                          )}
                        >
                          {item.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Image Upload */}
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-lg text-xs font-bold font-mono tracking-wide shadow-sm flex items-center gap-1.5 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'ar' ? 'تحميل صورة مخصصة' : 'Upload custom image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file, 256, 0.8);
                            setEditingAvatar(compressed);
                            setProfileSuccessMsg(language === 'ar' ? 'تم اختيار الصورة، اضغط حفظ التغييرات للتأكيد' : 'Image selected, press save changes to confirm');
                            setTimeout(() => setProfileSuccessMsg(''), 3000);
                          } catch (err) {
                            console.error('Error compressing avatar image:', err);
                          }
                        }
                      }}
                    />
                  </label>
                  {editingAvatar !== 'default' && (
                    <button
                      onClick={() => {
                        setEditingAvatar('default');
                        setProfileSuccessMsg(language === 'ar' ? 'تمت إعادة تعيين الصورة الشخصية' : 'Profile image reset');
                        setTimeout(() => setProfileSuccessMsg(''), 3000);
                      }}
                      className="text-xs text-rose-500 hover:underline font-mono font-bold"
                    >
                      {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400">
                {language === 'ar' ? 'اسم المستخدم بطل المغامرة' : 'Hero Username'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder={language === 'ar' ? 'البطل الصاعد' : 'Rising Hero'}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  onClick={() => {
                    const trimmed = editingName.trim();
                    updateUserProfile(trimmed, editingAvatar);
                    setProfileSuccessMsg(language === 'ar' ? 'تم حفظ التعديلات بنجاح! ⚔️' : 'Profile saved successfully! ⚔️');
                    setTimeout(() => setProfileSuccessMsg(''), 3000);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs font-mono tracking-wider uppercase transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save changes'}
                </button>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/20 dark:border-emerald-500/10 flex items-center gap-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Admin/Developer Section */}
        {isAdmin && (
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-2xl p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-amber-500/10 pb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 dark:text-amber-300">
                  {language === 'ar' ? 'لوحة تحكم المطور والمسؤول 👑' : 'Developer & Admin Console 👑'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar' 
                    ? `مرحباً بك، تم التحقق من بريدك الإلكتروني كمسؤول (${userEmail})` 
                    : `Welcome, verified admin email: (${userEmail})`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600 dark:text-slate-300">
                {language === 'ar' ? 'تعديل مستوى البطل مباشرة' : 'Direct Hero Level Modifier'}
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const l = Math.max(1, (profile?.level || 1) - 5);
                      handleLevelChange(l);
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs font-mono transition-colors cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const l = Math.max(1, (profile?.level || 1) - 1);
                      handleLevelChange(l);
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs font-mono transition-colors cursor-pointer"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={adminLevelInput}
                    onChange={(e) => setAdminLevelInput(e.target.value)}
                    className="flex-1 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const l = (profile?.level || 1) + 1;
                      handleLevelChange(l);
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs font-mono transition-colors cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const l = (profile?.level || 1) + 5;
                      handleLevelChange(l);
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs font-mono transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(adminLevelInput, 10);
                    if (!isNaN(parsed) && parsed >= 1) {
                      handleLevelChange(parsed);
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-xs font-mono tracking-wider uppercase transition-colors shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{language === 'ar' ? 'تطبيق المستوى' : 'Apply Level'}</span>
                </button>
              </div>

              {successMsg && (
                <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5 animate-fadeIn">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic mt-1 leading-relaxed">
                {language === 'ar'
                  ? '💡 ملاحظة: تغيير المستوى سيقوم بإعادة حساب الحد الأقصى لنقاط الصحة (HP) ونقاط التركيز (MP) تلقائياً بناءً على المستوى الجديد مع شحن طاقتك بالكامل وتصفير نقاط الخبرة الحالية.'
                  : '💡 Note: Modifying level will automatically calculate and scale max HP and MP based on the new level, fully recharge your hero, and reset current XP to 0.'}
              </div>

              {/* Admin Notification Test Section */}
              <div className="pt-3 border-t border-amber-500/20 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider font-mono text-slate-600 dark:text-slate-300">
                  {language === 'ar' ? 'اختبار الإشعارات الفورية (المسؤول)' : 'Admin Push Notification Test'}
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!notificationsEnabled) {
                        setNotificationsEnabled(true);
                      }
                      if (isNotificationSupported() && getNotificationPermission() === 'default') {
                        await requestNotificationPermission();
                      }
                      sendWebNotification(
                        language === 'ar' ? '⚔️ إشعار تجريبي للمسؤول | TaskSlayer' : '⚔️ Admin Test Notification | TaskSlayer',
                        {
                          body: language === 'ar'
                            ? 'نظام الإشعارات يعمل بنجاح! تذكير ببطولاتك وإنجازاتك في اللعبة 🏆'
                            : 'Notification system is working perfectly! Keep up your heroic productivity streak 🏆',
                          requireInteraction: true
                        }
                      );
                      setSuccessMsg(
                        language === 'ar' 
                          ? 'تم إرسال إشعار مسؤول تجريبي بنجاح! 🔔' 
                          : 'Admin test notification sent successfully! 🔔'
                      );
                      setTimeout(() => setSuccessMsg(null), 4000);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs font-mono tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تجربة إشعار المسؤول 🔔' : 'Test Admin Notification 🔔'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* Auth Settings */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    {language === 'ar' ? 'الحساب والمزامنة السحابية' : 'Account & Cloud Sync'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {syncKey 
                      ? (language === 'ar' ? 'حسابك متصل ومزامن تلقائياً' : 'Your account is connected and auto-synced') 
                      : (language === 'ar' ? 'سجل دخولك لحفظ بياناتك ومزامنتها عبر جميع أجهزتك' : 'Sign in to save and sync your data across devices')}
                  </p>
                </div>
              </div>

              {!syncKey && (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/20 shrink-0 border border-indigo-500/30"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                </button>
              )}
            </div>

            {syncKey && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/20">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {userName || (language === 'ar' ? 'مستخدم مسجّل' : 'Registered User')}
                    </div>
                    <div className="text-xs text-slate-500 font-mono break-all">
                      {userEmail || syncKey}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={isAuthLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-mono font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-rose-200 dark:border-rose-900/50"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              </div>
            )}

            {syncError && (
              <div className="text-xs text-rose-500 font-bold font-mono mt-3 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
                {syncError}
              </div>
            )}
          </div>

          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('language')}</h3>
                <p className="text-xs text-slate-500">{language === 'ar' ? 'اختر لغتك المفضلة' : 'Select your preferred language'}</p>
              </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                  language === 'en' ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all font-sans",
                  language === 'ar' ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                العربية
              </button>
            </div>
          </div>

          {/* Web Notifications Settings */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-col gap-4 text-left rtl:text-right">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('notifications')}</h3>
                  <p className="text-xs text-slate-500 max-w-md">{t('notifications_desc')}</p>
                </div>
              </div>
              
              <div className="shrink-0">
                {isNotificationSupported() ? (
                  <button
                    onClick={async () => {
                      if (notificationsEnabled) {
                        setNotificationsEnabled(false);
                      } else {
                        const perm = await requestNotificationPermission();
                        setPermissionStatus(perm);
                        
                        // Always enable notifications so that the custom, gorgeous in-app 
                        // fallback cards and chime sounds function, regardless of browser-level blocks.
                        setNotificationsEnabled(true);
                        
                        sendWebNotification(language === 'ar' ? 'تم تفعيل الإشعارات بنجاح! 🎉' : 'Notifications enabled successfully! 🎉', {
                          body: language === 'ar' ? 'ستصلك الآن تذكيرات بمهام اليوم وتنبيهات بومودورو.' : 'You will now receive reminders for today\'s tasks and Pomodoro alerts.',
                        });
                      }
                    }}
                    className={cn(
                      "w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-bold transition-all border cursor-pointer",
                      notificationsEnabled 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" 
                        : "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-sm"
                    )}
                  >
                    {notificationsEnabled ? t('disable_notifications') : t('enable_notifications')}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                    {t('notification_not_supported')}
                  </span>
                )}
              </div>
            </div>

            {/* If notifications are active, show quick actions & status */}
            {isNotificationSupported() && notificationsEnabled && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-1">
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  {permissionStatus === 'granted' ? (
                    language === 'ar' ? 'الإشعارات نشطة (النظام والمتصفح)' : 'Notifications are active (Native & In-app)'
                  ) : (
                    language === 'ar' ? 'الإشعارات نشطة (البرنامج الداخلي)' : 'Notifications are active (In-app Fallback)'
                  )}
                </div>
                
                <div className="flex gap-2 sm:ml-auto rtl:sm:mr-auto rtl:sm:ml-0">
                  <button
                    onClick={() => {
                      sendWebNotification(t('test_notification'), {
                        body: t('test_notification_sent'),
                      });
                    }}
                    className="flex-1 sm:flex-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    {t('test_notification')}
                  </button>
                  <button
                    onClick={() => {
                      triggerTodayReminders();
                    }}
                    className="flex-1 sm:flex-none bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/20 dark:border-indigo-800/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    {t('remind_me_now')}
                  </button>
                </div>
              </div>
            )}

            {/* If permission is denied */}
            {isNotificationSupported() && permissionStatus === 'denied' && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/30 dark:border-amber-500/10 text-amber-800 dark:text-amber-300 text-xs mt-1">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p>{t('notification_denied_tip')}</p>
                  <button 
                    onClick={async () => {
                      const perm = await requestNotificationPermission();
                      setPermissionStatus(perm);
                      if (perm === 'granted') {
                        setNotificationsEnabled(true);
                      }
                    }}
                    className="text-indigo-500 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {language === 'ar' ? 'إعادة طلب الإذن' : 'Re-request permission'}
                  </button>
                </div>
              </div>
            )}

            {/* Iframe advice note */}
            {isNotificationSupported() && (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5 leading-normal">
                {language === 'ar' 
                  ? '💡 ملاحظة: تمنع بعض المتصفحات تفعيل الإشعارات داخل إطار المعاينة. إذا واجهت مشكلة، يرجى فتح التطبيق في نافذة مستقلة عبر زر "فتح في علامة تبويب جديدة" بالأعلى لتشغيلها بشكل ممتاز.'
                  : '💡 Note: Some browsers block notification requests inside iframe previews. If you face issues, click "Open in New Tab" at the top of the preview to grant permissions and test notifications on a standalone page.'}
              </div>
            )}
          </div>

          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('dark_mode')}</h3>
                <p className="text-xs text-slate-500">{language === 'ar' ? 'تغيير مظهر التطبيق' : 'Toggle app appearance'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 cursor-pointer",
                theme === 'dark' 
                  ? "bg-slate-800 text-amber-400 border-amber-500/20 hover:bg-slate-700" 
                  : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
              )}
            >
              {theme === 'dark' ? '☀️ ' : '🌙 '}
              <span>{theme === 'dark' ? t('light_mode') : t('dark_mode')}</span>
            </button>
          </div>

          {/* Reset to Defaults Section */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-50/40 dark:bg-[#1d293d]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  {language === 'ar' ? 'إعادة ضبط كل شيء للافتراضي' : 'Reset All to Default'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ar' 
                    ? 'إعادة ضبط المهام، المستوى، الذهب والمؤشر للقيم الافتراضية (مع الاحتفاظ بالاسم والصورة)' 
                    : 'Reset all tasks, RPG stats, and settings to defaults (preserves username & avatar)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowResetModal(true)}
              className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'ar' ? 'إعادة الضبط للافتراضي' : 'Reset to Default'}</span>
            </button>
          </div>

          {/* Delete Account Section */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-100/50 dark:bg-[#1d293d] border-t border-red-200/60 dark:border-[#324258]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-200/80 dark:bg-red-900/50 rounded-lg text-red-700 dark:text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {language === 'ar' ? 'حذف الحساب' : 'Delete Account'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ar' 
                    ? 'حذف جميع بيانات المستخدم والمهام والمستوى والمزامنة نهائياً' 
                    : 'Permanently delete all user data, tasks, RPG stats, settings, and log out'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-[#ec003f] hover:bg-[#c90035] active:bg-[#a8002c] text-white font-bold px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'حذف الحساب' : 'Delete Account'}</span>
            </button>
          </div>

          {resetSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-200/50 dark:border-emerald-800/40 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{resetSuccessMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Reset to Defaults */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 text-left rtl:text-right">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/50 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'ar' ? 'تأكيد إعادة الضبط للافتراضي' : 'Confirm Reset to Defaults'}
                </h3>
                <p className="text-xs text-rose-500 font-mono font-bold">
                  {language === 'ar' ? 'إجراء سينفذ فوراً' : 'Action will execute immediately'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'ar' 
                ? 'هل أنت تأكد من إرادتك لإعادة ضبط جميع البيانات والمهام والمستوى والذهب ومؤقت بومودورو والسجلات إلى القيم الافتراضية؟' 
                : 'Are you sure you want to reset all tasks, RPG level, gold, Pomodoro stats, and logs back to default values?'}
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span className="text-base shrink-0">🛡️</span>
              <span className="font-bold">
                {language === 'ar' 
                  ? 'ملاحظة: سيتم الاحتفاظ باسمك وصورتك الشخصية كما هي دون أي تغيير!' 
                  : 'Note: Your username and profile picture will remain untouched!'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  resetToDefaults();
                  setShowResetModal(false);
                  setResetSuccessMsg(
                    language === 'ar' 
                      ? 'تمت إعادة ضبط كل شيء للقيم الافتراضية بنجاح! (تم الاحتفاظ بالاسم والصورة)' 
                      : 'Successfully reset everything to default values! (Username & avatar preserved)'
                  );
                  setTimeout(() => setResetSuccessMsg(''), 5000);
                }}
                className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'نعم، إعادة الضبط' : 'Yes, Reset All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Account */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-5 text-left rtl:text-right">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'تأكيد حذف الحساب' : 'Confirm Account Deletion'}
                </h3>
                <p className="text-xs text-red-500 font-mono font-bold">
                  {language === 'ar' ? 'إجراء نهائي لا يمكن التراجع عنه' : 'Irreversible permanent action'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'ar' 
                ? 'هل أنت تأكد من رغبتك في حذف الحساب؟ سيتم مسح جميع بياناتك والمهام والمستوى والذهب والإنجازات وتسجيل الخروج نهائياً.' 
                : 'Are you sure you want to delete your account? All your data, tasks, RPG level, gold, achievements, and settings will be permanently wiped, and you will be logged out.'}
            </p>

            <div className="bg-red-50 dark:bg-red-950/50 p-3.5 rounded-xl border border-red-200/60 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <span className="font-bold">
                {language === 'ar' 
                  ? 'تحذير: سيتم مسح كل ما يتعلق بالمستخدم فوراً ولن تتمكن من استعادتها.' 
                  : 'Warning: Everything associated with this user will be deleted immediately and cannot be recovered.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await deleteAccount();
                  setShowDeleteModal(false);
                }}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'نعم، حذف الحساب نهائياً' : 'Yes, Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
