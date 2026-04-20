import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';

import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Email/Password Registration
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Email/Password Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Sign-in
  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Forgot Password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Send Email Verification
  function verifyEmail() {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
  }

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    verifyEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

