
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Coins, Check, Image as ImageIcon, MessageSquare, LogIn, Video, Sparkles, AlertCircle } from 'lucide-react';
import { StoreItem, User } from '../types';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StoreItem[];
  user: User;
  onBuy: (item: StoreItem) => void;
}

const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose, items, user, onBuy }) => {
  const [activeTab, setActiveTab] = useState<'frame' | 'bubble' | 'entry'>('frame');
  const [confirmItem, setConfirmItem] = useState<StoreItem | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => item.type === activeTab);

  const handlePurchase = () => {
    if (confirmItem) {
      if (user.coins < confirmItem.price) {
        alert('رصيدك لا يكفي لشراء هذا العنصر 🪙');
        return;
      }
      onBuy(confirmItem);
      setConfirmItem(null);
    }
  };

  const tabs: { id: 'frame' | 'bubble' | 'entry', label: string, icon: any }[] = [
    { id: 'frame', label: 'إطارات', icon: ImageIcon },
    { id: 'bubble', label: 'فقاعات', icon: MessageSquare },
    { id: 'entry', label: 'دخوليات', icon: LogIn }
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#0f172a] border border-cyan-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col h-[85vh] font-cairo"
        dir="rtl"
      >
        <div className="relative p-6 text-center border-b border-white/5 bg-gradient-to-b from-cyan-500/10 to-transparent flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-all">
             <X size={24} />
          </button>
          <div className="inline-block p-3 rounded-2xl bg-cyan-500/20 mb-2 border border-cyan-500/30">
             <ShoppingBag size={32} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">المتجر الملكي</h2>
          
          <div className="mt-4 bg-black/40 rounded-2xl p-2 px-6 inline-flex items-center gap-2 border border-white/5 shadow-inner">
             <span className="text-[10px] font-black text-slate-400 uppercase">رصيدك المتاح</span>
             <div className="flex items-center gap-1">
                <span className="text-yellow-500 font-black text-lg">{(user.coins || 0).toLocaleString()}</span>
                <Coins size={14} className="text-yellow-500" />
             </div>
          </div>
        </div>

        <div className="flex p-2 gap-2 bg-black/20 flex-shrink-0">
           {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${
                   activeTab === tab.id 
                    ? 'bg-cyan-600 text-white shadow-lg' 
                    : 'bg-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
           <div className="grid grid-cols-2 gap-5 pb-24">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-slate-800/40 rounded-[2.5rem] p-5 border border-white/5 flex flex-col items-center gap-4 group hover:border-cyan-500/40 transition-all relative">
                   
                   {/* حاوية العرض - تم إزالة overflow-hidden للسماح للإطار بالتمدد */}
                   <div className="relative w-24 h-24 flex items-center justify-center">
                      {/* دائرة وهمية لخلفية البروفايل */}
                      <div className="absolute w-14 h-14 rounded-full bg-slate-900 border border-white/5 shadow-inner"></div>
                      
                      {item.type === 'frame' ? (
                         <img 
                           src={item.url} 
                           className="w-full h-full object-contain relative z-10 scale-[1.45] filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]" 
                           alt="" 
                         />
                      ) : item.type === 'bubble' ? (
                         <div className="relative z-10 w-16 h-10 rounded-lg bg-cover bg-center shadow-lg" style={{ backgroundImage: `url(${item.url})` }} />
                      ) : (
                         <div className="relative z-10 w-20 h-20 rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl">
                            <img src={item.thumbnailUrl || item.url} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Video size={20} className="text-white" /></div>
                         </div>
                      )}
                   </div>
                   
                   <div className="text-center w-full space-y-1">
                      <h3 className="font-black text-[11px] text-white truncate px-2">{item.name}</h3>
                      <div className="flex flex-col items-center">
                         <div className="flex items-center gap-1 text-yellow-500 font-black text-xs">
                            <span>{item.price.toLocaleString()}</span>
                            <Coins size={10} />
                         </div>
                         <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">{item.ownershipDays ? `صلاحية ${item.ownershipDays} يوم` : 'ملكية أبدية'}</span>
                      </div>
                   </div>

                   <button 
                     onClick={() => setConfirmItem(item)}
                     className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white text-[10px] font-black rounded-xl shadow-lg active:scale-95 transition-all"
                   >
                      شراء المنتج
                   </button>
                </div>
              ))}
           </div>
        </div>

        <AnimatePresence>
          {confirmItem && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="bg-[#1e293b] border border-cyan-500/30 rounded-[3rem] p-8 w-full shadow-2xl text-center space-y-6"
               >
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30">
                     <Sparkles size={32} className="text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg">تأكيد عملية الشراء</h4>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                       هل ترغب في اقتناء <span className="text-cyan-400 font-bold">"{confirmItem.name}"</span> 
                       <br/> مقابل <span className="text-yellow-500 font-bold">{confirmItem.price.toLocaleString()} كوينز</span>؟
                    </p>
                  </div>
                  <div className="flex gap-3">
                     <button 
                       onClick={handlePurchase}
                       className="flex-1 py-4 bg-cyan-600 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
                     >
                        تأكيد الشراء
                     </button>
                     <button 
                       onClick={() => setConfirmItem(null)}
                       className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-xs"
                     >
                        إلغاء
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default StoreModal;
