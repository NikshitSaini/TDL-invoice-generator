import React from 'react';

export default function InvoiceViewModal({ invoice, onClose, onViewFull }) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col border border-outline-variant/10 max-h-[90vh]">
        <header className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold font-headline">Invoice Details</h2>
            <span className="text-xs font-mono bg-surface-container-low px-2 py-0.5 rounded text-on-surface-variant">
              {invoice.invoiceNumber}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Client</p>
                <p className="font-bold">{invoice.clientName}</p>
                <p className="text-sm text-on-surface-variant">{invoice.clientAddress}</p>
                {invoice.clientGST && <p className="text-xs text-on-surface-variant font-mono mt-1">GST: {invoice.clientGST}</p>}
              </section>
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize bg-primary-container/20 text-primary">
                  {invoice.status}
                </span>
              </section>
            </div>
            <div className="space-y-4">
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Invoice Date</p>
                <p className="text-sm font-semibold">{invoice.invoiceDate}</p>
              </section>
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Created By</p>
                <p className="text-sm">{invoice.createdBy}</p>
              </section>
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Amount</p>
                <p className="text-2xl font-black text-[#6C47FF] font-mono">₹{Number(invoice.grandTotal || 0).toLocaleString('en-IN')}</p>
              </section>
            </div>
          </div>

          <section className="pt-4 border-t border-outline-variant/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Line Items</p>
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-bold">
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {invoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold">{item.description}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono">₹{Number(item.total).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {invoice.notes && (
            <section className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Notes</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">{invoice.notes}</p>
            </section>
          )}
        </div>

        <footer className="p-6 border-t border-outline-variant/10 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
            Close
          </button>
          <button onClick={onViewFull} className="flex-1 py-3 bg-[#6C47FF] text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            View & Download
          </button>
        </footer>
      </div>
    </div>
  );
}
