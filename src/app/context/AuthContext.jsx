// src/app/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../services/firebase/firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { ensureUserDoc } from "../services/firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase user object
  const [uid, setUid] = useState(null);   // convenience
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return; // strict mode safegaurd
    didInit.current = true;

    // Subscribe to auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setAuthError(null);

        // If there's no user yet, create an anonymous one
        if (!firebaseUser) {
          const cred = await signInAnonymously(auth);
          firebaseUser = cred.user;
        }

        setUser(firebaseUser);
        setUid(firebaseUser.uid);

        //ensure firestore user doc exists
        await ensureUserDoc(firebaseUser);

      } catch (err) {
        console.error("Auth init error:", err);
        setAuthError(err);
        setUser(null);
        setUid(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, uid, loading, authError }),
    [user, uid, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
