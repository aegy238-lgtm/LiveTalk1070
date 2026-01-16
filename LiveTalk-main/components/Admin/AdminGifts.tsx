
import React, { useState } from 'react';
import { Plus, Gift as GiftIcon, Edit3, Trash2, Wand2, X, Upload, Video, Image as ImageIcon, Save, Music, Clock, Maximize, Layers, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, GiftDisplaySize, GiftAnimationType } from '../../types';

interface AdminGiftsProps {
  gifts: Gift[];
  onSaveGift: (gift: Gift, isDelete?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminGifts: React.FC<AdminGiftsProps> = ({ gifts, onSaveGift, handleFileUpload }) => {
  const [editingGift, setEditingGift] = useState<Partial<Gift> | null>(null);
  const [isUploading, setIsUploading] = useState<'icon' | 'catalog' | 'sound' | null>(null);

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || url.includes('video');
  };

  const handleOpenAdd = () => {
    setEditingGift({
      id: 'gift_' + Date.now(),
      name: '',
      icon: '', // الرابط الأساسي (MP4 أو APNG)
      catalogIcon: '', // الأيقونة المصغرة
      soundUrl: '',
      cost: 10,
      category: 'popular',
      duration: 8,
      displaySize: 'medium',
      animationType: 'pop'
    });
  };

  return (
    <div className="space-y-10 text-right font-cairo" dir="rtl">
      {/* Header Card */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-950/40 p-8 rounded-[3rem] border border-white/10 shadow-2xl gap-6">
        <div className="text-right">
           <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-3 bg-pink-600 rounded-2xl shadow-lg shadow-pink-900/40"><GiftIcon className="text-white" /></div>
              نظام الهدايا المتقدم (V3)
           </h3>
           <p className="text-slate-500 text-xs font-bold mt-2">تحكم في روابط الـ MP4، المؤثرات الصوتية، وحجم ظهور الهدية في الغرف.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="px-10 py-5 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-[1.8rem] font-black text-xs shadow-xl active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={20} strokeWidth={3} /> إضافة هدية ملكية
        </button>
      </div>
      
      {/* Gifts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {gifts.map(gift => (
          <motion.div whileHover={{ y: -5 }} key={gift.id} className="bg-slate-900/60 border border-white/5 p-5 rounded-[2.5rem] flex flex-col items-center gap-4 group relative overflow-hidden shadow-xl transition-all hover:border-pink-500/30">
            <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button onClick={() => setEditingGift(gift)} className="p-2 bg-blue-600 rounded-xl text-white shadow-lg active:scale-90"><Edit3 size={14}/></button>
              <button onClick={() => { if(confirm('هل تريد حذف هذه الهدية نهائياً؟')) onSaveGift(gift, true) }} className="p-2 bg-red-600 rounded-xl text-white shadow-lg active:scale-90"><Trash2 size={14}/></button>
            </div>
            
            <div className="w-24 h-24 flex items-center justify-center bg-black/40 rounded-[2rem] overflow-hidden relative shadow-inner border border-white/5">
               {isVideoUrl(gift.icon) ? (
                 <video src={gift.icon} className="w-full h-full object-contain" muted loop autoPlay playsInline />
               ) : (
                 <img src={gift.catalogIcon || gift.icon} className="w-full h-full object-contain p-2" alt="" />
               )}
               {gift.isLucky && <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[6px] font-black px-1.5 py-0.5 rounded-md shadow-lg">LUCKY</div>}
            </div>
            
            <div className="text-center w-full">
              <span className="text-[11px] font-black text-white truncate block px-2">{gift.name}</span>
              <div className="flex items-center justify-center gap-1 mt-1.5 text-yellow-500 font-bold bg-black/30 py-1 rounded-full border border-white/5">
                <span className="text-[10px]">{gift.cost.toLocaleString()}</span>
                <Sparkles size={10} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advanced Editor Modal */}
      <AnimatePresence>
        {editingGift && (
          <div className="fixed inset-0 z-[3005] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f172a] border border-white/10 rounded-[3.5rem] w-full max-w-4xl p-10 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-pink-600/20 rounded-2xl border border-pink-500/30"><Wand2 className="text-pink-500" /></div>
                   <h3 className="text-2xl font-black text-white">تخصيص محتوى الهدية</h3>
                </div>
                <button onClick={() => setEditingGift(null)} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Left Column: Previews and Files */}
                <div className="space-y-8">
                   {/* Main Content Preview (Animation) */}
                   <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-500 uppercase pr-2 flex items-center gap-2">رابط الأنيميشن (MP4 / APNG) <Video size={14} /></label>
                      <div className="relative aspect-video bg-black/40 rounded-[2.5rem] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group shadow-inner">
                         {editingGift.icon ? (
                            isVideoUrl(editingGift.icon) ? (
                               <video src={editingGift.icon} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                            ) : (
                               <img src={editingGift.icon} className="w-full h-full object-contain p-4" />
                            )
                         ) : <div className="text-slate-700 flex flex-col items-center gap-2"><Video size={48} /><span className="text-[10px] font-black">لا يوجد ملف عرض</span></div>}
                         <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                            <Upload size={32} className="text-white" />
                            <span className="text-[10px] text-white font-black mt-2">رفع ملف العرض</span>
                            <input type="file" accept="video/*,image/*" className="hidden" onChange={(e) => { setIsUploading('icon'); handleFileUpload(e, (url) => { setEditingGift({...editingGift, icon: url}); setIsUploading(null); }, 1080, 1920); }} />
                         </label>
                      </div>
                      <input type="text" value={editingGift.icon || ''} onChange={e => setEditingGift({...editingGift, icon: e.target.value})} placeholder="أو ضع رابط MP4 مباشر هنا..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-[10px] text-pink-400 outline-none focus:border-pink-500/50" />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      {/* Catalog Icon */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase pr-2 flex items-center gap-2">أيقونة المتجر <ImageIcon size={12}/></label>
                        <div className="relative w-24 h-24 bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden group">
                           {editingGift.catalogIcon ? <img src={editingGift.catalogIcon} className="w-full h-full object-contain p-2" /> : <ImageIcon className="text-slate-800" size={32} />}
                           <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                              <Upload size={20} className="text-white" />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => { setIsUploading('catalog'); handleFileUpload(e, (url) => { setEditingGift({...editingGift, catalogIcon: url}); setIsUploading(null); }, 200, 200); }} />
                           </label>
                        </div>
                        <input type="text" value={editingGift.catalogIcon || ''} onChange={e => setEditingGift({...editingGift, catalogIcon: e.target.value})} placeholder="URL الأيقونة..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-[9px] text-blue-400 outline-none" />
                      </div>

                      {/* Sound File */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase pr-2 flex items-center gap-2">صوت الهدية <Music size={12}/></label>
                        <div className={`relative w-24 h-24 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-2 shadow-inner transition-colors ${editingGift.soundUrl ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-black/40'}`}>
                           <Music className={editingGift.soundUrl ? 'text-indigo-400' : 'text-slate-800'} size={32} />
                           {editingGift.soundUrl && <div className="bg-indigo-500 w-2 h-2 rounded-full animate-ping"></div>}
                           <label className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-all rounded-3xl">
                              <Upload size={20} className="text-white" />
                              <input type="file" accept="audio/*" className="hidden" onChange={(e) => { setIsUploading('sound'); handleFileUpload(e, (url) => { setEditingGift({...editingGift, soundUrl: url}); setIsUploading(null); }, 0, 0); }} />
                           </label>
                        </div>
                        <input type="text" value={editingGift.soundUrl || ''} onChange={e => setEditingGift({...editingGift, soundUrl: e.target.value})} placeholder="URL الصوت..." className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-[9px] text-emerald-400 outline-none" />
                      </div>
                   </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 pr-2">اسم الهدية</label>
                        <input type="text" value={editingGift.name} onChange={e => setEditingGift({...editingGift, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black" placeholder="اسم الهدية..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 pr-2">السعر (كوينز)</label>
                        <input type="number" value={editingGift.cost} onChange={e => setEditingGift({...editingGift, cost: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-yellow-500 font-black" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 pr-2 flex items-center gap-2"><Maximize size={12}/> حجم العرض</label>
                        <select 
                          value={editingGift.displaySize} 
                          onChange={e => setEditingGift({...editingGift, displaySize: e.target.value as GiftDisplaySize})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none appearance-none"
                        >
                          <option value="small">صغير (Small)</option>
                          <option value="medium">متوسط (Medium)</option>
                          <option value="large">كبير (Large)</option>
                          <option value="full">ملء الشاشة (Full Screen)</option>
                          <option value="max">أقصى حجم (Max Overlay)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 pr-2 flex items-center gap-2"><Layers size={12}/> صندوق الهدايا (الفئة)</label>
                        <select 
                          value={editingGift.category} 
                          onChange={e => setEditingGift({...editingGift, category: e.target.value as any})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none appearance-none"
                        >
                          <option value="popular">هدايا شائعة (Popular)</option>
                          <option value="exclusive">هدايا حصرية (Exclusive)</option>
                          <option value="lucky">هدايا الحظ (Lucky Boxes)</option>
                          <option value="trend">ترند (Trending)</option>
                          <option value="celebrity">مشاهير (Celebrity)</option>
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 pr-2 flex items-center gap-2"><Clock size={12}/> مدة العرض (ثانية)</label>
                        <input type="number" value={editingGift.duration} onChange={e => setEditingGift({...editingGift, duration: parseInt(e.target.value) || 8})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-blue-400 font-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 pr-2">نوع الحركة</label>
                        <select 
                          value={editingGift.animationType} 
                          onChange={e => setEditingGift({...editingGift, animationType: e.target.value as GiftAnimationType})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none appearance-none"
                        >
                          <option value="pop">انبثاق (Pop)</option>
                          <option value="fly">طيران (Fly)</option>
                          <option value="shake">اهتزاز (Shake)</option>
                          <option value="bounce">قفز (Bounce)</option>
                          <option value="full-screen">دخول سينمائي</option>
                          <option value="none">ثابت (None)</option>
                        </select>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-white/5 flex gap-4">
                      <button 
                         onClick={async () => { await onSaveGift(editingGift as Gift); setEditingGift(null); }} 
                         className="flex-1 py-5 bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                         <Save size={20} /> حفظ الهدية ونشرها
                      </button>
                      <button onClick={() => setEditingGift(null)} className="px-10 py-5 bg-white/5 text-slate-400 font-black rounded-2xl active:scale-95">إلغاء</button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGifts;
