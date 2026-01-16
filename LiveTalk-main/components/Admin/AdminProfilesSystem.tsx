
import React, { useState, useEffect } from 'react';
import { Search, UserCircle, Upload, Link as LinkIcon, CheckCircle2, ShieldCheck, Image as ImageIcon, Camera, Trash2, UserCog, Sparkles, ChevronLeft, Database, Layout, Save, UserPlus, Plus, Zap, Globe, HardDrive, MousePointer2, Ghost, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface ProfileTemplate {
  id: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  createdAt: number;
}

interface AdminProfilesSystemProps {
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminProfilesSystem: React.FC<AdminProfilesSystemProps> = ({ users, onUpdateUser, handleFileUpload }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [quickAvatarUrl, setQuickAvatarUrl] = useState('');
  const [quickCoverUrl, setQuickCoverUrl] = useState('');

  const [templates, setTemplates] = useState<ProfileTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState<Partial<ProfileTemplate>>({ name: '', avatarUrl: '', coverUrl: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      const snap = await getDoc(doc(db, 'appSettings', 'profile_library'));
      if (snap.exists()) setTemplates(snap.data().templates || []);
    };
    fetchTemplates();
  }, []);

  const filteredUsers = searchQuery.trim() === '' ? [] : users.filter(u => 
    u.customId?.toString() === searchQuery || u.id === searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  const handleApplyTransparentIdentity = async () => {
    if (!selectedUser) return alert('⚠️ يجب تحديد المستخدم أولاً');
    
    // الهوية الشفافة تحافظ على الغلاف الحالي ولا تحذفه
    const updateData = {
      avatar: 'https://www.transparenttextures.com/patterns/transparent.png',
      frame: null,
      badge: null,
      activeBubble: null
    };
    
    try {
      await onUpdateUser(selectedUser.id, updateData);
      alert('✅ تم تطبيق الهوية الشفافة مع الحفاظ على الغلاف');
    } catch (e) {
      alert('❌ فشل التطبيق على السيرفر');
    }
  };

  const handleQuickUpdate = async (type: 'avatar' | 'cover') => {
    if (!selectedUser) return alert('⚠️ يجب تحديد المستخدم أولاً');
    const url = type === 'avatar' ? quickAvatarUrl : quickCoverUrl;
    if (!url) return alert('⚠️ يرجى إدخال رابط الصورة أولاً');

    try {
      // نرسل الحقل المطلوب فقط. دالة onUpdateUser تستخدم updateDoc
      // مما يضمن عدم المساس بالحقول الأخرى (مثل عدم حذف الغلاف عند تحديث الصورة)
      await onUpdateUser(selectedUser.id, { [type]: url });
      alert(`✅ تم تحديث ${type === 'avatar' ? 'الصورة' : 'الغلاف'} بنجاح وثباته`);
      if (type === 'avatar') setQuickAvatarUrl(''); else setQuickCoverUrl('');
    } catch (e) {
      alert('❌ فشل التحديث في السيرفر');
    }
  };

  const handleSaveToLibrary = async () => {
    if (!newTemplate.name || (!newTemplate.avatarUrl && !newTemplate.coverUrl)) return alert('يرجى إكمال الاسم ورابط واحد على الأقل للحفظ');
    setIsSaving(true);
    const template: ProfileTemplate = {
      id: 'temp_' + Date.now(),
      name: newTemplate.name,
      avatarUrl: newTemplate.avatarUrl || '',
      coverUrl: newTemplate.coverUrl || '',
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'appSettings', 'profile_library'), { templates: arrayUnion(template) }, { merge: true });
      setTemplates(prev => [template, ...prev]);
      setNewTemplate({ name: '', avatarUrl: '', coverUrl: '' });
      alert('✅ تم حفظ التصميم في المستودع');
    } catch (e) { alert('❌ فشل الحفظ'); } finally { setIsSaving(false); }
  };

  const handleDeleteTemplate = async (template: ProfileTemplate) => {
    if (!confirm('هل تريد حذف هذا التصميم؟')) return;
    await updateDoc(doc(db, 'appSettings', 'profile_library'), { templates: arrayRemove(template) });
    setTemplates(prev => prev.filter(t => t.id !== template.id));
  };

  const handleApplyTemplate = async (template: ProfileTemplate) => {
    if (!selectedUser) return alert('⚠️ اختر مستخدماً أولاً');
    
    try {
      // تطبيق الهوية الكاملة
      const data: Partial<User> = {};
      if (template.avatarUrl) data.avatar = template.avatarUrl;
      if (template.coverUrl) data.cover = template.coverUrl;

      await onUpdateUser(selectedUser.id, data);
      alert(`✅ تم تطبيق تصميم "${template.name}" بنجاح ملكي`);
    } catch (e) {
      alert('❌ فشل التطبيق على السيرفر');
    }
  };

  return (
    <div className="space-y-8 text-right font-cairo" dir="rtl">
      <div className="bg-slate-950/60 p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/40"><UserCog className="text-white" /></div>
              مركز التحكم الفائق بالهويات
            </h3>
            <p className="text-slate-500 text-xs font-bold mt-2 pr-1 uppercase tracking-wider">تحديث مباشر للهوية مع ضمان ثبات العناصر وعدم تعارضها</p>
          </div>
        </div>
        <Sparkles className="absolute -left-10 -bottom-10 text-white/5 opacity-10" size={200} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 space-y-4 shadow-xl">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 pr-2">
                 <Search size={14} /> 1. حدد المستخدم (بالآيدي أو الاسم)
              </label>
              <div className="relative">
                 <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-6 text-white text-xs outline-none focus:border-blue-500 font-bold transition-all shadow-inner" placeholder="اكتب الآيدي هنا..." />
              </div>

              <AnimatePresence>
                 {filteredUsers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl divide-y divide-white/5">
                       {filteredUsers.map(u => (
                          <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQuery(''); }} className="w-full p-4 flex items-center gap-4 hover:bg-white/5 text-right transition-colors group">
                             <img src={u.avatar} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform" />
                             <div className="flex-1">
                                <span className="font-black text-white text-xs block group-hover:text-blue-400">{u.name}</span>
                                <span className="text-[9px] text-slate-500 font-bold">ID: {u.customId || u.id}</span>
                             </div>
                             <ChevronLeft size={16} className="text-slate-700" />
                          </button>
                       ))}
                    </motion.div>
                 )}
              </AnimatePresence>

              {selectedUser && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-3xl flex items-center gap-4 shadow-lg">
                   <div className="relative">
                      <img src={selectedUser.avatar} className="w-14 h-14 rounded-full border-2 border-blue-500/40 p-0.5" />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full border-2 border-[#0f172a] text-white">
                        <CheckCircle2 size={10} strokeWidth={4} />
                      </div>
                   </div>
                   <div className="text-right flex-1">
                      <p className="text-white font-black text-xs leading-none mb-1">{selectedUser.name}</p>
                      <button onClick={() => setSelectedUser(null)} className="text-[9px] text-red-500 font-black hover:underline">إلغاء التحديد ✖</button>
                   </div>
                </motion.div>
              )}
           </div>

           <div className="bg-black/40 p-8 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl relative">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h4 className="text-white font-black text-sm flex items-center gap-2">
                     <Globe size={18} className="text-blue-400"/> تحديث بيانات العضو
                  </h4>
                  <button onClick={handleApplyTransparentIdentity} className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl text-[9px] font-black hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2">
                    <Ghost size={14} /> تفعيل الرفع الشفاف
                  </button>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">الصورة الشخصية (رابط مباشر):</label>
                      <div className="flex gap-2">
                        <input type="text" value={quickAvatarUrl} onChange={e => setQuickAvatarUrl(e.target.value)} placeholder="ضع رابط الصورة هنا..." className="flex-1 bg-slate-900 border border-white/10 rounded-2xl p-4 text-[11px] text-blue-400 outline-none focus:border-blue-500" />
                        <button onClick={() => handleQuickUpdate('avatar')} className="px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] shadow-lg active:scale-90 transition-all flex flex-col items-center justify-center gap-1">
                           <Camera size={18} /> تحديث الصورة
                        </button>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase">غلاف البروفايل (رابط مباشر):</label>
                      <div className="flex gap-2">
                        <input type="text" value={quickCoverUrl} onChange={e => setQuickCoverUrl(e.target.value)} placeholder="ضع رابط الغلاف هنا..." className="flex-1 bg-slate-900 border border-white/10 rounded-2xl p-4 text-[11px] text-emerald-400 outline-none focus:border-emerald-500" />
                        <button onClick={() => handleQuickUpdate('cover')} className="px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] shadow-lg active:scale-90 transition-all flex flex-col items-center justify-center gap-1">
                           <ImageIcon size={18} /> تحديث الغلاف
                        </button>
                      </div>
                   </div>
                </div>
           </div>

           <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 space-y-4 shadow-2xl">
                <h4 className="text-white font-black text-xs flex items-center gap-2 pb-2 border-b border-white/5"><Plus size={16} className="text-amber-500"/> إضافة تصميم للمستودع</h4>
                <div className="space-y-3">
                   <input type="text" placeholder="اسم التصميم..." value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none" />
                   <div className="flex gap-2">
                      <input type="text" placeholder="رابط صورة الحساب..." value={newTemplate.avatarUrl} onChange={e => setNewTemplate({...newTemplate, avatarUrl: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] text-blue-400 outline-none" />
                      <label className="p-3 bg-blue-600 rounded-xl cursor-pointer shadow-lg active:scale-90"><Upload size={14}/><input type="file" className="hidden" onChange={e => handleFileUpload(e, url => setNewTemplate({...newTemplate, avatarUrl: url}), 300, 300)} /></label>
                   </div>
                   <div className="flex gap-2">
                      <input type="text" placeholder="رابط غلاف الحساب..." value={newTemplate.coverUrl} onChange={e => setNewTemplate({...newTemplate, coverUrl: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] text-emerald-400 outline-none" />
                      <label className="p-3 bg-emerald-600 rounded-xl cursor-pointer shadow-lg active:scale-90"><Upload size={14}/><input type="file" className="hidden" onChange={e => handleFileUpload(e, url => setNewTemplate({...newTemplate, coverUrl: url}), 800, 400)} /></label>
                   </div>
                   <button onClick={handleSaveToLibrary} className="w-full py-3 bg-amber-600 text-black font-black rounded-xl text-[11px] shadow-lg active:scale-95 transition-all">حفظ في الأرشيف الملكي</button>
                </div>
           </div>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-black/20 p-8 rounded-[3rem] border border-white/5 min-h-[600px] shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-white font-black text-sm flex items-center gap-3">
                    <Database size={20} className="text-blue-500" /> أرشيف التصاميم الجاهزة 
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-3 py-1 rounded-full border border-blue-500/20">{templates.length} تصميم</span>
                 </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {templates.map(template => (
                    <motion.div layout key={template.id} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-5 group hover:border-blue-500/40 transition-all flex flex-col shadow-lg relative">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="relative w-16 h-16 shrink-0 shadow-2xl">
                             <img src={template.avatarUrl} className="w-full h-full rounded-2xl object-cover border border-white/10" />
                             <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-lg text-white shadow-lg"><UserCircle size={12}/></div>
                          </div>
                          <div className="flex-1 text-right overflow-hidden">
                             <p className="text-white font-black text-xs truncate group-hover:text-blue-400 transition-colors">{template.name}</p>
                             <p className="text-[9px] text-slate-500 mt-1 font-bold">هوية أرشفة ملكية</p>
                          </div>
                          <button onClick={() => handleDeleteTemplate(template)} className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"><Trash2 size={18}/></button>
                       </div>
                       
                       {template.coverUrl && (
                         <div className="w-full h-20 bg-black/40 rounded-2xl mb-5 overflow-hidden border border-white/5 relative group-hover:border-blue-500/20 transition-all shadow-inner">
                            <img src={template.coverUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute top-2 right-2 bg-emerald-600 p-1 rounded text-white shadow-lg"><ImageIcon size={10}/></div>
                         </div>
                       )}

                       <button 
                         onClick={() => handleApplyTemplate(template)}
                         disabled={!selectedUser}
                         className={`w-full py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all relative overflow-hidden ${
                           selectedUser 
                             ? 'bg-blue-600 text-white shadow-xl active:scale-95 hover:bg-blue-500' 
                             : 'bg-slate-800 text-slate-600 opacity-40 cursor-not-allowed border border-white/5'
                         }`}
                       >
                          <UserPlus size={16}/> تطبيق التصميم بالكامل
                       </button>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilesSystem;
