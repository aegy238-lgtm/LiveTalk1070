
import React, { useState } from 'react';
import { Smile, Upload, Trash2, Plus, Clock, Save, Sparkles, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameSettings } from '../../types';

interface AdminEmojisProps {
  gameSettings: GameSettings;
  onUpdateGameSettings: (updates: Partial<GameSettings>) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminEmojis: React.FC<AdminEmojisProps> = ({ gameSettings, onUpdateGameSettings, handleFileUpload }) => {
  const [newEmojiText, setNewEmojiText] = useState('');
  const [newEmojiUrl, setNewEmojiUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const emojis = gameSettings.availableEmojis || [];
  const duration = gameSettings.emojiDuration || 4;

  const handleAddEmoji = async (value: string) => {
    if (!value.trim()) return;
    const updated = [...emojis, value.trim()];
    try {
      await onUpdateGameSettings({ availableEmojis: updated });
      alert('تمت الإضافة بنجاح وظهورها عالمياً ✅');
    } catch (e) {
      alert('فشل الحفظ في السيرفر');
    }
  };

  const handleRemoveEmoji = async (index: number) => {
    if (!confirm('هل تريد حذف هذا التفاعل؟')) return;
    const updated = emojis.filter((_, i) => i !== index);
    await onUpdateGameSettings({ availableEmojis: updated });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-right font-cairo" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 bg-yellow-500 rounded-xl shadow-lg shadow-yellow-900/40"><Smile className="text-black" /></div>
          إدارة تفاعلات الغرف (Reactions)
        </h3>
        <p className="text-slate-500 text-xs font-bold mt-2">أضف روابط صور PNG/GIF لتظهر كتفاعلات متحركة فوق المايك عند الجميع.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* مدة الظهور */}
        <div className="md:col-span-1 bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
           <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-blue-400" />
              <h4 className="text-sm font-black text-white">مدة الظهور</h4>
           </div>
           <div className="space-y-1">
              <input 
                type="number" 
                value={duration}
                onChange={(e) => onUpdateGameSettings({ emojiDuration: parseInt(e.target.value) || 1 })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-center text-xl font-black text-blue-400 outline-none focus:border-blue-500/50"
              />
              <p className="text-[10px] text-slate-500 text-center font-bold">عدد الثواني قبل اختفاء التفاعل</p>
           </div>
        </div>

        {/* إضافة جديد */}
        <div className="md:col-span-2 bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
           <div className="space-y-6">
              {/* إضافة عبر الرابط - ميزة الثبات المطلوبة */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 pr-2 flex items-center gap-2">
                   <LinkIcon size={12} className="text-blue-400"/> إضافة عبر رابط مباشر (URL)
                 </label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newEmojiUrl}
                      onChange={(e) => setNewEmojiUrl(e.target.value)}
                      placeholder="ضع رابط صورة الـ GIF أو PNG هنا..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"
                    />
                    <button 
                      onClick={() => { handleAddEmoji(newEmojiUrl); setNewEmojiUrl(''); }} 
                      className="px-6 bg-blue-600 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg"
                    >
                      إضافة رابط
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 pr-2">إضافة رمز نصي</label>
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newEmojiText}
                          onChange={(e) => setNewEmojiText(e.target.value)}
                          placeholder="مثلاً: 🔥"
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-center text-lg outline-none focus:border-yellow-500/50"
                        />
                        <button onClick={() => { handleAddEmoji(newEmojiText); setNewEmojiText(''); }} className="px-5 bg-yellow-500 text-black rounded-xl font-black text-xs active:scale-95"><Plus size={20}/></button>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 pr-2">رفع من الجهاز</label>
                    <label className={`w-full h-[52px] bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-500 transition-all font-black text-xs shadow-lg active:scale-95 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Upload size={18}/> رفع ملف</>}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          setIsUploading(true);
                          handleFileUpload(e, (url) => {
                            handleAddEmoji(url);
                            setIsUploading(false);
                          }, 256, 256);
                        }} />
                    </label>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* المستودع */}
      <div className="bg-black/20 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
         <div className="flex items-center justify-between mb-6">
            <h4 className="text-white font-black text-sm flex items-center gap-2">
               <Sparkles size={16} className="text-yellow-400" /> التفاعلات المتاحة في السيرفر ({emojis.length})
            </h4>
         </div>

         <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {emojis.map((emoji, idx) => {
               const isUrl = emoji.startsWith('http') || emoji.startsWith('data:');
               return (
                 <div key={idx} className="relative group aspect-square bg-slate-800/50 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden p-2 shadow-inner transition-all hover:border-yellow-500/30">
                    {isUrl ? (
                       <img src={emoji} className="w-full h-full object-contain" alt="" />
                    ) : (
                       <span className="text-2xl">{emoji}</span>
                    )}
                    <button 
                      onClick={() => handleRemoveEmoji(idx)}
                      className="absolute inset-0 bg-red-600/90 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <Trash2 size={18} />
                       <span className="text-[8px] font-black mt-1">حذف</span>
                    </button>
                 </div>
               );
            })}
            {emojis.length === 0 && (
               <div className="col-span-full py-20 text-center opacity-30">
                  <ImageIcon size={48} className="mx-auto mb-2" />
                  <p className="font-bold text-sm">لا توجد تفاعلات مخصصة بعد</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminEmojis;
