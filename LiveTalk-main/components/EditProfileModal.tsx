
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Save, User as UserIcon, FileText, Image as ImageIcon, MapPin } from 'lucide-react';
import { User } from '../types';

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.1): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
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

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updatedData: Partial<User>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [cover, setCover] = useState(currentUser.cover || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawAvatar, setRawAvatar] = useState<string | null>(null);
  const [rawCover, setRawCover] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setAvatar(currentUser.avatar);
      setCover(currentUser.cover || '');
      setRawAvatar(null);
      setRawCover(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const raw = event.target.result as string;
          // معاينة فورية بالمتصفح (قبل الضغط لسرعة الاستجابة)
          if (type === 'avatar') {
            setAvatar(raw);
            setRawAvatar(raw);
          } else {
            setCover(raw);
            setRawCover(raw);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // 1. تحديث محلي فوري (Optimistic)
    const instantData: Partial<User> = { name, bio, location, avatar, cover };
    onSave(instantData); 
    onClose(); // إغلاق النافذة فوراً

    // 2. الرفع في الخلفية مع الضغط
    setTimeout(async () => {
      let finalAvatar = avatar;
      let finalCover = cover;

      if (rawAvatar && !rawAvatar.startsWith('https')) {
        finalAvatar = await compressImage(rawAvatar, 128, 128, 0.3);
      }
      if (rawCover && !rawCover.startsWith('https')) {
        finalCover = await compressImage(rawCover, 600, 240, 0.2);
      }

      onSave({ ...instantData, avatar: finalAvatar, cover: finalCover });
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.8, opacity: 0, y: 50 }} 
        className="relative w-full max-w-sm bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-cairo"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-black text-white">تعديل الملف الشخصي</h2>
             <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition active:scale-90"><X size={20} className="text-slate-400" /></button>
          </div>

          <div className="flex flex-col gap-6">
             <div className="relative mb-8">
                <div className="w-full h-32 rounded-3xl bg-slate-900 relative group overflow-hidden border border-white/5">
                   {cover ? <img src={cover} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 flex items-center justify-center"><span className="text-[10px] text-white/30 font-black uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> غلاف الحساب</span></div>}
                   <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer">
                      <div className="bg-blue-600/80 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 border border-white/20">
                         <Camera size={16} className="text-white" /><span className="text-xs text-white font-black">تغيير الغلاف</span>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
                   </label>
                </div>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                   <div className="relative group">
                      <div className="w-24 h-24 rounded-full p-1 bg-slate-950 shadow-2xl">
                         <img src={avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-slate-800" />
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10">
                         <Camera size={28} className="text-white drop-shadow-xl" />
                         <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" />
                      </label>
                   </div>
                </div>
             </div>

             <div className="space-y-4 mt-6 text-right" dir="rtl">
                <div>
                   <label className="text-[10px] font-black text-slate-500 mb-1.5 flex items-center gap-2 pr-1 uppercase tracking-widest"><UserIcon size={12} className="text-blue-400" /> اسمك المستعار</label>
                   <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm font-bold focus:border-blue-500/50 outline-none transition-all shadow-inner" placeholder="ادخل اسمك الجديد..." />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 mb-1.5 flex items-center gap-2 pr-1 uppercase tracking-widest"><FileText size={12} className="text-emerald-400" /> السيرة الذاتية (Bio)</label>
                   <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm font-bold min-h-[90px] resize-none focus:border-emerald-500/50 outline-none transition-all shadow-inner" placeholder="اخبر الآخرين عنك..." maxLength={150} />
                </div>
             </div>

             <button 
                onClick={handleSave} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/20 mt-2"
             >
                <Save size={18} /> حفظ التعديلات الملكية
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
