
import React, { useState } from 'react';
import { Search, Settings2, X, Save, ShieldAlert, Upload, Trash2, ImageIcon, Award, Sparkles, UserMinus, Medal, Lock, Unlock, Clock, Ban, Eraser, Key, ShieldCheck, Check, Shield, UserCog, Hash, Smartphone, Globe, Coins, Crown, AlertTriangle, Layers, Users, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, VIPPackage } from '../../types';
import { db } from '../../services/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

interface AdminUsersProps {
  users: User[];
  vipLevels: VIPPackage[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  currentUser: User;
}

const ROOT_ADMIN_EMAIL = 'admin-owner@livetalk.com';

// قائمة بجميع أقسام لوحة التحكم لتخصيص الصلاحيات
const ADMIN_TABS = [
  { id: 'users', label: 'إدارة الأعضاء' },
  { id: 'profile_hub', label: 'إدارة الهويات' },
  { id: 'tribes', label: 'إدارة القبائل' },
  { id: 'rooms_manage', label: 'إدارة الغرف' },
  { id: 'activities_manage', label: 'الأنشطة' },
  { id: 'defaults', label: 'صور البداية' },
  { id: 'badges', label: 'الأوسمة' },
  { id: 'id_badges', label: 'أوسمة الـ ID' },
  { id: 'host_agency', label: 'وكالات المضيفين' },
  { id: 'room_bgs', label: 'خلفيات الغرف' },
  { id: 'mic_skins', label: 'أشكال المايكات' },
  { id: 'emojis', label: 'الإيموشنات' },
  { id: 'relationships', label: 'الارتباط' },
  { id: 'agency', label: 'شحن العملات' },
  { id: 'games', label: 'مركز الحظ' },
  { id: 'gifts', label: 'إدارة الهدايا' },
  { id: 'store', label: 'إدارة المتجر' },
  { id: 'vip', label: 'إدارة الـ VIP' },
  { id: 'identity', label: 'هوية التطبيق' },
  { id: 'maintenance', label: 'الصيانة' },
];

const AdminUsers: React.FC<AdminUsersProps> = ({ users, vipLevels, onUpdateUser, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingFields, setEditingFields] = useState({ 
    coins: 0, 
    customId: '', 
    vipLevel: 0, 
    isBanned: false, 
    banUntil: '',
    banDevice: true, 
    banNetwork: true, 
    loginPassword: '',
    isSystemModerator: false,
    moderatorPermissions: [] as string[]
  });

  // التحقق من هوية المدير العام (المالك)
  const isRootAdmin = currentUser.customId?.toString() === '1' || (currentUser as any).email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.customId?.toString().includes(searchQuery) ||
    u.id.includes(searchQuery)
  );

  // التحقق هل الحساب المستهدف بالتعديل هو حساب المدير العام؟
  const isTargetRoot = (user: User) => {
    return user.customId?.toString() === '1' || (user as any).email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
  };

  const handleBan = (duration: number | 'permanent') => {
    const isBanned = true;
    let banUntil = '';
    if (duration === 'permanent') {
      banUntil = 'permanent';
    } else {
      const date = new Date();
      date.setDate(date.getDate() + duration);
      banUntil = date.toISOString();
    }
    setEditingFields(prev => ({ ...prev, isBanned, banUntil }));
  };

  const handleSave = async () => {
    if (!selectedUser || isSaving) return;
    
    // منع الحفظ نهائياً إذا كان المستخدم المحرر ليس المدير العام والهدف هو حساب المدير العام
    if (!isRootAdmin && isTargetRoot(selectedUser)) {
      alert('⚠️ فشل أمني: لا يمكنك تعديل بيانات الإدارة العليا.');
      setSelectedUser(null);
      return;
    }

    setIsSaving(true);

    try { 
      const updates: any = { 
        coins: Number(editingFields.coins), 
        customId: editingFields.customId,
        isBanned: editingFields.isBanned, 
        banUntil: editingFields.banUntil,
        vipLevel: editingFields.vipLevel,
        isVip: editingFields.vipLevel > 0,
        loginPassword: editingFields.loginPassword || null,
      }; 

      if (isRootAdmin) {
        updates.isSystemModerator = editingFields.isSystemModerator;
        updates.moderatorPermissions = editingFields.moderatorPermissions;
      }
      
      const selectedVipPackage = vipLevels.find(v => v.level === editingFields.vipLevel);
      if (selectedVipPackage) updates.frame = selectedVipPackage.frameUrl;

      await onUpdateUser(selectedUser.id, updates); 
      
      if (editingFields.isBanned) {
        if (editingFields.banDevice && selectedUser.deviceId) {
          await setDoc(doc(db, 'blacklist', 'dev_' + selectedUser.deviceId), {
            type: 'device', value: selectedUser.deviceId, bannedUserId: selectedUser.id, timestamp: serverTimestamp()
          });
        }
        if (editingFields.banNetwork && selectedUser.lastIp) {
          await setDoc(doc(db, 'blacklist', 'ip_' + selectedUser.lastIp.replace(/\./g, '_')), {
            type: 'ip', value: selectedUser.lastIp, bannedUserId: selectedUser.id, timestamp: serverTimestamp()
          });
        }
      }

      alert('تم التحديث بنجاح ✅'); 
      setSelectedUser(null); 
    } catch (e) { 
      alert('فشل حفظ البيانات'); 
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (tabId: string) => {
    setEditingFields(prev => {
      const current = prev.moderatorPermissions;
      const updated = current.includes(tabId) 
        ? current.filter(id => id !== tabId) 
        : [...current, tabId];
      return { ...prev, moderatorPermissions: updated };
    });
  };

  return (
    <div className="space-y-6 text-right font-cairo" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-950/40 p-6 rounded-[2rem] border border-white/5 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/40"><Users className="text-white" /></div>
           <div>
              <h3 className="text-xl font-black text-white">مركز إدارة الأعضاء</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">التحكم في حسابات المستخدمين والمشرفين</p>
           </div>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو الـ ID..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 text-white text-xs outline-none focus:border-blue-500 transition-all shadow-inner" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(u => (
          <motion.div 
            whileHover={{ y: -3 }}
            key={u.id} 
            className={`bg-slate-900/60 border rounded-[2rem] p-5 flex items-center justify-between group transition-all ${u.isBanned ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 hover:border-blue-500/30'}`}
          >
            <div className="flex items-center gap-4 overflow-hidden">
               <div className="relative shrink-0">
                  <img src={u.avatar} className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg" alt="" />
                  {isTargetRoot(u) && <div className="absolute -top-2 -left-2 bg-amber-500 p-1 rounded-full shadow-lg border-2 border-[#0f172a]"><ShieldCheck size={12} className="text-black" /></div>}
                  {u.isVip && <div className="absolute -top-1 -right-1 bg-amber-500 p-0.5 rounded-md shadow-lg"><Crown size={10} className="text-black" fill="currentColor" /></div>}
               </div>
               <div className="overflow-hidden">
                  <h4 className="text-white font-black text-sm truncate">{u.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold">ID: {u.customId || u.id}</p>
               </div>
            </div>
            <button 
              onClick={() => { 
                setSelectedUser(u); 
                setEditingFields({ 
                  coins: u.coins || 0, 
                  customId: u.customId?.toString() || '', 
                  vipLevel: u.vipLevel || 0, 
                  isBanned: u.isBanned || false, 
                  banUntil: u.banUntil || '', 
                  loginPassword: u.loginPassword || '', 
                  isSystemModerator: u.isSystemModerator || false, 
                  moderatorPermissions: u.moderatorPermissions || [],
                  banDevice: true, 
                  banNetwork: true 
                }); 
              }} 
              className={`p-3 rounded-xl transition-all active:scale-90 ${isTargetRoot(u) ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white'}`}
            >
              {isTargetRoot(u) ? <Shield size={20}/> : <UserCog size={20}/>}
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[3005] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-[#0f172a] border border-white/10 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
               <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <img src={selectedUser.avatar} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" />
                     <div>
                        <h3 className="text-white font-black text-base">{selectedUser.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isTargetRoot(selectedUser) ? 'الحساب الرئيسي - محمي' : 'تعديل بيانات الحساب الرقمي'}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                  {/* حاجز أمان: إذا كان الهدف هو المدير والمحضر هو مجرد مشرف */}
                  {!isRootAdmin && isTargetRoot(selectedUser) ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/20">
                       <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
                          <Lock size={50} strokeWidth={2.5} />
                       </div>
                       <h4 className="text-xl font-black text-white">حساب محمي من النظام</h4>
                       <p className="text-slate-400 text-xs font-bold max-w-[280px]">لا تملك صلاحيات كافية للوصول إلى بيانات أو تعديل حساب المدير العام الرئيسي.</p>
                       <button onClick={() => setSelectedUser(null)} className="mt-4 px-8 py-3 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest">رجوع للوراء</button>
                    </div>
                  ) : (
                    <>
                      {/* قسم الحظر */}
                      <div className="p-6 bg-red-600/5 rounded-3xl border border-red-600/20 space-y-5">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black text-red-500 flex items-center gap-2 uppercase tracking-widest"><ShieldAlert size={16} /> الحظر والقيود</h4>
                           <div className="flex gap-2">
                              <button onClick={() => setEditingFields({...editingFields, banDevice: !editingFields.banDevice})} className={`px-3 py-1.5 rounded-lg border text-[9px] font-black transition-all flex items-center gap-1.5 ${editingFields.banDevice ? 'bg-red-600/20 border-red-500 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}><Smartphone size={12}/> فون</button>
                              <button onClick={() => setEditingFields({...editingFields, banNetwork: !editingFields.banNetwork})} className={`px-3 py-1.5 rounded-lg border text-[9px] font-black transition-all flex items-center gap-1.5 ${editingFields.banNetwork ? 'bg-red-600/20 border-red-500 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}><Globe size={12}/> شبكة</button>
                           </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <button onClick={() => setEditingFields({...editingFields, isBanned: false, banUntil: ''})} className={`py-3 rounded-2xl text-[10px] font-black border transition-all ${!editingFields.isBanned ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-black/20 text-slate-500'}`}>فك</button>
                           <button onClick={() => handleBan(30)} className={`py-3 rounded-2xl text-[10px] font-black border transition-all ${editingFields.isBanned && editingFields.banUntil !== 'permanent' ? 'bg-red-600 text-white border-red-400' : 'bg-black/20 text-slate-500'}`}>شهر</button>
                           <button onClick={() => handleBan('permanent')} className={`py-3 rounded-2xl text-[10px] font-black border transition-all ${editingFields.banUntil === 'permanent' ? 'bg-red-900 text-white border-red-600' : 'bg-black/20 text-slate-500'}`}>أبدي ☢️</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-black/30 p-6 rounded-[2.5rem] border border-white/5 space-y-5">
                           <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 pr-1"><Key size={14} /> بيانات الدخول</h4>
                           <div className="space-y-4">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-500 pr-2">الـ ID المخصص</label>
                                 <div className="relative">
                                    <Hash size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                    <input type="text" value={editingFields.customId} onChange={e => setEditingFields({...editingFields, customId: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pr-10 text-amber-500 font-black text-xs outline-none" />
                                 </div>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-500 pr-2">كلمة المرور</label>
                                 <div className="relative">
                                    <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                    <input type="text" value={editingFields.loginPassword} onChange={e => setEditingFields({...editingFields, loginPassword: e.target.value})} placeholder="تغيير الرمز..." className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pr-10 text-white font-black text-xs outline-none" />
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-black/30 p-6 rounded-[2.5rem] border border-white/5 space-y-5">
                           <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2 pr-1"><Coins size={14} /> الكوينز والـ VIP</h4>
                           <div className="space-y-4">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-500 pr-2">الكوينز</label>
                                 <input type="number" value={editingFields.coins} onChange={e => setEditingFields({...editingFields, coins: parseInt(e.target.value) || 0})} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pr-4 text-yellow-500 font-black text-sm outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-slate-500 pr-2">مستوى الـ VIP</label>
                                 <div className="relative">
                                    <select value={editingFields.vipLevel} onChange={e => setEditingFields({...editingFields, vipLevel: parseInt(e.target.value)})} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pr-4 pl-8 text-white text-xs font-black outline-none appearance-none">
                                       <option value={0}>بدون VIP</option>
                                       {vipLevels.sort((a,b)=>a.level-b.level).map(v => <option key={v.level} value={v.level}>{v.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* صلاحيات المشرفين - للمدير فقط */}
                      {isRootAdmin && (
                        <div className="p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/20 space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors ${editingFields.isSystemModerator ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}><ShieldCheck size={20} /></div>
                                <div>
                                   <h4 className="text-sm font-black text-white">رتبة مشرف نظام (System Mod)</h4>
                                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">تخويل العضو لاستخدام لوحة الإدارة</p>
                                </div>
                             </div>
                             <button 
                               onClick={() => setEditingFields({ ...editingFields, isSystemModerator: !editingFields.isSystemModerator })} 
                               className={`w-12 h-6 rounded-full relative transition-all duration-300 ${editingFields.isSystemModerator ? 'bg-blue-500 shadow-[0_0_15px_#3b82f6]' : 'bg-slate-700'}`}
                             >
                                <motion.div animate={{ x: editingFields.isSystemModerator ? 26 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                             </button>
                          </div>

                          {editingFields.isSystemModerator && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 border-t border-blue-500/10 space-y-4 overflow-hidden">
                               <label className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase"><Layers size={14}/> تحديد الصلاحيات الممنوحة:</label>
                               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {ADMIN_TABS.map(tab => (
                                    <button 
                                      key={tab.id} 
                                      onClick={() => togglePermission(tab.id)}
                                      className={`p-3 rounded-xl text-[9px] font-black border transition-all text-center ${editingFields.moderatorPermissions.includes(tab.id) ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black/30 border-white/5 text-slate-600'}`}
                                    >
                                       {tab.label}
                                    </button>
                                  ))}
                               </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      <div className="pt-4 pb-2">
                         <button 
                           onClick={handleSave} 
                           disabled={isSaving}
                           className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black rounded-[2rem] shadow-xl shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 text-sm"
                         >
                            {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><Save size={20} /> حفظ التعديلات فوراً</>}
                         </button>
                      </div>
                    </>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
