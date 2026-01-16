
import React, { useState } from 'react';
import { Smartphone, Camera, Image as ImageIcon, Edit3, Save, AlertCircle, RefreshCw } from 'lucide-react';

interface AdminIdentityProps {
  appLogo: string;
  appBanner: string;
  appName: string;
  authBackground: string; 
  onUpdateAppLogo: (url: string) => void;
  onUpdateAppBanner: (url: string) => void;
  onUpdateAppName: (name: string) => void;
  onUpdateAuthBackground: (url: string) => void; 
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminIdentity: React.FC<AdminIdentityProps> = ({ 
  appLogo, appBanner, appName, authBackground, 
  onUpdateAppLogo, onUpdateAppBanner, onUpdateAppName, onUpdateAuthBackground,
  handleFileUpload 
}) => {
  const [localAppName, setLocalAppName] = useState(appName);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveName = () => {
    if (localAppName.trim()) {
      onUpdateAppName(localAppName);
      alert('تم تحديث اسم التطبيق بنجاح! ✅');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-right font-cairo" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <Smartphone className="text-emerald-500"/> هوية التطبيق والبراند
        </h3>
        <p className="text-slate-500 text-xs font-bold mt-2 pr-1">تحكم في الشعار، اسم الموقع، وخلفية تسجيل الدخول التي تظهر للمستخدمين.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* قسم الشعار */}
        <div className="bg-slate-950/60 p-8 rounded-[3rem] border border-white/10 space-y-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-2">
             <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">شعار التطبيق (Logo)</span>
             <div className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md text-[8px] font-black">Live Preview</div>
          </div>
          
          <div className="relative group w-40 h-40">
            <div className="w-full h-full rounded-[2.5rem] bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
               <img src={appLogo} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Current Logo" />
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <Camera size={28} className="text-white" />
                  <span className="text-[9px] text-white font-black">تغيير الشعار</span>
               </div>
            </div>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, onUpdateAppLogo, 400, 400)} />
          </div>
          
          <div className="w-full space-y-2">
             <label className="text-[10px] font-black text-slate-600 pr-1">رابط الشعار المباشر:</label>
             <input 
               type="text" 
               value={appLogo} 
               onChange={(e) => onUpdateAppLogo(e.target.value)}
               className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-blue-400 outline-none focus:border-blue-500/50"
             />
          </div>
        </div>

        {/* خلفية الدخول */}
        <div className="bg-slate-950/60 p-8 rounded-[3rem] border border-white/10 space-y-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-2">
             <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">خلفية واجهة الدخول</span>
             <div className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md text-[8px] font-black">High Quality</div>
          </div>
          
          <div className="relative group w-full h-40">
            <div className="w-full h-full rounded-3xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
               {authBackground ? (
                 <img src={authBackground} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Auth Background" />
               ) : (
                 <ImageIcon size={40} className="text-slate-800" />
               )}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <Camera size={32} className="text-white" />
                  <span className="text-[9px] text-white font-black">تغيير الخلفية</span>
               </div>
            </div>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, onUpdateAuthBackground, 1200, 800)} />
          </div>

          <div className="w-full space-y-2">
             <label className="text-[10px] font-black text-slate-600 pr-1">رابط الخلفية المباشر:</label>
             <input 
               type="text" 
               value={authBackground} 
               onChange={(e) => onUpdateAuthBackground(e.target.value)}
               className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-emerald-400 outline-none focus:border-emerald-500/50"
             />
          </div>
        </div>
      </div>

      {/* اسم التطبيق */}
      <div className="bg-slate-950/60 p-10 rounded-[3rem] border border-white/10 space-y-6">
        <h4 className="text-sm font-black text-white flex items-center gap-3">
           <Edit3 size={18} className="text-blue-400" /> إعدادات اسم المنصة
        </h4>
        <div className="flex gap-4">
           <input 
             type="text" 
             value={localAppName}
             onChange={(e) => setLocalAppName(e.target.value)}
             className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-white text-lg font-black outline-none focus:border-blue-500/50 shadow-inner"
             placeholder="أدخل اسم التطبيق..."
           />
           <button 
             onClick={handleSaveName}
             className="px-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-3"
           >
              <Save size={20} /> حفظ التغيير
           </button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] flex items-center gap-4">
         <AlertCircle className="text-amber-500" size={24} />
         <p className="text-[11px] text-amber-200 font-bold leading-relaxed">
           سيتم تطبيق التغييرات فوراً على جميع الواجهات. يرجى التأكد من أن روابط الصور المرفوعة روابط مباشرة (Direct Links) لضمان سرعة التحميل القصوى.
         </p>
      </div>
    </div>
  );
};

export default AdminIdentity;
