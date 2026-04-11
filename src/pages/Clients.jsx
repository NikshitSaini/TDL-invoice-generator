import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────
const COLORS = [
  'bg-primary-fixed text-primary',
  'bg-secondary-fixed text-secondary',
  'bg-tertiary-fixed text-tertiary',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
];
function avatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % COLORS.length;
  return COLORS[idx];
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', gstin: '', address: '', website: '', notes: '',
};

// ── Shared Field input — must be OUTSIDE ClientModal to preserve focus ────────
function Field({ label, fieldKey, type = 'text', placeholder = '', form, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={form[fieldKey] || ''}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all"
      />
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function ClientModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState(client ? { ...client } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const isEdit = !!client?.id;

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Client name is required'); return; }
    try {
      setSaving(true);
      if (isEdit) {
        await updateDoc(doc(db, 'clients', client.id), {
          ...form,
          updatedAt: serverTimestamp(),
        });
        toast.success('Client updated!');
        onSaved({ id: client.id, ...form });
      } else {
        const ref = await addDoc(collection(db, 'clients'), {
          ...form,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success('Client added!');
        onSaved({ id: ref.id, ...form });
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save client. Please try again.');
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg border border-outline-variant/10 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
          <div>
            <h2 className="text-lg font-bold font-headline">{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
            <p className="text-sm text-on-surface-variant">
              {isEdit ? 'Update client details.' : 'Add a new client to your Teraforge workspace.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Client / Company Name *" fieldKey="name" placeholder="e.g. Acme Corp" form={form} onChange={set} />
            </div>
            <Field label="Email" fieldKey="email" type="email" placeholder="billing@company.com" form={form} onChange={set} />
            <Field label="Phone" fieldKey="phone" type="tel" placeholder="+91 98765 43210" form={form} onChange={set} />
            <Field label="GSTIN" fieldKey="gstin" placeholder="22AAAAA0000A1Z5" form={form} onChange={set} />
            <Field label="Website" fieldKey="website" placeholder="https://company.com" form={form} onChange={set} />
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">Address</label>
              <textarea
                value={form.address || ''}
                onChange={e => set('address', e.target.value)}
                placeholder="Street, City, State, PIN"
                rows={2}
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any internal notes about this client…"
                rows={2}
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant rounded-xl text-on-surface font-semibold hover:bg-surface-container-low transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-primary-container text-on-primary-container rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
              {saving
                ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Saving…</>
                : <><span className="material-symbols-outlined text-sm">{isEdit ? 'save' : 'person_add'}</span> {isEdit ? 'Save Changes' : 'Add Client'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ client, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 w-full max-w-sm border border-outline-variant/10">
        <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-4 mx-auto">
          <span className="material-symbols-outlined text-error text-2xl">person_remove</span>
        </div>
        <h2 className="text-xl font-bold font-headline text-center mb-2">Delete Client?</h2>
        <p className="text-sm text-on-surface-variant text-center mb-6">
          This will permanently delete <strong>{client?.name || 'this client'}</strong> and all their associated data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold hover:bg-surface-container-low transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Client Card ───────────────────────────────────────────────────────────────
function ClientCard({ client, invoiceCount, onEdit, onDelete, onViewInvoices }) {
  const initial = (client.name || '?').charAt(0).toUpperCase();
  const ac = avatarColor(client.name);

  return (
    <div className="group bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Top row */}
      <div className="flex justify-between items-start mb-5">
        <div className={`w-14 h-14 rounded-xl font-headline font-bold text-xl flex items-center justify-center ${ac}`}>
          {initial}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(client)} title="Edit"
            className="p-2 text-outline hover:text-primary hover:bg-primary-container/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
          <button onClick={() => onDelete(client)} title="Delete"
            className="p-2 text-outline hover:text-error hover:bg-error-container/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>

      {/* Client info */}
      <div className="flex-1 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface truncate">{client.name}</h3>
          {client.email && (
            <p className="text-sm text-on-surface-variant truncate">{client.email}</p>
          )}
        </div>

        <div className="space-y-2 pt-1">
          {client.phone && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-base">call</span>
              <span className="text-sm text-on-surface-variant">{client.phone}</span>
            </div>
          )}
          {client.gstin && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-base">fingerprint</span>
              <span className="text-sm text-on-surface-variant font-mono">{client.gstin}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-outline text-base mt-0.5">location_on</span>
              <span className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">{client.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-5 pt-4 flex items-center justify-between border-t border-outline-variant/10 group-hover:border-primary-container/20 transition-colors">
        <button onClick={() => onViewInvoices(client)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline underline-offset-2">
          <span className="material-symbols-outlined text-base">description</span>
          {invoiceCount > 0 ? `${invoiceCount} Invoice${invoiceCount > 1 ? 's' : ''}` : 'No invoices'}
        </button>
        <Link
          to={`/invoices/create`}
          state={{ clientId: client.id }}
          className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary-container/10"
        >
          <span className="material-symbols-outlined text-sm">add</span> Invoice
        </Link>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Clients() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients]     = useState([]);
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [toDelete, setToDelete]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  // Fetch clients + invoices together
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [cSnap, iSnap] = await Promise.all([
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'invoices')),
      ]);
      setClients(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setInvoices(iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Invoice count per client
  const invoiceCountMap = useMemo(() => {
    const map = {};
    invoices.forEach(inv => {
      if (inv.clientId) map[inv.clientId] = (map[inv.clientId] || 0) + 1;
    });
    return map;
  }, [invoices]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.gstin || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  // Add / Edit save callback — optimistic update
  function handleSaved(saved) {
    setClients(prev => {
      const exists = prev.find(c => c.id === saved.id);
      if (exists) return prev.map(c => c.id === saved.id ? saved : c);
      return [saved, ...prev];
    });
  }

  // Open Edit
  function openEdit(client) {
    setEditClient(client);
    setShowModal(true);
  }

  // Close modal
  function closeModal() {
    setShowModal(false);
    setEditClient(null);
  }

  // Delete
  async function confirmDelete() {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'clients', toDelete.id));
      toast.success('Client deleted');
      setClients(prev => prev.filter(c => c.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      toast.error('Failed to delete client');
    } finally {
      setDeleting(false);
    }
  }

  // View invoices for a specific client
  function viewClientInvoices(client) {
    navigate('/invoices', { state: { clientId: client.id, clientName: client.name } });
  }

  // Skeleton card
  const Skeleton = () => (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="w-14 h-14 rounded-xl bg-surface-container" />
        <div className="w-16 h-6 rounded-full bg-surface-container" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-36 bg-surface-container rounded" />
        <div className="h-4 w-48 bg-surface-container rounded" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-32 bg-surface-container rounded" />
        <div className="h-3 w-40 bg-surface-container rounded" />
      </div>
    </div>
  );

  return (
    <AppLayout>
      {/* Modals */}
      {showModal && (
        <ClientModal
          client={editClient}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
      {toDelete && (
        <DeleteModal
          client={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
          deleting={deleting}
        />
      )}

      <main className="max-w-screen-xl mx-auto px-6 md:px-10 py-10 flex-1 w-full space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold font-headline tracking-tight">My Clients</h1>
              <span className="bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full text-sm font-bold">
                {loading ? '…' : clients.length}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm">
              Manage client profiles and billing details for Teraforge Digital Lab.
            </p>
          </div>
          <button
            onClick={() => { setEditClient(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Add New Client
          </button>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients',    value: clients.length,                     icon: 'group',           cls: 'text-[#6C47FF]' },
            { label: 'Active (invoiced)', value: Object.keys(invoiceCountMap).length, icon: 'how_to_reg',      cls: 'text-emerald-600' },
            { label: 'Total Invoices',   value: invoices.length,                    icon: 'description',     cls: 'text-[#6C47FF]' },
            { label: 'New This Month',   value: clients.filter(c => {
                const d = c.createdAt?.toDate?.();
                if (!d) return false;
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length,                                                             icon: 'person_add_alt',  cls: 'text-amber-600' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm flex flex-col gap-1.5">
              <span className={`material-symbols-outlined text-xl ${s.cls}`}>{s.icon}</span>
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{s.label}</p>
              {loading
                ? <div className="animate-pulse h-6 w-10 bg-surface-container rounded" />
                : <p className={`text-xl font-extrabold font-headline ${s.cls}`}>{s.value}</p>}
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or GSTIN…"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          <span className="text-sm text-on-surface-variant">
            {filtered.length} of {clients.length}
          </span>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-outline">group</span>
            <p className="text-lg font-bold text-on-surface">
              {search ? 'No clients match your search' : 'No clients yet'}
            </p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              {search
                ? 'Try a different name, email, or GSTIN.'
                : 'Add your first client to start creating invoices for them.'}
            </p>
            {!search && (
              <button
                onClick={() => { setEditClient(null); setShowModal(true); }}
                className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Add Your First Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                invoiceCount={invoiceCountMap[client.id] || 0}
                onEdit={openEdit}
                onDelete={setToDelete}
                onViewInvoices={viewClientInvoices}
              />
            ))}

            {/* Add new tile */}
            <button
              onClick={() => { setEditClient(null); setShowModal(true); }}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-primary-container/5 text-on-surface-variant hover:text-primary transition-all group min-h-[240px]"
            >
              <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container/10 transition-colors mb-3">
                <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add</span>
              </div>
              <p className="font-bold">Add New Client</p>
              <p className="text-sm mt-1 text-center opacity-70">Grow your client portfolio</p>
            </button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
