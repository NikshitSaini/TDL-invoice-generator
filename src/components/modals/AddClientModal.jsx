import React, { useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

export default function AddClientModal({ onClose, onClientAdded }) {
  const nameRef = useRef();
  const gstinRef = useRef();
  const addressRef = useRef();
  const [loading, setLoading] = useState(false);

  // Generate 6-digit alphanumeric client ID
  function generateClientId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const clientData = {
      name: nameRef.current.value,
      gstin: gstinRef.current.value || '',
      address: addressRef.current.value,
      clientId: generateClientId(),
      createdAt: serverTimestamp(),
    };

    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, 'clients'), clientData);
      toast.success("Client added successfully!");
      if (onClientAdded) onClientAdded({ id: docRef.id, ...clientData });
      onClose();
    } catch (err) {
      toast.error("Failed to add client");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-outline-variant/10">
        <header className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10">
          <h2 className="text-lg font-bold font-headline">Add New Client</h2>
          <button onClick={onClose} className="p-1 text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">Client Name</label>
            <input 
              type="text" 
              ref={nameRef}
              required
              placeholder="e.g. Acme Corp" 
              className="w-full bg-surface-container-low border-none rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">GST (Optional)</label>
            <input 
              type="text" 
              ref={gstinRef}
              placeholder="e.g. 27AAAAA0000A1Z5" 
              className="w-full bg-surface-container-low border-none rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">Client Address</label>
            <textarea 
              ref={addressRef}
              required
              rows={3}
              placeholder="Full billing address..." 
              className="w-full bg-surface-container-low border-none rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
