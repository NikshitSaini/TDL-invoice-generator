import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Checks if a user profile exists in Firestore.
 * @param {string} uid - Firebase Auth User Node ID
 * @returns {boolean} - true if exists
 */
export async function checkUserProfileExists(uid) {
  if (!uid) return false;
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}

/**
 * Creates a new user profile document in Firestore.
 * @param {string} uid - Firebase Auth User Node ID
 * @param {Object} data - Profile Data {firstName, lastName, email, mobile}
 */
export async function createUserProfile(uid, data) {
  if (!uid) throw new Error("No UID provided");

  // Generate a random 6-digit User ID
  const userId = Math.floor(100000 + Math.random() * 900000).toString();

  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    mobile: data.mobile || '',
    userId: userId,
    createdAt: new Date().toISOString(),
  });
}
