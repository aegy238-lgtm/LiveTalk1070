
import React, { useState, useEffect } from 'react';
import { TowerControl, Coins, Save, Trash2, Search, PlusCircle, UserCheck, Image as ImageIcon, Upload } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Tribe, User, GameSettings } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminTribesProps {
  users: User[];
  gameSettings: GameSettings;
  onUpdateGameSettings: (updates: Partial<GameSettings>) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminTribes: React.FC<AdminTribesProps> = ({ users, gameSettings, onUpdateGameSettings, handleFileUpload }) => {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [creationCost, setCreationCost] = useState(gameSettings.tribeCreationCost || 50000);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tribes'), (snap) => {
      setTribes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tribe)));
    });
    return () => unsub();
  }, []);

  const handleUpdateCost = () => {
    onUpdateGameSettings({ tribeCreationCost: creationCost });
    alert('تم تحديث تكلفة إنشاء القبيلة ✅');
  };

  const handleDeleteTribe = async (id: string) => {
    if(!confirm('حذف هذه القبيلة نهائياً؟')) return;
    await deleteDoc(doc(db, 'tribes', id));
  };

  return (
    <div className="space-y-8 text-right font-cairo" dir="rtl">
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-lg"><TowerControl size={24} /></div>
          إدارة نظام القبائل (Clans)
        </h3>
        <p className="text-slate-500 text-xs font-bold mt-2">تحكم في تكلفة إنشاء القبائل ومراقبة القبائل النشطة.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
            <h4 className="text-white font-black text-sm">تحديد تكلفة التأسيس</h4>
            <div className="flex gap-3">
               <div className="relative flex-1">
                  <input 
                    type="number" 
                    value={creationCost}
                    onChange={(e) => setCreationCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-yellow-500 font-black text-center"
                  />
                  <Coins size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
               </div>
               <button onClick={handleUpdateCost} className="px-8 bg-blue-600 text-white rounded-2xl font-black text-xs">حفظ التكلفة</button>
            </div>
         </div>

         <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
            <h4 className="text-white font-black text-sm">القبائل النشطة ({tribes.length})</h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
               {tribes.map(tribe => (
                  <div key={tribe.id} className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                     <div className="flex items-center gap-3">
                        <img src={tribe.image} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                           <p className="text-white font-black text-xs">{tribe.name}</p>
                           <p className="text-[9px] text-slate-500">القائد: {tribe.leaderName}</p>
                        </div>
                     </div>
                     <button onClick={() => handleDeleteTribe(tribe.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18}/></button>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminTribes;
