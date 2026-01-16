
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { GiftDisplaySize } from '../../types';

interface GiftEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  giftAnimation: string; 
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientIds: string[];
  quantity: number;
  duration?: number;
  displaySize?: GiftDisplaySize;
  soundUrl?: string;
  timestamp: any;
}

interface GiftAnimationLayerProps {
  roomId: string;
  currentUserId: string;
  speakers?: any[];
  onActiveChange?: (active: boolean) => void;
}

/**
 * محرك تشغيل الفيديوهات المطور (Ultra Reliable Player)
 * يضمن تشغيل روابط MP4 حتى لو كانت من سيرفرات خارجية تمنع CORS
 */
const VAPEnginePlayer = ({ src, onEnded, isFull }: { src: string, onEnded?: () => void, isFull?: boolean }) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let isMounted = true;

    const startVideo = async () => {
      try {
        setHasError(false);
        video.muted = true; // كتم الصوت إجباري للبدء لتجاوز حماية المتصفح
        video.src = src;
        video.load();

        // محاولة التشغيل
        await video.play();
        
        // بمجرد البدء، نفتح الصوت ونرفع الدرجة
        if (isMounted) {
          video.muted = false;
          video.volume = 1.0;
        }
      } catch (err) {
        console.warn("Autoplay with sound blocked, keeping muted for 1s then retrying sound...");
        // إذا فشل تشغيل الصوت فوراً، ننتظر ثانية ثم نحاول إعادة الصوت (سلوك متصفحات أندرويد)
        setTimeout(() => {
          if (video && isMounted) {
            video.muted = false;
            video.play().catch(() => {});
          }
        }, 1000);
      }
    };

    startVideo();

    return () => {
      isMounted = false;
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, [src]);

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-[5000] ${isFull ? 'w-full h-full' : ''}`}>
       <video 
         ref={videoRef}
         src={src} 
         autoPlay 
         playsInline 
         webkit-playsinline="true"
         className={isFull ? 'w-full h-full object-cover' : 'w-full max-w-[90vw] aspect-video object-contain'}
         onEnded={onEnded}
         onError={() => {
           console.error("Video element failed to load source:", src);
           setHasError(true);
         }}
         style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
       />
       {hasError && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="text-[10px] text-white/50 font-black">خطأ في رابط الفيديو</span>
         </div>
       )}
    </div>
  );
};

export const GiftAnimationLayer = forwardRef((props: GiftAnimationLayerProps, ref) => {
  const { roomId, currentUserId, onActiveChange } = props;
  const [activeAnimations, setActiveAnimations] = useState<GiftEvent[]>([]);
  const playedIds = useRef(new Set<string>());
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(activeAnimations.length > 0);
    }
  }, [activeAnimations, onActiveChange]);

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || url.includes('video') || url.startsWith('blob:') || url.startsWith('data:video');
  };

  const triggerAnimation = (event: GiftEvent) => {
    if (playedIds.current.has(event.id)) return;
    playedIds.current.add(event.id);

    setActiveAnimations(prev => [...prev, event]);

    // تشغيل ملف الصوت الملحق (فقط إذا كانت الهدية صورة APNG/GIF)
    // لأن فيديوهات MP4 ستشغل صوتها المدمج من داخل المكون نفسه
    if (event.soundUrl && !isVideoUrl(event.giftIcon)) {
      try {
        const audio = new Audio(event.soundUrl);
        audio.volume = 1.0;
        audio.play().catch(e => console.warn("Audio Play Blocked", e));
        audioRefs.current[event.id] = audio;
      } catch (err) {
        console.warn("Gift sound failed", err);
      }
    }
    
    const maxDuration = (event.duration || 8) * 1000;
    setTimeout(() => {
      if (audioRefs.current[event.id]) {
        audioRefs.current[event.id].pause();
        delete audioRefs.current[event.id];
      }
      setActiveAnimations(prev => prev.filter(a => a.id !== event.id));
      // منع تكرار نفس الهدية لـ 20 ثانية
      setTimeout(() => playedIds.current.delete(event.id), 20000);
    }, maxDuration + 500);
  };

  useImperativeHandle(ref, () => ({
    trigger: (event: GiftEvent) => triggerAnimation(event)
  }));

  useEffect(() => {
    const q = query(
      collection(db, 'rooms', roomId, 'gift_events'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const newEvent = { id: change.doc.id, ...data } as GiftEvent;
          if (newEvent.senderId === currentUserId) return;
          
          const now = Date.now();
          const eventTime = data.timestamp?.toMillis ? data.timestamp.toMillis() : now;
          if (Math.abs(now - eventTime) < 10000) triggerAnimation(newEvent);
        }
      });
    });
    return () => {
      unsubscribe();
      Object.values(audioRefs.current).forEach((a) => {
        if (a instanceof HTMLAudioElement) a.pause();
      });
      audioRefs.current = {};
    };
  }, [roomId, currentUserId]);

  return (
    <div className="fixed inset-0 z-[5000] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {activeAnimations.map((event) => {
          const isFullScreen = event.giftAnimation === 'full-screen' || event.displaySize === 'full' || event.displaySize === 'max';

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              {isVideoUrl(event.giftIcon) ? (
                <VAPEnginePlayer 
                  src={event.giftIcon} 
                  isFull={isFullScreen}
                  onEnded={() => {
                    setActiveAnimations(prev => prev.filter(a => a.id !== event.id));
                  }}
                />
              ) : (
                <motion.div 
                  initial={{ scale: 0.5, y: 100 }}
                  animate={{ scale: 1, y: 0 }}
                  className={`${isFullScreen ? 'w-full h-full' : 'w-80 h-80'} flex items-center justify-center relative`}
                >
                  <img 
                    src={event.giftIcon} 
                    className={`${isFullScreen ? 'w-full h-full object-cover' : 'w-full h-full object-contain'} drop-shadow-2xl`} 
                    alt="Gift"
                  />
                  {event.quantity > 1 && (
                    <div className="absolute -right-4 top-1/2 bg-gradient-to-b from-yellow-400 to-orange-600 text-white font-black text-6xl px-6 py-2 rounded-3xl border-4 border-white shadow-2xl italic z-[5001]">
                      X{event.quantity}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

export default GiftAnimationLayer;
