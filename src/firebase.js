import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Some networks/browsers (proxies, ad blockers, certain sandboxed or
// corporate environments) can't establish Firestore's default WebChannel
// streaming transport — the SDK then retries forever instead of falling
// back, leaving onSnapshot listeners stuck and throwing "the user aborted a
// request". Forcing long-polling avoids that failure mode entirely.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

// Creates a new Firebase Auth account for a worker without disturbing the
// admin's own signed-in session. createUserWithEmailAndPassword() on the
// primary app would sign the admin out and into the new worker account, so
// this runs it on a throwaway secondary app instance instead.
export async function createWorkerAuthAccount(email, password) {
  const secondaryApp = initializeApp(
    firebaseConfig,
    `Secondary-${Date.now()}`,
  );
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password,
    );
    return cred.user.uid;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}
