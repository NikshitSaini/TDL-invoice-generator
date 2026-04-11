import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import OnboardingModal from '../components/OnboardingModal';

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function statusColor(s) {
  if (s === 'Paid' || s === 'Payment Received') return 'text-emerald-700 bg-emerald-50';
  if (s === 'Approved') return 'text-blue-600 bg-blue-50';
  if (s === 'Sent') return 'text-purple-600 bg-purple-50';
  if (s === 'Under Discussion') return 'text-yellow-600 bg-yellow-50';
  if (s === 'Ignored') return 'text-orange-600 bg-orange-50';
  if (s === 'Rejected' || s === 'Lost Cause') return 'text-red-700 bg-red-50';
  if (s === 'Draft') return 'text-slate-500 bg-slate-100';
  return 'text-primary bg-primary-fixed/30';
}

function statusDot(s) {
  if (s === 'Paid' || s === 'Payment Received') return 'bg-emerald-600';
  if (s === 'Approved') return 'bg-blue-400';
  if (s === 'Sent') return 'bg-purple-400';
  if (s === 'Under Discussion') return 'bg-yellow-400';
  if (s === 'Ignored') return 'bg-orange-400';
  if (s === 'Rejected' || s === 'Lost Cause') return 'bg-red-500';
  if (s === 'Draft') return 'bg-slate-300';
  return 'bg-primary';
}

const Skeleton = () => (
  <div className="animate-pulse h-6 bg-surface-container rounded-lg w-24" />
);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showOnboarding = searchParams.get('onboarding') === 'true';

  const [stats, setStats] = useState({ totalRevenue: 0, paid: 0, outstanding: 0, overdue: 0, totalClients: 0, totalInvoices: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const invoicesSnap = await getDocs(collection(db, 'invoices'));
        const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const clientsSnap = await getDocs(collection(db, 'clients'));
        const clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let paid = 0, outstanding = 0, overdue = 0;
        invoices.forEach(inv => {
          const amount = Number(inv.grandTotal || inv.total || 0);
          if (inv.status === 'paid') paid += amount;
          else if (inv.status === 'overdue') overdue += amount;
          else outstanding += amount;
        });

        setStats({ totalRevenue: paid + outstanding + overdue, paid, outstanding, overdue, totalClients: clients.length, totalInvoices: invoices.length });

        const sorted = [...invoices].sort((a, b) => {
          const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const db2 = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return db2 - da;
        });
        setRecentInvoices(sorted.slice(0, 4));
        setRecentClients(clients.slice(0, 4));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <AppLayout>
      {showOnboarding && <OnboardingModal />}

      <main className="max-w-screen-xl mx-auto px-6 md:px-10 py-10 flex-1 w-full space-y-10">

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#6C47FF] to-[#4318C9] rounded-2xl p-8 md:p-10 text-white shadow-lg">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight">
                Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there'}!
              </h1>
              <p className="text-white/70 text-sm max-w-md">
                Building the next generation of tech startups — your financial command centre is ready.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link to="/invoices/create" className="flex items-center gap-2 bg-white text-[#6C47FF] px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:shadow-md hover:scale-[1.02] transition-all">
                <span className="material-symbols-outlined text-base">add</span>
                Create Invoice
              </Link>
              <Link to="/clients" className="flex items-center gap-2 bg-white/15 border border-white/30 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/25 transition-all">
                <span className="material-symbols-outlined text-base">person_add</span>
                Add New Client
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Revenue', value: formatINR(stats.totalRevenue), icon: 'payments',     accent: 'text-[#6C47FF]' },
            { label: 'Paid',          value: formatINR(stats.paid),         icon: 'check_circle', accent: 'text-emerald-600' },
            { label: 'Outstanding',   value: formatINR(stats.outstanding),  icon: 'hourglass_top',accent: 'text-amber-600' },
            { label: 'Overdue',       value: formatINR(stats.overdue),      icon: 'warning',      accent: 'text-error' },
            { label: 'Invoices',      value: stats.totalInvoices,           icon: 'description',  accent: 'text-[#6C47FF]' },
            { label: 'Clients',       value: stats.totalClients,            icon: 'group',        accent: 'text-[#6C47FF]' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm flex flex-col gap-2">
              <span className={`material-symbols-outlined text-xl ${s.accent}`}>{s.icon}</span>
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{s.label}</p>
              {loadingStats ? <Skeleton /> : <p className={`text-lg font-extrabold font-headline ${s.accent}`}>{s.value}</p>}
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Invoices */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-headline">Recent Invoices</h2>
              <Link to="/invoices" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                View all <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
              {loadingStats ? (
                <div className="p-6 space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4 items-center">
                      <div className="h-10 w-10 rounded-lg bg-surface-container"/>
                      <div className="flex-1 space-y-2"><div className="h-4 bg-surface-container rounded w-40"/><div className="h-3 bg-surface-container rounded w-24"/></div>
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-outline">description</span>
                  <p className="text-on-surface-variant font-medium">No invoices yet</p>
                  <Link to="/invoices/create" className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined text-sm">add</span> Create your first invoice
                  </Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-on-surface-variant text-xs font-bold uppercase tracking-widest border-b border-outline-variant/10">
                      <th className="text-left px-5 py-3">Invoice</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Client</th>
                      <th className="text-right px-5 py-3">Amount</th>
                      <th className="text-center px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {recentInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-surface-container-low/50 transition-colors cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                        <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{inv.invoiceNumber || `#${inv.id.slice(0,8).toUpperCase()}`}</td>
                        <td className="px-5 py-4 font-semibold text-on-surface hidden md:table-cell">{inv.clientName || inv.client || 'N/A'}</td>
                        <td className="px-5 py-4 text-right font-bold font-mono text-on-surface">{formatINR(inv.grandTotal || inv.total || 0)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold capitalize ${statusColor(inv.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot(inv.status)}`}></span>
                            {inv.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Clients */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-headline">Clients</h2>
                <Link to="/clients" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  View all <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                {loadingStats ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="animate-pulse flex gap-3 items-center">
                        <div className="h-8 w-8 rounded-full bg-surface-container"/>
                        <div className="flex-1 h-4 bg-surface-container rounded w-32"/>
                      </div>
                    ))}
                  </div>
                ) : recentClients.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <span className="material-symbols-outlined text-3xl text-outline">group</span>
                    <p className="text-on-surface-variant text-sm font-medium">No clients yet</p>
                    <Link to="/clients" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
                      <span className="material-symbols-outlined text-sm">add</span> Add a client
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-outline-variant/10">
                    {recentClients.map(client => (
                      <li key={client.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {(client.name || client.companyName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{client.name || client.companyName || 'N/A'}</p>
                          <p className="text-xs text-on-surface-variant truncate">{client.email || ''}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5 space-y-3">
              <img src="https://teraforgedigitallab.com/images/logo.svg" alt="Teraforge Digital Lab" className="h-7 w-auto" onError={e => { e.target.style.display = 'none'; }} />
              <p className="text-sm font-bold text-on-surface">Teraforge Digital Lab</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Building the next generation of tech startups — end-to-end software solutions from ideation to launch.
              </p>
              <Link to="/settings" className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                <span className="material-symbols-outlined text-sm">settings</span> Company Settings
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
