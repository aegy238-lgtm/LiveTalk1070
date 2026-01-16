
import React, { useState, useEffect } from 'react';
import { UserCircle, Upload, Link as LinkIcon, Save, Image as ImageIcon, Search, Trash2, CheckCircle2, UserPlus, Database, Layout, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User } from '../../types';

interface ProfileTemplate {
  id: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  createdAt: number;
}

interface AdminProfileManagementProps {
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminProfileManagement: React.FC<AdminProfileManagementProps> = ({ users, onUpdateUser, handleFileUpload }) => {
  const [templates, setTemplates] = useState<ProfileTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState<Partial<ProfileTemplate>>({ name: '', avatarUrl: '', coverUrl: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState<'avatar' | 'cover' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      const snap = await getDoc(doc(db, 'appSettings', 'profile_library'));
      if (snap.exists()) setTemplates(snap.data().templates || []);
    };
    fetchTemplates();
  }, []);

  const handleSaveToLibrary = async () => {
    if (!newTemplate.name || !newTemplate.avatarUrl) return alert('يرجى إكمال الاسم والصورة الشخصية على الأقل');
    setIsSaving(true);
    const template: ProfileTemplate = {
      id: 'temp_' + Date.now(),
      name: newTemplate.name,
      avatarUrl: newTemplate.avatarUrl,
      coverUrl: newTemplate.coverUrl || '',
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'appSettings', 'profile_library'), { templates: arrayUnion(template) }, { merge: true });
      setTemplates(prev => [...prev, template]);
      setNewTemplate({ name: '', avatarUrl: '', coverUrl: '' });
      alert('تم حفظ الهوية في المستودع بنجاح ✅');
    } catch (e) { alert('فشل الحفظ'); } finally { setIsSaving(false); }
  };

  const handleDeleteTemplate = async (template: ProfileTemplate) => {
    if (!confirm('حذف هذه الهوية من المستودع؟')) return;
    await updateDoc(doc(db, 'appSettings', 'profile_library'), { templates: arrayRemove(template) });
    setTemplates(prev => prev.filter(t => t.id !== template.id));
  };

  const handleApplyToUser = async (template: ProfileTemplate) => {
    if (!selectedUser) return alert('يرجى اختيار مستخدم أولاً من القائمة');
    try {
      await onUpdateUser(selectedUser.id, {
        avatar: template.avatarUrl,
        cover: template.coverUrl
      });
      alert(`تم تطبيق هوية "${template.name}" على المستخدم ${selectedUser.name} بنجاح ✅`);
    } catch (e) { alert('فشل التطبيق'); }
  };

  const filteredUsers = searchQuery.trim() === '' ? [] : users.filter(u => 
    u.customId?.toString() === searchQuery || u.id === searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-8 text-right font-cairo" dir="rtl">
      {/* Header */}
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40"><Database className="text-white" /></div>
            مستودع الهويات الذكي (Identity Vault)
          </h3>
          <p className="text-slate-500 text-xs font-bold mt-2 pr-1">ارفع الهويات (صورة + غلاف) واحفظها في المستودع لتطبيقها على أي مستخدم بلمسة واحدة.</p>
        </div>
        <Sparkles className="absolute -right-10 -bottom-10 text-white/5" size={200} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* القسم الأول: إنشاء هوية جديدة وحفظها */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900/60 p-8 rounded-[3rem] border border-white/5 space-y-6 shadow-xl">
              <h4 className="text-white font-black text-sm flex items-center gap-2 border-b border-white/5 pb-3"><Layout size={18} className="text-blue-500" /> تجهيز هوية جديدة</h4>
              
              <div className="space-y-4">
                 <input 
                   type="text" 
                   value={newTemplate.name}
                   onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                   className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-xs outline-none focus:border-blue-500" 
                   placeholder="اسم الهوية (للأرشفة فقط)..."
                 />
                 
                 {/* حقل الصورة الشخصية */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 pr-2">الصورة الشخصية (رابط أو رفع):</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={newTemplate.avatarUrl}
                         onChange={e => setNewTemplate({...newTemplate, avatarUrl: e.target.value})}
                         className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-blue-400 outline-none" 
                         placeholder="رابط الصورة..."
                       />
                       <label className="p-3 bg-blue-600 rounded-xl cursor-pointer active:scale-90 transition-transform">
                          <Upload size={16} />
                          <input type="file" className="hidden" onChange={e => handleFileUpload(e, url => setNewTemplate({...newTemplate, avatarUrl: url}), 300, 300)} />
                       </label>
                    </div>
                 </div>

                 {/* حقل الغلاف */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 pr-2">صورة الغلاف (رابط أو رفع):</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={newTemplate.coverUrl}
                         onChange={e => setNewTemplate({...newTemplate, coverUrl: e.target.value})}
                         className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[10px] text-emerald-400 outline-none" 
                         placeholder="رابط الغلاف..."
                       />
                       <label className="p-3 bg-emerald-600 rounded-xl cursor-pointer active:scale-90 transition-transform">
                          <Upload size={16} />
                          <input type="file" className="hidden" onChange={e => handleFileUpload(e, url => setNewTemplate({...newTemplate, coverUrl: url}), 800, 400)} />
                       </label>
                    </div>
                 </div>

                 <button 
                   onClick={handleSaveToLibrary}
                   disabled={isSaving}
                   className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                    {isSaving ? 'جاري الحفظ...' : <><Save size={18} /> حفظ في المستودع</>}
                 </button>
              </div>
           </div>
        </div>

        {/* القسم الثاني: المستودع وتطبيق الهويات */}
        <div className="lg:col-span-2 space-y-6">
           {/* اختيار المستخدم */}
           <div className="bg-black/20 p-6 rounded-[2.5rem] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                 <label className="text-xs font-black text-slate-400 pr-2 uppercase tracking-widest">1. اختر المستخدم المستهدف:</label>
                 {selectedUser && <button onClick={() => setSelectedUser(null)} className="text-[10px] text-red-500 font-bold">إلغاء التحديد</button>}
              </div>
              <div className="relative">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pr-14 text-white outline-none focus:border-blue-500/50" 
                   placeholder="بحث بـ ID المستخدم..."
                 />
              </div>

              <AnimatePresence>
                 {filteredUsers.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl divide-y divide-white/5">
                       {filteredUsers.map(u => (
                          <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQuery(''); }} className="w-full p-4 flex items-center gap-4 hover:bg-white/5 text-right transition-colors">
                             <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                             <div className="flex-1">
                                <span className="font-bold text-white text-sm block">{u.name}</span>
                                <span className="text-[10px] text-slate-500">ID: {u.customId || u.id}</span>
                             </div>
                             {selectedUser?.id === u.id && <CheckCircle2 size={20} className="text-blue-500" />}
                          </button>
                       ))}
                    </motion.div>
                 )}
              </AnimatePresence>

              {selectedUser && (
                 <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                    <img src={selectedUser.avatar} className="w-12 h-12 rounded-full border border-blue-500/30" />
                    <div className="text-right">
                       <p className="text-white font-black text-xs">محدد حالياً: {selectedUser.name}</p>
                       <p className="text-[10px] text-slate-500">سيتم تطبيق الهوية عليه فوراً</p>
                    </div>
                 </div>
              )}
           </div>

           {/* شبكة المستودع */}
           <div className="bg-black/20 p-8 rounded-[3rem] border border-white/5">
              <h4 className="text-white font-black text-sm mb-6 flex items-center gap-2"><Database size={18} className="text-amber-500" /> الهويات المحفوظة في المستودع ({templates.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {templates.map(template => (
                    <div key={template.id} className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden p-4 group hover:border-blue-500/40 transition-all flex flex-col">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="relative w-16 h-16 shrink-0">
                             <img src={template.avatarUrl} className="w-full h-full rounded-2xl object-cover border border-white/10" />
                             <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-lg"><UserCircle size={12}/></div>
                          </div>
                          <div className="flex-1 text-right overflow-hidden">
                             <p className="text-white font-black text-xs truncate">{template.name}</p>
                             <p className="text-[9px] text-slate-500 mt-1 italic">تم الحفظ: {new Date(template.createdAt).toLocaleDateString()}</p>
                          </div>
                          <button onClick={() => handleDeleteTemplate(template)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 size={16}/></button>
                       </div>
                       
                       {template.coverUrl && (
                         <div className="w-full h-12 bg-black/40 rounded-xl mb-4 overflow-hidden border border-white/5">
                            <img src={template.coverUrl} className="w-full h-full object-cover opacity-50" />
                         </div>
                       )}

                       <button 
                         onClick={() => handleApplyToUser(template)}
                         disabled={!selectedUser}
                         className={`w-full py-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all ${selectedUser ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}`}
                       >
                          <UserPlus size={14}/> تطبيق هذه الهوية على العضو
                       </button>
                    </div>
                 ))}
                 {templates.length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-20">
                      <Database size={60} className="mx-auto mb-4" />
                      <p className="font-bold">المستودع فارغ حالياً</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileManagement;
