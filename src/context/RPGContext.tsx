import React, { createContext, useContext, useState, useEffect } from 'react';
import { RPGProfile, ShopItem, GameLog, Priority } from '../types';
import {
  DEFAULT_PROFILE,
  DEFAULT_SHOP,
  sanitizeProfile,
  getMaxHpForLevel,
  getMaxMpForLevel,
  getXpToNextForLevel,
  getHeroClassTitle,
  categorizeTaskPillar,
  parseTaskHours,
} from '../lib/rpgUtils';
import {
  safeParseProfile,
  safeParseShopItems,
  safeParseGameLogs,
  safeParseJSON,
} from '../lib/schemas';
import { playLevelUpSound, playPurchaseSound } from '../lib/audio';
import { Language } from '../utils/translations';

export interface RPGContextType {
  profile: RPGProfile;
  setProfile: React.Dispatch<React.SetStateAction<RPGProfile>>;
  shopItems: ShopItem[];
  setShopItems: React.Dispatch<React.SetStateAction<ShopItem[]>>;
  gameLogs: GameLog[];
  setGameLogs: React.Dispatch<React.SetStateAction<GameLog[]>>;

  addShopItem: (title: string, cost: number, type: 'gold' | 'mp', description: string, icon: string) => void;
  buyShopItem: (itemId: string) => boolean;
  useEntertainment: (type: 'games' | 'anime') => void;

  addLog: (message: string, type: GameLog['type']) => void;
  clearLogs: () => void;

  showMpZeroModal: boolean;
  setShowMpZeroModal: (show: boolean) => void;
  isDead: boolean;
  setIsDead: (dead: boolean) => void;
  deathStats: { goldTax: number; xpLoss: number } | null;
  setDeathStats: React.Dispatch<React.SetStateAction<{ goldTax: number; xpLoss: number } | null>>;

  respawnHero: () => void;
  meditateRest: () => void;

  awardRPG: (
    priority: Priority,
    projId?: string,
    isPomodoro?: boolean,
    language?: Language,
    taskTitle?: string,
    taskDesc?: string
  ) => { xpGain: number; goldGain: number; hpChange: number; mpGain: number };

  revokeRPG: (
    earnedXp: number,
    earnedGold: number,
    earnedHp: number,
    earnedMp: number,
    priority: Priority,
    projId?: string,
    language?: Language
  ) => void;
}

const RPGContext = createContext<RPGContextType | undefined>(undefined);

export function RPGProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<RPGProfile>(() => {
    const raw = safeParseJSON(localStorage.getItem('taskslayer_profile') || localStorage.getItem('ticktick_profile'), null);
    return safeParseProfile(raw);
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    const raw = safeParseJSON(localStorage.getItem('taskslayer_shop_items') || localStorage.getItem('ticktick_shop_items'), null);
    return safeParseShopItems(raw);
  });

  const [gameLogs, setGameLogs] = useState<GameLog[]>(() => {
    const raw = safeParseJSON(localStorage.getItem('taskslayer_game_logs') || localStorage.getItem('ticktick_game_logs'), null);
    const parsed = safeParseGameLogs(raw);
    return parsed.length > 0 ? parsed : [
      { id: '1', message: 'Welcome to your RPG Life Questboard! Level up by completing tasks.', timestamp: new Date().toISOString(), type: 'xp' }
    ];
  });

  const [showMpZeroModal, setShowMpZeroModal] = useState<boolean>(false);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [deathStats, setDeathStats] = useState<{ goldTax: number; xpLoss: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('taskslayer_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('taskslayer_shop_items', JSON.stringify(shopItems));
  }, [shopItems]);

  useEffect(() => {
    localStorage.setItem('taskslayer_game_logs', JSON.stringify(gameLogs));
  }, [gameLogs]);

  const addLog = (message: string, type: GameLog['type']) => {
    const newLog: GameLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      message,
      timestamp: new Date().toISOString(),
      type
    };
    setGameLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const clearLogs = () => {
    setGameLogs([]);
  };

  const awardRPG = (
    priority: Priority,
    projId?: string,
    isPomodoro: boolean = false,
    language: Language = 'ar',
    taskTitle?: string,
    taskDesc?: string
  ) => {
    let goldGain = 0;
    let xpGain = 0;
    let baseHpChange = 0;
    let baseMpGain = 0;

    if (isPomodoro) {
      goldGain = 20;
      xpGain = 45;
      baseMpGain = 25;
      baseHpChange = 5;
    } else {
      switch (priority) {
        case 'urgent':
          goldGain = 40;
          xpGain = 80;
          baseHpChange = -Math.round(profile.maxHp * 0.25);
          baseMpGain = -Math.round(profile.maxMp * 0.20);
          break;
        case 'high':
          goldGain = 20;
          xpGain = 40;
          baseHpChange = -Math.round(profile.maxHp * 0.15);
          baseMpGain = -Math.round(profile.maxMp * 0.10);
          break;
        case 'medium':
          goldGain = 10;
          xpGain = 20;
          baseHpChange = 5;
          baseMpGain = 5;
          break;
        case 'low':
        default:
          goldGain = 5;
          xpGain = 10;
          baseHpChange = 10;
          baseMpGain = 10;
          break;
      }
    }

    setProfile((prev) => {
      let newXp = prev.xp + xpGain;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNextLevel;
      let didLevelUp = false;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel += 1;
        newXpToNext = getXpToNextForLevel(newLevel);
        didLevelUp = true;
      }

      const newMaxHp = getMaxHpForLevel(newLevel);
      const newMaxMp = getMaxMpForLevel(newLevel);

      let newHp = prev.hp + baseHpChange;
      let fainted = false;
      let goldPenalty = 0;
      let xpPenalty = 0;

      if (newHp <= 0) {
        fainted = true;
        newHp = 0;
        const totalGold = prev.gold + goldGain;
        goldPenalty = Math.min(totalGold, Math.max(50, Math.floor(totalGold * 0.5)));
        if (totalGold < 50) {
          xpPenalty = Math.floor(prev.xpToNextLevel * 0.20);
        }
      } else {
        if (didLevelUp) {
          newHp = newMaxHp;
        } else {
          newHp = Math.min(newMaxHp, newHp);
        }
      }

      let newMp;
      if (didLevelUp) {
        newMp = newMaxMp;
      } else {
        newMp = Math.max(0, Math.min(newMaxMp, prev.mp + baseMpGain));
      }

      const totalGold = prev.gold + goldGain;
      const newGold = Math.max(0, totalGold - goldPenalty);
      const newXpAfterPenalty = Math.max(0, newXp - xpPenalty);

      const updatedPillars = { ...prev.pillars };
      if (taskTitle) {
        const pillar = categorizeTaskPillar(taskTitle, taskDesc || '');
        const hours = parseTaskHours(taskTitle, taskDesc || '', isPomodoro ? 1.0 : 0.5);
        if (pillar === 'code') updatedPillars.code += hours;
        else if (pillar === 'design') updatedPillars.design += hours;
        else if (pillar === 'study') updatedPillars.study += hours;
      } else if (projId) {
        if (projId === 'proj-work') updatedPillars.code += isPomodoro ? 1.0 : 0.25;
        else if (projId === 'proj-personal') updatedPillars.design += isPomodoro ? 1.0 : 0.25;
        else if (projId === 'proj-study') updatedPillars.study += isPomodoro ? 1.0 : 0.25;
      }

      const newClass = getHeroClassTitle(newLevel, updatedPillars, language);

      setTimeout(() => {
        if (fainted) {
          setIsDead(true);
          setDeathStats({ goldTax: goldPenalty, xpLoss: xpPenalty });
          addLog(`💀 YOU FAINTED IN BATTLE! Collapsed due to intense task damage.`, 'damage');
        } else {
          addLog(`Quest Cleared! Earned +${xpGain} XP, +${goldGain} Gold.`, 'xp');
          if (baseHpChange > 0) {
            addLog(`Healed +${baseHpChange} HP.`, 'heal');
          } else if (baseHpChange < 0) {
            addLog(`💥 Took ${Math.abs(baseHpChange)} battle damage from a tough quest!`, 'damage');
          }

          if (baseMpGain > 0) {
            addLog(`✨ Mana Restored +${baseMpGain} MP.`, 'xp');
          } else if (baseMpGain < 0) {
            addLog(`🔮 Mental Strain / Effort: Spent ${Math.abs(baseMpGain)} MP.`, 'damage');
          }
          if (didLevelUp) {
            playLevelUpSound();
            addLog(`🎉 LEVEL UP! You reached Level ${newLevel}! Max HP and MP increased!`, 'level_up');
          }
        }
      }, 50);

      return {
        ...prev,
        level: newLevel,
        xp: fainted ? newXpAfterPenalty : newXp,
        xpToNextLevel: newXpToNext,
        hp: newHp,
        maxHp: newMaxHp,
        mp: newMp,
        maxMp: newMaxMp,
        gold: newGold,
        classTitle: newClass,
        pillars: updatedPillars,
      };
    });

    return { xpGain, goldGain, hpChange: baseHpChange, mpGain: baseMpGain };
  };

  const revokeRPG = (
    earnedXp: number,
    earnedGold: number,
    earnedHp: number,
    earnedMp: number,
    priority: Priority,
    projId?: string,
    language: Language = 'ar'
  ) => {
    setProfile((prev) => {
      const newGold = Math.max(0, prev.gold - earnedGold);

      let newXp = prev.xp - earnedXp;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNextLevel;

      while (newXp < 0 && newLevel > 1) {
        newLevel -= 1;
        newXpToNext = getXpToNextForLevel(newLevel);
        newXp += newXpToNext;
      }

      if (newLevel === 1 && newXp < 0) {
        newXp = 0;
      }

      const newMaxHp = getMaxHpForLevel(newLevel);
      const newMaxMp = getMaxMpForLevel(newLevel);

      let newHp = Math.max(0, Math.min(newMaxHp, prev.hp - earnedHp));
      let newMp = Math.max(0, Math.min(newMaxMp, prev.mp - earnedMp));

      const updatedPillars = { ...prev.pillars };
      if (projId) {
        if (projId === 'proj-work') updatedPillars.code = Math.max(0, updatedPillars.code - 0.25);
        else if (projId === 'proj-personal') updatedPillars.design = Math.max(0, updatedPillars.design - 0.25);
        else if (projId === 'proj-study') updatedPillars.study = Math.max(0, updatedPillars.study - 0.25);
      }

      const newClass = getHeroClassTitle(newLevel, updatedPillars, language);

      setTimeout(() => {
        addLog(`Quest Uncompleted: Revoked -${earnedXp} XP, -${earnedGold} Gold.`, 'damage');
        if (earnedHp > 0) {
          addLog(`Revoked ${earnedHp} HP.`, 'damage');
        } else if (earnedHp < 0) {
          addLog(`Restored ${Math.abs(earnedHp)} HP.`, 'heal');
        }
        if (earnedMp > 0) {
          addLog(`Revoked ${earnedMp} MP.`, 'damage');
        } else if (earnedMp < 0) {
          addLog(`Restored ${Math.abs(earnedMp)} MP.`, 'heal');
        }
      }, 50);

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpToNextLevel: newXpToNext,
        hp: newHp,
        maxHp: newMaxHp,
        mp: newMp,
        maxMp: newMaxMp,
        gold: newGold,
        classTitle: newClass,
        pillars: updatedPillars,
      };
    });
  };

  const respawnHero = () => {
    setProfile(prev => {
      const restoredHp = prev.maxHp;
      const restoredMp = Math.floor(prev.maxMp * 0.5);
      const taxPaid = deathStats?.goldTax || 0;
      const xpLost = deathStats?.xpLoss || 0;

      setTimeout(() => {
        addLog(`⚔️ You fell in battle! Resurrected at the sanctuary for ${taxPaid} Gold.${xpLost > 0 ? ` Lost ${xpLost} XP due to lack of funds.` : ''}`, 'damage');
        addLog(`🏡 Respawned at the Inn with full HP and 50% MP. Ready to try again!`, 'heal');
      }, 50);

      return {
        ...prev,
        hp: restoredHp,
        mp: restoredMp,
      };
    });
    setIsDead(false);
    setDeathStats(null);
  };

  const meditateRest = () => {
    setProfile(prev => {
      const restoredMp = Math.min(prev.maxMp, prev.mp + 20);
      setTimeout(() => {
        addLog(`🧘‍♂️ Spent time in deep meditation: Restored +20 MP!`, 'heal');
      }, 50);
      return {
        ...prev,
        mp: restoredMp
      };
    });
    setShowMpZeroModal(false);
  };

  const addShopItem = (title: string, cost: number, type: 'gold' | 'mp', description: string, icon: string) => {
    const newItem: ShopItem = {
      id: `shop-${Date.now()}`,
      title,
      description,
      cost,
      type,
      icon
    };
    setShopItems(prev => [...prev, newItem]);
    addLog(`Added Reward to Shop: "${title}"`, 'xp');
  };

  const buyShopItem = (itemId: string): boolean => {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return false;

    let purchaseSuccess = false;

    setProfile(prev => {
      if (item.type === 'gold' && prev.gold >= item.cost) {
        purchaseSuccess = true;
        playPurchaseSound();
        setTimeout(() => addLog(`Purchased Reward: "${item.title}" for ${item.cost} Gold.`, 'purchase'), 50);

        let hpEffect = 0;
        let mpEffect = 0;
        let gamesEffect = 0;
        let animeEffect = 0;

        if (item.id === '4' || item.title.toLowerCase().includes('health potion') || item.icon === 'HeartPulse') {
          hpEffect = 50;
          setTimeout(() => addLog(`❤️ Consumed Health Potion! Restored +50 HP.`, 'heal'), 100);
        } else if (item.icon === 'Coffee' || item.id === '1') {
          hpEffect = 15;
          setTimeout(() => addLog(`☕ Drank Coffee Elixir! Restored +15 HP.`, 'heal'), 100);
        } else if (item.id === '3' || item.title.toLowerCase().includes('mana feast')) {
          mpEffect = 50;
          setTimeout(() => addLog(`✨ Consumed Mana Feast! Restored +50 MP.`, 'xp'), 100);
        } else if (item.id === 'shop-game-hr' || item.title.toLowerCase().includes('game hour')) {
          gamesEffect = 1;
        } else if (item.id === 'shop-anime-ep' || item.title.toLowerCase().includes('anime episode')) {
          animeEffect = 1;
        }

        return {
          ...prev,
          gold: prev.gold - item.cost,
          hp: Math.min(prev.maxHp, prev.hp + hpEffect),
          mp: Math.min(prev.maxMp, prev.mp + mpEffect),
          entertainment: {
            ...prev.entertainment,
            gamesHours: (prev.entertainment?.gamesHours || 0) + gamesEffect,
            animeEpisodes: (prev.entertainment?.animeEpisodes || 0) + animeEffect,
          }
        };
      } else if (item.type === 'mp' && prev.mp >= item.cost) {
        purchaseSuccess = true;
        setTimeout(() => addLog(`Cast Spell/Spent: "${item.title}" for ${item.cost} MP.`, 'purchase'), 50);

        let gamesEffect = 0;
        let animeEffect = 0;
        if (item.id === 'shop-game-hr' || item.title.toLowerCase().includes('game hour')) {
          gamesEffect = 1;
        } else if (item.id === 'shop-anime-ep' || item.title.toLowerCase().includes('anime episode')) {
          animeEffect = 1;
        }

        return {
          ...prev,
          mp: prev.mp - item.cost,
          entertainment: {
            ...prev.entertainment,
            gamesHours: (prev.entertainment?.gamesHours || 0) + gamesEffect,
            animeEpisodes: (prev.entertainment?.animeEpisodes || 0) + animeEffect,
          }
        };
      }
      return prev;
    });

    return purchaseSuccess;
  };

  const useEntertainment = (type: 'games' | 'anime') => {
    setProfile(prev => {
      const ent = prev.entertainment || { gamesHours: 0, animeEpisodes: 0 };
      if (type === 'games' && ent.gamesHours > 0) {
        setTimeout(() => addLog(`Played Video Games for 1 Hour. Enjoy!`, 'heal'), 50);
        return {
          ...prev,
          entertainment: { ...ent, gamesHours: ent.gamesHours - 1 }
        };
      } else if (type === 'anime' && ent.animeEpisodes > 0) {
        setTimeout(() => addLog(`Watched 1 Episode of Anime. Relaxing!`, 'heal'), 50);
        return {
          ...prev,
          entertainment: { ...ent, animeEpisodes: ent.animeEpisodes - 1 }
        };
      }
      return prev;
    });
  };

  return (
    <RPGContext.Provider
      value={{
        profile,
        setProfile,
        shopItems,
        setShopItems,
        gameLogs,
        setGameLogs,
        addShopItem,
        buyShopItem,
        useEntertainment,
        addLog,
        clearLogs,
        showMpZeroModal,
        setShowMpZeroModal,
        isDead,
        setIsDead,
        deathStats,
        setDeathStats,
        respawnHero,
        meditateRest,
        awardRPG,
        revokeRPG,
      }}
    >
      {children}
    </RPGContext.Provider>
  );
}

export function useRPG() {
  const context = useContext(RPGContext);
  if (!context) {
    throw new Error('useRPG must be used within an RPGProvider');
  }
  return context;
}
