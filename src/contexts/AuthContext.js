import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setConnectionError(false);
    // If Firestore is misconfigured (e.g. the database doesn't exist yet),
    // onSnapshot never calls either callback — it just retries forever
    // instead of erroring. Without this timeout the app would be stuck on
    // a loading spinner with no explanation of why.
    const timeoutId = setTimeout(() => setConnectionError(true), 8000);
    const unsubProfile = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        clearTimeout(timeoutId);
        setProfile(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      () => {
        clearTimeout(timeoutId);
        setProfile(null);
        setLoading(false);
      },
    );
    return () => {
      clearTimeout(timeoutId);
      unsubProfile();
    };
  }, [user]);

  const signIn = useCallback(
    (email, password) => signInWithEmailAndPassword(auth, email, password),
    [],
  );

  const signOutUser = useCallback(() => signOut(auth), []);

  const resetPassword = useCallback(
    (email) => sendPasswordResetEmail(auth, email),
    [],
  );

  // One-time bootstrap: registers whoever holds the allowlisted admin email
  // in firestore.rules as the very first admin. If the email isn't
  // allowlisted, Firestore rejects the profile write and we roll back the
  // orphaned Auth account so the user isn't left in a half-registered state.
  const registerFirstAdmin = useCallback(async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        role: "admin",
        canEditJobs: true,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: cred.user.uid,
      });
    } catch (err) {
      await deleteUser(cred.user).catch(() => {});
      await signOut(auth).catch(() => {});
      throw err;
    }
  }, []);

  const role = profile?.role || null;
  const active = profile?.active !== false;
  const canEditJobs = role === "admin" || (role === "worker" && !!profile?.canEditJobs);

  const value = {
    user,
    profile,
    role,
    active,
    canEditJobs,
    loading: loading && !connectionError,
    connectionError,
    signIn,
    signOutUser,
    resetPassword,
    registerFirstAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
