
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Check, MessageSquare, Image as ImageIcon, Sparkles, Wand2, Trash2, LogIn, Video, Clock } from 'lucide-react';
import { StoreItem, User } from '../types';

interface BagModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onEquip: (item: StoreItem) => void;
}

const BagModal: React.FC<BagModalProps> = ({ isOpen, onClose, user, onEquip }) => {
  const [activeTab, setActiveTab] = useState<'frame' | 'bubble' | 'entry'>('frame');

  if (!isOpen) return null;

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || url.includes('video') || url.includes('base64:video');
  };

  const myInventory = useMemo(() => {
    const now = Date.now();
    const items = Array.isArray(user.earnedItems) ? user.earnedItems : [];
    
    // فلترة العناصر منتهية الصلاحية
    return items.filter(item => {
      if (item.expiresAt && item.expiresAt < now) return false;
      return true;
    });
  }, [user.earnedItems]);

  const filteredItems = myInventory.filter(item => item.type === activeTab);

  const tabs: { id: 'frame' | 'bubble' | 'entry', label: string, icon: any }[] = [
    { id: 'frame', label: 'إطاراتي', icon: ImageIcon },
    { id: 'bubble', label: 'فقاعاتي', icon: MessageSquare },
    { id: 'entry', label: 'دخولياتي', icon: LogIn }
  ];

  const isEquipped = (item: StoreItem) => {
    if (!item.url) return false;
    if (item.type === 'frame') return user.frame === item.url;
    if (item.type === 'bubble') return user.activeBubble === item.url;
    if (item.type === 'entry') return user.activeEntry === item.url;
    return false;
  };

  const getTimeLeftLabel = (expiresAt?: number) => {
    if (!expiresAt) return 'ملكية دائمة';
    const diff = expiresAt - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} يوم متبقي`;
    if (hours > 0) return `${hours} ساعة متبقية`;
    return 'تنتهي قريباً';
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#020617] border border-purple-500/30 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[80vh] font-cairo"
        dir="rtl"
      >
        <div className="relative p-8 text-center border-b border-white/5 bg-gradient-to-b from-purple-500/10 to-transparent flex-shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/30 hover:text-white active:scale-90"><X size={26} /></button>
          <div className="inline-block p-4 rounded-3xl bg-purple-600/20 mb-3 border border-purple-500/30 shadow-inner"><Package size={36} className="text-purple-400" /></div>
          <h2 className="text-2xl font-black text-white">خزانتي الملكية</h2>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">إدارة مقتنياتك ومكافآتك</p>
        </div>

        <div className="flex p-2.5 gap-2 bg-black/20 flex-shrink-0">
           {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${
                   activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
           {filteredItems.length > 0 ? (
             <div className="grid grid-cols-2 gap-4 pb-20">
               {filteredItems.map((item, idx) => {
                 const active = isEquipped(item);
                 const timeLabel = getTimeLeftLabel(item.expiresAt);

                 return (
                   <div key={item.id + idx} className={`relative rounded-[2.5rem] p-5 border transition-all duration-500 flex flex-col items-center gap-4 ${active ? 'bg-purple-600/10 border-purple-500/60 ring-1 ring-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-slate-900/60 border-white/5'}`}>
                      {item.expiresAt && (
                        <div className="absolute top-3 left-3 bg-red-500/80 text-white text-[7px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-20">
                           <Clock size={8} /> {timeLabel}
                        </div>
                      )}

                      <div className="relative w-full aspect-square flex items-center justify-center">
                        {item.type === 'frame' ? (
                           <div className="relative w-28 h-28 flex items-center justify-center">
                              <div className="absolute w-16 h-16 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                                 <img src={user.avatar} className="w-full h-full object-cover opacity-40 grayscale" />
                              </div>
                              <img 
                                src={item.url} 
                                className="w-full h-full object-contain relative z-10 scale-[1.4] filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" 
                                alt="" 
                              />
                           </div>
                        ) : item.type === 'bubble' ? (
                           <div className="relative z-10 w-24 h-14 rounded-xl bg-cover bg-center border border-white/10 shadow-lg" style={{ backgroundImage: `url(${item.url})` }} />
                        ) : (
                           <div className="relative z-10 w-full h-full rounded-[1.8rem] overflow-hidden border border-white/10 bg-black shadow-2xl group">
                              {isVideoUrl(item.url) ? (
                                <video 
                                  src={item.url} 
                                  autoPlay 
                                  loop 
                                  muted 
                                  playsInline 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <img src={item.thumbnailUrl || item.url} className="w-full h-full object-cover" alt="" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                              <div className="absolute bottom-2 left-2 p-1.5 bg-purple-600 rounded-lg shadow-lg">
                                 <Video size={14} className="text-white" />
                              </div>
                           </div>
                        )}
                        
                        {active && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg z-30 ring-4 ring-[#020617]">
                            <Check size={14} className="text-white" strokeWidth={4} />
                          </div>
                        )}
                      </div>

                      <div className="text-center w-full min-h-[32px]">
                         <h3 className="font-black text-[11px] text-white truncate px-2">{item.name}</h3>
                         <span className="text-[8px] text-slate-500 font-bold block mt-0.5 uppercase tracking-widest">
                            {item.isFromActivity ? '🎁 جائزة فعالية' : '🛒 متجر فيفو'}
                         </span>
                      </div>

                      <button 
                        onClick={() => onEquip(active ? { ...item, url: '' } as any : item)}
                        className={`w-full py-3 rounded-xl text-[10px] font-black shadow-lg transition-all active:scale-95 ${
                          active ? 'bg-red-600/10 text-red-500 border border-red-500/20' : 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-purple-900/20'
                        }`}
                      >
                         {active ? 'إلغاء الاستخدام' : 'ارتداء الآن'}
                      </button>
                   </div>
                 );
               })}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-10 gap-4">
                <Package size={64} className="text-slate-600" />
                <p className="text-sm font-black text-slate-400">خزانتك فارغة حالياً.. شارك في الفعاليات وتميز بمظهرك الملكي!</p>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default BagModal;
