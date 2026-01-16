
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Plus, UserCircle, Save, Sparkles, Layout, Camera, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';

interface AdminDefaultsProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminDefaults: React.FC<AdminDefaultsProps> = ({ handleFileUpload }) => {
  const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);
  const [globalDefaultAvatar, setGlobalDefaultAvatar] = useState('');
  const [globalDefaultCover, setGlobalDefaultCover] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  useEffect(() => {
    const fetchDefaults = async () => {
      const docRef = doc(db, 'appSettings', 'defaults');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setDefaultAvatars(data.profilePictures || []);
        setGlobalDefaultAvatar(data.globalDefaultAvatar || '');
        setGlobalDefaultCover(data.globalDefaultCover || '');
      }
    };
    fetchDefaults();
  }, []);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    handleFileUpload(e, async (url) => {
      try {
        const docRef = doc(db, 'appSettings', 'defaults');
        await setDoc(docRef, { profilePictures: arrayUnion(url) }, { merge: true });
        setDefaultAvatars(prev => [...prev, url]);
      } catch (err) {
        alert('فشل حفظ الصورة');
      } finally {
        setIsUploading(false);
      }
    }, 300, 300);
  };

  const removeAvatar = async (url: string) => {
    if (!confirm('حذف هذه الصورة من القائمة الافتراضية؟')) return;
    try {
      const docRef = doc(db, 'appSettings', 'defaults');
      await updateDoc(docRef, { profilePictures: arrayRemove(url) });
      setDefaultAvatars(prev => prev.filter(a => a !== url));
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const saveGlobalDefaults = async () => {
    setIsSavingGlobal(true);
    try {
      const docRef = doc(db, 'appSettings', 'defaults');
      await updateDoc(docRef, {
        globalDefaultAvatar,
        globalDefaultCover
      });
      alert('تم اعتماد الهوية الافتراضية للمسجلين الجدد بنجاح ✅');
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  return (
    <div className="space-y-10 text-right font-cairo" dir="rtl">
      
      {/* قسم الهوية التلقائية للمستخدمين الجدد */}
      <section className="bg-slate-900/60 p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
        <div className="relative z-10 space-y-8">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/40">
                 <Sparkles className="text-white" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white">الهوية التلقائية للأعضاء الجدد</h3>
                 <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">تخصيص بروفايل ينزل آلياً عند إنشاء حساب جديد</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* الصورة الشخصية الافتراضية */}
              <div className="space-y-4">
                 <label className="text-xs font-black text-slate-400 pr-2 flex items-center gap-2">
                    <Camera size={14} className="text-blue-500" /> الصورة الشخصية (Avatar)
                 </label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <input 
                         type="text" 
                         value={globalDefaultAvatar}
                         onChange={e => setGlobalDefaultAvatar(e.target.value)}
                         placeholder="رابط الصورة المباشر..."
                         className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] text-blue-400 outline-none focus:border-blue-500"
                       />
                       <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    </div>
                    <label className="p-4 bg-blue-600 rounded-2xl cursor-pointer active:scale-90 transition-transform">
                       <Upload size={20} />
                       <input type="file" className="hidden" onChange={e => handleFileUpload(e, setGlobalDefaultAvatar, 300, 300)} />
                    </label>
                 </div>
                 {globalDefaultAvatar && (
                   <div className="flex justify-center pt-2">
                      <img src={globalDefaultAvatar} className="w-20 h-20 rounded-full border-2 border-blue-500/30 p-1 object-cover" alt="Preview" />
                   </div>
                 )}
              </div>

              {/* الغلاف الافتراضي */}
              <div className="space-y-4">
                 <label className="text-xs font-black text-slate-400 pr-2 flex items-center gap-2">
                    <Layout size={14} className="text-emerald-500" /> غلاف البروفايل (Cover)
                 </label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <input 
                         type="text" 
                         value={globalDefaultCover}
                         onChange={e => setGlobalDefaultCover(e.target.value)}
                         placeholder="رابط الغلاف المباشر..."
                         className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-[11px] text-emerald-400 outline-none focus:border-emerald-500"
                       />
                       <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    </div>
                    <label className="p-4 bg-emerald-600 rounded-2xl cursor-pointer active:scale-90 transition-transform">
                       <Upload size={20} />
                       <input type="file" className="hidden" onChange={e => handleFileUpload(e, setGlobalDefaultCover, 800, 400)} />
                    </label>
                 </div>
                 {globalDefaultCover && (
                   <div className="pt-2">
                      <div className="w-full h-16 rounded-xl border border-emerald-500/20 overflow-hidden">
                         <img src={globalDefaultCover} className="w-full h-full object-cover opacity-60" alt="Preview" />
                      </div>
                   </div>
                 )}
              </div>
           </div>

           <button 
             onClick={saveGlobalDefaults}
             disabled={isSavingGlobal}
             className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
           >
              {isSavingGlobal ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
              اعتماد الهوية الافتراضية للجميع
           </button>
        </div>
      </section>

      {/* القسم القديم: المعرض الاختياري */}
      <section>
        <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <UserCircle className="text-blue-500" size={24} /> معرض الصور الاختياري
            </h3>
            <p className="text-slate-500 text-[10px] font-bold mt-1">الصور التي يراها المستخدم في شريط الاختيار السريع عند التسجيل.</p>
          </div>
          <label className={`flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black cursor-pointer hover:bg-white/10 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
            إضافة للمعرض
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {defaultAvatars.map((url, idx) => (
            <motion.div key={idx} whileHover={{ scale: 1.05 }} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-slate-900 shadow-lg">
              <img src={url} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => removeAvatar(url)} className="p-2 bg-red-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
          {defaultAvatars.length === 0 && !isUploading && (
            <div className="col-span-full py-10 text-center opacity-30">
              <ImageIcon size={40} className="mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-[10px]">المعرض فارغ</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDefaults;
