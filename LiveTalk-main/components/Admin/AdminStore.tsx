
import React, { useState, useMemo } from 'react';
import { Plus, ShoppingBag, Edit3, Trash2, X, Upload, Image as ImageIcon, Video, Wand2, Clock, Calendar, Crown, MessageSquare, Layers, Sparkles, Coins, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreItem, ItemType } from '../../types';

interface AdminStoreProps {
  storeItems: StoreItem[];
  onSaveItem: (item: StoreItem, isDelete?: boolean) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminStore: React.FC<AdminStoreProps> = ({ storeItems, onSaveItem, handleFileUpload }) => {
  const [editingStoreItem, setEditingStoreItem] = useState<Partial<StoreItem> | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingUrl, setIsUploadingUrl] = useState(false);

  const stats = useMemo(() => ({
    frames: storeItems.filter(i => i.type === 'frame').length,
    bubbles: storeItems.filter(i => i.type === 'bubble').length,
    entries: storeItems.filter(i => i.type === 'entry').length,
    total: storeItems.length
  }), [storeItems]);

  const handleFinalSave = async () => {
    if (!editingStoreItem?.name || !editingStoreItem?.url) {
      alert('يرجى إكمال الاسم ووضع رابط أو رفع ملف المنتج');
      return;
    }
    try {
      await onSaveItem(editingStoreItem as StoreItem);
      setEditingStoreItem(null);
    } catch (error) {
      alert("حدث خطأ أثناء حفظ العنصر");
    }
  };

  // تم إزالة "badge" (وسام فريد) بناءً على طلب المستخدم
  const itemTypes: { id: ItemType; label: string; icon: any; color: string }[] = [
    { id: 'frame', label: 'إطار ملكي', icon: ImageIcon, color: 'from-blue-500 to-indigo-600' },
    { id: 'entry', label: 'دخولية فيديو', icon: Video, color: 'from-purple-500 to-pink-600' },
    { id: 'bubble', label: 'فقاعة دردشة', icon: MessageSquare, color: 'from-emerald-500 to-teal-600' },
  ];

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || url.includes('video') || url.includes('base64:video');
  };

  return (
    <div className="space-y-8 text-right font-cairo" dir="rtl">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الإطارات', count: stats.frames, icon: ImageIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'فقاعات مضافة', count: stats.bubbles, icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'دخوليات نشطة', count: stats.entries, icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-[2.5rem] border border-white/5 ${stat.bg} shadow-xl backdrop-blur-md flex items-center justify-between`}>
             <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
               <h4 className={`text-2xl font-black ${stat.color}`}>{stat.count}</h4>
             </div>
             <stat.icon className={stat.color} size={28} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-slate-950/40 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-3 bg-cyan-600 rounded-2xl shadow-lg shadow-cyan-900/40"><ShoppingBag className="text-white" /></div>
            مستودع المنتجات الملكية
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-2 pr-1">ارفع أو ضع روابط الإطارات والدخوليات والفقاعات لمتجر التطبيق.</p>
        </div>
        <button 
          onClick={() => setEditingStoreItem({ id: 'item_' + Date.now(), name: '', type: 'frame', price: 1000, url: '', thumbnailUrl: '', duration: 6, ownershipDays: 30 })} 
          className="px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-[1.5rem] font-black text-xs shadow-xl active:scale-95 flex items-center gap-3 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> إضافة منتج جديد
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {storeItems.map(item => (
          <motion.div whileHover={{ y: -5 }} key={item.id} className="bg-slate-900/60 p-5 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-3 group relative overflow-hidden shadow-2xl">
            <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={() => setEditingStoreItem(item)} className="p-2 bg-blue-600 rounded-xl text-white shadow-lg"><Edit3 size={14}/></button>
              <button onClick={() => { if(confirm('حذف هذا المنتج؟')) onSaveItem(item, true) }} className="p-2 bg-red-600 rounded-xl text-white shadow-lg"><Trash2 size={14}/></button>
            </div>
            <div className="relative w-24 h-24 bg-black/40 rounded-[2rem] flex items-center justify-center overflow-hidden mb-1 shadow-inner border border-white/5">
               {item.type === 'entry' ? (
                 <div className="w-full h-full relative">
                    <img src={item.thumbnailUrl || item.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Video size={24} className="text-white opacity-80" /></div>
                 </div>
               ) : (
                 <img src={item.url} className="w-[85%] h-[85%] object-contain" alt="" />
               )}
            </div>
            <div className="text-center w-full">
              <span className="text-[11px] font-black text-white truncate block">{item.name}</span>
              <div className="flex items-center justify-center gap-1.5 mt-1.5 bg-black/40 py-1 rounded-full border border-white/5">
                <span className="text-[10px] font-bold text-yellow-500">{item.price.toLocaleString()}</span>
                <Sparkles size={10} className="text-yellow-500" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingStoreItem && (
          <div className="fixed inset-0 z-[3005] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f172a] border border-white/10 rounded-[3.5rem] w-full max-w-2xl p-10 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white">تخصيص المنتج الملكي</h3>
                <button onClick={() => setEditingStoreItem(null)} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="space-y-10">
                 <div className="grid grid-cols-3 gap-3">
                    {itemTypes.map(type => (
                       <button key={type.id} onClick={() => setEditingStoreItem({...editingStoreItem, type: type.id})} className={`flex flex-col items-center gap-3 p-4 rounded-[1.8rem] border transition-all duration-300 relative overflow-hidden ${editingStoreItem.type === type.id ? `bg-gradient-to-br ${type.color} border-white/20 shadow-lg scale-105` : 'bg-black/40 border-white/5 text-slate-500'}`}>
                          <type.icon size={24} className={editingStoreItem.type === type.id ? 'text-white' : 'text-slate-600'} />
                          <span className={`text-[10px] font-black ${editingStoreItem.type === type.id ? 'text-white' : ''}`}>{type.label}</span>
                       </button>
                    ))}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Preview Icon Section */}
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-500 uppercase pr-2">أيقونة المعاينة (URL أو رفع)</label>
                       <div className="relative aspect-square bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
                          {editingStoreItem.thumbnailUrl ? <img src={editingStoreItem.thumbnailUrl} className="w-[70%] h-[70%] object-contain" /> : <ImageIcon size={48} className="text-slate-800" />}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                             {isUploadingThumb ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> : <Upload className="text-white" size={30} />}
                             <span className="text-[9px] text-white font-black mt-2">رفع صورة</span>
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => { setIsUploadingThumb(true); handleFileUpload(e, (url) => { setEditingStoreItem({...editingStoreItem, thumbnailUrl: url}); setIsUploadingThumb(false); }, 300, 300); }} />
                          </label>
                       </div>
                       <div className="relative">
                          <input type="text" value={editingStoreItem.thumbnailUrl || ''} onChange={e => setEditingStoreItem({...editingStoreItem, thumbnailUrl: e.target.value})} placeholder="أو ضع رابط الأيقونة هنا..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-10 text-[10px] text-blue-400 outline-none" />
                          <LinkIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
                       </div>
                    </div>

                    {/* Original File Preview Section */}
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-500 uppercase pr-2">الملف الأصلي (URL أو رفع)</label>
                       <div className="relative aspect-square bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
                          {editingStoreItem.url ? (
                             isVideoUrl(editingStoreItem.url) || editingStoreItem.type === 'entry' ? (
                                <video src={editingStoreItem.url} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                             ) : (
                                <img src={editingStoreItem.url} className="w-[85%] h-[85%] object-contain" />
                             )
                          ) : <Layers size={48} className="text-slate-800" />}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                             {isUploadingUrl ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> : <Upload className="text-white" size={30} />}
                             <span className="text-[9px] text-white font-black mt-2">رفع الملف</span>
                             <input type="file" accept={editingStoreItem.type === 'entry' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { setIsUploadingUrl(true); handleFileUpload(e, (url) => { setEditingStoreItem({...editingStoreItem, url: url}); setIsUploadingUrl(false); }, 1080, 1920); }} />
                          </label>
                       </div>
                       <div className="relative">
                          <input type="text" value={editingStoreItem.url || ''} onChange={e => setEditingStoreItem({...editingStoreItem, url: e.target.value})} placeholder="أو ضع رابط الملف المباشر هنا..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-10 text-[10px] text-emerald-400 outline-none" />
                          <LinkIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 pr-2 uppercase">اسم المنتج</label>
                       <input type="text" value={editingStoreItem.name} onChange={e => setEditingStoreItem({...editingStoreItem, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm" placeholder="اسم المنتج..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 pr-2 uppercase">السعر (كوينز)</label>
                       <input type="number" value={editingStoreItem.price} onChange={e => setEditingStoreItem({...editingStoreItem, price: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-yellow-500 text-sm font-black" placeholder="السعر..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 pr-2 uppercase flex items-center gap-1.5"><Calendar size={12}/> مدة الصلاحية في الحقيبة (بالأيام)</label>
                       <input type="number" value={editingStoreItem.ownershipDays} onChange={e => setEditingStoreItem({...editingStoreItem, ownershipDays: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-blue-400 font-black text-sm" placeholder="مثلاً: 30" />
                    </div>
                    {editingStoreItem.type === 'entry' && (
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 pr-2 uppercase flex items-center gap-1.5"><Clock size={12}/> مدة عرض الدخولية (بالثواني)</label>
                          <input type="number" value={editingStoreItem.duration} onChange={e => setEditingStoreItem({...editingStoreItem, duration: parseInt(e.target.value) || 6})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-emerald-400 font-black text-sm" placeholder="مثلاً: 6" />
                       </div>
                    )}
                 </div>

                 <button onClick={handleFinalSave} className="w-full py-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black rounded-[2.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg">
                    <Wand2 size={24} /> حفظ في المتجر
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStore;
