
import { db } from './firebase';
import { doc, increment, writeBatch, arrayUnion, updateDoc, collection, serverTimestamp } from 'firebase/firestore';

export const EconomyEngine = {
  
  // 1. صرف كوينز لشراء منتج من المتجر (تحديث فوري)
  spendCoins: async (userId: string, currentCoins: any, currentWealth: any, amount: any, currentOwnedItems: string[], itemId: string | null, updateLocalState: (data: any) => void, itemMetadata?: any, currentEarnedItems: any[] = []) => {
    const coins = Number(currentCoins || 0);
    const wealth = Number(currentWealth || 0);
    const cost = Number(amount || 0);

    if (cost <= 0 || coins < cost) return false;
    
    // تحديث الواجهة فوراً (Optimistic UI)
    const localUpdate: any = { 
      coins: coins - cost, 
      wealth: wealth + cost 
    };

    if (itemId && itemMetadata) {
      const now = Date.now();
      const instanceId = `${itemId}_buy_${now}`;
      const expiresAt = itemMetadata.ownershipDays > 0 
        ? now + (itemMetadata.ownershipDays * 24 * 60 * 60 * 1000) 
        : now + (30 * 24 * 60 * 60 * 1000);

      const newItem = {
        id: instanceId, 
        originalId: itemId, 
        name: itemMetadata.name,
        type: itemMetadata.type,
        url: itemMetadata.url,
        expiresAt: expiresAt,
        duration: itemMetadata.duration || 6,
        price: itemMetadata.price || 0
      };

      localUpdate.earnedItems = [...(Array.isArray(currentEarnedItems) ? currentEarnedItems : []), newItem].slice(-15);
      if (itemMetadata.type === 'frame') localUpdate.frame = itemMetadata.url;
      if (itemMetadata.type === 'bubble') localUpdate.activeBubble = itemMetadata.url;
      if (itemMetadata.type === 'entry') localUpdate.activeEntry = itemMetadata.url;
      if (!currentOwnedItems.includes(itemId)) localUpdate.ownedItems = [...currentOwnedItems, itemId];
    }

    // التنفيذ الفوري في الواجهة
    updateLocalState(localUpdate);

    // المزامنة في الخلفية بدون انتظار blocking await لزيادة السرعة
    const userRef = doc(db, 'users', userId);
    updateDoc(userRef, {
      ...localUpdate,
      coins: increment(-cost),
      wealth: increment(cost),
      earnedItems: localUpdate.earnedItems || [],
      ownedItems: arrayUnion(itemId)
    }).catch(e => console.error("Sync Error:", e));

    return true;
  },

  // 2. شراء رتبة VIP (تحديث فوري)
  buyVIP: async (userId: string, currentCoins: any, currentWealth: any, vip: any, updateLocalState: (data: any) => void) => {
    const coins = Number(currentCoins || 0);
    const cost = Number(vip.cost || 0);
    if (coins < cost) return false;

    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

    // تحديث فوري
    const updates = { 
      isVip: true, 
      vipLevel: vip.level, 
      coins: coins - cost, 
      wealth: Number(currentWealth || 0) + cost, 
      frame: vip.frameUrl,
      vipExpiresAt: expiresAt
    };
    
    updateLocalState(updates);

    // مزامنة خلفية
    updateDoc(doc(db, 'users', userId), { 
      ...updates,
      coins: increment(-cost), 
      wealth: increment(cost)
    }).catch(() => {});

    return true;
  },

  // 3. تحويل الألماس لكوينز (تحديث فوري)
  exchangeDiamonds: async (userId: string, currentCoins: any, currentDiamonds: any, amount: any, updateLocalState: (data: any) => void) => {
    const cost = Number(amount || 0);
    const diamonds = Number(currentDiamonds || 0);
    if (cost <= 0 || diamonds < cost) return false;
    const coinsGained = Math.floor(cost * 0.5);

    // تحديث فوري للعدادات
    updateLocalState({ 
      coins: Number(currentCoins || 0) + coinsGained, 
      diamonds: diamonds - cost 
    });

    // مزامنة خلفية
    updateDoc(doc(db, 'users', userId), { 
      coins: increment(coinsGained), 
      diamonds: increment(-cost) 
    }).catch(() => {});

    return true;
  },

  // 4. تحويل راتب لوكالة (70,000 -> 80,000)
  exchangeSalaryToAgency: async (userId: string, currentDiamonds: any, agentId: string, amount: number, updateLocalState: (data: any) => void) => {
    const diamonds = Number(currentDiamonds || 0);
    if (diamonds < amount || amount < 70000) return false;

    // الحساب: 80,000 كوينز وكالة لكل 70,000 ماسة
    const agencyCoinsGained = Math.floor((amount / 70000) * 80000);

    try {
      const batch = writeBatch(db);
      // خصم الماس من المستخدم
      batch.update(doc(db, 'users', userId), { diamonds: increment(-amount) });
      // إضافة رصيد وكالة للوكيل
      batch.update(doc(db, 'users', agentId), { agencyBalance: increment(agencyCoinsGained) });
      
      await batch.commit();

      // تحديث فوري للواجهة
      updateLocalState({ diamonds: diamonds - amount });
      return true;
    } catch (e) {
      console.error("Exchange to Agency Failed:", e);
      return false;
    }
  },

  // 5. تحويل وكالة (شحن مستخدم من قبل وكيل) - تحديث فوري فائق
  agencyTransfer: async (agentId: string, agentBalance: any, targetId: string, amount: number, callback: (agentUpdate: any) => void) => {
    const balance = Number(agentBalance || 0);
    if (balance < amount) return false;

    // تحديث فوري لواجهة الوكيل (خصم المبلغ)
    callback({ agencyBalance: balance - amount });

    try {
      const batch = writeBatch(db);
      // خصم من الوكيل
      batch.update(doc(db, 'users', agentId), { agencyBalance: increment(-amount) });
      // إضافة للمستخدم (كوينز + نقاط شحن لرفع مستوى الشحن لديه فوراً)
      batch.update(doc(db, 'users', targetId), { 
        coins: increment(amount),
        rechargePoints: increment(amount) 
      });
      
      // تسجيل عملية الشحن
      const logsRef = doc(collection(db, 'agency_logs'));
      batch.set(logsRef, {
        agentId,
        targetId,
        amount,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      return true;
    } catch (e) { 
      console.error("Agency Transfer Failed:", e);
      return false; 
    }
  }
};
