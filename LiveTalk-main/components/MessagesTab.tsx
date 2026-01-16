
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Shield, ChevronLeft, Clock, ChevronRight, TowerControl, Users, MoreVertical, Trash2 } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { User, Tribe } from '../types';

interface MessagesTabProps {
  currentUser: User;
  onOpenChat: (partner: User) => void;
  onOpenTribeChat: () => void;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastTimestamp: any;
  [key: string]: any;
}

const MessagesTab: React.FC<MessagesTabProps> = ({ currentUser, onOpenChat, onOpenTribeChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myTribe, setMyTribe] = useState<Tribe | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    // جلب محادثات الخاص
    const q = query(
      collection(db, 'private_chats'),
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      
      convs.sort((a, b) => {
        const timeA = a.lastTimestamp?.toMillis() || 0;
        const timeB = b.lastTimestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      setConversations(convs);
      setLoading(false);
    });

    // جلب بيانات القبيلة المنضم إليها
    let unsubTribe = () => {};
    if (currentUser.tribeId) {
      unsubTribe = onSnapshot(doc(db, 'tribes', currentUser.tribeId), (snap) => {
        if (snap.exists()) setMyTribe({ id: snap.id, ...snap.data() } as Tribe);
        else setMyTribe(null);
      });
    }

    return () => { unsubscribe(); unsubTribe(); };
  }, [currentUser.id, currentUser.tribeId]);

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدردشة نهائياً؟ سيتم مسح كافة الرسائل.')) return;
    
    try {
      const batch = writeBatch(db);
      
      // 1. جلب كافة الرسائل في المحادثة وحذفها
      const msgsSnap = await getDocs(collection(db, 'private_chats', chatId, 'messages'));
      msgsSnap.forEach(msgDoc => {
        batch.delete(msgDoc.ref);
      });

      // 2. حذف وثيقة المحادثة الرئيسية
      batch.delete(doc(db, 'private_chats', chatId));

      await batch.commit();
      setActiveMenuId(null);
      alert('تم حذف الدردشة بنجاح ✅');
    } catch (e) {
      alert('فشل حذف الدردشة');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#030816] font-cairo" dir="rtl">
      <div className="p-6 bg-gradient-to-b from-blue-900/10 to-transparent">
        <h2 className="text-2xl font-black text-white mb-5 flex items-center gap-3">
          <MessageSquare className="text-blue-500" /> المحادثات
        </h2>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث في الرسائل..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white outline-none focus:border-blue-500/30 transition-all font-bold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
             <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">جاري تحميل صندوق الوارد...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* عرض محادثة القبيلة */}
            {myTribe && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onOpenTribeChat}
                className="flex items-center gap-4 p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-3xl transition-all cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <img src={myTribe.image} className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30 shadow-lg shadow-emerald-900/20" alt="" />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-lg border-2 border-[#030816] text-white">
                    <TowerControl size={10} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-white text-sm truncate flex items-center gap-2">
                       {myTribe.name}
                       <span className="bg-emerald-500 text-black text-[8px] px-1.5 py-0.5 rounded-md font-black">قبيلتي</span>
                    </h4>
                    <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                       {formatTime(myTribe.lastTimestamp)} <Clock size={10} />
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400/80 truncate font-bold italic">
                    {myTribe.lastMessage || "ابدأ الدردشة مع أفراد قبيلتك..."}
                  </p>
                </div>
                <div className="shrink-0 opacity-40">
                   <ChevronLeft size={18} className="text-emerald-500" />
                </div>
              </motion.div>
            )}

            {/* عرض المحادثات الخاصة */}
            {conversations
              .filter(c => {
                const partnerId = c.participants.find(id => id !== currentUser.id);
                const partner = c[`user_${partnerId}`];
                return partner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conv) => {
                const partnerId = conv.participants.find(id => id !== currentUser.id);
                const partnerData = conv[`user_${partnerId}`];
                const isMenuOpen = activeMenuId === conv.id;
                
                return (
                  <motion.div 
                    key={conv.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    <div 
                      onClick={() => onOpenChat({ id: partnerId, ...partnerData } as any)}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl transition-all cursor-pointer group"
                    >
                      <div className="relative shrink-0">
                        <img src={partnerData?.avatar} className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg" alt="" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#030816] rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-black text-white text-sm truncate">{partnerData?.name}</h4>
                          <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                             {formatTime(conv.lastTimestamp)} <Clock size={10} />
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate font-bold opacity-80">
                          {conv.lastMessage}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : conv.id);
                          }}
                          className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors active:scale-90"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <div className="shrink-0 opacity-20 group-hover:opacity-100 transition-opacity">
                           <ChevronLeft size={18} className="text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* قائمة خيارات المحادثة */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[80]" onClick={() => setActiveMenuId(null)}></div>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-[90] bg-[#0f172a] border border-white/10 rounded-2xl p-1 shadow-2xl min-w-[120px]"
                          >
                            <button 
                              onClick={() => handleDeleteChat(conv.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-[11px] font-black"
                            >
                              <Trash2 size={14} /> حذف الدردشة
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            
            {!myTribe && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-40">
                 <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center shadow-inner">
                    <MessageSquare size={48} className="text-slate-700" />
                 </div>
                 <p className="text-white font-black text-sm">لا يوجد لديك رسائل نشطة حالياً</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
