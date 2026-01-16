
import React, { useMemo, useEffect, useState } from 'react';
import { User, Room } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Gift, Trophy, Star, Heart, Coins, Copy, ShieldCheck, MoreVertical, MicOff, UserX, RotateCcw, Users, Edit3, ShieldAlert, UserMinus, MessageSquare, Package, Send, Mail, Crown, Sparkles } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

const calculateProfileLvl = (pts: number) => {
  if (!pts || pts <= 0) return 1;
  const l = Math.floor(Math.sqrt(pts / 50000)); 
  return Math.max(1, Math.min(200, l));
};

const ProfileLevelBadge: React.FC<{ level: number; type: 'wealth' | 'recharge' }> = ({ level, type }) => {
  const isWealth = type === 'wealth';
  return (
    <div className="relative h-[20px] min-w-[62px] flex items-center pr-2.5 group cursor-default shrink-0">
      <div className={`absolute inset-0 right-2 rounded-l-md border border-white/10 ${
        isWealth 
          ? 'bg-gradient-to-r from-purple-700 to-indigo-600 shadow-lg' 
          : 'bg-slate-900 border-blue-500/20'
      }`}>
      </div>
      <div className="relative z-10 flex-1 text-center pr-1">
        <span className="text-[10px] font-black italic text-white drop-shadow-md block">
          {level}
        </span>
      </div>
      <div className="relative z-20 w-5 h-5 flex items-center justify-center -mr-1.5">
        <div className={`absolute inset-0 rounded-sm transform rotate-45 border border-white/20 ${
          isWealth ? 'bg-purple-600' : 'bg-black'
        }`}></div>
        <span className="relative z-30 text-[9px] mb-0.5">{isWealth ? '💎' : '⚡'}</span>
      </div>
    </div>
  );
};

interface UserProfileSheetProps {
  user: User;
  onClose: () => void;
  isCurrentUser: boolean;
  onAction: (action: string) => void;
  currentUser: User;
  allUsers?: User[];
  currentRoom?: Room | null; // جعل الغرفة اختيارية
}

const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ user: initialUser, onClose, isCurrentUser, onAction, currentUser, allUsers = [], currentRoom }) => {
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  const user = useMemo(() => {
    if (initialUser.id === currentUser.id) return currentUser;
    const latest = allUsers.find(u => u.id === initialUser.id);
    return latest || initialUser;
  }, [initialUser, allUsers, currentUser]);

  const isHost = currentRoom?.hostId === currentUser.id;
  const isModerator = currentRoom?.moderators?.includes(currentUser.id);
  const canManage = currentRoom && (isHost || isModerator) && !isCurrentUser;

  const wealthLvl = calculateProfileLvl(Number(user.wealth || 0));
  const rechargeLvl = calculateProfileLvl(Number(user.rechargePoints || 0));

  const hasCover = !!user.cover;

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center p-0 font-cairo">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" 
      />

      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className={`relative w-full ${hasCover ? 'bg-transparent' : 'bg-[#030816]'} rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden h-full`}
        dir="rtl"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          {hasCover ? (
            <img src={user.cover} className="w-full h-full object-cover" alt="Full Profile Skin" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-[#030816]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />
        </div>

        <div className="relative w-full h-screen shrink-0 z-10">
          <div className="absolute top-12 left-8 right-8 flex justify-between items-center z-30">
            <button onClick={onClose} className="p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white/80 border border-white/10 active:scale-90 shadow-2xl transition-all"><X size={22}/></button>
            {canManage && (
               <button onClick={() => setShowAdminMenu(!showAdminMenu)} className="p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white/80 border border-white/10 active:scale-90 shadow-2xl transition-all"><MoreVertical size={22}/></button>
            )}
          </div>

          <div className="absolute top-[300px] right-6 flex items-start gap-6 z-20">
             <div className="relative w-28 h-28 shrink-0">
                <div className="w-full h-full rounded-full border-[4px] border-[#030816]/30 backdrop-blur-md overflow-hidden bg-slate-800 shadow-2xl">
                   <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
                </div>
                {user.frame && <img src={user.frame} className="absolute inset-0 scale-[1.3] z-10 pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" />}
             </div>
             
             <div className="flex flex-col gap-1.5 pt-2 text-right">
                <div className="flex items-center gap-2 flex-wrap">
                   <h2 className="text-2xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] leading-tight">{user.name}</h2>
                   {user.isVip && <Crown size={18} className="text-amber-400 drop-shadow-lg" fill="currentColor" />}
                </div>
                <div className="flex items-center gap-2">
                   <ProfileLevelBadge level={wealthLvl} type="wealth" />
                   <ProfileLevelBadge level={rechargeLvl} type="recharge" />
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                   {user.badge ? (
                     <div className="relative flex items-center justify-center h-8 min-w-[95px] group">
                        <span className="absolute inset-0 z-20 flex items-center justify-center text-white font-black text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">ID:{user.customId || user.id}</span>
                        <img src={user.badge} className="h-8 object-contain drop-shadow-xl" />
                     </div>
                   ) : (
                     <span className="text-[10px] font-black text-white bg-blue-600/60 backdrop-blur-md px-3 py-0.5 rounded-lg border border-blue-400/20 shadow-lg">ID: {user.customId || user.id}</span>
                   )}
                   <button onClick={() => { navigator.clipboard.writeText(String(user.customId || user.id)); alert('تم نسخ الـ ID'); }} className="p-1 text-white/40 hover:text-amber-500 transition-colors active:scale-90"><Copy size={12}/></button>
                </div>

                {user.cpPartner && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 bg-pink-600/20 backdrop-blur-md border border-pink-500/20 rounded-xl p-1.5 flex items-center gap-2 w-fit shadow-lg">
                       <img src={user.cpPartner.avatar} className="w-6 h-6 rounded-full object-cover border border-pink-500/30" />
                       <Heart size={10} fill="#ec4899" className="text-pink-500" />
                       <span className="text-[8px] font-black text-white truncate max-w-[60px]">{user.cpPartner.name}</span>
                    </motion.div>
                )}
             </div>
          </div>

          <div className="absolute top-[410px] left-8 flex gap-3 z-30">
            {!isCurrentUser && (
              <>
                <button onClick={() => onAction('message')} className="w-11 h-11 bg-blue-600/20 backdrop-blur-md border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-xl active:scale-90 transition-all"><Mail size={20}/></button>
                <button onClick={() => onAction('gift')} className="w-11 h-11 bg-pink-600/20 backdrop-blur-md border border-pink-500/20 rounded-2xl flex items-center justify-center text-pink-400 shadow-xl active:scale-90 transition-all"><Gift size={20}/></button>
              </>
            )}
            {isCurrentUser && (
              <button onClick={() => onAction('edit')} className="w-11 h-11 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all"><Edit3 size={20}/></button>
            )}
          </div>

          <div className="absolute bottom-12 left-10 right-10 z-20 max-h-[40vh] overflow-y-auto scrollbar-hide">
             <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                   <h3 className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2"><Trophy size={14} className="text-amber-500" /> أوسمة الشرف</h3>
                   <span className="text-[10px] text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded-full">{(user.achievements || []).length} / 30</span>
                </div>
                <div className="grid grid-cols-5 gap-5">
                   {(user.achievements || []).length > 0 ? (
                     user.achievements?.map((medal, idx) => (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          transition={{ delay: idx * 0.05 }}
                          key={idx} 
                          className="aspect-square flex items-center justify-center relative group"
                        >
                           <img src={medal} className="w-full h-full object-contain filter drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-115" alt="achievement" />
                        </motion.div>
                     ))
                   ) : (
                     <div className="col-span-5 py-8 text-center border-2 border-dashed border-white/5 rounded-[2.2rem] opacity-30 bg-black/20 backdrop-blur-sm">
                        <p className="text-xs font-bold text-slate-500">لا توجد أوسمة بعد</p>
                     </div>
                   )}
                </div>

                <AnimatePresence>
                   {showAdminMenu && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4 overflow-hidden pb-4">
                         <button onClick={() => { onAction('addModerator'); setShowAdminMenu(false); }} className="p-4 bg-blue-600/20 backdrop-blur-xl text-blue-400 rounded-3xl text-[11px] font-black border border-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-900/10"><ShieldCheck size={16}/> تعيين مشرف</button>
                         <button onClick={() => { onAction('removeMic'); setShowAdminMenu(false); }} className="p-4 bg-orange-600/20 backdrop-blur-xl text-orange-400 rounded-3xl text-[11px] font-black border border-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-orange-900/10"><MicOff size={16}/> تنزيل مايك</button>
                         <button onClick={() => { onAction('kickAndBan'); setShowAdminMenu(false); }} className="p-4 bg-red-600/20 backdrop-blur-xl text-red-400 rounded-3xl text-[11px] font-black border border-red-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-900/10"><UserMinus size={16}/> طرد وحظر</button>
                         <button onClick={() => { onAction('resetUserCharm'); setShowAdminMenu(false); }} className="p-4 bg-white/5 backdrop-blur-xl text-white/60 rounded-3xl text-[11px] font-black border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"><RotateCcw size={16}/> تصفير الكاريزما</button>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfileSheet;
