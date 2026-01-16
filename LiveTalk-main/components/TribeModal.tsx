import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MessageSquare, Plus, Search, ShieldCheck, UserPlus, Image as ImageIcon, Send, Clock, Trash2, Coins, ChevronLeft, ChevronRight, Zap, Ghost, TowerControl, UserMinus, Upload } from 'lucide-react';
import { Tribe, User, TribeMessage, GameSettings } from '../types';
import { db } from '../services/firebase';
// Added missing getDocs import
import { collection, onSnapshot, doc, query, orderBy, limit, where, setDoc, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, getDoc, getDocs, writeBatch, increment, Timestamp } from 'firebase/firestore';

interface TribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onUpdateUser: (data: Partial<User>) => void;
  gameSettings: GameSettings;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
  initialTab?: 'my_tribe' | 'explore' | 'chat' | 'requests';
}

const TribeModal: React.FC<TribeModalProps> = ({ isOpen, onClose, currentUser, users, onUpdateUser, gameSettings, handleFileUpload, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'my_tribe' | 'explore' | 'chat' | 'requests'>(initialTab || 'explore');
  const [allTribes, setAllTribes] = useState<Tribe[]>([]);
  const [myTribe, setMyTribe] = useState<Tribe | null>(null);
  const [messages, setMessages] = useState<TribeMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  
  // إضافة عضو بالـ ID
  const [addId, setAddId] = useState('');
  const [addingByMemberId, setAddingByMemberId] = useState(false);

  // إنشاء قبيلة
  const [newTribeName, setNewTribeName] = useState('');
  const [newTribeImage, setNewTribeImage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubTribes = onSnapshot(collection(db, 'tribes'), (snap) => {
      setAllTribes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tribe)));
    });
    return () => unsubTribes();
  }, []);

  useEffect(() => {
    if (currentUser.tribeId) {
      const unsubMyTribe = onSnapshot(doc(db, 'tribes', currentUser.tribeId), (snap) => {
        if (snap.exists()) {
          setMyTribe({ id: snap.id, ...snap.data() } as Tribe);
        } else {
          setMyTribe(null);
          onUpdateUser({ tribeId: null });
        }
      });

      const q = query(
        collection(db, 'tribes', currentUser.tribeId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      const unsubChat = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as TribeMessage)));
      });

      return () => { unsubMyTribe(); unsubChat(); };
    } else {
      setMyTribe(null);
      setMessages([]);
    }
  }, [currentUser.tribeId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, activeTab]);

  const handleCreateTribe = async () => {
    const cost = gameSettings.tribeCreationCost || 50000;
    if (currentUser.coins < cost) return alert('رصيدك لا يكفي لتأسيس قبيلة');
    if (!newTribeName.trim() || !newTribeImage) return alert('يرجى إكمال اسم وصورة القبيلة');

    setIsProcessing(true);
    const tribeId = 'tribe_' + Date.now();
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'tribes', tribeId), {
        id: tribeId,
        name: newTribeName,
        image: newTribeImage,
        leaderId: currentUser.id,
        leaderName: currentUser.name,
        memberIds: [currentUser.id],
        joinRequests: [],
        createdAt: serverTimestamp(),
        memberCount: 1,
        lastMessage: "تم تأسيس القبيلة 🎉",
        lastTimestamp: serverTimestamp()
      });

      batch.update(doc(db, 'users', currentUser.id), {
        coins: increment(-cost),
        wealth: increment(cost),
        tribeId: tribeId
      });

      await batch.commit();
      onUpdateUser({ coins: currentUser.coins - cost, tribeId: tribeId });
      setShowCreate(false);
      setActiveTab('my_tribe');
      alert('تم تأسيس قبيلتك بنجاح! 🏰');
    } catch (e) {
      alert('فشل تأسيس القبيلة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMemberById = async () => {
    if (!addId.trim() || !myTribe) return;
    setAddingByMemberId(true);
    try {
      const q = query(collection(db, 'users'), where('customId', '==', addId.trim()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert('المستخدم غير موجود');
      } else {
        const targetUser = snap.docs[0];
        const targetData = targetUser.data();
        if (targetData.tribeId) {
          alert('هذا المستخدم منضم لقبيلة أخرى بالفعل');
        } else {
          const batch = writeBatch(db);
          batch.update(doc(db, 'tribes', myTribe.id), {
            memberIds: arrayUnion(targetUser.id),
            memberCount: increment(1)
          });
          batch.update(targetUser.ref, { tribeId: myTribe.id });
          await batch.commit();
          alert('تمت إضافة العضو للقبيلة بنجاح ✅');
          setAddId('');
        }
      }
    } catch (e) { alert('خطأ في الإضافة'); } finally { setAddingByMemberId(false); }
  };

  const handleKickMember = async (userId: string) => {
    if (!myTribe || userId === currentUser.id) return;
    if (!confirm('هل أنت متأكد من طرد هذا العضو؟')) return;

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'tribes', myTribe.id), {
        memberIds: arrayRemove(userId),
        memberCount: increment(-1)
      });
      batch.update(doc(db, 'users', userId), { tribeId: null });
      await batch.commit();
      alert('تم طرد العضو من القبيلة');
    } catch (e) { alert('فشل الطرد'); }
  };

  const handleJoinRequest = async (tribeId: string) => {
    try {
      await updateDoc(doc(db, 'tribes', tribeId), {
        joinRequests: arrayUnion(currentUser.id)
      });
      alert('تم إرسال طلب الانضمام، بانتظار موافقة القائد ✅');
    } catch (e) { alert('فشل إرسال الطلب'); }
  };

  const handleAcceptMember = async (userId: string) => {
    if (!myTribe) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'tribes', myTribe.id), {
        memberIds: arrayUnion(userId),
        joinRequests: arrayRemove(userId),
        memberCount: increment(1)
      });
      batch.update(doc(db, 'users', userId), { tribeId: myTribe.id });
      await batch.commit();
    } catch (e) {}
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser.tribeId) return;
    const text = inputText;
    setInputText('');
    try {
      await addDoc(collection(db, 'tribes', currentUser.tribeId, 'messages'), {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'tribes', currentUser.tribeId), {
        lastMessage: text,
        lastTimestamp: serverTimestamp()
      });
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg h-[80vh] bg-[#0c101b] border border-emerald-500/20 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl font-cairo"
      >
        <div className="p-6 bg-gradient-to-br from-emerald-600/20 to-indigo-900/20 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                 <TowerControl className="text-emerald-400" size={28} />
              </div>
              <div className="text-right">
                 <h2 className="text-xl font-black text-white">نظام القبيلة</h2>
                 <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">التكاتف والقوة الملكية</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-white/40 hover:text-white"><X size={24}/></button>
        </div>

        <div className="flex bg-black/40 border-b border-white/5 p-1">
           <button onClick={() => setActiveTab('explore')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeTab === 'explore' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>استكشاف</button>
           {currentUser.tribeId && (
             <>
               <button onClick={() => setActiveTab('my_tribe')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeTab === 'my_tribe' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>قبيلتي</button>
               <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>الدردشة</button>
               {myTribe?.leaderId === currentUser.id && (
                 <button onClick={() => setActiveTab('requests')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeTab === 'requests' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}>الطلبات ({myTribe.joinRequests.length})</button>
               )}
             </>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
           {activeTab === 'explore' && (
             <div className="space-y-6">
                {!currentUser.tribeId && !showCreate && (
                  <button 
                    onClick={() => setShowCreate(true)}
                    className="w-full py-5 bg-gradient-to-r from-emerald-600 to-indigo-700 rounded-[1.8rem] flex flex-col items-center justify-center gap-1 shadow-xl active:scale-95 transition-all border border-white/10"
                  >
                     <span className="text-sm font-black text-white">تأسيس قبيلة جديدة</span>
                     <span className="text-[10px] font-bold text-emerald-200">التكلفة: {(gameSettings.tribeCreationCost || 50000).toLocaleString()} كوينز</span>
                  </button>
                )}

                <AnimatePresence>
                   {showCreate && (
                     <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-5 overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="text-white font-black text-xs">إعداد القبيلة الجديدة</h4>
                           <button onClick={() => setShowCreate(false)}><X size={16} className="text-slate-500"/></button>
                        </div>
                        <div className="space-y-4">
                           <input type="text" placeholder="اسم القبيلة..." value={newTribeName} onChange={e => setNewTribeName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pr-4 text-white text-xs outline-none focus:border-blue-500" />
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 pr-2">صورة القبيلة:</label>
                              <div className="flex items-center gap-4">
                                 <div className="w-20 h-20 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                                    {newTribeImage ? <img src={newTribeImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-700" size={32} />}
                                 </div>
                                 <label className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black cursor-pointer flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all">
                                    <Upload size={16} /> رفع صورة القبيلة
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, url => setNewTribeImage(url), 400, 400)} />
                                 </label>
                              </div>
                           </div>
                           <button onClick={handleCreateTribe} disabled={isProcessing} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">
                              {isProcessing ? 'جاري التأسيس...' : 'تأسيس الآن'}
                           </button>
                        </div>
                     </motion.div>
                   )}
                </AnimatePresence>

                <div className="grid gap-3">
                   {allTribes.map(tribe => (
                      <div key={tribe.id} className="bg-slate-900 border border-white/5 p-4 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                         <div className="flex items-center gap-3">
                            <img src={tribe.image} className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg" />
                            <div className="text-right">
                               <h5 className="text-white font-black text-sm">{tribe.name}</h5>
                               <p className="text-[10px] text-slate-500">الأعضاء: {tribe.memberCount}</p>
                            </div>
                         </div>
                         {!currentUser.tribeId && (
                            <button onClick={() => handleJoinRequest(tribe.id)} className="px-4 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black active:scale-90">انضمام</button>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'my_tribe' && myTribe && (
             <div className="space-y-6 text-right">
                <div className="relative w-full h-40 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                   <img src={myTribe.image} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                   <div className="absolute bottom-6 right-6">
                      <h3 className="text-2xl font-black text-white drop-shadow-lg">{myTribe.name}</h3>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">القائد: {myTribe.leaderName}</p>
                   </div>
                </div>

                {myTribe.leaderId === currentUser.id && (
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-3">
                     <h4 className="text-[10px] font-black text-emerald-400 uppercase pr-1">إضافة عضو جديد بالـ ID</h4>
                     <div className="flex gap-2">
                        <input type="text" value={addId} onChange={e => setAddId(e.target.value)} placeholder="ادخل آيدي العضو..." className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 text-xs text-white outline-none focus:border-emerald-500" />
                        <button onClick={handleAddMemberById} disabled={addingByMemberId} className="px-5 bg-emerald-600 text-white rounded-xl font-black text-xs active:scale-95 transition-all">إضافة</button>
                     </div>
                  </div>
                )}

                <div className="space-y-4">
                   <h4 className="text-white font-black text-sm flex items-center gap-2 pr-2">أعضاء القبيلة ({myTribe.memberCount})</h4>
                   <div className="grid gap-3">
                      {myTribe.memberIds.map(uid => {
                         const u = users.find(x => x.id === uid);
                         return u ? (
                           <div key={uid} className="bg-slate-900/50 p-3 rounded-2xl flex items-center justify-between border border-white/5">
                              <div className="flex items-center gap-3">
                                 <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                 <div className="text-right">
                                    <p className="text-xs font-black text-white">{u.name}</p>
                                    <p className="text-[9px] text-slate-500">ID: {u.customId || u.id}</p>
                                 </div>
                              </div>
                              {myTribe.leaderId === currentUser.id && u.id !== currentUser.id && (
                                <button onClick={() => handleKickMember(u.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><UserMinus size={18}/></button>
                              )}
                           </div>
                         ) : null;
                      })}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'chat' && (
             <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-hide" dir="rtl">
                   {messages.map(msg => {
                      const isMine = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                           <img src={msg.senderAvatar} className="w-7 h-7 rounded-lg object-cover" />
                           <div className={`p-3 rounded-2xl text-[11px] font-bold max-w-[70%] ${isMine ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                              {!isMine && <p className="text-[8px] opacity-60 mb-1">{msg.senderName}</p>}
                              {msg.text}
                           </div>
                        </div>
                      );
                   })}
                   <div ref={chatEndRef} />
                </div>
                <div className="p-2 bg-black/40 rounded-2xl flex items-center gap-2 shrink-0">
                   <input 
                     type="text" 
                     value={inputText}
                     onChange={e => setInputText(e.target.value)}
                     onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                     placeholder="دردشة القبيلة..." 
                     className="flex-1 bg-transparent text-white text-xs outline-none pr-3" 
                   />
                   <button onClick={handleSendMessage} className="p-2 bg-emerald-600 rounded-xl text-white active:scale-90"><Send size={18} fill="currentColor" /></button>
                </div>
             </div>
           )}

           {activeTab === 'requests' && (
             <div className="space-y-3" dir="rtl">
                {myTribe?.joinRequests.length === 0 ? (
                  <div className="py-20 text-center opacity-30 flex flex-col items-center gap-3">
                     <Users size={48} />
                     <p className="text-sm font-black">لا توجد طلبات انضمام حالياً</p>
                  </div>
                ) : (
                  myTribe?.joinRequests.map(uid => {
                    const u = users.find(x => x.id === uid);
                    return u ? (
                      <div key={uid} className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                         <div className="flex items-center gap-3">
                            <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover" />
                            <div>
                               <p className="text-white font-black text-xs">{u.name}</p>
                               <p className="text-[9px] text-slate-500">ID: {u.customId}</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleAcceptMember(u.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black">قبول</button>
                            <button onClick={() => updateDoc(doc(db, 'tribes', myTribe.id), { joinRequests: arrayRemove(u.id) })} className="px-3 py-1.5 bg-red-600/10 text-red-500 rounded-lg text-[9px] font-black">رفض</button>
                         </div>
                      </div>
                    ) : null;
                  })
                )}
             </div>
           )}

        </div>
      </motion.div>
    </div>
  );
};

export default TribeModal;