import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useRPG } from '../context/RPGContext';
import { getLocalDateString } from '../lib/utils';
import { playLevelUpSound } from '../lib/audio';
import { sendWebNotification } from '../utils/notifications';
import { 
  Gift, 
  Coins, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  X, 
  Trophy, 
  Zap, 
  Lock, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { getMaxHpForLevel, getMaxMpForLevel, getXpToNextForLevel, getHeroClassTitle } from '../lib/rpgUtils';

export interface DailyReward {
  day: number;
  gold: number;
  xp: number;
  mp?: number;
  titleEn: string;
  titleAr: string;
  isBigReward?: boolean;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gold: 25, xp: 40, titleEn: 'Starter Spark', titleAr: 'شرارة البداية' },
  { day: 2, gold: 40, xp: 60, titleEn: 'Double Momentum', titleAr: 'تضاعف الزخم' },
  { day: 3, gold: 60, xp: 90, titleEn: 'Warrior Essence', titleAr: 'جوهر المحارب' },
  { day: 4, gold: 80, xp: 120, titleEn: 'Focus Surge', titleAr: 'تدفق التركيز' },
  { day: 5, gold: 110, xp: 160, titleEn: 'Heroic Vault', titleAr: 'خزينة البطل' },
  { day: 6, gold: 150, xp: 220, titleEn: 'Epic Fortune', titleAr: 'ثروة ملحمية' },
  { day: 7, gold: 300, xp: 400, mp: 30, titleEn: 'Legendary Chest', titleAr: 'الكنز الأسطوري', isBigReward: true },
];

export interface DailyBonusState {
  lastClaimedDate: string | null;
  currentStreak: number;
  claimedDays: number[];
  totalClaims: number;
}

const STORAGE_KEY = 'taskslayer_daily_bonus_data';

export function DailyLoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language } = useApp();
  const { profile, setProfile, addLog } = useRPG();
  const isAr = language === 'ar';

  const [bonusState, setBonusState] = useState<DailyBonusState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse daily bonus state:', e);
    }
    return {
      lastClaimedDate: null,
      currentStreak: 0,
      claimedDays: [],
      totalClaims: 0,
    };
  });

  const [claimedToday, setClaimedToday] = useState<boolean>(false);
  const [claimableDay, setClaimableDay] = useState<number>(1);
  const [isJustClaimed, setIsJustClaimed] = useState<boolean>(false);

  // Calculate login state on open or mount
  useEffect(() => {
    const todayStr = getLocalDateString();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterdayStr = getLocalDateString(d);

    const isClaimedToday = bonusState.lastClaimedDate === todayStr;
    setClaimedToday(isClaimedToday);

    if (isClaimedToday) {
      // User claimed today already. The claimable day was the streak day they claimed.
      setClaimableDay(bonusState.currentStreak || 1);
    } else {
      // User hasn't claimed today yet.
      if (bonusState.lastClaimedDate === yesterdayStr) {
        // Consecutive login yesterday!
        const nextDay = (bonusState.currentStreak % 7) + 1;
        setClaimableDay(nextDay);
      } else {
        // Missed a day or first time ever!
        setClaimableDay(1);
      }
    }
  }, [isOpen, bonusState.lastClaimedDate, bonusState.currentStreak]);

  if (!isOpen) return null;

  const currentReward = DAILY_REWARDS[claimableDay - 1] || DAILY_REWARDS[0];

  const handleClaim = () => {
    if (claimedToday) return;

    const todayStr = getLocalDateString();
    playLevelUpSound();

    // Award XP, Gold, MP
    setProfile(prev => {
      let newXp = prev.xp + currentReward.xp;
      let newGold = prev.gold + currentReward.gold;
      let newLevel = prev.level;
      let newMaxHp = prev.maxHp;
      let newMaxMp = prev.maxMp;
      let newHp = prev.hp;
      let newMp = currentReward.mp ? Math.min(prev.maxMp, prev.mp + currentReward.mp) : prev.mp;
      let xpToNext = prev.xpToNextLevel;

      // Handle possible level up
      let leveledUp = false;
      while (newXp >= xpToNext) {
        newXp -= xpToNext;
        newLevel += 1;
        xpToNext = getXpToNextForLevel(newLevel);
        newMaxHp = getMaxHpForLevel(newLevel);
        newMaxMp = getMaxMpForLevel(newLevel);
        newHp = newMaxHp; // Fully heal
        newMp = newMaxMp;
        leveledUp = true;
      }

      if (leveledUp) {
        addLog(
          isAr
            ? `🎉 ارتقيت للمستوى ${newLevel}! تم استعادة طاقتك بالكامل.`
            : `🎉 Leveled up to Level ${newLevel}! Health & Mana restored.`,
          'level_up'
        );
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpToNextLevel: xpToNext,
        gold: newGold,
        hp: newHp,
        maxHp: newMaxHp,
        mp: newMp,
        maxMp: newMaxMp,
        classTitle: getHeroClassTitle(newLevel),
      };
    });

    // Update daily bonus state
    const newStreak = claimableDay;
    const newClaimedDays = claimableDay === 1 ? [1] : [...bonusState.claimedDays, claimableDay];
    const newState: DailyBonusState = {
      lastClaimedDate: todayStr,
      currentStreak: newStreak,
      claimedDays: newClaimedDays,
      totalClaims: bonusState.totalClaims + 1,
    };

    setBonusState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

    setClaimedToday(true);
    setIsJustClaimed(true);

    // Log message
    addLog(
      isAr
        ? `🎁 استلام مكافأة اليوم ${claimableDay}: +${currentReward.gold} ذهب, +${currentReward.xp} XP${currentReward.mp ? `, +${currentReward.mp} MP` : ''}`
        : `🎁 Claimed Day ${claimableDay} Login Bonus: +${currentReward.gold} Gold, +${currentReward.xp} XP${currentReward.mp ? `, +${currentReward.mp} MP` : ''}`,
      'gold'
    );

    // Trigger Notification
    sendWebNotification(
      isAr ? '🎁 تم استلام مكافأة الدخول اليومي!' : '🎁 Daily Login Bonus Claimed!',
      {
        body: isAr
          ? `حصلت على +${currentReward.gold} ذهب و +${currentReward.xp} نقاط خبرة! واصل التميز ⚔️`
          : `You received +${currentReward.gold} Gold and +${currentReward.xp} XP! Keep up your streak ⚔️`,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Glowing Header Background */}
        <div className="relative p-6 bg-gradient-to-br from-amber-500/20 via-indigo-950/40 to-slate-900 border-b border-amber-500/20 text-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Badge */}
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Gift className="w-8 h-8 text-slate-950 stroke-[2.5]" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>{isAr ? 'مكافأة الدخول اليومي 🎁' : 'Daily Login Bonus 🎁'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
            {isAr
              ? 'سجّل دخولك يومياً لجمع الكنوز المجانية وتطوير قوة بطلك!'
              : 'Log in daily to claim free treasures and empower your hero!'}
          </p>

          {/* Current Streak Indicator */}
          <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
            <span>
              {isAr
                ? `سلسلة الدخول: ${bonusState.currentStreak || (claimedToday ? claimableDay : 0)} يوم`
                : `Login Streak: ${bonusState.currentStreak || (claimedToday ? claimableDay : 0)} Days`}
            </span>
          </div>
        </div>

        {/* Rewards Calendar Carousel Grid */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DAILY_REWARDS.slice(0, 4).map((reward) => {
              const isClaimed = bonusState.claimedDays.includes(reward.day) || (claimedToday && reward.day <= claimableDay);
              const isCurrentToClaim = !claimedToday && reward.day === claimableDay;
              const isLocked = reward.day > claimableDay && !isClaimed;

              return (
                <div
                  key={reward.day}
                  className={`relative p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center ${
                    isCurrentToClaim
                      ? 'bg-gradient-to-b from-amber-500/20 to-slate-800/90 border-amber-400 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-400/50'
                      : isClaimed
                      ? 'bg-slate-800/40 border-slate-700/60 opacity-80'
                      : 'bg-slate-800/20 border-slate-800 opacity-60'
                  }`}
                >
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                    {isAr ? `اليوم ${reward.day}` : `Day ${reward.day}`}
                  </span>

                  <div className="relative mb-2">
                    {isClaimed ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <Coins className={`w-8 h-8 ${isCurrentToClaim ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-amber-400 font-mono">
                      +{reward.gold} {isAr ? 'ذهب' : 'Gold'}
                    </div>
                    <div className="text-[11px] font-bold text-indigo-400 font-mono">
                      +{reward.xp} XP
                    </div>
                  </div>

                  {isClaimed && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {isAr ? 'تم' : 'Claimed'}
                    </div>
                  )}

                  {isCurrentToClaim && (
                    <div className="mt-2 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                      {isAr ? 'متاح الآن!' : 'Ready!'}
                    </div>
                  )}

                  {isLocked && (
                    <div className="mt-2 text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{isAr ? 'قفل' : 'Locked'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Days 5, 6, and Big Chest Day 7 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DAILY_REWARDS.slice(4).map((reward) => {
              const isClaimed = bonusState.claimedDays.includes(reward.day) || (claimedToday && reward.day <= claimableDay);
              const isCurrentToClaim = !claimedToday && reward.day === claimableDay;
              const isLocked = reward.day > claimableDay && !isClaimed;

              if (reward.isBigReward) {
                return (
                  <div
                    key={reward.day}
                    className={`relative col-span-1 sm:col-span-3 p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left rtl:sm:text-right ${
                      isCurrentToClaim
                        ? 'bg-gradient-to-r from-amber-500/30 via-indigo-950/60 to-purple-900/40 border-amber-400 shadow-xl shadow-amber-500/30 ring-2 ring-amber-400'
                        : isClaimed
                        ? 'bg-slate-800/40 border-slate-700/60 opacity-85'
                        : 'bg-slate-800/30 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-400 uppercase font-mono">
                            {isAr ? `اليوم ${reward.day} - الكنز الكبير 🏆` : `Day ${reward.day} - Grand Treasure 🏆`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          {isAr ? reward.titleAr : reward.titleEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono font-bold text-xs">
                      <span className="text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        +{reward.gold} {isAr ? 'ذهب' : 'Gold'}
                      </span>
                      <span className="text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        +{reward.xp} XP
                      </span>
                      {reward.mp && (
                        <span className="text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                          +{reward.mp} MP
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={reward.day}
                  className={`relative p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center ${
                    isCurrentToClaim
                      ? 'bg-gradient-to-b from-amber-500/20 to-slate-800/90 border-amber-400 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-400/50'
                      : isClaimed
                      ? 'bg-slate-800/40 border-slate-700/60 opacity-80'
                      : 'bg-slate-800/20 border-slate-800 opacity-60'
                  }`}
                >
                  <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                    {isAr ? `اليوم ${reward.day}` : `Day ${reward.day}`}
                  </span>

                  <div className="relative mb-2">
                    {isClaimed ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <Coins className={`w-8 h-8 ${isCurrentToClaim ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-amber-400 font-mono">
                      +{reward.gold} {isAr ? 'ذهب' : 'Gold'}
                    </div>
                    <div className="text-[11px] font-bold text-indigo-400 font-mono">
                      +{reward.xp} XP
                    </div>
                  </div>

                  {isClaimed && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {isAr ? 'تم' : 'Claimed'}
                    </div>
                  )}

                  {isCurrentToClaim && (
                    <div className="mt-2 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                      {isAr ? 'متاح الآن!' : 'Ready!'}
                    </div>
                  )}

                  {isLocked && (
                    <div className="mt-2 text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{isAr ? 'قفل' : 'Locked'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex flex-col items-center gap-3">
          {!claimedToday ? (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full max-w-md py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gift className="w-5 h-5 stroke-[2.5]" />
              <span>{isAr ? `استلام مكافأة اليوم ${claimableDay} 🎁` : `Claim Day ${claimableDay} Reward 🎁`}</span>
            </button>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center text-center gap-2">
              <div className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{isAr ? 'تم استلام مكافأة اليوم بنجاح! ✨' : 'Today’s reward claimed successfully! ✨'}</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {isAr ? 'عد غداً للحصول على مكافأتك التالية!' : 'Come back tomorrow for your next reward!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
