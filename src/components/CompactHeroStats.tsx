import React from 'react';
import { useApp, getHeroClassTitle } from '../context/AppContext';
import { Heart, Zap, Coins, User, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

export function CompactHeroStats() {
  const { profile, language, userName, userEmail, userAvatar } = useApp();

  const isAr = language === 'ar';
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : (isAr ? 'البطل' : 'Hero'));
  const heroClassTitle = getHeroClassTitle(profile.level, profile.pillars, language);

  const renderAvatar = () => {
    if (userAvatar && userAvatar.startsWith('emoji:')) {
      return <span className="text-2xl select-none">{userAvatar.substring(6)}</span>;
    }
    if (userAvatar && (userAvatar.startsWith('data:image') || userAvatar.startsWith('http'))) {
      return <img src={userAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Avatar" />;
    }
    return <User className="w-5 h-5 text-indigo-400" />;
  };

  // Percentages
  const hpPercent = Math.min(100, Math.max(0, (profile.hp / profile.maxHp) * 100));
  const mpPercent = Math.min(100, Math.max(0, (profile.mp / profile.maxMp) * 100));
  const xpPercent = Math.min(100, Math.max(0, (profile.xp / profile.xpToNextLevel) * 100));

  return (
    <div className="lg:hidden bg-[#0b1329] text-white p-4 rounded-2xl border border-slate-800 shadow-xl w-full mb-6 sm:mb-8 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Right/Middle Side (RTL): Avatar, Name (+ LVL Badge) & Class Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full border-2 border-indigo-500/50 bg-[#16223f] flex items-center justify-center overflow-hidden shrink-0">
            {renderAvatar()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base tracking-tight leading-tight truncate">
                {displayName}
              </h3>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono font-bold text-xs leading-none shrink-0">
                LVL {profile.level}
              </span>
            </div>
            <p className="text-xs text-indigo-400 font-medium truncate mt-0.5">
              {heroClassTitle}
            </p>
          </div>
        </div>

        {/* Left Side: Gold Wallet */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl text-amber-400 select-none">
            <Coins className="w-4 h-4 shrink-0 fill-amber-500/10 animate-pulse" />
            <span className="font-mono font-bold text-xs sm:text-sm">
              {profile.gold}{isAr ? 'ذ' : 'g'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bars Stack */}
      <div className="space-y-3">
        {/* HP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1 font-bold">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-current shrink-0" />
              <span>{isAr ? 'النقاط الصحية' : 'HP'}</span>
            </span>
            <span className="font-mono text-red-400">{profile.hp.toLocaleString()}/{profile.maxHp.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden animate-pulse-subtle">
            <div 
              className="bg-gradient-to-r from-red-600 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* MP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1 font-bold">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current shrink-0" />
              <span>{isAr ? 'المانا' : 'MP'}</span>
            </span>
            <span className="font-mono text-cyan-400">{profile.mp.toLocaleString()}/{profile.maxMp.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden animate-pulse-subtle">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${mpPercent}%` }}
            />
          </div>
        </div>

        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1 font-bold">
              <Flame className="w-3.5 h-3.5 text-purple-400 fill-purple-400 shrink-0" />
              <span>{isAr ? 'الخبرة' : 'XP'}</span>
            </span>
            <span className="font-mono text-indigo-400">{Math.round(xpPercent)}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden animate-pulse-subtle">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
