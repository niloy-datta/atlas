import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await sendEmailVerification(credential.user);
  } catch (error) {
    console.warn("Failed to send initial verification email:", error);
  }
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup was blocked or unsupported, fallback to redirect
    if (error?.code === "auth/popup-blocked" || error?.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, googleProvider);
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult) return redirectResult.user;
    }
    throw error;
  }
}

export async function checkRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch {
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function sendVerificationEmail(user?: User): Promise<void> {
  const targetUser = user || auth.currentUser;
  if (!targetUser) throw new Error("No authenticated user to verify");
  await sendEmailVerification(targetUser);
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken(forceRefresh);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function onTokenChange(callback: (token: string | null) => void): () => void {
  return onIdTokenChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      callback(token);
    } else {
      callback(null);
    }
  });
}
