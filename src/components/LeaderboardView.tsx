import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Trophy, Medal, Award, Crown, Loader2, AlertCircle, Search, Shield, UserCheck, Flame, ShieldCheck, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { cn, calculateDailyStreak } from '../lib/utils';

interface LeaderboardUser {
  id: string;
  userName: string;
  userAvatar: string;
  level: number;
  xp: number;
  streak: number;
  title?: string;
}

export function LeaderboardView() {
  const { tasks, pomodoroStats, profile, language, t, userName, userAvatar } = useApp();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const currentUser = auth.currentUser;

  // Compute local user's live current streak
  const myLiveStreak = useMemo(() => {
    return calculateDailyStreak(tasks, pomodoroStats?.history);
  }, [tasks, pomodoroStats]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(100));
        const snapshot = await getDocs(q);
        
        const fetchedUsers: LeaderboardUser[] = [];
        let hasCurrentUserInDocs = false;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.profile || data.streak !== undefined) {
            const p = data.profile || {};
            const isMe = currentUser?.uid === doc.id;
            
            // Calculate streak using doc data or fallback
            const streakCount = isMe 
              ? Math.max(myLiveStreak, data.streak ?? p.streak ?? 0)
              : (data.streak ?? p.streak ?? calculateDailyStreak(data.tasks || [], data.pomodoroStats?.history));

            if (isMe) hasCurrentUserInDocs = true;

            fetchedUsers.push({
              id: doc.id,
              userName: isMe ? (userName || data.userName || auth.currentUser?.displayName || (language === 'ar' ? 'أنت' : 'You')) : (data.userName || (language === 'ar' ? 'بطل مجهول' : 'Unknown Hero')),
              userAvatar: isMe ? ((userAvatar && userAvatar !== 'default') ? userAvatar : (data.userAvatar || auth.currentUser?.photoURL || 'default')) : (data.userAvatar || 'default'),
              level: isMe ? (profile.level || p.level || 1) : (p.level || 1),
              xp: isMe ? (profile.xp || p.xp || 0) : (p.xp || 0),
              streak: streakCount || 0,
              title: p.title || '',
            });
          }
        });

        // If current user is logged in but not in fetched snapshot yet, add local entry
        if (currentUser && !hasCurrentUserInDocs) {
          fetchedUsers.push({
            id: currentUser.uid,
            userName: userName || auth.currentUser?.displayName || (language === 'ar' ? 'أنت' : 'You'),
            userAvatar: (userAvatar && userAvatar !== 'default') ? userAvatar : (auth.currentUser?.photoURL || 'default'),
            level: profile.level || 1,
            xp: profile.xp || 0,
            streak: myLiveStreak,
            title: profile.classTitle || '',
          });
        }

        // Sort by Level 1st, Streak 2nd, XP 3rd, Alphabetical 4th (Tie-breaker)
        fetchedUsers.sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          if (b.streak !== a.streak) return b.streak - a.streak;
          if (b.xp !== a.xp) return b.xp - a.xp;
          return a.userName.localeCompare(b.userName);
        });

        setUsers(fetchedUsers);
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message || 'Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [language, currentUser, myLiveStreak, profile]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return users.filter(u => u.userName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [users, searchQuery]);

  const top3 = useMemo(() => users.slice(0, 3), [users]);

  // Current user's index in the leaderboard
  const currentUserIndex = useMemo(() => {
    if (!currentUser) return -1;
    return users.findIndex(u => u.id === currentUser.uid);
  }, [users, currentUser]);

  const currentUserData = currentUserIndex !== -1 ? users[currentUserIndex] : null;

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-5 animate-fade-in pb-20 max-w-5xl mx-auto w-full min-w-0">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 rounded-2xl p-4 sm:p-6 shadow-lg border border-indigo-500/20 text-white relative overflow-hidden">
        <div className="absolute top-0 ltr:right-0 rtl:left-0 p-8 opacity-10 pointer-events-none hidden sm:block">
          <Trophy className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 text-amber-400 shrink-0 shadow-inner mt-0.5 sm:mt-0">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex flex-wrap items-center gap-2 leading-snug">
                <span>{language === 'ar' ? 'متصدرو السلسلة اليومية' : 'Daily Streaks Leaderboard'}</span>
                <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-orange-500/30 border border-orange-400/40 text-orange-200 font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                  Streak #1
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-xl leading-relaxed break-words">
                {language === 'ar' 
                  ? 'شاهد أفضل اللاعبين وتنافس على أعلى مستوى!'
                  : 'See the top players and compete for the highest level!'}
              </p>
            </div>
          </div>

          {/* Quick Stats overview on header */}
          {currentUserData && (
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/10 dark:bg-black/20 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-white/10 shrink-0 w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 sm:p-2 bg-orange-500/30 rounded-xl text-orange-300 shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-400 text-orange-400" />
                </div>
                <div className="text-xs font-mono">
                  <div className="text-indigo-200/70 uppercase text-[10px] font-bold">
                    {language === 'ar' ? 'رتبتك وسلسلتك' : 'Your Rank & Streak'}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    #{currentUserIndex + 1}
                  </div>
                </div>
              </div>
              <span className="text-amber-300 text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/20 border border-orange-400/30 shrink-0">
                <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 animate-pulse shrink-0" />
                {currentUserData.streak} {language === 'ar' ? 'يوم' : 'days'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Anti-Cheat & Streak Rules Explainer Box */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-indigo-950/80 rounded-2xl border border-indigo-500/30 shadow-md text-slate-200 text-xs leading-relaxed overflow-hidden">
        <button 
          onClick={() => setRulesExpanded(!rulesExpanded)}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 text-right rtl:text-right hover:bg-white/5 transition-all select-none focus:outline-none"
        >
          <div className="flex items-center gap-2 font-bold text-amber-400 text-xs sm:text-sm leading-snug break-words">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{language === 'ar' ? 'قواعد التنافس العادل ونظام منع الغش (Anti-Cheat Rule)' : 'Fair Play Rules & Anti-Cheat System'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-300 font-medium shrink-0 font-mono">
            <span>{rulesExpanded ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'عرض التفاصيل' : 'Show Details')}</span>
            {rulesExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
          </div>
        </button>
        
        {rulesExpanded && (
          <div className="p-3.5 sm:p-5 pt-0 border-t border-indigo-500/10 space-y-2.5 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 pt-3 text-[11px] text-slate-300">
              <div className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5 min-w-0">
                <Flame className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 leading-snug">
                  <strong className="text-white block font-bold mb-0.5">{language === 'ar' ? '1. السلسلة اليومية (معيار 1)' : '1. Daily Streak (Rank 1)'}</strong>
                  {language === 'ar' ? 'الترتيب الأساسي يُحسب بالأيام المتتالية التي تم فيها الوصول للحد الأدنى.' : 'Primary rank counts consecutive active days meeting minimum criteria.'}
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5 min-w-0">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 leading-snug">
                  <strong className="text-white block font-bold mb-0.5">{language === 'ar' ? '2. شرط تفعيل اليوم' : '2. Daily Minimum Qualification'}</strong>
                  {language === 'ar' ? 'يتحقق اليوم بإنجاز مهمة 1 على الأقل أو إتمام جلسة بومودورو واحدة.' : 'Achieved by completing at least 1 quest or 1 Pomodoro focus session.'}
                </div>
              </div>
              <div className="flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5 min-w-0">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 leading-snug">
                  <strong className="text-white block font-bold mb-0.5">{language === 'ar' ? '3. حماية ضد السكام' : '3. Anti-Spam Protection'}</strong>
                  {language === 'ar' ? 'إكمال 1000 مهمة عشوائية في يوم واحد يمنح "يوم واحد" فقط بالسلسلة ولن يغلب الالتزام المستمر!' : 'Creating 1,000 spam tasks in a day yields only 1 streak day and cannot beat real multi-week discipline.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-bold font-mono">{language === 'ar' ? 'جاري حساب السلاسل وتحميل لائحة الأبطال...' : 'Calculating streaks & loading leaderboard...'}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm text-red-500">
          <AlertCircle className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400">
          <Trophy className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-bold">{language === 'ar' ? 'لا يوجد أبطال مسجلين بعد.' : 'No heroes on the leaderboard yet.'}</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {top3.length > 0 && !searchQuery && (
            <div className="hidden md:grid md:grid-cols-3 gap-4 items-end pt-2">
              {/* 2nd Place */}
              {top3[1] ? (
                <div className="order-2 md:order-1 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-slate-400 transition-all">
                  <div className="absolute top-3 ltr:left-3 rtl:right-3 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-slate-400" /> #2
                  </div>
                  <div className="relative mt-4 mb-3">
                    <img 
                      src={top3[1].userAvatar !== 'default' ? top3[1].userAvatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].id}&backgroundColor=transparent`} 
                      alt="avatar" 
                      className="w-16 h-16 rounded-full border-2 border-slate-300 dark:border-slate-600 object-cover bg-slate-100 dark:bg-slate-900 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 border border-white dark:border-slate-800">
                      <Medal className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate max-w-full">
                    {top3[1].userName}
                  </h3>
                  
                  {/* Primary Streak Display */}
                  <div className="my-2.5 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-xs font-black border border-orange-500/20 flex items-center gap-1.5 shadow-sm">
                    <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse shrink-0" />
                    <span>{top3[1].streak} {language === 'ar' ? 'أيام متتالية' : 'Days Streak'}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span className="px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold">
                      {language === 'ar' ? 'Lvl' : 'Lvl'} {top3[1].level}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{top3[1].xp.toLocaleString()} XP</span>
                  </div>
                </div>
              ) : <div className="order-2 md:order-1 hidden md:block" />}

              {/* 1st Place (Center Champion Highlight) */}
              {top3[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-white to-amber-500/5 dark:from-amber-500/20 dark:via-slate-800 dark:to-slate-800/90 rounded-2xl p-6 border-2 border-amber-400/80 dark:border-amber-500/50 shadow-xl flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-all">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"></div>
                  <div className="absolute top-3 ltr:left-3 rtl:right-3 px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-black shadow-md flex items-center gap-1.5">
                    <Crown className="w-4 h-4 fill-slate-950" /> #1 {language === 'ar' ? 'البطل الملتزم' : 'Streak Champion'}
                  </div>
                  <div className="relative mt-5 mb-3">
                    <img 
                      src={top3[0].userAvatar !== 'default' ? top3[0].userAvatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].id}&backgroundColor=transparent`} 
                      alt="avatar" 
                      className="w-20 h-20 rounded-full border-4 border-amber-400 object-cover bg-amber-50 dark:bg-slate-900 shadow-lg"
                    />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 p-1.5 bg-amber-400 text-slate-950 rounded-full shadow-md animate-bounce">
                      <Crown className="w-5 h-5 fill-slate-950" />
                    </div>
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-amber-100 text-lg truncate max-w-full">
                    {top3[0].userName}
                  </h3>

                  {/* Primary Streak Display */}
                  <div className="my-2.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-mono text-sm font-black shadow-md flex items-center gap-1.5">
                    <Flame className="w-4.5 h-4.5 fill-slate-950 text-slate-950 animate-pulse shrink-0" />
                    <span>{top3[0].streak} {language === 'ar' ? 'أيام متتالية' : 'Days Streak'}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs font-bold">
                    <span className="px-2.5 py-0.5 rounded-full border border-amber-500/50 bg-amber-500/20 text-amber-900 dark:text-amber-200 shadow-sm">
                      {language === 'ar' ? 'Lvl' : 'Level'} {top3[0].level}
                    </span>
                    <span className="text-amber-800/60 dark:text-amber-200/60">•</span>
                    <span className="text-amber-900 dark:text-amber-200">{top3[0].xp.toLocaleString()} XP</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] ? (
                <div className="order-3 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-amber-600/50 transition-all">
                  <div className="absolute top-3 ltr:left-3 rtl:right-3 px-2.5 py-1 rounded-xl bg-amber-900/10 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold border border-amber-600/20 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> #3
                  </div>
                  <div className="relative mt-4 mb-3">
                    <img 
                      src={top3[2].userAvatar !== 'default' ? top3[2].userAvatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].id}&backgroundColor=transparent`} 
                      alt="avatar" 
                      className="w-16 h-16 rounded-full border-2 border-amber-600/50 object-cover bg-slate-100 dark:bg-slate-900 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full border border-white dark:border-slate-800">
                      <Award className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate max-w-full">
                    {top3[2].userName}
                  </h3>

                  {/* Primary Streak Display */}
                  <div className="my-2.5 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-xs font-black border border-orange-500/20 flex items-center gap-1.5 shadow-sm">
                    <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse shrink-0" />
                    <span>{top3[2].streak} {language === 'ar' ? 'أيام متتالية' : 'Days Streak'}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span className="px-2.5 py-0.5 rounded-full border border-amber-600/30 bg-amber-600/10 text-amber-800 dark:text-amber-300 font-bold">
                      {language === 'ar' ? 'Lvl' : 'Lvl'} {top3[2].level}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{top3[2].xp.toLocaleString()} XP</span>
                  </div>
                </div>
              ) : <div className="order-3 hidden md:block" />}
            </div>
          )}

          {/* Search & List Header Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث عن بطل...' : 'Search hero...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            
            <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 shrink-0">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>{language === 'ar' ? `إجمالي الأبطال: ${users.length}` : `Total Heroes: ${users.length}`}</span>
            </div>
          </div>

          {/* Main Rankings Table / List Container */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">{language === 'ar' ? 'البطل' : 'Hero'}</div>
              <div className="col-span-3 text-center">{language === 'ar' ? 'السلسلة اليومية 🔥' : 'Daily Streak 🔥'}</div>
              <div className="col-span-2 text-center">{language === 'ar' ? 'المستوى' : 'Level'}</div>
              <div className="col-span-2 ltr:text-right rtl:text-left">{language === 'ar' ? 'نقاط الخبرة (XP)' : 'Total XP'}</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredUsers.map((user) => {
                const isCurrentUser = currentUser?.uid === user.id;
                const actualRank = users.findIndex(u => u.id === user.id) + 1;

                let RankIcon = null;
                let rankStyle = 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50';

                if (actualRank === 1) {
                  RankIcon = Crown;
                  rankStyle = 'text-amber-500 bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/30';
                } else if (actualRank === 2) {
                  RankIcon = Medal;
                  rankStyle = 'text-slate-400 bg-slate-100 dark:bg-slate-500/20 border-slate-300 dark:border-slate-500/30';
                } else if (actualRank === 3) {
                  RankIcon = Award;
                  rankStyle = 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800/30';
                }

                return (
                  <div 
                    key={user.id} 
                    className={cn(
                      "flex md:grid md:grid-cols-12 items-center gap-2.5 sm:gap-4 p-3 sm:p-4 sm:px-6 transition-all hover:bg-indigo-50/30 dark:hover:bg-slate-700/30",
                      isCurrentUser && "bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 rtl:border-r-4 border-l-indigo-600 rtl:border-r-indigo-600"
                    )}
                  >
                    {/* Rank Number / Icon */}
                    <div className="md:col-span-1 flex items-center justify-center shrink-0">
                      <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shadow-sm", rankStyle)}>
                        {RankIcon ? <RankIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : actualRank}
                      </div>
                    </div>

                    {/* Hero Info */}
                    <div className="md:col-span-4 flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <img 
                          src={user.userAvatar !== 'default' ? user.userAvatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}&backgroundColor=transparent`} 
                          alt="avatar" 
                          className={cn(
                            "w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 object-cover bg-slate-100 dark:bg-slate-900 shadow-sm",
                            isCurrentUser ? "border-indigo-500" : "border-slate-200 dark:border-slate-600"
                          )} 
                        />
                        {isCurrentUser && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-indigo-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate flex items-center gap-1.5">
                          <span className="truncate">{user.userName}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-600 text-white font-bold uppercase tracking-wider shrink-0">
                              {language === 'ar' ? 'أنت' : 'You'}
                            </span>
                          )}
                        </div>
                        {user.title && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                            {user.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Daily Streak (Primary Ranking Field) */}
                    <div className="md:col-span-3 flex items-center justify-center shrink-0">
                      <div className={cn(
                        "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-mono text-[11px] sm:text-xs font-black border flex items-center gap-1 sm:gap-1.5 shadow-sm transition-all",
                        user.streak === 0 
                          ? "bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-slate-700/50 opacity-40" 
                          : "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30"
                      )}>
                        <Flame className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", user.streak === 0 ? "text-slate-400 dark:text-slate-500" : "fill-orange-500 text-orange-500 animate-pulse")} />
                        <span>{user.streak} {language === 'ar' ? 'أيام' : 'Days'}</span>
                      </div>
                    </div>

                    {/* Level */}
                    <div className="md:col-span-2 hidden md:flex items-center justify-center">
                      <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {language === 'ar' ? 'مستوى' : 'Lvl'} {user.level}
                      </span>
                    </div>

                    {/* XP */}
                    <div className="md:col-span-2 ltr:text-right rtl:text-left shrink-0">
                      <div className="flex flex-col ltr:items-end rtl:items-start md:ltr:items-end md:rtl:items-left">
                        <span className="hidden md:inline font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                          {user.xp.toLocaleString()} <span className="text-[10px] text-slate-400">XP</span>
                        </span>
                        <div className="md:hidden flex flex-col ltr:items-end rtl:items-start font-mono leading-tight">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {language === 'ar' ? `مستوى ${user.level}` : `Lvl ${user.level}`}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-0.5">
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">XP</span>
                            <span>{user.xp.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
