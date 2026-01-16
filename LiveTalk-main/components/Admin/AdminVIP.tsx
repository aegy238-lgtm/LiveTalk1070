
import React, { useState } from 'react';
// Added Coins to lucide-react imports
import { Plus, Crown, Edit3, Trash2, X, Upload, Image as ImageIcon, Star, Save, Link as LinkIcon, Sparkles, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VIPPackage } from '../../types';

interface AdminVIPProps {
  vipLevels: VIPPackage[];
  onSaveVip: (vip: VIPPackage, isDelete?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminVIP: React.FC<AdminVIPProps> = ({ vipLevels, onSaveVip, handleFileUpload }) => {
  const [editingVip, setEditingVip] = useState<Partial<VIPPackage> | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFinalSave = async () => {
    if (!editingVip || !editingVip.name || !editingVip.frameUrl) {
      alert('يرجى إكمال البيانات (الاسم ورابط الإطار)');
      return;
    }
    await onSaveVip(editingVip as VIPPackage);
    setEditingVip(null);
  };

  return (
    <div className="space-y-10 text-right font-cairo" dir="rtl">
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-950/40 p-8 rounded-[3rem] border border-white/10 shadow-2xl gap-6">
        <div className="text-center md:text-right">
          <h3 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
            <div className="p-2 bg-amber-500 rounded-2xl shadow-lg shadow-amber-900/40"><Crown className="text-black" /></div>
            إدارة الرتب الملكية (VIP)
          </h3>
          <p className="text-slate-500 text-sm font-bold mt-2 pr-1">قم بإنشاء مستويات VIP مخصصة بأسعار وإطارات فريدة.</p>
        </div>
        <button 
          onClick={() => setEditingVip({ 
            level: (vipLevels.length > 0 ? Math.max(...vipLevels.map(v => v.level)) + 1 : 1), 
            name: '', 
            cost: 1000, 
            frameUrl: '', 
            color: 'text-amber-400', 
            nameStyle: 'font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600' 
          })} 
          className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 text-black rounded-[1.8rem] font-black text-xs shadow-xl active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={22} strokeWidth={3} /> إضافة مستوى VIP جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vipLevels.sort((a,b)=>a.level-b.level).map(vip => (
          <motion.div 
            whileHover={{ y: -5 }}
            key={vip.level} 
            className="bg-slate-950/60 p-6 rounded-[2.5rem] border border-white/10 flex items-center gap-5 group relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button onClick={() => setEditingVip(vip)} className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg active:scale-90"><Edit3 size={16}/></button>
              <button onClick={() => { if(confirm('حذف هذه الرتبة؟')) onSaveVip(vip, true) }} className="p-2.5 bg-red-600 rounded-xl text-white shadow-lg active:scale-90"><Trash2 size={16}/></button>
            </div>
            
            <div className="relative w-24 h-24 flex-shrink-0">
               <div className="absolute inset-3 rounded-full bg-black/40 border border-white/5 shadow-inner"></div>
               <img src={vip.frameUrl} className="w-full h-full object-contain relative z-10 scale-125 drop-shadow-2xl" alt="" />
               <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-white/20 shadow-lg z-20">LV.{vip.level}</div>
            </div>

            <div className="text-right flex-1 min-w-0">
              <h4 className={`font-black text-xl truncate ${vip.color}`}>{vip.name}</h4>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="bg-black/30 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                   <span className="text-sm font-black text-yellow-500">{(vip.cost || 0).toLocaleString()}</span>
                   <Coins size={12} className="text-yellow-500" />
                </div>
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none rounded-full"></div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingVip && (
          <div className="fixed inset-0 z-[3005] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f172a] border border-white/10 rounded-[3.5rem] w-full max-w-2xl p-10 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-3 text-right">
                   <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30"><Crown className="text-amber-500" size={24}/></div>
                   تخصيص رتبة الـ VIP
                </h3>
                <button onClick={() => setEditingVip(null)} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={28} /></button>
              </div>

              <div className="space-y-10 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* قسم المعاينة والرفع */}
                   <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-500 uppercase pr-2">إطار الرتبة (رفع أو رابط)</label>
                      <div className="relative aspect-square bg-black/40 rounded-[2.5rem] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group shadow-inner">
                        {editingVip.frameUrl ? (
                          <img src={editingVip.frameUrl} className="w-full h-full object-contain scale-[1.3] drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" alt="Preview" />
                        ) : (
                          <div className="flex flex-col items-center gap-3 opacity-20">
                             <ImageIcon size={60} />
                             <span className="text-xs font-black">لا يوجد إطار</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all z-20">
                           {isUploading ? <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div> : <><Upload className="text-white mb-2" size={32} /><span className="text-[10px] text-white font-black uppercase">رفع من الجهاز</span></>}
                           <input 
                             type="file" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={(e) => { setIsUploading(true); handleFileUpload(e, (url) => { setEditingVip({...editingVip, frameUrl: url}); setIsUploading(false); }, 400, 400); }} 
                           />
                        </label>
                      </div>
                      
                      <div className="relative mt-4">
                         <input 
                           type="text" 
                           value={editingVip.frameUrl || ''} 
                           placeholder="أو ضع رابط الإطار المباشر هنا..." 
                           onChange={e => setEditingVip({...editingVip, frameUrl: e.target.value})}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 text-[10px] text-blue-400 font-bold outline-none focus:border-blue-500/50" 
                         />
                         <LinkIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      </div>
                   </div>

                   {/* قسم البيانات النصية */}
                   <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase pr-2">اسم الرتبة الملكية</label>
                        <input 
                          type="text" 
                          value={editingVip.name} 
                          placeholder="مثال: الملك، الإمبراطور..."
                          onChange={e => setEditingVip({...editingVip, name: e.target.value})} 
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-black outline-none focus:border-amber-500/50 shadow-inner" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase pr-2">رقم المستوى</label>
                            <input 
                              type="number" 
                              value={editingVip.level} 
                              onChange={e => setEditingVip({...editingVip, level: parseInt(e.target.value) || 1})} 
                              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white font-black text-center text-lg outline-none focus:border-amber-500/50 shadow-inner" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase pr-2">سعر التفعيل</label>
                            <div className="relative">
                               <input 
                                 type="number" 
                                 value={editingVip.cost} 
                                 onChange={e => setEditingVip({...editingVip, cost: parseInt(e.target.value) || 0})} 
                                 className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-yellow-500 font-black text-center text-lg outline-none focus:border-yellow-500/50 shadow-inner" 
                               />
                               <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-600/30" size={20} />
                            </div>
                         </div>
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[2rem] space-y-4">
                         <h5 className="text-[10px] font-black text-amber-500 flex items-center gap-2"><Sparkles size={14}/> مميزات الرتبة</h5>
                         <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                           سيحصل المشترك على الإطار المختار تلقائياً فور الشراء، بالإضافة إلى شارة VIP في البروفايل وداخل الغرف.
                         </p>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleFinalSave} 
                  className="w-full py-6 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black rounded-[2.5rem] shadow-xl shadow-amber-900/40 active:scale-95 transition-all flex items-center justify-center gap-4 text-lg mt-4"
                >
                  <Save size={26} /> حفظ ونشر الرتبة الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminVIP;
