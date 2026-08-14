import React, { useState } from 'react';
import { useApp, getHeroClassTitle } from '../context/AppContext';
import { 
  Shield, Sparkles, Heart, Zap, Award, BookOpen, Paintbrush, Terminal, 
  Coins, Trash2, Flame, Gamepad2, Tv, RefreshCw, Cloud, Link, Check, 
  AlertCircle, LogOut, Key, User, Edit3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskSlayerLogo } from './TaskSlayerLogo';
import { ProductivityIdentityCard } from './ProductivityIdentityCard';

export function HeroDashboard() {
  const { 
    profile, 
    gameLogs, 
    clearLogs, 
    useEntertainment, 
    t, 
    language,
    syncKey,
    isSyncing,
    lastSyncTime,
    syncError,
    generateSyncKey,
    connectSyncKey,
    syncData,
    disconnectSync,
    userName,
    userEmail,
    userAvatar,
    setCurrentView
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : (language === 'ar' ? 'البطل' : 'Hero'));

  const renderDashboardAvatar = () => {
    if (userAvatar && userAvatar.startsWith('emoji:')) {
      return <span className="text-4xl select-none">{userAvatar.substring(6)}</span>;
    }
    if (userAvatar && (userAvatar.startsWith('data:image') || userAvatar.startsWith('http'))) {
      return <img src={userAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Avatar" />;
    }
    return <Shield className="w-7 h-7 md:w-8 md:h-8" />;
  };

  // Percentage calculations
  const hpPercent = Math.min(100, Math.max(0, (profile.hp / profile.maxHp) * 100));
  const mpPercent = Math.min(100, Math.max(0, (profile.mp / profile.maxMp) * 100));
  const xpPercent = Math.min(100, Math.max(0, (profile.xp / profile.xpToNextLevel) * 100));

  const heroClassTitle = getHeroClassTitle(profile.level, profile.pillars, language);

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-left rtl:text-right"
    >
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {/* RPG Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-250 dark:border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <TaskSlayerLogo className="w-8 h-8 md:w-10 md:h-10 shrink-0 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
              <span>{language === 'ar' ? 'شاشة الحالة' : 'Hero Status Screen'}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {language === 'ar' ? 'تحويل الحياة والبرمجة والإنجازات اليومية إلى لعبة.' : 'Gamifying life, code, and daily accomplishments.'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-550/10 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 self-start sm:self-auto shrink-0">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin shrink-0" />
            <span className="font-normal">{language === 'ar' ? 'الفئة' : 'CLASS'}: <span className="font-bold">{heroClassTitle.toUpperCase()}</span></span>
          </div>
        </div>

        {/* Profile Card & HP/MP Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm dark:shadow-xl">
          {/* Avatar and Info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center text-white shadow-lg border border-indigo-400/30 overflow-hidden">
                {renderDashboardAvatar()}
              </div>
              <span className="absolute -bottom-2 -right-2 rtl:-right-auto rtl:-left-2 bg-indigo-600 text-white font-mono font-bold text-[10px] md:text-xs px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow">
                {language === 'ar' ? 'مستوى' : 'LV'}.{profile.level}
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white leading-tight">
                  {displayName}
                </h2>
                <button
                  onClick={() => setCurrentView('settings')}
                  title={language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                {heroClassTitle}
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {language === 'ar' 
                  ? `المستوى التالي: بحاجة إلى ${profile.xpToNextLevel - profile.xp} خبرة (XP)`
                  : `Next level: ${profile.xpToNextLevel - profile.xp} XP needed`}
              </p>
            </div>
          </div>

          {/* Quick Gold Wallet */}
          <div className="flex items-center justify-start sm:justify-end">
            <div className="bg-amber-500/10 border border-amber-500/20 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl flex items-center gap-3 shadow-sm w-full sm:w-auto">
              <Coins className="w-5 h-5 md:w-6 md:h-6 text-amber-550 dark:text-amber-400 fill-amber-500/10 animate-bounce shrink-0" />
              <div>
                <span className="block text-[9px] md:text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold uppercase tracking-wider">{language === 'ar' ? 'رصيد الذهب' : 'Gold Balance'}</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-amber-600 dark:text-white">{profile.gold}{language === 'ar' ? 'ذ' : 'g'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bars layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* HP Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Heart className="w-4 h-4 text-red-500 fill-current shrink-0" />
                <span>{language === 'ar' ? 'الصحة (HP)' : 'Health (HP)'}</span>
              </span>
              <span className="font-mono text-red-600 dark:text-red-400">{profile.hp.toLocaleString()}/{profile.maxHp.toLocaleString()} HP</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-600 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* MP Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 md:p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Zap className="w-4 h-4 text-cyan-500 dark:text-cyan-400 fill-current shrink-0" />
                <span>{language === 'ar' ? 'المانا / طاقة التركيز (MP)' : 'Mana / Focus Energy (MP)'}</span>
              </span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400">{profile.mp.toLocaleString()}/{profile.maxMp.toLocaleString()} MP</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                 className="bg-gradient-to-r from-cyan-500 to-[#82dde8] h-full rounded-full transition-all duration-500"
                style={{ width: `${mpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-bold">
              <Flame className="w-4 h-4 text-purple-500 fill-purple-500/20 shrink-0" />
              <span>{language === 'ar' ? 'رصيد الخبرة (XP)' : 'Experience (XP) Balance'}</span>
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">{profile.xp} / {profile.xpToNextLevel} XP</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/50">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Productivity Identity Card & Weekly Evaluation */}
        <ProductivityIdentityCard />

        {/* Available Entertainment Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <span>{language === 'ar' ? 'الترفيه المتاح' : 'AVAILABLE ENTERTAINMENT'}</span>
              <Flame className="w-3.5 h-3.5 text-indigo-500" />
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-slate-500 font-mono font-bold tracking-widest uppercase">{language === 'ar' ? 'ألعاب' : 'Games'}</span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-white">
                  {language === 'ar' ? `${profile.entertainment?.gamesHours || 0} س` : `Hrs ${profile.entertainment?.gamesHours || 0}`}
                </span>
              </div>
              <button
                onClick={() => useEntertainment('games')}
                disabled={(profile.entertainment?.gamesHours || 0) <= 0}
                className="w-full flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Gamepad2 className="w-6 h-6" />
                <span className="text-sm font-bold tracking-tight">{language === 'ar' ? 'لعب ألعاب الفيديو' : 'Video Games'}</span>
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-slate-500 font-mono font-bold tracking-widest uppercase">{language === 'ar' ? 'أنمي' : 'Anime'}</span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-white">
                  {language === 'ar' ? `${profile.entertainment?.animeEpisodes || 0} ح` : `Ep ${profile.entertainment?.animeEpisodes || 0}`}
                </span>
              </div>
              <button
                onClick={() => useEntertainment('anime')}
                disabled={(profile.entertainment?.animeEpisodes || 0) <= 0}
                className="w-full flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-pink-200 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Tv className="w-6 h-6" />
                <span className="text-sm font-bold tracking-tight">{language === 'ar' ? 'مشاهدة الأنمي' : 'Watching Anime'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Productivity Pillars Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-4">
            {language === 'ar' ? 'ركائز الإنتاجية / أشجار المهارات' : 'Productivity Pillars / Skill Trees'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            
            {/* Design Pillar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-between text-center relative group overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-150 transition-all" />
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 mb-3 text-emerald-600 dark:text-emerald-400">
                <Paintbrush className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">{language === 'ar' ? 'إتقان التصميم' : 'Design Mastery'}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{language === 'ar' ? 'المساعي الشخصية والإبداعية' : 'Personal & creative endeavors'}</p>
              <div className="mt-4 font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                {profile.pillars.design.toFixed(1)} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">{language === 'ar' ? 'ساعة مهارة' : 'Skill Hrs'}</span>
              </div>
            </div>

            {/* Code Pillar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-between text-center relative group overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:scale-150 transition-all" />
              <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 mb-3 text-indigo-600 dark:text-indigo-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">{language === 'ar' ? 'ساحر الكود العظيم' : 'Code Archmage'}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{language === 'ar' ? 'المهام الهندسية والمهنية' : 'Professional & engineering quests'}</p>
              <div className="mt-4 font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400">
                {profile.pillars.code.toFixed(1)} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">{language === 'ar' ? 'ساعة مهارة' : 'Skill Hrs'}</span>
              </div>
            </div>

            {/* Study Pillar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-between text-center relative group overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:scale-150 transition-all" />
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 mb-3 text-amber-600 dark:text-amber-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">{language === 'ar' ? 'باحث الحكمة' : 'Wisdom Scholar'}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{language === 'ar' ? 'القراءة الأكاديمية والمعرفية' : 'Academic & knowledge reading'}</p>
              <div className="mt-4 font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                {profile.pillars.study.toFixed(1)} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">{language === 'ar' ? 'ساعة مهارة' : 'Skill Hrs'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Real-time Game Events Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider font-mono text-slate-800 dark:text-white">
              {language === 'ar' ? '📜 سجل مغامرات المهام الفوري' : '📜 Real-Time Quest Adventure Log'}
            </h3>
            {gameLogs.length > 0 && (
              <button 
                onClick={clearLogs}
                className="text-xs font-mono font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'مسح السجلات' : 'Wipe Logs'}</span>
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-left rtl:text-right">
            {gameLogs.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center py-4">
                {language === 'ar' ? 'سجل المغامرات فارغ. انطلق واهزم بعض المهام!' : 'Adventure log is clear. Go conquer some quests!'}
              </p>
            ) : (
              gameLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="font-mono text-[11px] md:text-xs flex items-start justify-between py-1 border-b border-slate-100 dark:border-slate-800/40 last:border-0"
                >
                  <span className={cn(
                    log.type === 'level_up' && 'text-amber-600 dark:text-amber-400 font-bold',
                    log.type === 'xp' && 'text-indigo-600 dark:text-indigo-300',
                    log.type === 'gold' && 'text-amber-700 dark:text-amber-300',
                    log.type === 'heal' && 'text-emerald-600 dark:text-emerald-400',
                    log.type === 'damage' && 'text-red-600 dark:text-red-400',
                    log.type === 'purchase' && 'text-cyan-600 dark:text-cyan-400'
                  )}>
                    {log.message}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-600 ml-2 mr-2 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
