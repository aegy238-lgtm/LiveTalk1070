
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, History, Coins, Volume2, VolumeX, HelpCircle, Star, Zap, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import WinStrip from './WinStrip';
import { GameSettings } from '../types';

interface LionWheelGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  gameSettings: GameSettings;
}

const LION_ITEMS = [
  { id: 'chicken', label: 'دجاج', icon: '🍗', multiplier: 45, color: '#f97316' },
  { id: 'octopus', label: 'أخطبوط', icon: '🐙', multiplier: 25, color: '#ec4899' },
  { id: 'fish', label: 'سمك', icon: '🐟', multiplier: 15, color: '#3b82f6' },
  { id: 'meat', label: 'لحم', icon: '🥩', multiplier: 10, color: '#ef4444' },
  { id: 'grapes', label: 'عنب', icon: '🍇', multiplier: 5, color: '#a855f7' },
  { id: 'salad', label: 'سلطة', icon: '🥗', multiplier: 5, color: '#22c55e' },
];

enum GameState {
  BETTING = 'betting',
  SPINNING = 'spinning',
  RESULT = 'result'
}

const LionWheelGameModal: React.FC<LionWheelGameModalProps> = ({ isOpen, onClose, userCoins, onUpdateCoins, gameSettings }) => {
  const [state, setState] = useState<GameState>(GameState.BETTING);
  const [timer, setTimer] = useState(15);
  
  const CHIPS = useMemo(() => gameSettings?.lionChips || [100, 1000, 10000, 100000], [gameSettings?.lionChips]);
  const [selectedChip, setSelectedChip] = useState(CHIPS[0]);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<typeof LION_ITEMS>([]);
  const [winner, setWinner] = useState<typeof LION_ITEMS[0] | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [selectorRotation, setSelectorRotation] = useState(0); 

  useEffect(() => {
    if (history.length === 0) {
      setHistory(Array(4).fill(null).map(() => LION_ITEMS[Math.floor(Math.random() * LION_ITEMS.length)]));
    }
  }, [history.length]);

  useEffect(() => {
    let interval: any;
    if (state === GameState.BETTING) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setState(GameState.SPINNING);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (state === GameState.SPINNING) {
      startSelection();
    } else if (state === GameState.RESULT) {
      setTimeout(() => {
        setWinner(null);
        setWinAmount(0);
        setBets({});
        setTimer(15); 
        setState(GameState.BETTING);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [state, bets]); 

  const startSelection = () => {
    const bettedIds = Object.keys(bets).filter(id => (bets[id] || 0) > 0);
    const winRate = gameSettings?.lionWinRate || 35;
    const isWin = (Math.random() * 100) < winRate;
    let winIndex;

    if (isWin && bettedIds.length > 0) {
      const winId = bettedIds[Math.floor(Math.random() * bettedIds.length)];
      winIndex = LION_ITEMS.findIndex(i => i.id === winId);
    } else {
      winIndex = Math.floor(Math.random() * LION_ITEMS.length);
    }

    const winningItem = LION_ITEMS[winIndex];
    const segmentAngle = 360 / LION_ITEMS.length;
    const targetRotation = selectorRotation + 1440 + (winIndex * segmentAngle);
    
    setSelectorRotation(targetRotation);
    setWinner(winningItem);

    setTimeout(() => {
      setHistory(prev => [winningItem, ...prev.slice(0, 3)]);
      const userBet = bets[winningItem.id] || 0;
      if (userBet > 0) {
        const payout = userBet * winningItem.multiplier;
        setWinAmount(payout);
        // إضافة المكسب فوراً (فوري ولحظي)
        onUpdateCoins(userCoins + payout + userBet);
      }
      setState(GameState.RESULT);
    }, 5500); 
  };

  const handlePlaceBet = (itemId: string) => {
    if (state !== GameState.BETTING || userCoins < selectedChip) return;
    
    // خصم فوري ومباشر في واجهة المستخدم (فوري ولحظي)
    onUpdateCoins(userCoins - selectedChip);
    setBets(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + selectedChip }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 overflow-hidden bg-black/85 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-[360px] h-[90vh] bg-[#38BDF8] shadow-2xl overflow-hidden rounded-[2.5rem] flex flex-col font-cairo border border-white/20">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0EA5E9] via-[#7DD3FC] to-[#FFEDD5]"></div>
        <AnimatePresence>{state === GameState.RESULT && winAmount > 0 && <WinStrip amount={winAmount} />}</AnimatePresence>
        
        {/* Game UI Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="relative w-64 h-64">
                <AnimatePresence>
                  {state !== GameState.BETTING && (
                    <motion.div 
                      animate={{ rotate: selectorRotation }}
                      transition={state === GameState.SPINNING ? { duration: 5.5, ease: [0.4, 0.0, 0.2, 1] } : { duration: 0.5 }}
                      className="absolute inset-0 z-40 pointer-events-none"
                    >
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-white border-4 border-yellow-500 rounded-xl shadow-xl"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute inset-0">
                   {LION_ITEMS.map((item, idx) => {
                      const angle = (360 / LION_ITEMS.length) * idx;
                      const x = 90 * Math.cos((angle - 90) * (Math.PI / 180));
                      const y = 90 * Math.sin((angle - 90) * (Math.PI / 180));
                      return (
                        <button key={item.id} onClick={() => handlePlaceBet(item.id)} style={{ transform: `translate(${x}px, ${y}px)` }} className="absolute left-1/2 top-1/2 -ml-8 -mt-8 w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-90 transition-transform">
                           <span className="text-2xl">{item.icon}</span>
                           <span className="text-[8px] font-black">X{item.multiplier}</span>
                           {bets[item.id] > 0 && <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[7px] font-black px-1 rounded-full shadow-lg">{bets[item.id] >= 1000 ? (bets[item.id]/1000).toFixed(0)+'K' : bets[item.id]}</span>}
                        </button>
                      );
                   })}
                </div>
            </div>
        </div>

        <div className="relative z-20 bg-[#EF4444] rounded-t-[2.5rem] p-4 border-t-4 border-[#FBBF24] flex flex-col gap-3">
           <div className="flex justify-between items-center gap-1 bg-black/20 p-1 rounded-full border border-white/5">
              {CHIPS.map(c => (
                 <button key={c} onClick={() => setSelectedChip(c)} className={`flex-1 h-8 rounded-full border transition-all active:scale-95 text-[8px] font-black ${selectedChip === c ? 'bg-yellow-400 text-amber-900 border-white' : 'bg-black/30 text-white/50 border-white/5'}`}>
                    {c >= 1000 ? (c/1000)+'K' : c}
                 </button>
              ))}
           </div>
           <div className="flex items-center justify-between">
              <div className="bg-white/95 rounded-2xl p-2 px-4 flex items-center gap-2 border-b-4 border-slate-300">
                 <Coins size={12} className="text-amber-600" />
                 <span className="text-amber-900 font-black text-xs">{userCoins.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[10px] text-white font-black">الوقت المتبقي</span>
                 <span className="text-lg text-yellow-300 font-black">{timer}s</span>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LionWheelGameModal;
