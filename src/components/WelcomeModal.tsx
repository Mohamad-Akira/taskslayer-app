import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleSignIn, appleSignIn, signInWithEmail, signUpWithEmail } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { 
  Crown, 
  ShieldAlert, 
  Swords, 
  Sparkles, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  Loader2, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft,
  Globe,
  X
} from 'lucide-react';

export function WelcomeModal() {
  const { language, setLanguage, isAuthModalOpen, setAuthModalOpen } = useApp();
  const isAr = language === 'ar';

  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [initializing, setInitializing] = useState(true);
  const [step, setStep] = useState<'welcome' | 'rejected' | 'auth'>('welcome');
  
  // Auth state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [allowGuest, setAllowGuest] = useState<boolean>(() => {
    return sessionStorage.getItem('rpg_allow_guest') === 'true';
  });

  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('auth');
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthModalOpen(false);
      } else {
        // Reset to welcome screen when user logs out
        setStep('welcome');
        sessionStorage.removeItem('rpg_allow_guest');
        setAllowGuest(false);
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, [setAuthModalOpen]);

  const handleGuestEntry = () => {
    sessionStorage.setItem('rpg_allow_guest', 'true');
    setAllowGuest(true);
    setAuthModalOpen(false);
  };

  // While Firebase auth status is initializing, or if not open and user is logged in or allowed guest mode
  if (initializing) {
    return null;
  }

  if (!isAuthModalOpen && (currentUser || allowGuest)) {
    return null;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      let msg = err.message || 'حدث خطأ أثناء تسجيل الدخول';
      if (err.code === 'auth/email-already-in-use') {
        msg = isAr ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email is already in use';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password';
      } else if (err.code === 'auth/weak-password') {
        msg = isAr ? 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)' : 'Password should be at least 6 characters';
      }
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await googleSignIn();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError(isAr ? 'تم حظر النافذة المنبثقة من قِبل المتصفح.' : 'Popup blocked by browser.');
      } else {
        setAuthError(err.message || (isAr ? 'فشل تسجيل الدخول بواسطة Google' : 'Google sign-in failed'));
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      await appleSignIn();
    } catch (err: any) {
      console.error('Apple sign in error:', err);
      setAuthError(err.message || (isAr ? 'فشل تسجيل الدخول بواسطة Apple' : 'Apple sign-in failed'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans select-none">
      <div className="max-w-md w-full bg-slate-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 relative overflow-hidden text-center text-white">
        
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar: Language Switcher */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono font-bold">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Language</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer font-mono",
                  language === 'en' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer font-sans",
                  language === 'ar' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                العربية
              </button>
            </div>
            {(allowGuest || currentUser || isAuthModalOpen) && (
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(false);
                  if (!currentUser && !allowGuest) {
                    sessionStorage.setItem('rpg_allow_guest', 'true');
                    setAllowGuest(true);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div className="space-y-6 animate-scale-in">
            {/* Crown & RPG Emblem */}
            <div className="flex justify-center pt-2">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full blur-md opacity-60 animate-pulse" />
                <div className="relative bg-slate-950 p-5 rounded-full border border-amber-400/50 shadow-xl flex items-center justify-center">
                  <Crown className="w-12 h-12 text-amber-400 fill-amber-400/20" />
                </div>
              </div>
            </div>

            {/* Title / Question */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'نداء الأبطال' : 'Heroes Call'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
                {isAr 
                  ? 'مرحباً بك أيها المغامر، هل أنت مستعد لتصبح الأفضل في هذا العالم؟'
                  : 'Welcome, Adventurer! Are you ready to become the greatest in this world?'}
              </h2>
            </div>

            {/* Yes / No Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('auth')}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/30"
              >
                <Swords className="w-4 h-4" />
                <span>{isAr ? 'نعم، أنا مستعد!' : 'Yes, I am ready!'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('rejected')}
                className="w-full py-3 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 font-bold text-xs border border-slate-800 transition-all cursor-pointer"
              >
                {isAr ? 'لا' : 'No'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REJECTED SCREEN */}
        {step === 'rejected' && (
          <div className="space-y-6 animate-scale-in">
            <div className="flex justify-center pt-2">
              <div className="relative">
                <div className="absolute -inset-2 bg-red-600/30 rounded-full blur-md opacity-60" />
                <div className="relative bg-slate-950 p-5 rounded-full border border-red-500/40 shadow-xl flex items-center justify-center">
                  <ShieldAlert className="w-12 h-12 text-red-400" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-black text-red-400 leading-snug">
                {isAr
                  ? 'للأسف يبدو أنك غير مؤهل لتصبح شخصاً ذا مكانة عالية.'
                  : 'Unfortunately, it seems you are not qualified to become a person of high status.'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                {isAr
                  ? 'المجد والبطولة يتطلبان الشجاعة والإصرار... أعد التفكير عندما تشعر بالاستعداد لرفع السيف!'
                  : 'Glory and heroism require courage and determination... Reconsider when you are ready!'}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>{isAr ? 'أعد التفكير (أنا مستعد الآن!)' : 'Reconsider (I\'m ready now!)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AUTH SCREEN (Sign In / Sign Up) */}
        {step === 'auth' && (
          <div className="space-y-5 text-left rtl:text-right animate-scale-in">
            {/* Top Bar / Back */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="text-xs font-bold text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{isAr ? 'رجوع' : 'Back'}</span>
              </button>
              <div className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>{isAr ? 'إنشاء هويتك' : 'Create Identity'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-white text-center">
                {isAr ? 'اختر كيف تنشئ حسابك' : 'Choose how to create your account'}
              </h3>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                {isAr ? 'ليتم حفظ مستواك وإنجازاتك في لائحة الأبطال' : 'To save your level and rank on the leaderboard'}
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 font-semibold text-center">
                {authError}
              </div>
            )}

            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                className={cn(
                  "flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  authMode === 'signup' 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAr ? 'حساب جديد' : 'Sign Up'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                className={cn(
                  "flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  authMode === 'signin' 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {isAr ? 'اسم البطل' : 'Hero Display Name'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={isAr ? 'مثال: الفارس أحمد' : 'e.g. Sir Alex'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-9 rtl:pr-9 rtl:pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-9 rtl:pr-9 rtl:pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-9 rtl:pr-9 rtl:pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50"
              >
                {isAuthLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>
                    {authMode === 'signin'
                      ? (isAr ? 'تسجيل الدخول' : 'Sign In')
                      : (isAr ? 'إنشاء حساب وبدء المغامرة' : 'Create Account & Start')}
                  </span>
                )}
              </button>
            </form>

            {/* Social Logins */}
            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-[10px] text-slate-500 font-mono">
                {isAr ? 'أو عبر' : 'OR WITH'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="w-full bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-800 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isAuthLoading}
                className="w-full bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-800 shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.36-6.1-3.23-2.63-7.16-7.23-11.8-13.82-5.78-8.19-10.42-17.65-13.93-28.38-3.51-10.73-5.26-21.14-5.26-31.23 0-14.83 3.82-27.18 11.47-37.05 7.65-9.87 17.38-14.89 29.19-15.05 4.34 0 9.38 1.12 15.13 3.36 5.75 2.24 9.87 3.36 12.36 3.36 2.12 0 6.31-1.16 12.57-3.48 6.26-2.32 11.19-3.39 14.79-3.22 10.97.53 19.86 4.37 26.67 11.53-9.72 5.88-14.45 14.15-14.19 24.81.26 8.35 3.51 15.39 9.75 21.12 6.24 5.73 13.72 9.08 22.44 10.05-2.02 6.13-4.63 12.18-7.83 18.15zM119.22 31.81c0-7.38 2.65-14.32 7.95-20.82 5.3-6.5 11.83-10.37 19.59-11.61.13.92.2 1.83.2 2.73 0 7.21-2.73 14.12-8.19 20.73-5.46 6.61-12.1 10.46-19.92 11.55-.13-.88-.2-1.74-.2-2.58z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>

            {/* Optional Guest Entry */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleGuestEntry}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-semibold underline cursor-pointer"
              >
                {isAr ? 'الدخول كضيف مؤقت (بدون حفظ سحابي)' : 'Continue as Guest (No Cloud Sync)'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
