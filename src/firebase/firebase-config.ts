// src/firebase-config.ts

import { 
  initializeApp, 
} from "firebase/app";

import type { // Imported as a type only
  FirebaseApp 
} from "firebase/app";

import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
} from "firebase/auth";

import type { // Imported as types only
  Auth, 
  User, 
  UserCredential, 
  AuthError 
} from "firebase/auth";


const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// 2. Initialize Firebase App and Auth
const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// 3. Google Auth Provider Instance
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();


// --- 4. Google Sign-In Function ---
// Returns a Promise that resolves to the authenticated Firebase User object.
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    
    // The signed-in user info (type: User)
    const user: User = result.user;
    
    // Optional: Get token/credential info if needed for backend or accessing Google APIs
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token: string | undefined = credential?.accessToken; // token is either string or undefined

    console.log("Google Sign-In Successful:", user.displayName, user.email);
    
    return user; 
  } catch (error) {
    // Type assertion to handle specific Firebase Auth errors
    const authError = error as AuthError;
    
    // Handle the case where the user closes the popup
    if (authError.code === 'auth/popup-closed-by-user') {
      console.warn("Sign-in popup closed by user.");
    } else {
      console.error("Google Sign-In Error:", authError.code, authError.message);
    }
    
    throw authError; // Re-throw the error for component-level error handling
  }
};


// --- 5. Sign Out Function ---
// Returns a Promise that resolves when the user is signed out.
export const logout = (): Promise<void> => {
  return signOut(auth);
};