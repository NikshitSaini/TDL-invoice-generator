import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, getDocs, deleteDoc, doc, orderBy, query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import InvoiceViewModal from '../components/modals/InvoiceViewModal';
import InvoiceHistoryModal from '../components/modals/InvoiceHistoryModal';
import { addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';


const LOGO = 'https://teraforgedigitallab.com/images/logo.svg';
const PAGE_SIZE = 6;

const STATUS_STYLES = {
  'Created':          { dot: 'bg-slate-400',    badge: 'bg-slate-100 text-slate-600',   color: '#64748b' },
  'Sent':             { dot: 'bg-purple-400',   badge: 'bg-purple-50 text-purple-600',  color: '#c084fc' },
  'Approved':         { dot: 'bg-blue-400',     badge: 'bg-blue-50 text-blue-600',    color: '#60a5fa' },
  'Paid':             { dot: 'bg-green-400',    badge: 'bg-green-50 text-green-600',   color: '#4ade80' },
  'Overdue':          { dot: 'bg-orange-500',   badge: 'bg-orange-100 text-orange-700', color: '#f97316' },
  'Rejected':         { dot: 'bg-red-300',      badge: 'bg-red-50 text-red-400',      color: '#fca5a5' },
  'Lost Cause':       { dot: 'bg-red-800',      badge: 'bg-red-900/10 text-red-800',    color: '#991b1b' },
  'Draft':            { dot: 'bg-slate-300',    badge: 'bg-slate-100 text-slate-500',   color: '#cbd5e1' },
};
function statusStyle(s) { return STATUS_STYLES[s] || STATUS_STYLES.Created; }

function formatINR(v) {
  return '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(val) {
  if (!val) return '—';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ invoice, onCancel, onConfirm, deleting }) {
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-8 w-full max-w-sm border border-outline-variant/10">
        <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-4 mx-auto">
          <span className="material-symbols-outlined text-error text-2xl">delete_forever</span>
        </div>
        <h2 className="text-xl font-bold font-headline text-center mb-2">Delete Invoice?</h2>
        <p className="text-sm text-on-surface-variant text-center mb-6">
          This action requires <strong>Super Admin Password</strong>.
        </p>
        
        <div className="space-y-4 mb-6">
          <input 
            type="password" 
            placeholder="Super Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl p-3.5 focus:ring-2 focus:ring-error/20"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold hover:bg-surface-container-low transition-colors text-sm">Cancel</button>
          <button 
            onClick={() => onConfirm(password)} 
            disabled={deleting || !password} 
            className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {deleting ? <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Chip with Dropdown ────────────────────────────────────────────────
function StatusChip({ status, open, setOpen, onStatusChange }) {
  const ss = statusStyle(status);
  const options = Object.keys(STATUS_STYLES);

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ss.badge} hover:brightness-95 transition-all`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`}></span>
        {status || 'Created'}
        <span className="material-symbols-outlined text-[10px]">expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setOpen(false); }}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-outline-variant/10 z-[70] py-2 animate-in fade-in slide-in-from-top-2 max-h-56 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-surface-container-low flex items-center gap-2 transition-colors ${status === opt ? 'text-primary' : 'text-on-surface-variant'}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle(opt).dot}`}></span>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Invoice Card ─────────────────────────────────────────────────────────────
function InvoiceCard({ inv, onView, onDelete, onHistory, onStatusChange }) {
  const ss = statusStyle(inv.status);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm transition-all duration-200 group border border-outline-variant/5 relative ${statusOpen ? 'z-50' : 'z-10 hover:-translate-y-0.5 hover:shadow-md'}`}>
      <div className="flex justify-between items-start mb-5">
        <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md font-bold uppercase tracking-widest">
          {inv.invoiceNumber || `#${inv.id?.slice(0,8).toUpperCase()}`}
        </span>
        <StatusChip 
          status={inv.status} 
          open={statusOpen}
          setOpen={setStatusOpen}
          onStatusChange={(newStatus) => onStatusChange(inv.id, newStatus)} 
        />
      </div>

      <div className="mb-5">
        <h2 className="text-lg font-bold text-on-surface mb-0.5 truncate">{inv.clientName || inv.client || 'Unknown Client'}</h2>
        <p className="text-xs text-on-surface-variant font-medium">
          {inv.status === 'Draft' ? 'Created' : 'Issued'} on {fmtDate(inv.invoiceDate || inv.createdAt)}
        </p>
      </div>

      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-2xl font-headline font-extrabold text-[#6C47FF]">{formatINR(inv.grandTotal || inv.total)}</span>
        <span className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">INR</span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
        <div className="flex gap-2">
          <button
            onClick={() => onView(inv)}
            title="Quick View"
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">visibility</span>
          </button>
          <button
            onClick={() => onHistory(inv.id)}
            title="History"
            className="p-2 text-on-surface-variant hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">history</span>
          </button>
        </div>
        <button
          onClick={() => onDelete(inv)}
          title="Delete Invoice"
          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Invoices() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('All');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [toDelete, setToDelete]       = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [historyInvoiceId, setHistoryInvoiceId] = useState(null);

  // Fetch invoices from Firestore
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      // createdAt index might not exist yet — fall back to unordered
      try {
        const snap = await getDocs(collection(db, 'invoices'));
        let docsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Local sort to simulate orderBy('createdAt', 'desc')
        docsList.sort((a, b) => {
          const getMs = (inv) => {
            if (inv.createdAt?.toDate) return inv.createdAt.toDate().getTime();
            if (inv.createdAt) return new Date(inv.createdAt).getTime();
            if (inv.invoiceDate) return new Date(inv.invoiceDate).getTime();
            return 0;
          };
          return getMs(b) - getMs(a);
        });
        setInvoices(docsList);
      } catch (e2) {
        console.error(e2);
        toast.error('Failed to load invoices');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Computed stats
  const stats = React.useMemo(() => {
    let paid = 0, outstanding = 0, overdue = 0, drafts = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    invoices.forEach(inv => {
      const amt = Number(inv.grandTotal || inv.total || 0);
      const s = inv.status?.toLowerCase() || '';
      
      let invDate = new Date();
      if (inv.createdAt?.toDate) invDate = inv.createdAt.toDate();
      else if (inv.createdAt) invDate = new Date(inv.createdAt);
      else if (inv.invoiceDate) invDate = new Date(inv.invoiceDate);
      
      const isThisMonth = invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;

      if (s === 'paid' || s === 'payment received') {
        if (isThisMonth) paid += amt;
      }
      else if (s === 'overdue') overdue += amt;
      else if (s === 'draft') drafts++;
      else if (!['rejected', 'lost cause'].includes(s)) outstanding += amt;
    });

    return { paid, outstanding, overdue, drafts };
  }, [invoices]);

  // Filter + search
  const visible = React.useMemo(() => {
    let list = invoices;
    if (filter !== 'All') {
      list = list.filter(i => {
        const s = i.status?.toLowerCase() || '';
        if (filter === 'Paid') return s === 'paid';
        if (filter === 'Overdue') return s === 'overdue';
        if (filter === 'Draft') return s === 'draft';
        if (filter === 'Outstanding') return !['paid', 'overdue', 'draft', 'rejected', 'lost cause'].includes(s);
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.clientName || i.client || '').toLowerCase().includes(q) ||
        (i.invoiceNumber || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, filter, search]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const paginated  = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filter/search changes
  useEffect(() => setPage(1), [filter, search]);

  // Ensure page is clamped to valid range if list shrinks
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // Delete handler
  async function confirmDelete(password) {
    if (!toDelete) return;
    const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'TERAFORGE_ADMIN';
    
    if (password !== superAdminPassword) {
      return toast.error("Invalid Super Admin password");
    }

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'invoices', toDelete.id));
      toast.success('Invoice deleted successfully');
      setInvoices(prev => prev.filter(i => i.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  }

  // Status Change handler
  async function handleStatusChange(invoiceId, newStatus) {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv || inv.status === newStatus) return;

    const oldStatus = inv.status;

    try {
      // 1. Update Invoice status
      await updateDoc(doc(db, 'invoices', invoiceId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // 2. Add history log
      await addDoc(collection(db, 'invoiceLogs'), {
        invoiceId,
        action: `Status changed from ${oldStatus} to ${newStatus}`,
        userEmail: currentUser?.email || 'Unknown',
        timestamp: serverTimestamp(),
        details: `Manual status update from dashboard.`
      });

      // 3. Update local state
      setInvoices(prev => prev.map(item => 
        item.id === invoiceId ? { ...item, status: newStatus } : item
      ));

      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  }

  const Skeleton = () => (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 animate-pulse space-y-4">
      <div className="flex justify-between"><div className="h-5 w-28 bg-surface-container rounded"/><div className="h-5 w-16 bg-surface-container rounded-full"/></div>
      <div className="h-5 w-40 bg-surface-container rounded"/>
      <div className="h-4 w-24 bg-surface-container rounded"/>
      <div className="h-7 w-32 bg-surface-container rounded"/>
    </div>
  );

  const FILTERS = ['All', 'Outstanding', 'Paid', 'Overdue', 'Draft'];

  return (
    <AppLayout>
      {viewingInvoice && (
        <InvoiceViewModal 
          invoice={viewingInvoice} 
          onClose={() => setViewingInvoice(null)} 
          onViewFull={() => navigate(`/${viewingInvoice.id}`)}
        />
      )}

      {historyInvoiceId && (
        <InvoiceHistoryModal 
          invoiceId={historyInvoiceId} 
          onClose={() => setHistoryInvoiceId(null)} 
        />
      )}

      {toDelete && (
        <DeleteModal
          invoice={toDelete}
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
              <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">My Invoices</h1>
              <span className="bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full text-sm font-bold">
                {loading ? '…' : invoices.length}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm">Manage and track all client invoices for Teraforge Digital Lab.</p>
          </div>
          <Link
            to="/invoices/create"
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create Invoice
          </Link>
        </div>

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Outstanding', value: formatINR(stats.outstanding), cls: 'text-amber-700', border: '' },
            { label: 'Paid This Month', value: formatINR(stats.paid),   cls: 'text-emerald-700', border: 'border-l-4 border-emerald-500' },
            { label: 'Overdue',        value: formatINR(stats.overdue), cls: 'text-error',       border: '' },
            { label: 'Drafts',         value: loading ? '—' : stats.drafts, cls: 'text-on-surface', border: '' },
          ].map(s => (
            <div key={s.label} className={`bg-surface-container-low p-5 rounded-xl ${s.border}`}>
              <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-1">{s.label}</p>
              {loading
                ? <div className="animate-pulse h-6 w-24 bg-surface-container rounded"/>
                : <p className={`text-xl font-bold font-headline ${s.cls}`}>{s.value}</p>}
            </div>
          ))}
        </div>

        {/* ── Filter + Search ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors
                  ${filter === f ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
              >{f}</button>
            ))}
          </div>
          {/* Search */}
          <div className="relative ml-auto w-full sm:w-60">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              placeholder="Search invoices…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-full text-sm border-none focus:ring-2 focus:ring-primary-container/20 focus:bg-surface-container-lowest transition-all"
            />
          </div>
        </div>

        {/* ── Invoice Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
            <span className="material-symbols-outlined text-5xl text-outline">description</span>
            <p className="text-lg font-bold text-on-surface">{search || filter !== 'All' ? 'No matching invoices' : 'No invoices yet'}</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              {search || filter !== 'All'
                ? 'Try a different filter or search term.'
                : 'Create your first invoice to start tracking client payments.'}
            </p>
            {!search && filter === 'All' && (
              <Link to="/invoices/create" className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-sm">add</span> Create Invoice
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map(inv => (
                <InvoiceCard
                  key={inv.id}
                  inv={inv}
                  onView={inv => setViewingInvoice(inv)}
                  onDelete={setToDelete}
                  onHistory={id => setHistoryInvoiceId(id)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-on-surface-variant">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)} of {visible.length} invoice{visible.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-medium hover:bg-surface-container-high transition-colors disabled:opacity-40 text-sm"
                >Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3.5 py-2 rounded-lg font-medium text-sm ${n === page ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors'}`}
                  >{n}</button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-medium hover:bg-surface-container-high transition-colors disabled:opacity-40 text-sm"
                >Next</button>
              </div>
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
