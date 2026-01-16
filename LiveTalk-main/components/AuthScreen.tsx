
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Camera, Ban, Check, Sparkles, Fingerprint, Mail, Key } from 'lucide-react';
import { UserLevel, User as UserType } from '../types';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';

interface AuthScreenProps {
  onAuth: (user: UserType) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'id_login'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userIdInput, setUserIdInput] = useState(''); // للدخول بالآيدي
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatar, setAvatar] = useState('');
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);
  const [systemDefaults, setSystemDefaults] = useState({ avatar: '', cover: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // استلام بيانات الهوية فورياً من لوحة التحكم (التحديث اللحظي بدون ريفريش)
  const [siteIdentity, setSiteIdentity] = useState({
    logo: 'https://storage.googleapis.com/static.aistudio.google.com/stables/2025/03/06/f0e64906-e7e0-4a87-af9b-029e2467d302/f0e64906-e7e0-4a87-af9b-029e2467d302.png',
    background: ''
  });

  useEffect(() => {
    // التحديث الفوري للوجو والخلفية عند تغييرهم من الأدمن
    const unsubIdentity = onSnapshot(doc(db, 'appSettings', 'identity'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSiteIdentity({
          logo: data.appLogo || siteIdentity.logo,
          background: data.authBackground || ''
        });
      }
    });

    const fetchDefaults = async () => {
      const snap = await getDoc(doc(db, 'appSettings', 'defaults'));
      if (snap.exists()) {
        const data = snap.data();
        const imgs = data.profilePictures || [];
        setDefaultAvatars(imgs);
        
        const globalAvatar = data.globalDefaultAvatar || '';
        const globalCover = data.globalDefaultCover || '';
        setSystemDefaults({ avatar: globalAvatar, cover: globalCover });

        // إذا كان هناك هوية عالمية، نضعها كخيار أولي
        if (globalAvatar && !avatar) {
           setAvatar(globalAvatar);
        } else if (imgs.length > 0 && !avatar) {
           setAvatar(imgs[0]);
        }
      }
    };

    fetchDefaults();
    return () => unsubIdentity();
  }, []);

  const handleCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        setCustomAvatarPreview(res);
        setAvatar(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'id_login') {
        // تسجيل الدخول بالآيدي
        const q = query(collection(db, 'users'), where('customId', '==', userIdInput.trim()), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error('الآيدي غير مسجل');
        
        const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as UserType;
        if (userData.loginPassword !== password) throw new Error('كلمة المرور غير صحيحة');
        if (userData.isBanned) throw new Error('هذا الحساب محظور');
        
        onAuth(userData);
      } else if (authMode === 'login') {
        // تسجيل الدخول بالبريد
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (uDoc.exists()) {
          const userData = { id: uDoc.id, ...uDoc.data() } as UserType;
          if (userData.isBanned) throw new Error('هذا الحساب محظور');
          onAuth(userData);
        }
      } else {
        // إنشاء حساب جديد
        if (!avatar && !systemDefaults.avatar) return setError('يرجى اختيار صورة الشخصية');
        
        const finalAvatar = avatar || systemDefaults.avatar;
        const finalCover = systemDefaults.cover || '';
        
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userData: UserType = {
          id: cred.user.uid,
          customId: Math.floor(100000 + Math.random() * 899999).toString(),
          name, 
          avatar: finalAvatar, 
          cover: finalCover,
          gender, 
          level: UserLevel.NEW, 
          coins: 0, 
          diamonds: 0, 
          wealth: 0, 
          charm: 0, 
          isVip: false,
          loginPassword: password // حفظ كلمة المرور لاستخدامها في دخول الآيدي
        };
        await setDoc(doc(db, 'users', cred.user.uid), { ...userData, email, createdAt: serverTimestamp() });
        onAuth(userData);
      }
    } catch (err: any) { 
      setError(err.message || 'تأكد من البيانات المدخلة'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-cairo px-4 relative">
      
      {/* خلفية متغيرة فورياً */}
      {siteIdentity.background && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${siteIdentity.background})`, filter: 'brightness(0.3)' }} 
        />
      )}
      <div className="absolute inset-0 bg-black/40 z-[1]"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px] flex flex-col items-center gap-4 relative z-10">
        
        {/* اللوجو المتغير فورياً */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[1.4rem] p-1 shadow-2xl mx-auto mb-2 overflow-hidden border border-white/10">
            <img src={siteIdentity.logo} className="w-full h-full object-cover rounded-[1rem] bg-[#020617]" alt="Logo" />
          </div>
          <h1 className="text-lg font-black text-white tracking-tight">لايف تـوك</h1>
        </div>

        <div className="w-full bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-5 shadow-2xl overflow-y-auto max-h-[78vh] scrollbar-hide">
          
          {/* تبديل طرق الدخول */}
          <div className="flex bg-black/40 p-1 rounded-2xl mb-5 gap-1">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${authMode === 'login' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500'}`}>البريد</button>
            <button onClick={() => setAuthMode('id_login')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${authMode === 'id_login' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>الآيدي (ID)</button>
            <button onClick={() => setAuthMode('register')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${authMode === 'register' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500'}`}>جديد</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4" dir="rtl">
            {authMode === 'register' && (
              <div className="flex flex-col items-center gap-5">
                
                {/* منصة عرض الصورة المرفوعة (احترافي) */}
                <div className="flex flex-col items-center gap-2">
                   <div className="relative group">
                      <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-r from-amber-500 to-orange-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border-2 border-slate-900">
                           {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <UserIcon size={32} className="text-slate-600 mx-auto mt-5" />}
                        </div>
                      </div>
                      <label className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full cursor-pointer shadow-lg active:scale-90 transition-transform border border-white/20">
                         <Camera size={14} />
                         <input type="file" accept="image/*" className="hidden" onChange={handleCustomImage} />
                      </label>
                   </div>
                   <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1"><Sparkles size={8}/> صورتك الشخصية</span>
                </div>

                {/* قائمة الصور الافتراضية */}
                {(defaultAvatars.length > 0 || systemDefaults.avatar) && (
                  <div className="w-full bg-black/30 rounded-2xl p-3 border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 mb-2 px-1 uppercase">المعرض الافتراضي:</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {/* عرض الصورة العالمية كأول خيار إذا كانت موجودة */}
                      {systemDefaults.avatar && (
                        <button type="button" onClick={() => { setAvatar(systemDefaults.avatar); setCustomAvatarPreview(null); }} className={`relative w-10 h-10 rounded-xl shrink-0 transition-all border-2 ${avatar === systemDefaults.avatar && !customAvatarPreview ? 'border-blue-500 scale-105' : 'border-white/5 opacity-50'}`}>
                          <img src={systemDefaults.avatar} className="w-full h-full object-cover rounded-lg" />
                          {avatar === systemDefaults.avatar && !customAvatarPreview && <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg"><Check size={14} className="text-blue-500" /></div>}
                        </button>
                      )}
                      
                      {defaultAvatars.map((url, i) => (
                        <button key={i} type="button" onClick={() => { setAvatar(url); setCustomAvatarPreview(null); }} className={`relative w-10 h-10 rounded-xl shrink-0 transition-all border-2 ${avatar === url && !customAvatarPreview ? 'border-amber-500 scale-105' : 'border-white/5 opacity-50'}`}>
                          <img src={url} className="w-full h-full object-cover rounded-lg" />
                          {avatar === url && !customAvatarPreview && <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20 rounded-lg"><Check size={14} className="text-amber-500" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative w-full">
                  <UserIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pr-12 pl-5 text-white text-xs font-bold outline-none focus:border-amber-500/50" placeholder="الاسم المستعار..." />
                </div>
                <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 px-5 text-white text-xs font-bold outline-none"><option value="male">ذكر ♂</option><option value="female">أنثى ♀</option></select>
              </div>
            )}

            {authMode === 'id_login' ? (
              <div className="space-y-4">
                <div className="relative">
                  <Fingerprint size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pr-12 pl-5 text-white text-xs font-bold outline-none focus:border-blue-500/50" placeholder="ادخل رقم الآيدي (ID)..." />
                </div>
              </div>
            ) : (
              <div className="relative">
                <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pr-12 pl-5 text-white text-xs font-bold outline-none focus:border-amber-500/50" placeholder="البريد الإلكتروني..." />
              </div>
            )}

            <div className="relative">
              <Key size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pr-12 pl-5 text-white text-xs font-bold outline-none focus:border-amber-500/50" placeholder="كلمة السر..." />
            </div>

            {error && <p className="text-red-500 text-[10px] text-center font-black animate-pulse">{error}</p>}

            <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl text-black font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${authMode === 'id_login' ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'انطلق الآن'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
