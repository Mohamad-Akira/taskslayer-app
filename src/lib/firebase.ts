import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Initialize GoogleAuth on mobile native platforms
if (Capacitor.isNativePlatform()) {
  try {
    GoogleAuth.initialize({
      clientId: '438572796168-4hv18kkr9e83q3nounh2sph18g14l1jv.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
  } catch (err) {
    console.warn('GoogleAuth initialization notice:', err);
  }
}

// Test Firestore connection gracefully without throwing uncaught errors when offline
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.message?.includes('Could not reach Cloud Firestore')) {
      console.info('Firestore is operating in offline mode or waiting for connection.');
    }
  }
}
testConnection();

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const googleSignIn = async (): Promise<{ user: User } | null> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken;
      if (!idToken) {
        throw new Error('No ID Token received from Google Auth.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      return { user: result.user };
    } else {
      const result = await signInWithPopup(auth, provider);
      return { user: result.user };
    }
  } catch (error: any) {
    console.warn('Google Sign-In notice:', error?.message || error);
    throw error;
  }
};

const appleProvider = new OAuthProvider('apple.com');

export const appleSignIn = async (): Promise<{ user: User } | null> => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return { user: result.user };
  } catch (error: any) {
    console.warn('Apple Sign-In notice:', error?.message || error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name?: string): Promise<{ user: User }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    return { user: userCredential.user };
  } catch (error: any) {
    console.warn('Email Sign-Up notice:', error?.message || error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string): Promise<{ user: User }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { user: userCredential.user };
  } catch (error: any) {
    console.warn('Email Sign-In notice:', error?.message || error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (error: any) {
    console.warn('Sign-out notice:', error?.message || error);
    throw error;
  }
};

// Authenticated fetch helper that attaches the Firebase ID token (Bearer header)
// so protected server endpoints (Gemini AI) can verify the caller identity.
export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
