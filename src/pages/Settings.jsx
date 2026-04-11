import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import ConfigEditModal from '../components/modals/ConfigEditModal';
import AppLayout from '../components/AppLayout';

const LOGO = 'https://teraforgedigitallab.com/images/logo.svg';

// ── Reusable read-only field row ──────────────────────────────────────────────
function InfoRow({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 px-6 py-4 items-start border-b border-surface-container last:border-0">
      <span className="text-sm font-semibold text-on-surface-variant">{label}</span>
      <span className={`md:col-span-2 text-on-surface text-sm mt-1 md:mt-0 break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// ── Config card tile ──────────────────────────────────────────────────────────
function ConfigCard({ icon, title, description, action, onClick, children }) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group flex flex-col relative border border-outline-variant/10">
      <div className="flex justify-between items-start mb-4">
        <div className="w-11 h-11 bg-primary-container/10 rounded-xl flex items-center justify-center text-[#6C47FF]">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <button
          onClick={onClick}
          title="Edit"
          className="p-1.5 text-outline hover:text-[#6C47FF] hover:bg-primary-container/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
      </div>
      <h3 className="font-headline font-bold text-base mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-4 flex-1">{description}</p>

      {/* Live values preview */}
      {children && (
        <div className="mt-2 space-y-1 text-xs text-on-surface-variant border-t border-outline-variant/10 pt-3">
          {children}
        </div>
      )}

      <button
        onClick={onClick}
        className="mt-4 text-xs font-bold text-[#6C47FF] flex items-center gap-1 hover:underline underline-offset-2 before:absolute before:inset-0"
      >
        {action} <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { currentUser, logout } = useAuth();
  const { config, loadingConfig } = useConfig();
  const [activeTab, setActiveTab] = useState('config');
  const [editingSection, setEditingSection] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
  };

  const SIDEBAR_TABS = [
    { key: 'profile', icon: 'person',   label: 'Profile' },
    { key: 'config',  icon: 'settings', label: 'Company Config' },
  ];

  return (
    <AppLayout>
      <main className="max-w-screen-xl mx-auto flex min-h-[calc(100vh-130px)] w-full flex-1">

        {/* ── Sidebar ── */}
        <aside className="w-64 bg-surface-container-low p-6 hidden md:flex flex-col border-r border-outline-variant/10 shrink-0">
          <div className="flex-1 space-y-6">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-4 px-3">
                Account
              </p>
              <nav className="space-y-1">
                {SIDEBAR_TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all
                      ${activeTab === t.key
                        ? 'bg-white text-[#6C47FF] shadow-sm'
                        : 'text-slate-600 hover:bg-surface-container-high hover:translate-x-0.5'}`}
                  >
                    <span className="material-symbols-outlined text-base">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Company logo preview in sidebar */}
            {config?.logoUrl || true ? (
              <div className="px-3 py-4 bg-surface-container rounded-xl space-y-2">
                <img
                  src={config?.logoUrl || LOGO}
                  alt={config?.companyName || 'Logo'}
                  className="h-7 w-auto"
                  onError={e => { e.target.src = LOGO; }}
                />
                <p className="text-xs font-semibold text-on-surface truncate">
                  {config?.companyName || 'Teraforge Digital Lab'}
                </p>
                {config?.gstin && (
                  <p className="text-[10px] text-on-surface-variant font-mono">GSTIN: {config.gstin}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Logout at bottom of sidebar */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-error hover:bg-error-container/20 rounded-xl font-semibold text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </aside>

        {/* ── Content ── */}
        <section className="flex-1 bg-surface p-6 md:p-10 overflow-y-auto">
          {loadingConfig ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
              <p className="text-sm font-medium">Loading configuration…</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-10">

              {/* ── PROFILE TAB ── */}
              {activeTab === 'profile' && (() => {
                const [userProfile, setUserProfile] = React.useState(null);
                const [loadingProfile, setLoadingProfile] = React.useState(true);

                React.useEffect(() => {
                  if (!currentUser) return;
                  const fetchProfile = async () => {
                    try {
                      const { doc, getDoc } = await import('firebase/firestore');
                      const { db } = await import('../config/firebase');
                      const snap = await getDoc(doc(db, 'users', currentUser.uid));
                      if (snap.exists()) setUserProfile(snap.data());
                    } catch (e) {
                      console.error("Error fetching profile:", e);
                    } finally {
                      setLoadingProfile(false);
                    }
                  };
                  fetchProfile();
                }, [currentUser]);

                if (loadingProfile) return <div className="animate-pulse space-y-4 pt-10"><div className="h-20 bg-surface-container rounded-xl"/><div className="h-40 bg-surface-container rounded-xl"/></div>;

                return (
                  <div>
                    <div className="mb-8">
                      <h1 className="text-2xl font-extrabold tracking-tight font-headline text-on-surface mb-1">My Profile</h1>
                      <p className="text-on-surface-variant text-sm">Your authentication and identity details.</p>
                    </div>

                    {/* User card */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden mb-6">
                      <div className="flex items-center gap-5 px-6 py-5 bg-gradient-to-r from-primary-container/10 to-transparent border-b border-outline-variant/10">
                        <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-md">
                          {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-on-surface">
                            {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : (currentUser?.displayName || currentUser?.email?.split('@')[0])}
                          </p>
                          <p className="text-sm text-on-surface-variant">{currentUser?.email}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-1
                            ${currentUser?.emailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            <span className="material-symbols-outlined text-xs">
                              {currentUser?.emailVerified ? 'verified' : 'warning'}
                            </span>
                            {currentUser?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-outline-variant/10">
                        <InfoRow label="First Name"   value={userProfile?.firstName || '—'} />
                        <InfoRow label="Last Name"    value={userProfile?.lastName || '—'} />
                        <InfoRow label="Mobile Number" value={userProfile?.mobile || '—'} />
                        <InfoRow label="Email Address" value={currentUser?.email} />
                        <InfoRow label="Unique User ID" value={userProfile?.userId} mono />
                        <InfoRow label="Firebase UID"  value={currentUser?.uid} mono />
                        <InfoRow label="Account Created" value={currentUser?.metadata?.creationTime
                          ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '—'} />
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="bg-error-container/10 border border-error-container/30 rounded-xl p-6">
                      <h3 className="font-bold text-error mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">warning</span> Danger Zone
                      </h3>
                      <p className="text-sm text-on-surface-variant mb-4">
                        Once you log out, you will need your credentials to sign back in.
                      </p>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-error text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-base">logout</span> Logout
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── CONFIG TAB ── */}
              {activeTab === 'config' && (
                <div>
                  <div className="mb-8">
                    <h1 className="text-2xl font-extrabold tracking-tight font-headline text-on-surface mb-1">Company Config</h1>
                    <p className="text-on-surface-variant text-sm">
                      Global settings synced to Firestore at <code className="text-[#6C47FF] font-mono text-xs bg-primary-container/10 px-1.5 py-0.5 rounded">config/main</code>.
                      Super Admin password required to edit.
                    </p>
                  </div>

                  {/* Live read-only preview */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-base">cloud_done</span>
                        <p className="text-sm font-bold text-on-surface">Current Configuration (Live from Firebase)</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Synced</span>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      <InfoRow label="Company Name" value={config?.companyName || '—'} />
                      <InfoRow label="Logo URL"     value={config?.logoUrl || '—'} />
                      <InfoRow label="GSTIN"        value={config?.gstin || '—'} mono />
                      <InfoRow label="Website"      value={config?.website || '—'} />
                      <InfoRow label="Phone"        value={config?.phone || '—'} />
                      <InfoRow label="Address"      value={config?.address || '—'} />
                      <InfoRow label="Bank Details" value={config?.bankDetails || '—'} />
                      <InfoRow label="QR Code URL"  value={config?.qrCodeUrl || '—'} />
                    </div>
                  </div>

                  {/* Edit cards grid */}
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Edit Sections</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ConfigCard
                      icon="business"
                      title="Company Info"
                      description="Legal name, logo URL, website, phone, and registered address."
                      action="CONFIGURE"
                      onClick={() => setEditingSection('company')}
                    >
                      {config?.companyName && <p className="truncate">📛 {config.companyName}</p>}
                      {config?.phone       && <p>📞 {config.phone}</p>}
                      {config?.website     && <p className="truncate">🌐 {config.website}</p>}
                    </ConfigCard>

                    <ConfigCard
                      icon="fingerprint"
                      title="Tax & GSTIN"
                      description="GST registration number used on all generated invoices."
                      action="MANAGE"
                      onClick={() => setEditingSection('tax')}
                    >
                      {config?.gstin
                        ? <p className="font-mono">🧾 GSTIN: {config.gstin}</p>
                        : <p className="text-amber-600">⚠ GSTIN not configured</p>}
                    </ConfigCard>

                    <ConfigCard
                      icon="account_balance"
                      title="Bank Details"
                      description="Account number, IFSC, and Swift code for invoice payment section."
                      action="UPDATE"
                      onClick={() => setEditingSection('bank')}
                    >
                      {config?.bankDetails
                        ? <p className="truncate whitespace-pre-line line-clamp-2">🏦 {config.bankDetails}</p>
                        : <p className="text-amber-600">⚠ Bank details not set</p>}
                    </ConfigCard>

                    <ConfigCard
                      icon="qr_code_2"
                      title="Payment QR Code"
                      description="UPI or payment gateway QR displayed on the invoice PDF."
                      action="SET QR"
                      onClick={() => setEditingSection('bank')}
                    >
                      {config?.qrCodeUrl ? (
                        <div className="flex items-center gap-2">
                          <img src={config.qrCodeUrl} alt="QR" className="w-10 h-10 rounded border border-outline-variant/20 object-contain" onError={e => e.target.style.display = 'none'} />
                          <p className="truncate text-emerald-600">✅ QR configured</p>
                        </div>
                      ) : (
                        <p className="text-amber-600">⚠ QR code not uploaded</p>
                      )}
                    </ConfigCard>
                  </div>
                </div>
              )}

            </div>
          )}
        </section>
      </main>

      {/* Edit Modal */}
      {editingSection && (
        <ConfigEditModal section={editingSection} onClose={() => setEditingSection(null)} />
      )}

      {/* Mobile tab bar for Settings-specific tabs */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/10 flex justify-around px-6 py-2 z-30">
        {SIDEBAR_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 ${activeTab === t.key ? 'text-[#6C47FF]' : 'text-slate-500'}`}
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === t.key ? "'FILL' 1" : "'FILL' 0" }}>
              {t.icon}
            </span>
            <span className="text-[10px] font-semibold">{t.label}</span>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
