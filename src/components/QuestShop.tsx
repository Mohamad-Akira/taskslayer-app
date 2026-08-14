import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShopItem } from '../types';
import { Coins, Zap, Coffee, Tv, Utensils, HeartPulse, Sparkles, Gift, Plus, ShieldAlert, Gamepad2, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export function QuestShop() {
  const { profile, shopItems, addShopItem, buyShopItem, t, language } = useApp();
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState(10);
  const [newType, setNewType] = useState<'gold' | 'mp'>('gold');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('Gift');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [insufficientItem, setInsufficientItem] = useState<ShopItem | null>(null);

  const getLocalizedShopItem = (item: ShopItem, lang: string) => {
    if (lang !== 'ar') return { title: item.title, description: item.description };

    switch (item.id) {
      case '1':
        return {
          title: 'إكسير القهوة الممتازة',
          description: 'استراحة قهوة مختصة لتجديد طاقتك وإنعاش عقلك.'
        };
      case 'shop-game-hr':
        return {
          title: 'ساعة ألعاب فيديو',
          description: 'افتح ساعة كاملة من الترفيه بألعاب الفيديو.'
        };
      case 'shop-anime-ep':
        return {
          title: 'حلقة أنمي واحدة',
          description: 'افتح مشاهدة حلقة أنمي واحدة بدون تأنيب ضمير.'
        };
      case '3':
        return {
          title: 'وليمة المانا (وجبة مفتوحة)',
          description: 'استمتع بوجبة سريعة أو سناك مفتوح بدون أي شعور بالذنب.'
        };
      case '4':
        return {
          title: 'جرعة صحة (استعادة +50 HP)',
          description: 'استرد فوراً 50 نقطة صحة لتغطية الأضرار من المهام الخاسرة.'
        };
      case '5':
        return {
          title: 'تعويذة التركيز الفائق',
          description: 'استهلك 40 مانا لرفع حماسك وتجاوز مهمة بدون عقوبة.'
        };
      default:
        const lowerTitle = (item.title || '').toLowerCase();
        if (lowerTitle.includes('coffee')) {
          return { title: 'إكسير القهوة الممتازة', description: 'استراحة قهوة مختصة لتجديد طاقتك وإنعاش عقلك.' };
        }
        if (lowerTitle.includes('video game') || lowerTitle.includes('game hour') || item.title === 'Hour Video Games 1') {
          return { title: 'ساعة ألعاب فيديو', description: 'افتح ساعة كاملة من الترفيه بألعاب الفيديو.' };
        }
        if (lowerTitle.includes('anime')) {
          return { title: 'حلقة أنمي واحدة', description: 'افتح مشاهدة حلقة أنمي واحدة بدون تأنيب ضمير.' };
        }
        if (lowerTitle.includes('cheat meal') || lowerTitle.includes('mana feast')) {
          return { title: 'وليمة المانا (وجبة مفتوحة)', description: 'استمتع بوجبة سريعة أو سناك مفتوح بدون أي شعور بالذنب.' };
        }
        if (lowerTitle.includes('health potion') || lowerTitle.includes('heal')) {
          return { title: 'جرعة صحة (استعادة +50 HP)', description: 'استرد فوراً 50 نقطة صحة لتغطية الأضرار من المهام الخاسرة.' };
        }
        if (lowerTitle.includes('focus spell') || lowerTitle.includes('empowered focus')) {
          return { title: 'تعويذة التركيز الفائق', description: 'استهلك 40 مانا لرفع حماسك وتجاوز مهمة بدون عقوبة.' };
        }
        return { title: item.title, description: item.description };
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Coffee': return Coffee;
      case 'Tv': return Tv;
      case 'Utensils': return Utensils;
      case 'HeartPulse': return HeartPulse;
      case 'Zap': return Zap;
      case 'Sparkles': return Sparkles;
      case 'Gamepad2': return Gamepad2;
      default: return Gift;
    }
  };

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addShopItem(
      newTitle, 
      newCost, 
      newType, 
      newDesc || (language === 'ar' ? 'مكافأة مخصصة تم الإعلان عنها.' : 'Custom declared real life reward block.'), 
      newIcon
    );
    
    setNewTitle('');
    setNewCost(15);
    setNewDesc('');
    setNewIcon('Gift');
    
    setSuccessMsg(language === 'ar' ? 'تمت صياغة المكافأة بنجاح!' : 'Declared new item reward successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handlePurchase = (item: ShopItem) => {
    const isGoldType = item.type === 'gold';
    const hasEnoughCurrency = isGoldType ? profile.gold >= item.cost : profile.mp >= item.cost;
    const { title } = getLocalizedShopItem(item, language);

    if (!hasEnoughCurrency) {
      setInsufficientItem({ ...item, title });
      return;
    }

    const bought = buyShopItem(item.id);
    if (bought) {
      if (language === 'ar') {
        setSuccessMsg(`تم استبدال المكافأة: "${title}"! استمتع بوقتك.`);
      } else {
        setSuccessMsg(`Redeemed Reward: "${title}"! Enjoy your reward.`);
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-left rtl:text-right"
    >
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-7 h-7 md:w-8 md:h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{language === 'ar' ? 'متجر المكافآت والتعاويذ' : 'Reward & Spell Shop'}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {language === 'ar' 
                ? 'استخدم الذهب والمانا التي حصلت عليها من فترات تركيزك لشراء مكافآت حقيقية.' 
                : 'Spend hard-earned Gold & Mana from your focus blocks on custom real-life treats.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {/* Gold balance */}
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 md:px-4 py-2 rounded-xl flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-550 dark:text-amber-400 fill-amber-500/10 shrink-0" />
              <div>
                <span className="block text-[8px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">{language === 'ar' ? 'الذهب' : 'GOLD'}</span>
                <span className="text-sm font-bold text-amber-650 dark:text-white font-mono">{profile.gold.toLocaleString()}{language === 'ar' ? 'ذ' : 'g'}</span>
              </div>
            </div>

            {/* MP balance */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 px-3 md:px-4 py-2 rounded-xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400 fill-cyan-500/10 shrink-0" />
              <div>
                <span className="block text-[8px] text-cyan-600 dark:text-cyan-400 uppercase font-bold tracking-wider">{language === 'ar' ? 'المانا' : 'MANA'}</span>
                <span className="text-sm font-bold text-cyan-650 dark:text-white font-mono">{profile.mp.toLocaleString()} MP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Banner alerts */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/35 text-red-700 dark:text-red-350 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-mono font-semibold animate-bounce">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm font-mono font-semibold animate-fade-in">
            🎉 {successMsg}
          </div>
        )}

        {/* Create Custom Reward Shop items */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm dark:shadow-md">
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{language === 'ar' ? 'صياغة مكافأة مخصصة' : 'Forge Custom Reward Block'}</span>
          </h3>

          <form onSubmit={handleCreateReward} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'عنوان المكافأة' : 'Reward Title'}</label>
              <input
                type="text"
                placeholder={language === 'ar' ? 'مثال: قيلولة 15 دقيقة، لعب ألعاب، لوح شوكولاتة' : 'e.g. 15-minute nap, play CS:GO, chocolate bar'}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'التكلفة' : 'Cost Value'}</label>
                <input
                  type="number"
                  min="1"
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-bold font-mono text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'نوع العملة' : 'Currency Type'}</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'gold' | 'mp')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-semibold text-slate-700 dark:text-white"
                >
                  <option value="gold">{language === 'ar' ? 'ذهب' : 'Gold'}</option>
                  <option value="mp">{language === 'ar' ? 'مانا (MP)' : 'Mana (MP)'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'أيقونة المكافأة' : 'Icon Accent'}</label>
              <select
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-semibold text-slate-700 dark:text-white"
              >
                <option value="Gift">{language === 'ar' ? 'هدية افتراضية' : 'Default Gift'}</option>
                <option value="Coffee">{language === 'ar' ? 'كوب قهوة' : 'Coffee cup'}</option>
                <option value="Gamepad2">{language === 'ar' ? 'ألعاب فيديو' : 'Video Games'}</option>
                <option value="Tv">{language === 'ar' ? 'شاشة ترفيه' : 'Entertainment Screen'}</option>
                <option value="Utensils">{language === 'ar' ? 'وليمة طعام' : 'Food Feast'}</option>
                <option value="HeartPulse">{language === 'ar' ? 'استعادة الصحة' : 'Heart Restoration'}</option>
                <option value="Zap">{language === 'ar' ? 'شحن طاقة' : 'Mana charge'}</option>
                <option value="Sparkles">{language === 'ar' ? 'نجم سحري' : 'Magic Star'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الوصف' : 'Description'}</label>
              <input
                type="text"
                placeholder={language === 'ar' ? 'صرح بتفاصيل هذه المكافأة المخصصة' : 'Declare details of this reward'}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold tracking-tight shadow-md shadow-indigo-500/20 dark:shadow-none transition-all cursor-pointer"
              >
                {language === 'ar' ? 'صنع وعرض على الرف' : 'Declare & Place on Shelf'}
              </button>
            </div>
          </form>
        </div>

        {/* Shelf listing */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-4">
            {language === 'ar' ? 'العناصر ولفائف السحر المتاحة' : 'Items & Spell scrolls available'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shopItems.map((item) => {
              const Icon = getIconComponent(item.icon);
              const isMP = item.type === 'mp';
              const { title, description } = getLocalizedShopItem(item, language);
              return (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-700 rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "p-3 rounded-xl border shrink-0",
                      isMP 
                        ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400" 
                        : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 text-left rtl:text-right">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">{description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(item)}
                    className={cn(
                      "px-3 md:px-4 py-2 rounded-xl text-xs font-bold font-mono shrink-0 transition-all flex items-center gap-1 border cursor-pointer",
                      isMP
                        ? "bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-600 text-cyan-600 dark:text-cyan-400 hover:text-white border-cyan-200 dark:border-cyan-500/20"
                        : "bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-600 text-amber-600 dark:text-amber-400 hover:text-white border-amber-200 dark:border-amber-500/20"
                    )}
                  >
                    <span>{language === 'ar' ? 'شراء' : 'Redeem'}</span>
                    <span className="font-bold">{item.cost}{language === 'ar' ? (isMP ? 'م' : 'ذ') : (isMP ? 'm' : 'g')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Insufficient Currency Modal Popup */}
      {insufficientItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5 text-left rtl:text-right">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => setInsufficientItem(null)}
              className="absolute top-4 right-4 ltr:right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg animate-pulse",
                insufficientItem.type === 'gold'
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-amber-500/10"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-500 dark:text-cyan-400 shadow-cyan-500/10"
              )}>
                {insufficientItem.type === 'gold' ? (
                  <Coins className="w-9 h-9" />
                ) : (
                  <Zap className="w-9 h-9" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {language === 'ar'
                    ? `رصيد ${insufficientItem.type === 'gold' ? 'الذهب' : 'المانا'} غير كافٍ!`
                    : `Insufficient ${insufficientItem.type === 'gold' ? 'Gold' : 'Mana'}!`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  {language === 'ar'
                    ? `أنت تحاول شراء "${insufficientItem.title}"`
                    : `Attempting to purchase "${insufficientItem.title}"`}
                </p>
              </div>
            </div>

            {/* Stats Breakdown Card */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{language === 'ar' ? 'التكلفة المطلوبة:' : 'Required Cost:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {insufficientItem.cost} {insufficientItem.type === 'gold' ? (language === 'ar' ? 'ذهب' : 'Gold') : (language === 'ar' ? 'مانا' : 'MP')}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>{language === 'ar' ? 'رصيدك الحالي:' : 'Your Balance:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {insufficientItem.type === 'gold' ? profile.gold : profile.mp} {insufficientItem.type === 'gold' ? (language === 'ar' ? 'ذهب' : 'Gold') : (language === 'ar' ? 'مانا' : 'MP')}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-red-600 dark:text-red-400 font-bold">
                <span>{language === 'ar' ? 'المبلغ الناقص:' : 'Deficit Amount:'}</span>
                <span>
                  {insufficientItem.cost - (insufficientItem.type === 'gold' ? profile.gold : profile.mp)} {insufficientItem.type === 'gold' ? (language === 'ar' ? 'ذهب' : 'Gold') : (language === 'ar' ? 'مانا' : 'MP')}
                </span>
              </div>
            </div>

            {/* Tip Banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-3 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                {language === 'ar'
                  ? 'نصيحة: يمكنك الحصول على المزيد من الذهب والمانا عبر إنجاز المهام وإكمال جلسات التركيز والبومودورو!'
                  : 'Tip: Earn more Gold & Mana by completing tasks, quests, and finishing Pomodoro focus sessions!'}
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setInsufficientItem(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              {language === 'ar' ? 'حسناً، فهمت' : 'Got it'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
