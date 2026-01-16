
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles, Coins, Crown, Zap, ShieldCheck, CheckCircle2, ChevronRight, Lock, Gift, Star, Video, MessageSquare, ArrowDown } from 'lucide-react';
import { Activity, User, StoreItem } from '../types';
import { db } from '../services/firebase';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, activity, user, onUpdateUser }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const userScore = 
    activity.type === 'gift_event' ? Number(user.charm || 0) : 
    activity.type === 'recharge_event' ? Number(user.rechargePoints || 0) : 0;

  const handleClaimReward = async (reward: any) => {
    if (userScore < reward.threshold || isProcessing) return;
    if (reward.claimedBy?.includes(user.id)) return;

    setIsProcessing(true);

    try {
      const activityRef = doc(db, 'activities', activity.id);
      const userRef = doc(db, 'users', user.id);
      
      const now = Date.now();
      const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // صلاحية 30 يوم
      const instanceId = `${reward.id}_claim_${now}`;
      
      const newItem: StoreItem = {
        id: instanceId,
        name: reward.rewardName,
        type: reward.rewardType,
        url: reward.rewardValue,
        thumbnailUrl: reward.rewardIconUrl || reward.rewardValue,
        price: 0,
        expiresAt: expiresAt,
        ownershipDays: 30,
        isFromActivity: true
      };

      const localUpdates: any = {};
      const currentEarned = Array.isArray(user.earnedItems) ? user.earnedItems : [];
      
      // تقليم المصفوفة للحفاظ على الأداء
      const updatedEarned = [...currentEarned, newItem].slice(-15);
      localUpdates.earnedItems = updatedEarned;

      // منطق الارتداء الفوري وتحديث الرصيد
      if (reward.rewardType === 'frame') {
        localUpdates.frame = reward.rewardValue;
      } else if (reward.rewardType === 'entry') {
        localUpdates.activeEntry = reward.rewardValue;
        localUpdates.activeEntryDuration = 6;
      } else if (reward.rewardType === 'bubble') {
        localUpdates.activeBubble = reward.rewardValue;
      } else if (reward.rewardType === 'coins') {
        localUpdates.coins = Number(user.coins || 0) + Number(reward.rewardValue);
      } else if (reward.rewardType === 'vip') {
        localUpdates.isVip = true;
        localUpdates.vipLevel = Number(reward.rewardValue);
        // عند استلام VIP، نبحث عن إطار الرتبة المقابل ونرتديه فوراً
        // ملاحظة: يُفترض أن رتب الـ VIP مخزنة في السيستم ببياناتها
        localUpdates.frame = reward.rewardIconUrl || user.frame; 
      }

      // تجهيز بيانات Firebase
      const firestoreUpdates: any = {
        ...localUpdates
      };

      // إذا كانت الجائزة مالية أو رتبة نستخدم التزايد، المقتنيات نحدث المصفوفة كاملة
      if (reward.rewardType === 'coins') {
        firestoreUpdates.coins = increment(Number(reward.rewardValue));
        delete firestoreUpdates.earnedItems; // لا نحتاج لإضافة كوينز للحقيبة
      } else if (reward.rewardType === 'vip') {
        // الـ VIP يحدث الحقول مباشرة
      } else {
        firestoreUpdates.earnedItems = updatedEarned;
      }

      await updateDoc(userRef, firestoreUpdates);
      
      // تحديث حالة الاستلام في الفعالية
      const updatedRewards = activity.rewards.map(r => {
        if (r.id === reward.id) {
          return { ...r, claimedBy: [...(r.claimedBy || []), user.id] };
        }
        return r;
      });
      await updateDoc(activityRef, { rewards: updatedRewards });

      onUpdateUser(localUpdates);
      alert(`مبروك! تم استلام "${reward.rewardName}" وارتداؤه بنجاح ✅`);
    } catch (e: any) {
      console.error("Activity Reward Claim Error:", e);
      alert('حدث خطأ أثناء الاستلام، يرجى المحاولة لاحقاً.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sortedRewards = [...activity.rewards].sort((a,b) => a.threshold - b.threshold);

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full max-w-md h-full md:h-[90vh] bg-[#020617] md:rounded-[3rem] overflow-hidden flex flex-col font-cairo shadow-2xl border-x border-white/5"
        dir="rtl"
      >
        <div className="absolute inset-0 z-0">
           {activity.backgroundUrl ? (
             <img src={activity.backgroundUrl} className="w-full h-full object-cover" alt="" />
           ) : (
             <div className="w-full h-full bg-gradient-to-b from-[#0f172a] via-[#020617] to-black"></div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-black/40"></div>
        </div>

        <div className="relative z-10 p-6 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/5">
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:bg-red-600/20 hover:text-red-500 transition-all"><X size={24}/></button>
           <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/30 mb-1">
                 <Star size={10} className="text-amber-500" fill="currentColor" />
                 <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">فعالية ملكية</span>
              </div>
              <h2 className="text-xl font-black text-white drop-shadow-lg">{activity.title}</h2>
           </div>
           <div className="w-10"></div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-20 scrollbar-hide pt-6">
           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none rotate-12"><Zap size={200} /></div>
              <div className="flex flex-col items-center text-center mb-6">
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {activity.type === 'gift_event' ? 'إجمالي الدعم المجمع' : 'إجمالي نقاط الشحن'}
                 </span>
                 <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{userScore.toLocaleString()}</span>
                    <div className="bg-amber-500 p-2 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.5)]"><Sparkles size={20} className="text-black" /></div>
                 </div>
              </div>
              
              <div className="space-y-3">
                 <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 p-[2px]">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(100, (userScore / (sortedRewards[sortedRewards.length-1]?.threshold || 1)) * 100)}%` }}
                       className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                    />
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              {sortedRewards.map((reward, idx) => {
                 const isClaimed = reward.claimedBy?.includes(user.id);
                 const isUnlocked = userScore >= reward.threshold;
                 
                 return (
                    <div key={reward.id} className="relative">
                       {idx !== sortedRewards.length - 1 && (
                         <div className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] z-0 opacity-20">
                            <ArrowDown size={16} className="text-white animate-bounce" />
                         </div>
                       )}

                       <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`relative p-5 rounded-[2.5rem] border transition-all duration-700 overflow-hidden ${isUnlocked ? 'bg-gradient-to-r from-white/10 to-transparent border-amber-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-black/40 border-white/5 opacity-60'}`}
                       >
                          {isUnlocked && !isClaimed && (
                             <motion.div 
                               animate={{ opacity: [0.1, 0.3, 0.1] }} 
                               transition={{ repeat: Infinity, duration: 2 }}
                               className="absolute inset-0 bg-amber-500/10 pointer-events-none"
                             />
                          )}

                          <div className="flex items-center gap-5 relative z-10">
                             <div className="relative">
                                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-2xl border transition-all duration-500 ${isUnlocked ? 'bg-black border-amber-500/50 shadow-amber-500/20' : 'bg-slate-900 border-white/10'}`}>
                                   {reward.rewardIconUrl ? (
                                      <img src={reward.rewardIconUrl} className="w-[85%] h-[85%] object-contain" alt="" />
                                   ) : (
                                      reward.rewardType === 'coins' ? <Coins size={36} className="text-yellow-500"/> : 
                                      reward.rewardType === 'vip' ? <Crown size={36} className="text-amber-500"/> : 
                                      <ShieldCheck size={36} className="text-blue-500"/>
                                   )}
                                </div>
                                {isUnlocked && !isClaimed && (
                                   <motion.div 
                                     animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
                                     transition={{ repeat: Infinity, duration: 1.5 }}
                                     className="absolute -inset-1 border-2 border-amber-400 rounded-[1.6rem] blur-[2px] pointer-events-none"
                                   />
                                )}
                             </div>
                             
                             <div className="flex-1 text-right">
                                <h4 className={`text-sm font-black mb-1 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{reward.rewardName}</h4>
                                <div className="flex items-center gap-1.5">
                                   <span className="text-[10px] font-bold text-slate-400">الهدف: {reward.threshold.toLocaleString()}</span>
                                   {isUnlocked && <CheckCircle2 size={12} className="text-emerald-500" />}
                                </div>
                             </div>

                             <div className="shrink-0">
                                {isClaimed ? (
                                   <div className="bg-emerald-500/20 px-5 py-2.5 rounded-2xl border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
                                      <CheckCircle2 size={14}/> استلمت
                                   </div>
                                ) : isUnlocked ? (
                                   <motion.button 
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      disabled={isProcessing}
                                      onClick={() => handleClaimReward(reward)}
                                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-[11px] rounded-2xl shadow-xl active:scale-90 transition-all flex items-center justify-center gap-2 animate-pulse disabled:opacity-50"
                                   >
                                      استلم <Gift size={14} fill="currentColor" />
                                   </motion.button>
                                ) : (
                                   <div className="px-4 py-2 bg-black/40 rounded-xl text-slate-600 flex items-center gap-2 text-[10px] font-black border border-white/5">
                                      <Lock size={14}/> مقفل
                                   </div>
                                )}
                             </div>
                          </div>
                       </motion.div>
                    </div>
                 );
              })}
           </div>
        </div>

        <div className="p-4 bg-black/80 border-t border-white/5 text-center flex items-center justify-center gap-2 relative z-10">
           <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">LiveTalk Activity Rewards System</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ActivityModal;
