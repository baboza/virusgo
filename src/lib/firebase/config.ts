import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAWSfQ-5dGQFoRVl-UQG11J161yUItytGQ",
  authDomain: "virusgo-9964f.firebaseapp.com",
  projectId: "virusgo-9964f",
  storageBucket: "virusgo-9964f.firebasestorage.app",
  messagingSenderId: "332159783297",
  appId: "1:332159783297:web:39c80a6d0f0fb7de985880",
  measurementId: "G-EY96WZ3ZR9"
};

// Initialize Firebase (singleton pattern for Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

// Enable persistent IndexedDB cache on client side to eliminate duplicate server reads
let db: any;
if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

const storage = getStorage(app);

// Analytics must be initialized only on the client side
let analytics: any;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
