
import React, { useState, useEffect } from 'react';
import { Search, Medal, Upload, Trash2, User as UserIcon, Plus, Sparkles, X, Send, CheckCircle2, UserMinus, Star, ShieldCheck, UserCheck, Check, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';

interface AdminBadgesProps {
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.2): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

const AdminBadges: React.FC<AdminBadgesProps> = ({ users, onUpdateUser }) => {
  const [globalMedals, setGlobalMedals] = useState<string[]>([]);
  const [autoAgentMedal, setAutoAgentMedal] = useState<string | null>(null);
  const [autoHostMedal, setAutoHostMedal] = useState<string | null>(null);
  
  // حالات الاختيار المتعدد
  const [selectedMedals, setSelectedMedals] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);

  useEffect(() => {
    const fetchMedals = async () => {
      const docRef = doc(db, 'appSettings', 'medals_library');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setGlobalMedals(data.medals || []);
        setAutoAgentMedal(data.autoAgentMedal || null);
        setAutoHostMedal(data.autoHostMedal || null);
      }
    };
    fetchMedals();
  }, []);

  const filteredAwardUsers = searchQuery.trim() === '' ? [] : users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.customId?.toString() === searchQuery ||
    u.id === searchQuery
  ).slice(0, 5);

  const toggleMedalSelection = (medal: string) => {
    setSelectedMedals(prev => 
      prev.includes(medal) ? prev.filter(m => m !== medal) : [...prev, medal]
    );
  };

  const handleUploadToLibrary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        alert('حجم الوسام كبير! يفضل أن يكون أقل من 200 كيلوبايت.');
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        
        if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
          try {
            const docRef = doc(db, 'appSettings', 'medals_library');
            await setDoc(docRef, { medals: arrayUnion(result) }, { merge: true });
            setGlobalMedals(prev => [...prev, result]);
          } catch (err) { alert('فشل رفع الوسام'); } finally { setIsUploading(false); }
        } else {
          const compressed = await compressImage(result, 64, 64, 0.3);
          try {
            const docRef = doc(db, 'appSettings', 'medals_library');
            await setDoc(docRef, { medals: arrayUnion(compressed) }, { merge: true });
            setGlobalMedals(prev => [...prev, compressed]);
          } catch (err) { alert('فشل رفع الوسام'); } finally { setIsUploading(false); }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const setAutoMedal = async (url: string, type: 'agent' | 'host') => {
    try {
      const docRef = doc(db, 'appSettings', 'medals_library');
      if (type === 'agent') {
        await updateDoc(docRef, { autoAgentMedal: url });
        setAutoAgentMedal(url);
        alert('تم تعيين الوسام التلقائي للوكلاء الجدد ✅');
      } else {
        await updateDoc(docRef, { autoHostMedal: url });
        setAutoHostMedal(url);
        alert('تم تعيين الوسام التلقائي للمضيفين الجدد ✅');
      }
    } catch (e) { alert('فشل التعيين'); }
  };

  const removeFromLibrary = async (url: string) => {
    if (!confirm('هل تريد حذف هذا الوسام من المكتبة؟')) return;
    try {
      const docRef = doc(db, 'appSettings', 'medals_library');
      const updates: any = { medals: arrayRemove(url) };
      if (autoAgentMedal === url) updates.autoAgentMedal = null;
      if (autoHostMedal === url) updates.autoHostMedal = null;
      
      await updateDoc(docRef, updates);
      setGlobalMedals(prev => prev.filter(m => m !== url));
      if (autoAgentMedal === url) setAutoAgentMedal(null);
      if (autoHostMedal === url) setAutoHostMedal(null);
      setSelectedMedals(prev => prev.filter(m => m !== url));
    } catch (err) { alert('فشل الحذف من المكتبة'); }
  };

  const awardMedalsToUser = async () => {
    if (!selectedUser || selectedMedals.length === 0) return;
    
    const currentBadgesCount = (selectedUser.achievements || []).length;
    if (currentBadgesCount + selectedMedals.length > 30) {
      alert(`هذا العضو لديه ${currentBadgesCount} وسام. لا يمكن إضافة ${selectedMedals.length} وسام إضافي لأن الحد الأقصى 30.`);
      return;
    }

    setIsAwarding(true);
    try {
      // استخدام arrayUnion مع عدة عناصر في نفس الوقت
      await onUpdateUser(selectedUser.id, { 
        achievements: arrayUnion(...selectedMedals) 
      });
      alert(`تم منح ${selectedMedals.length} أوسمة لـ ${selectedUser.name} بنجاح! 🎖️`);
      setSelectedUser(null);
      setSelectedMedals([]);
      setSearchQuery('');
    } catch (err) { 
      alert('فشل منح الأوسمة'); 
    } finally { 
      setIsAwarding(false); 
    }
  };

  return (
    <div className="space-y-10 text-right font-cairo" dir="rtl">
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
           <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <Medal className="text-yellow-500" /> إدارة الأوسمة (منح متعدد)
              </h3>
              <p className="text-slate-500 text-xs font-bold mt-1">حدد مجموعة أوسمة من المكتبة ثم ابحث عن العضو لمنحهم له دفعة واحدة.</p>
           </div>
           <div className="flex gap-2">
             <label className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl text-xs font-black cursor-pointer shadow-xl active:scale-95 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
                رفع وسام جديد
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadToLibrary} />
             </label>
             {selectedMedals.length > 0 && (
               <button onClick={() => setSelectedMedals([])} className="px-4 py-3 bg-red-600/10 text-red-500 rounded-2xl text-xs font-black border border-red-500/20 active:scale-95">تصفير المختار ({selectedMedals.length})</button>
             )}
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
           {globalMedals.map((medal, idx) => {
              const isSelected = selectedMedals.includes(medal);
              return (
                <div 
                  key={idx} 
                  onClick={() => toggleMedalSelection(medal)}
                  className={`relative group bg-slate-950/40 border-2 rounded-[2rem] p-2 flex flex-col items-center justify-center min-h-[140px] transition-all cursor-pointer ${isSelected ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-white/5 hover:border-white/20'}`}
                >
                   {/* Checkbox Icon */}
                   <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-black/40 border-white/20 text-transparent'}`}>
                      <Check size={12} strokeWidth={4} />
                   </div>

                   <div className="h-16 w-16 flex items-center justify-center mb-2">
                      <img src={medal} className="max-w-full max-h-full object-contain pointer-events-none" />
                   </div>
                   
                   {/* شارات التلقائية */}
                   <div className="flex flex-wrap gap-1 justify-center mb-1">
                      {autoAgentMedal === medal && <div className="bg-blue-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full shadow-lg">AUTO AGENT</div>}
                      {autoHostMedal === medal && <div className="bg-emerald-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full shadow-lg">AUTO HOST</div>}
                   </div>

                   <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 rounded-[2rem] z-20">
                      <button onClick={(e) => { e.stopPropagation(); setAutoMedal(medal, 'agent'); }} className="w-full py-1.5 bg-blue-600 text-white text-[8px] font-black rounded-lg flex items-center justify-center gap-1"><ShieldCheck size={10}/> آلي وكيل</button>
                      <button onClick={(e) => { e.stopPropagation(); setAutoMedal(medal, 'host'); }} className="w-full py-1.5 bg-emerald-600 text-white text-[8px] font-black rounded-lg flex items-center justify-center gap-1"><UserCheck size={10}/> آلي مضيف</button>
                      <button onClick={(e) => { e.stopPropagation(); removeFromLibrary(medal); }} className="w-full py-1.5 bg-red-600 text-white text-[8px] font-black rounded-lg flex items-center justify-center gap-1"><Trash2 size={10}/> حذف</button>
                   </div>
                </div>
              );
           })}
        </div>
      </section>

      {/* لوحة المنح الجماعي */}
      <AnimatePresence>
        {selectedMedals.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }} 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-[4000] bg-slate-900 border border-yellow-500/50 rounded-[3rem] p-8 shadow-[0_20px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[60px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                 <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <Layers className="text-yellow-500" /> منح مجموعة أوسمة ({selectedMedals.length})
                 </h3>
                 <button onClick={() => setSelectedMedals([])} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={20}/></button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 pr-2">أولاً: ابحث عن العضو المستهدف:</label>
                    <div className="relative group">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="ادخل ID المستخدم..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pr-14 text-white text-sm outline-none focus:border-yellow-500/50 shadow-inner font-black" 
                      />
                    </div>
                    
                    <AnimatePresence>
                      {filteredAwardUsers.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-40 overflow-y-auto divide-y divide-white/5">
                          {filteredAwardUsers.map(u => (
                            <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQuery(''); }} className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-right ${selectedUser?.id === u.id ? 'bg-yellow-500/10 border-r-4 border-yellow-500' : ''}`}>
                              <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                              <div className="flex flex-col">
                                <span className="font-bold text-white text-sm">{u.name}</span>
                                <span className="text-[10px] text-slate-500">ID: {u.customId || u.id}</span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 <div className="space-y-4 flex flex-col justify-end">
                    {selectedUser ? (
                       <div className="flex flex-col gap-4 p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                          <div className="flex items-center gap-4">
                             <img src={selectedUser.avatar} className="w-12 h-12 rounded-2xl object-cover" />
                             <div className="flex-1">
                                <p className="text-white text-sm font-black">جاهز للمنح لـ <span className="text-emerald-400">{selectedUser.name}</span></p>
                                <p className="text-[10px] text-slate-500 font-bold">سيتم إضافة {selectedMedals.length} وسام جديد لحسابه.</p>
                             </div>
                          </div>
                          <button 
                            onClick={awardMedalsToUser} 
                            disabled={isAwarding} 
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isAwarding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={18} />}
                            تنفيذ منح المجموعة الآن
                          </button>
                       </div>
                    ) : (
                       <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] p-6 opacity-30">
                          <p className="text-xs font-bold text-slate-400">اختر عضواً لإكمال عملية المنح الجماعي</p>
                       </div>
                    )}
                 </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBadges;
