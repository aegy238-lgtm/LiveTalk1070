
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import { User } from '../../types';

interface SeatProps {
  index: number;
  speaker: User | null;
  onClick: (index: number) => void;
  currentUser: User;
  sizeClass: string;
  customSkin?: string;
  isHost?: boolean;
}

const Seat: React.FC<SeatProps> = ({ index, speaker, onClick, currentUser, sizeClass, customSkin, isHost }) => {
  const isUrlEmoji = speaker?.activeEmoji?.startsWith('http') || speaker?.activeEmoji?.startsWith('data:');

  return (
    <div className={`relative flex items-center justify-center ${sizeClass} shrink-0 overflow-visible`}>
      <button 
        onClick={() => onClick(index)} 
        className="w-full h-full relative group transition-transform active:scale-90 flex items-center justify-center overflow-visible"
      >
        {speaker ? (
          <div className="relative w-full h-full p-0.5 flex flex-col items-center justify-center overflow-visible">
            
            {/* 1. دائرة البروفايل (Avatar) */}
            <div className={`relative z-10 w-[82%] h-[82%] rounded-full overflow-hidden border bg-slate-900 shadow-2xl flex items-center justify-center ${isHost ? 'border-amber-500/60' : 'border-white/25'}`}>
              <img src={speaker.avatar} className="w-full h-full object-cover" alt={speaker.name} />
            </div>

            {/* 2. الإطارات الملكية (أهم طبقة للعرض) */}
            {speaker.frame && (
              <img 
                src={speaker.frame} 
                className="absolute inset-0 w-full h-full object-contain z-[100] scale-[1.25] pointer-events-none drop-shadow-2xl" 
                style={{ imageRendering: 'auto' }}
                alt="VIP Frame"
              />
            )}

            {/* 3. الإيموجي المتحرك (أعلى شيء) */}
            <AnimatePresence mode="wait">
              {speaker.activeEmoji && (
                <motion.div
                  key={`${speaker.id}-${speaker.activeEmoji}`}
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{ opacity: 1, scale: 1.1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                  className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none"
                >
                  {isUrlEmoji ? (
                     <img 
                       src={speaker.activeEmoji} 
                       className="w-full h-full object-contain filter drop-shadow-2xl" 
                       alt="emoji" 
                     />
                  ) : (
                     <span className="text-4xl drop-shadow-2xl">{speaker.activeEmoji}</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. شارة الاسم والكاريزما */}
            <div className="absolute -bottom-7 left-0 right-0 flex flex-col items-center gap-0.5 pointer-events-none z-[200]">
               <span className={`text-[7px] font-black truncate drop-shadow-md px-2 py-0.5 rounded-full max-w-[52px] border leading-none shadow-sm ${isHost ? 'bg-amber-500 text-black border-amber-600' : 'bg-black/80 text-white border-white/10'}`}>
                  {speaker.name}
               </span>
               <div className="flex items-center gap-0.5 px-2 py-0.5 bg-black/70 border border-white/20 rounded-full shadow-xl backdrop-blur-md">
                  <span className="text-white font-black text-[6px] leading-none tracking-tighter">
                     {(Number(speaker.charm || 0)).toLocaleString()}
                  </span>
               </div>
            </div>
          </div>
        ) : (
          /* المقعد الفارغ */
          <div className="w-full h-full relative flex items-center justify-center">
            {customSkin ? (
               <img src={customSkin} className="w-full h-full object-contain filter drop-shadow-lg opacity-85" alt="Skin" />
            ) : (
              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                 <Mic size={14} className="text-white opacity-40" />
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  );
};

export default Seat;
