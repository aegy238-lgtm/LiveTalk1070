
// Standard Firebase v9 modular imports
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyC6jaJoEtdxOnnmVbk5HjWiuH9M_yWzrTk",
    authDomain: "bobo-live-bce54.firebaseapp.com",
    projectId: "bobo-live-bce54",
    storageBucket: "bobo-live-bce54.firebasestorage.app",
    messagingSenderId: "386288883998",
    appId: "1:386288883998:web:ce7c14d37dd7371552110f"
};

const app = initializeApp(firebaseConfig);

// تحسين Firestore للتعامل مع تحديثات الويب المكثفة
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

// الاحترافية القصوى: تعيين ثبات الجلسة بشكل إجباري عند تشغيل الملف
// هذا يضمن أن التوكن سيبقى مخزناً في localStorage الخاص بالمتصفح
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth Persistence set to LOCAL successfully");
  })
  .catch((error) => {
    console.error("Auth Persistence Error:", error);
  });
