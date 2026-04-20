import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, getDocs, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import AddClientModal from '../components/modals/AddClientModal';
import { useConfig } from '../contexts/ConfigContext';
import toast from 'react-hot-toast';

const LOGO = 'https://teraforgedigitallab.com/images/logo.svg';
const GST_RATE = 0.18;

// ── helpers ──────────────────────────────────────────────────────────────────
function genInvoiceNumber() {
  const now = new Date();
  const yy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TDL-${yy}${mm}-${rand}`;
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

const EMPTY_ITEM = () => ({ id: crypto.randomUUID(), description: '', qty: 1, unitPrice: '' });

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreateInvoice() {
  const { currentUser, logout } = useAuth();
  const { config: currentConfig } = useConfig();
  const navigate = useNavigate();

  // Form state
  const [clients, setClients]           = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(genInvoiceNumber());
  const [invoiceDate, setInvoiceDate]   = useState(today());
  const [notes, setNotes]               = useState('');
  const [gstEnabled, setGstEnabled]     = useState(true);
  const [items, setItems]               = useState([EMPTY_ITEM()]);
  const [saving, setSaving]             = useState(false);
  const [status, setStatus]             = useState('Pending'); // Default status
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Fetch clients from Firestore
  const fetchClients = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'clients'), orderBy('createdAt', 'desc')));
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      // fallback unordered
      try {
        const snap = await getDocs(collection(db, 'clients'));
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        toast.error('Could not load clients');
      }
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Item handlers ──────────────────────────────────────────────────────────
  function addItem() {
    setItems(prev => [...prev, EMPTY_ITEM()]);
  }

  function removeItem(id) {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  }

  function updateItem(id, field, value) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  // ── Calculations ───────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => {
    const qty  = Number(i.qty || 0);
    const unit = Number(i.unitPrice || 0);
    return sum + qty * unit;
  }, 0);

  const gstAmount  = gstEnabled ? subtotal * GST_RATE : 0;
  const grandTotal = subtotal + gstAmount;

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e, saveAsDraft = false) {
    e?.preventDefault();

    const finalStatus = saveAsDraft ? 'Draft' : status;

    // Validation
    if (!selectedClient) { toast.error('Please select a client'); return; }
    const validItems = items.filter(i => i.description.trim() && Number(i.qty) > 0);
    if (validItems.length === 0) { toast.error('Add at least one line item with a description'); return; }

    const client = clients.find(c => c.id === selectedClient);

    const invoiceData = {
      invoiceNumber,
      invoiceDate,
      status: finalStatus,
      clientId:   selectedClient,
      clientName: client?.name || client?.companyName || selectedClient,
      clientEmail: client?.email || '',
      clientGST:  client?.gstin || '',
      clientAddress: client?.address || '',
      items: validItems.map(i => ({
        description: i.description,
        qty:  Number(i.qty),
        unitPrice: Number(i.unitPrice || 0),
        total: Number(i.qty) * Number(i.unitPrice || 0),
      })),
      subtotal,
      gstRate:   gstEnabled ? GST_RATE : 0,
      gstAmount,
      grandTotal,
      notes,
      
      // Metadata
      createdBy: currentUser?.email,
      createdById: currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Snapshot config so old invoices remain unaffected by future changes
      configSnapshot: {
        companyName: currentConfig?.companyName || 'Teraforge Digital Lab LLP',
        address: currentConfig?.address || '',
        phone: currentConfig?.phone || '',
        email: currentConfig?.email || '',
        website: currentConfig?.website || '',
        gstin: currentConfig?.gstin || '',
        bankDetails: currentConfig?.bankDetails || '',
        qrCodeUrl: currentConfig?.qrCodeUrl || '',
        logoUrl: currentConfig?.logoUrl || '',
      }
    };

    try {
      setSaving(true);
      const ref = await addDoc(collection(db, 'invoices'), invoiceData);
      toast.success(saveAsDraft ? 'Saved as draft!' : 'Invoice created successfully!');
      // Redirect to the public URL for the newly created invoice
      navigate(`/${ref.id}`); 
    } catch (err) {
      console.error(err);
      toast.error('Failed to save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>

      <main className="max-w-screen-lg mx-auto px-6 md:px-10 py-10 flex-1 w-full">

        {/* Page Header */}
        <div className="mb-8">
          <Link to="/invoices" className="inline-flex items-center text-sm font-semibold text-primary hover:underline mb-3 gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Invoices
          </Link>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-1">Create Invoice</h1>
          <p className="text-on-surface-variant text-sm">Generate a new invoice for a client of Teraforge Digital Lab.</p>
        </div>

        <form onSubmit={e => handleSubmit(e, false)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Main Form ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Invoice Meta */}
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <h2 className="text-lg font-bold font-headline mb-5">Invoice Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Invoice Number</label>
                  <div className="relative">
                    <input
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all"
                    />
                    <button type="button" onClick={() => setInvoiceNumber(genInvoiceNumber())}
                      title="Regenerate"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-primary transition-colors rounded">
                      <span className="material-symbols-outlined text-base">refresh</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Client Selection */}
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <h2 className="text-lg font-bold font-headline">Client Details</h2>
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-primary-container text-primary-container rounded-lg font-semibold text-sm hover:bg-primary-container/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  Add New Client
                </button>
              </div>

              {showAddClientModal && (
                <AddClientModal 
                  onClose={() => setShowAddClientModal(false)} 
                  onClientAdded={(newClient) => {
                    setClients(prev => [newClient, ...prev]);
                    setSelectedClient(newClient.id);
                  }}
                />
              )}

              {loadingClients ? (
                <div className="animate-pulse h-12 bg-surface-container rounded-lg" />
              ) : (
                <div className="relative">
                  <select
                    value={selectedClient}
                    onChange={e => setSelectedClient(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 appearance-none focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all text-sm"
                  >
                    <option value="" disabled>Select a client…</option>
                    {clients.length === 0 && (
                      <option disabled>No clients yet — add one first</option>
                    )}
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.companyName || c.email || c.id}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
              )}

              {/* Show selected client details */}
              {selectedClient && (() => {
                const c = clients.find(x => x.id === selectedClient);
                if (!c) return null;
                return (
                  <div className="mt-4 p-4 bg-surface-container-low rounded-xl text-sm space-y-1">
                    {c.email    && <p className="text-on-surface-variant"><span className="font-semibold text-on-surface">Email:</span> {c.email}</p>}
                    {c.gstin    && <p className="text-on-surface-variant"><span className="font-semibold text-on-surface">GSTIN:</span> {c.gstin}</p>}
                    {c.address  && <p className="text-on-surface-variant"><span className="font-semibold text-on-surface">Address:</span> {c.address}</p>}
                  </div>
                );
              })()}
            </section>

            {/* Line Items */}
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <h2 className="text-lg font-bold font-headline mb-5">Line Items</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                      <th className="pb-2 pl-3 w-8">#</th>
                      <th className="pb-2">Description</th>
                      <th className="pb-2 w-28">Unit Price (₹)</th>
                      <th className="pb-2 w-20 text-center">Qty</th>
                      <th className="pb-2 w-28 text-right pr-3">Total</th>
                      <th className="pb-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const rowTotal = Number(item.qty || 0) * Number(item.unitPrice || 0);
                      const bg = idx % 2 === 0 ? 'bg-surface-container-low' : 'bg-white';
                      return (
                        <tr key={item.id} className="group">
                          <td className={`${bg} py-3 pl-3 rounded-l-lg text-center text-sm font-medium text-on-surface-variant`}>{idx + 1}</td>
                          <td className={`${bg} py-3 pr-2`}>
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Item description"
                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-on-surface placeholder:text-outline"
                              required
                            />
                          </td>
                          <td className={`${bg} py-3 pr-2`}>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-mono text-on-surface placeholder:text-outline"
                            />
                          </td>
                          <td className={`${bg} py-3`}>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={e => updateItem(item.id, 'qty', e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-mono text-center text-on-surface"
                            />
                          </td>
                          <td className={`${bg} py-3 text-right pr-3 text-sm font-bold font-mono text-on-surface`}>
                            ₹{fmt(rowTotal)}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className={`p-1 text-outline hover:text-error transition-colors rounded ${items.length === 1 ? 'opacity-20 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mt-4 flex items-center gap-2 px-4 py-2 border-2 border-[#6C47FF] text-[#6C47FF] rounded-lg font-bold text-sm hover:bg-primary-container/5 transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add Line Item
              </button>
            </section>

            {/* Notes */}
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <h2 className="text-lg font-bold font-headline mb-4">Notes & Terms</h2>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Payment terms, bank details, or any special instructions…"
                rows={4}
                className="w-full bg-surface-container-low border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all resize-none"
              />
            </section>
          </div>

          {/* ── RIGHT: Summary Sidebar ── */}
          <div className="space-y-5 lg:sticky lg:top-24 self-start">

            {/* Invoice Summary */}
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-md border border-outline-variant/10">
              <h2 className="text-base font-bold font-headline mb-5 text-on-surface-variant uppercase tracking-widest text-xs">Invoice Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center text-sm text-on-surface-variant">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-mono font-semibold">₹{fmt(subtotal)}</span>
                </div>

                {/* GST toggle */}
                <div className="flex justify-between items-center text-sm">
                  <button
                    type="button"
                    onClick={() => setGstEnabled(v => !v)}
                    className="flex items-center gap-2 text-on-surface-variant font-medium hover:text-primary transition-colors"
                  >
                    <span className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${gstEnabled ? 'bg-primary' : 'bg-surface-container-high'}`}>
                      <span className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${gstEnabled ? 'translate-x-4' : ''}`}></span>
                    </span>
                    GST (18%)
                  </button>
                  <span className="font-mono font-semibold text-on-surface-variant">
                    {gstEnabled ? `₹${fmt(gstAmount)}` : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/15">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Grand Total</span>
                  <span className="text-2xl font-extrabold text-[#6C47FF] font-mono">₹{fmt(grandTotal)}</span>
                </div>
              </div>

              {/* Status selector */}
              <div className="mt-5 pt-4 border-t border-outline-variant/15">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Status</label>
                <div className="flex gap-2">
                  {['Pending', 'Draft'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors border
                        ${status === s ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container-high'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Primary Action */}
              <button
                type="submit"
                disabled={saving}
                className="mt-5 w-full py-3.5 bg-primary-container text-on-primary-container rounded-xl font-bold text-base shadow-lg shadow-primary-container/20 hover:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving
                  ? <><span className="animate-spin material-symbols-outlined text-base">progress_activity</span> Creating…</>
                  : <><span className="material-symbols-outlined text-base">send</span> Create Invoice</>
                }
              </button>

              {/* Save as Draft */}
              <button
                type="button"
                onClick={e => handleSubmit(null, true)}
                disabled={saving}
                className="mt-2 w-full py-2.5 bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">save</span> Save as Draft
              </button>

              <p className="text-center text-xs text-on-surface-variant mt-3">
                Invoice will be saved to your Firestore records.
              </p>
            </section>

            {/* Company Info */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-5 space-y-2">
              <img 
                src={currentConfig?.logoUrl || LOGO} 
                alt={currentConfig?.companyName || "Teraforge Digital Lab"} 
                className="h-6 w-auto" 
                onError={e => { e.target.src = LOGO; }} 
              />
              <p className="text-xs font-bold text-on-surface">{currentConfig?.companyName || "Teraforge Digital Lab"}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {currentConfig?.address || "End-to-end solutions from MVP development & AI to web & app — your single partner from ideation to launch."}
              </p>
            </div>

          </div>
        </form>
      </main>

    </AppLayout>
  );
}
