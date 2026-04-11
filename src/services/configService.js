import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetches the global application configuration from Firestore.
 * Route: config/main
 * @returns {Object} Global Configuration Map
 */
export async function getConfig() {
  const configRef = doc(db, 'config', 'main');
  const configSnap = await getDoc(configRef);
  
  if (configSnap.exists()) {
    return configSnap.data();
  } else {
    // Return empty defaults if document doesn't exist yet
    return {
      companyName: '',
      logoUrl: '',
      gstin: '',
      address: '',
      website: '',
      phone: '',
      bankDetails: '',
      qrCodeUrl: ''
    };
  }
}

/**
 * Updates the global application configuration in Firestore using Super Admin Auth.
 * @param {Object} newConfig - New subset of config parameters to update/merge.
 * @param {string} password - Input Super Admin Password.
 */
export async function updateConfig(newConfig, password) {
  const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD;

  if (!superAdminPassword) {
    throw new Error('Server Environment Error: VITE_SUPER_ADMIN_PASSWORD is not configured.');
  }

  if (password !== superAdminPassword) {
    throw new Error('Unauthorized: Invalid Super Admin password');
  }

  const configRef = doc(db, 'config', 'main');
  
  // Using merge: true prevents wiping out fields that aren't provided in newConfig
  await setDoc(configRef, newConfig, { merge: true });
}
