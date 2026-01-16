
import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Edit3, Image as ImageIcon, Upload, Save, Calendar, Trophy, Coins, Crown, Layers, X, ShieldCheck, Target, Settings2, Video, MessageSquare, List, Activity as ActivityIcon, ShoppingBag, ChevronDown, Check, Layout, Monitor, Clock, Link as LinkIcon, Gift, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ActivityReward, Gift as GiftType, StoreItem, VIPPackage } from '../../types';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface AdminActivitiesProps {
  gifts: GiftType[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminActivities: React.FC<AdminActivitiesProps> = ({ gifts, handleFileUpload }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivity, setEditingActivity] = useState<Partial<Activity> | null>(null);
  const [availableStoreItems, setAvailableStoreItems] = useState<StoreItem[]>([]);
  const [availableVIPs, setAvailableVIPs] = useState<VIPPackage[]>([]);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'activities'), (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity)));
    });
    const unsubStore = onSnapshot(collection(db, 'store'), (snap) => {
      setAvailableStoreItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as StoreItem)));
    });
    const unsubVIP = onSnapshot(collection(db, 'vip'), (snap) => {
      setAvailableVIPs(snap.docs.map(d => ({ id: d.id, ...d.data() } as VIPPackage)));
    });
    return () => { unsub(); unsubStore(); unsubVIP(); };
  }, []);

  const handleSaveActivity = async () => {
    if (!editingActivity || !editingActivity.title || !editingActivity.bannerUrl) {
      alert('يرجى إكمال البيانات الأساسية (العنوان والبنر)');
      return;
    }

    const activityId = editingActivity.id || 'activity_' + Date.now();
    const finalData = {
      ...editingActivity,
      id: activityId,
      status: editingActivity.status || 'active',
      rewards: editingActivity.rewards || [],
      createdAt: serverTimestamp(),
      endDate: editingActivity.endDate || Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    };

    try {
      await setDoc(doc(db, 'activities', activityId), finalData);
      alert('تم حفظ النشاط بنجاح ✅');
      setEditingActivity(null);
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const addRewardRow = () => {
    const newReward: ActivityReward = {
      id: 'reward_' + Date.now(),
      threshold: 10000,
      rewardType: 'coins',
      rewardValue: '',
      rewardName: 'جائزة جديدة',
      rewardIconUrl: '',
      claimedBy: []
    };
    setEditingActivity({
      ...editingActivity,
      rewards: [...(editingActivity?.rewards || []), newReward]
    });
  };

  const updateReward = (idx: number, updates: Partial<ActivityReward>) => {
    if (!editingActivity?.rewards) return;
    const rewards = [...editingActivity.rewards];
    rewards[idx] = { ...rewards[idx], ...updates };
    setEditingActivity({ ...editingActivity, rewards });
  };

  const removeReward = (idx: number) => {
    if (!editingActivity?.rewards) return;
    const rewards = editingActivity.rewards.filter((_, i) => i !== idx);
    setEditingActivity({ ...editingActivity, rewards });
  };

  const getFormattedDate = (ts?: any) => {
    if (!ts) return '';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-10 text-right font-cairo" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-900/40"><ActivityIcon className="text-black" /></div>
            إدارة الفعاليات والأنشطة
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-2 pr-1">تحكم في بنرات الأنشطة، الجوائز، والروابط الخارجية.</p>
        </div>
        <button 
          onClick={() => setEditingActivity({ title: '', bannerUrl: '', backgroundUrl: '', type: 'gift_event', rewards: [], status: 'active', endDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) })}
          className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-black rounded-[1.5rem] font-black text-xs shadow-xl active:scale-95 flex items-center gap-3 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> إنشاء فعالية جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activities.map(act => (
          <motion.div key={act.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-amber-500/30 transition-all shadow-2xl">
             <div className="relative h-44 overflow-hidden">
                <img src={act.bannerUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
             </div>
             <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-black text-lg truncate flex-1">{act.title}</h4>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    act.type === 'gift_event' ? 'bg-pink-500/20 text-pink-500' : 
                    act.type === 'external_link' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {act.type === 'gift_event' ? 'تجميع كاريزما' : act.type === 'external_link' ? 'رابط خارجي 🌐' : 'تجميع شحن'}
                  </span>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setEditingActivity(act)} className="flex-1 py-4 bg-blue-600/10 text-blue-400 rounded-2xl font-black text-[11px] hover:bg-blue-600 hover:text-white transition-all shadow-inner">تعديل</button>
                   <button onClick={async () => { if(confirm('حذف النشاط؟')) await deleteDoc(doc(db, 'activities', act.id)) }} className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingActivity && (
          <div className="fixed inset-0 z-[3005] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f172a] border border-white/10 rounded-[3.5rem] w-full max-w-5xl p-10 shadow-2xl overflow-y-auto max-h-[92vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-3"><Settings2 className="text-amber-500" /> تخصيص النشاط / الإعلان</h3>
                <button onClick={() => setEditingActivity(null)} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="space-y-10">
                 {/* البيانات الأساسية */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase pr-2">عنوان الفعالية</label>
                       <input type="text" value={editingActivity.title} onChange={e => setEditingActivity({...editingActivity, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none focus:border-amber-500/50 shadow-inner" placeholder="مثلاً: كأس الكاريزما..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase pr-2">نوع النشاط</label>
                       <select 
                         value={editingActivity.type} 
                         onChange={e => setEditingActivity({...editingActivity, type: e.target.value as any})}
                         className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none appearance-none"
                       >
                         <option value="gift_event">تجميع كاريزما (استقبال هدايا)</option>
                         <option value="recharge_event">تجميع شحن (نقاط شحن)</option>
                         <option value="external_link">رابط خارجي (إعلان فقط) 🌐</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase pr-2">تاريخ الانتهاء</label>
                       <input 
                         type="datetime-local" 
                         value={getFormattedDate(editingActivity.endDate)} 
                         onChange={e => {
                            const val = e.target.value;
                            if (val) {
                              setEditingActivity({...editingActivity, endDate: Timestamp.fromDate(new Date(val))});
                            }
                         }} 
                         className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none focus:border-amber-500/50" 
                       />
                    </div>
                 </div>

                 {/* حقل الرابط الخارجي (يظهر فقط عند اختيار رابط خارجي) */}
                 {editingActivity.type === 'external_link' && (
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-blue-500 uppercase pr-2 flex items-center gap-2"><LinkIcon size={14}/> الرابط الخارجي (الموقع الموجه إليه)</label>
                      <input 
                        type="url" 
                        value={editingActivity.externalUrl || ''} 
                        onChange={e => setEditingActivity({...editingActivity, externalUrl: e.target.value})} 
                        className="w-full bg-blue-600/5 border border-blue-500/30 rounded-2xl py-5 px-8 text-blue-400 font-black outline-none focus:border-blue-500 shadow-xl" 
                        placeholder="https://example.com/recharge" 
                      />
                   </div>
                 )}

                 {/* الوسائط */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/20 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                       <label className="text-[11px] font-black text-slate-400">بنر الواجهة الرئيسية (800x350)</label>
                       <div className="relative aspect-[16/7] bg-black rounded-2xl overflow-hidden border border-white/10 group">
                          {editingActivity.bannerUrl ? <img src={editingActivity.bannerUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon size={40}/></div>}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                             {isUploadingBanner ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> : <Upload className="text-white" size={32} />}
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => { setIsUploadingBanner(true); handleFileUpload(e, (url) => { setEditingActivity({...editingActivity, bannerUrl: url}); setIsUploadingBanner(false); }, 800, 350); }} />
                          </label>
                       </div>
                       <input type="text" value={editingActivity.bannerUrl || ''} onChange={e => setEditingActivity({...editingActivity, bannerUrl: e.target.value})} placeholder="أو ضع رابط البنر المباشر..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-blue-400 outline-none" />
                    </div>

                    {editingActivity.type !== 'external_link' && (
                       <div className="bg-black/20 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                          <label className="text-[11px] font-black text-slate-400">خلفية صفحة الفعالية (1080x1920)</label>
                          <div className="relative aspect-[16/7] bg-black rounded-2xl overflow-hidden border border-white/10 group">
                             {editingActivity.backgroundUrl ? <img src={editingActivity.backgroundUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Layout size={40}/></div>}
                             <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                                {isUploadingBackground ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> : <Upload className="text-white" size={32} />}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { setIsUploadingBackground(true); handleFileUpload(e, (url) => { setEditingActivity({...editingActivity, backgroundUrl: url}); setIsUploadingBackground(false); }, 1080, 1920); }} />
                             </label>
                          </div>
                          <input type="text" value={editingActivity.backgroundUrl || ''} onChange={e => setEditingActivity({...editingActivity, backgroundUrl: e.target.value})} placeholder="أو ضع رابط الخلفية المباشر..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-emerald-400 outline-none" />
                       </div>
                    )}
                 </div>

                 {/* نظام الجوائز (يختفي في حالة الرابط الخارجي) */}
                 {editingActivity.type !== 'external_link' && (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-2">
                          <h4 className="text-white font-black text-lg flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> مستويات الجوائز والترقيات</h4>
                          <button onClick={addRewardRow} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-lg flex items-center gap-2"><Plus size={14}/> إضافة جائزة</button>
                       </div>

                       <div className="space-y-4">
                          {editingActivity.rewards?.map((reward, i) => (
                             <div key={reward.id} className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative overflow-hidden group">
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-slate-500 uppercase pr-1">النقاط المطلوبة</label>
                                   <div className="relative">
                                      <input type="number" value={reward.threshold} onChange={e => updateReward(i, { threshold: parseInt(e.target.value) || 0 })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-black text-center" />
                                      <Sparkles size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                   </div>
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-slate-500 uppercase pr-1">نوع الجائزة</label>
                                   <select 
                                      value={reward.rewardType} 
                                      onChange={e => updateReward(i, { rewardType: e.target.value as any, rewardValue: '', rewardName: '', rewardIconUrl: '' })}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-black appearance-none text-center"
                                   >
                                      <option value="coins">كوينز 🪙</option>
                                      <option value="vip">رتبة VIP 👑</option>
                                      <option value="frame">إطار ملكي 🖼️</option>
                                      <option value="entry">دخولية فيديو 🎬</option>
                                      <option value="bubble">فقاعة دردشة 💬</option>
                                   </select>
                                </div>

                                <div className="space-y-2 md:col-span-1">
                                   <label className="text-[9px] font-black text-slate-500 uppercase pr-1">اختيار القيمة / العنصر</label>
                                   {reward.rewardType === 'coins' ? (
                                      <input type="number" placeholder="عدد الكوينز..." value={reward.rewardValue} onChange={e => updateReward(i, { rewardValue: e.target.value, rewardName: `${e.target.value} كوينز`, rewardIconUrl: '' })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-yellow-500 font-black text-center" />
                                   ) : (
                                      <select 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold appearance-none text-[10px]"
                                        onChange={(e) => {
                                           const val = e.target.value;
                                           if (reward.rewardType === 'vip') {
                                              const v = availableVIPs.find(x => x.level.toString() === val);
                                              if (v) updateReward(i, { rewardValue: v.level, rewardName: v.name, rewardIconUrl: v.frameUrl });
                                           } else {
                                              const item = availableStoreItems.find(x => x.id === val);
                                              if (item) updateReward(i, { rewardValue: item.url, rewardName: item.name, rewardIconUrl: item.thumbnailUrl || item.url });
                                           }
                                        }}
                                      >
                                         <option value="">اختر من المتجر...</option>
                                         {reward.rewardType === 'vip' ? (
                                            availableVIPs.map(v => <option key={v.level} value={v.level}>{v.name}</option>)
                                         ) : (
                                            availableStoreItems.filter(x => x.type === reward.rewardType).map(item => (
                                               <option key={item.id} value={item.id}>{item.name}</option>
                                            ))
                                         )}
                                      </select>
                                   )}
                                </div>

                                <div className="flex items-center gap-3">
                                   <div className="w-12 h-12 bg-black rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                      {reward.rewardIconUrl ? <img src={reward.rewardIconUrl} className="w-full h-full object-contain" /> : <div className="opacity-20"><ShoppingBag size={20}/></div>}
                                   </div>
                                   <button onClick={() => removeReward(i)} className="flex-1 py-3 bg-red-600/10 text-red-500 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all">حذف</button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 <button onClick={handleSaveActivity} className="w-full py-6 bg-gradient-to-r from-amber-600 to-orange-600 text-black font-black rounded-[2.5rem] shadow-xl active:scale-95 transition-all text-lg flex items-center justify-center gap-4">
                    <Save size={26} /> حفظ ونشر النشاط الآن
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminActivities;
