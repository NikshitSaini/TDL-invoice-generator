import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function InvoiceHistoryModal({ invoiceId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'invoiceLogs'),
          where('invoiceId', '==', invoiceId),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching logs:", err);
        // Fallback if index not created
        try {
          const snap = await getDocs(collection(db, 'invoiceLogs'));
          const filtered = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(l => l.invoiceId === invoiceId)
            .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
          setLogs(filtered);
        } catch (e2) {}
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col border border-outline-variant/10 max-h-[80vh]">
        <header className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10 shrink-0">
          <h2 className="text-lg font-bold font-headline text-on-surface">Invoice History</h2>
          <button onClick={onClose} className="p-1 text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              <p className="text-sm font-medium text-on-surface-variant">Loading audit logs…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <span className="material-symbols-outlined text-outline text-4xl">history</span>
              <p className="text-sm font-semibold text-on-surface">No history found</p>
              <p className="text-xs text-on-surface-variant px-10">Any changes made to this invoice will be recorded here.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-outline-variant/20 ml-3 pl-6 space-y-8 py-2">
              {logs.map((log) => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white"></span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mb-1">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('en-IN') : 'Just now'}
                    </span>
                    <p className="text-sm font-bold text-on-surface">{log.action}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Updated by <span className="font-semibold text-[#6C47FF]">{log.userEmail}</span>
                    </p>
                    {log.details && (
                      <p className="mt-2 text-[11px] bg-surface-container-low p-2 rounded-lg text-on-surface-variant italic leading-relaxed">
                        "{log.details}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-outline-variant/10 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
