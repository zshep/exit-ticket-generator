// src/app/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { auth } from "../services/firebase/firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { ensureUserDoc } from "../services/firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase user object
  const [uid, setUid] = useState(null); // convenience
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const didInit = useRef(false);
  console.log("[AuthProvider] render");

  useEffect(() => {
    //console.log("[Auth] subscribing to onAuthStateChanged");
    // Subscribe to auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      //console.log("[Auth] onAuthStateChanged fired. user =", firebaseUser);

      try {
        setAuthError(null);

        // If there's no user yet, create an anonymous one
        if (!firebaseUser) {
          //console.log("[Auth] signing in anonymously...");
          const cred = await signInAnonymously(auth);
          firebaseUser = cred.user;
          //console.log("[Auth] anonymous sign-in done. uid =", firebaseUser.uid);
        }

        setUser(firebaseUser);
        setUid(firebaseUser.uid);

        //ensure firestore user doc exists
        //await ensureUserDoc(firebaseUser);
        ensureUserDoc(firebaseUser).catch((e) => {
          console.error("ensureUserDoc failed:", e);
        });
      } catch (err) {
        console.error("Auth init error:", err);
        setAuthError(err);
        setUser(null);
        setUid(null);
      } finally {
        //console.log("[Auth] setting loading false");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, uid, loading, authError }),
    [user, uid, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
