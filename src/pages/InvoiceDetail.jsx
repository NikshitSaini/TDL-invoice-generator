import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import canvasQR from '../assets/qr_code/canvas.png';

const LOGO = 'https://teraforgedigitallab.com/images/logo.svg';

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
}

const STATUS_STYLES = {
  'Created':          { dot: 'bg-slate-400',    badge: 'bg-slate-100 text-slate-600',   color: '#64748b' },
  'Sent':             { dot: 'bg-purple-400',   badge: 'bg-purple-50 text-purple-600',  color: '#c084fc' },
  'Under Discussion': { dot: 'bg-yellow-400',   badge: 'bg-yellow-50 text-yellow-600',  color: '#facc15' },
  'Approved':         { dot: 'bg-blue-400',     badge: 'bg-blue-50 text-blue-600',    color: '#60a5fa' },
  'Paid':             { dot: 'bg-green-400',    badge: 'bg-green-50 text-green-600',   color: '#4ade80' },
  'Payment Received': { dot: 'bg-emerald-600',  badge: 'bg-emerald-50 text-emerald-700', color: '#059669' },
  'Ignored':          { dot: 'bg-orange-400',   badge: 'bg-orange-50 text-orange-600',  color: '#fb923c' },
  'Rejected':         { dot: 'bg-red-300',      badge: 'bg-red-50 text-red-400',      color: '#fca5a5' },
  'Lost Cause':       { dot: 'bg-red-800',      badge: 'bg-red-900/10 text-red-800',    color: '#991b1b' },
  'Draft':            { dot: 'bg-slate-300',    badge: 'bg-slate-100 text-slate-500',   color: '#cbd5e1' },
};

function statusStyle(s) {
  return STATUS_STYLES[s]?.badge || 'bg-primary-container/20 text-primary';
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const { config } = useConfig();
  const { currentUser } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'invoices', id));
        if (snap.exists()) setInvoice({ id: snap.id, ...snap.data() });
        else setError('Invoice not found.');
      } catch (e) {
        setError('Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Company info — prefer snapshot if available, fallback to global config
  const snapConf = invoice?.configSnapshot || {};
  
  const companyName    = snapConf.companyName  || config?.companyName  || 'Teraforge Digital Lab LLP';
  const companyAddress = snapConf.address      || config?.address      || 'S109, 2nd Floor, Nano Wing, Haware Fantasia Business Park, Sector 30A Vashi, Navi Mumbai, Maharashtra, India - 400704';
  const companyPhone   = snapConf.phone        || config?.phone        || '+91 7718837352';
  const companyEmail   = snapConf.email        || config?.email        || 'contact@teraforgedigitallab.com';
  const companyWebsite = snapConf.website      || config?.website      || 'www.teraforgedigitallab.com';
  const companyGSTIN   = snapConf.gstin        || config?.gstin        || '';
  const bankDetails    = snapConf.bankDetails  || config?.bankDetails  || '';
  const qrCodeUrl      = snapConf.qrCodeUrl    || config?.qrCodeUrl    || '';

  return (
    <AppLayout noFooter>
      {/* ── Action Bar (screen only) ── */}
      <div className="print:hidden sticky top-[57px] z-40 bg-white/80 backdrop-blur-xl border-b border-outline-variant/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentUser && (
            <Link to="/invoices" className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base">arrow_back</span> Back to Invoices
            </Link>
          )}
          <div className="h-4 w-px bg-outline-variant/20 hidden sm:block"></div>
          {invoice && (
            <p className="text-[11px] font-bold text-on-surface-variant hidden sm:block uppercase tracking-widest">
              Created By: <span className="text-on-surface">{invoice.createdBy || 'Unknown'}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {invoice && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusStyle(invoice.status)}`}>
              {invoice.status || 'pending'}
            </span>
          )}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
            ➜ press h + enter to show help
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#6C47FF] text-white px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Download PDF
          </button>
        </div>
      </div>

      <main className="py-10 px-4 flex justify-center print:py-0 print:px-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
            <p className="text-sm font-medium">Loading invoice…</p>
          </div>
        ) : error ? (
          <div className="text-center py-32 space-y-3">
            <span className="material-symbols-outlined text-4xl text-error">error</span>
            <p className="text-on-surface font-semibold">{error}</p>
            <Link to="/invoices" className="text-primary text-sm hover:underline">Back to Invoices</Link>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             PRINTABLE INVOICE — matches the reference design exactly
          ═══════════════════════════════════════════════════════════════════ */
          <div
            id="invoice-print"
            className="w-full max-w-[800px] bg-white shadow-lg print:shadow-none print:max-w-full font-body text-[#1a1a1a]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {/* ── HEADER ── */}
            <div className="flex justify-between items-start px-10 pt-10 pb-6">
              {/* Left: Logo + Name + Address */}
              <div className="flex items-start gap-4">
                {/* Black circle logo */}
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center shrink-0 shadow">
                  <img
                    src={LOGO}
                    alt={companyName}
                    className="w-10 h-10 object-contain"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                <div>
                  <h1 className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]">{companyName}</h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Operational Office Address:</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed max-w-[260px]">
                    {companyAddress}
                  </p>
                  {companyGSTIN && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      <span className="font-semibold">GSTIN:</span> {companyGSTIN}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Contact */}
              <div className="text-right text-[11px] text-slate-600 space-y-1.5">
                {companyPhone && (
                  <p className="flex items-center justify-end gap-1.5">
                    <span>{companyPhone}</span>
                    <span className="text-[#6C47FF] text-xs">📞</span>
                  </p>
                )}
                {companyEmail && (
                  <p className="flex items-center justify-end gap-1.5">
                    <span>{companyEmail}</span>
                    <span className="text-[#6C47FF] text-xs">✉</span>
                  </p>
                )}
                {companyWebsite && (
                  <p className="flex items-center justify-end gap-1.5">
                    <span>{companyWebsite}</span>
                    <span className="text-[#6C47FF] text-xs">🌐</span>
                  </p>
                )}
              </div>
            </div>

            {/* ── PURPLE DIVIDER ── */}
            <div className="h-1 bg-[#6C47FF] w-full" />
            <div className="h-0.5 bg-black w-full" />

            {/* ── INVOICE TITLE ── */}
            <div className="text-center py-6">
              <h2 className="text-3xl font-black uppercase tracking-widest text-[#1a1a1a]">INVOICE</h2>
            </div>

            {/* ── ISSUED BY / ISSUED TO ── */}
            <div className="grid grid-cols-2 gap-8 px-10 pb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Issued By:</p>
                <p className="text-[12px] font-black uppercase text-[#1a1a1a]">{companyName}</p>
                {companyGSTIN && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <span className="font-semibold">GSTIN:</span> {companyGSTIN}
                  </p>
                )}
                {companyAddress && (
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    <span className="font-semibold">Address:</span> {companyAddress}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Issued To:</p>
                <p className="text-[12px] font-black uppercase text-[#1a1a1a]">{invoice.clientName || '—'}</p>
                {invoice.clientGST && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <span className="font-semibold">GSTIN:</span> {invoice.clientGST}
                  </p>
                )}
                {invoice.clientAddress && (
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    <span className="font-semibold">Address:</span> {invoice.clientAddress}
                  </p>
                )}
                {invoice.clientEmail && (
                  <p className="text-[11px] text-slate-600 mt-0.5">{invoice.clientEmail}</p>
                )}
              </div>
            </div>

            {/* ── INVOICE NO + DATE ── */}
            <div className="flex justify-between items-center px-10 py-3 border-t border-b border-slate-200">
              <p className="text-[13px] font-bold text-slate-700">
                Invoice No: <span className="font-black text-[#1a1a1a] font-mono">{invoice.invoiceNumber || id}</span>
              </p>
              <p className="text-[13px] font-bold text-slate-700">
                Date: <span className="font-black text-[#1a1a1a]">{fmtDate(invoice.invoiceDate)}</span>
              </p>
            </div>

            {/* ── LINE ITEMS TABLE ── */}
            <div className="px-10 pt-5">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#6C47FF] text-white">
                    <th className="py-3 px-4 text-left text-[11px] font-black uppercase tracking-widest roundedl">Description</th>
                    <th className="py-3 px-4 text-right text-[11px] font-black uppercase tracking-widest">Unit Price</th>
                    <th className="py-3 px-4 text-center text-[11px] font-black uppercase tracking-widest">QTY</th>
                    <th className="py-3 px-4 text-right text-[11px] font-black uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, idx) => {
                    const rowTotal = Number(item.qty || 0) * Number(item.unitPrice || 0);
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-500 mr-2">{idx + 1}.</span>
                          <span className="text-[#1a1a1a] font-medium">{item.description}</span>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-slate-700">₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                        <td className="py-4 px-4 text-center font-mono text-slate-700">{item.qty}</td>
                        <td className="py-4 px-4 text-right font-bold font-mono text-[#1a1a1a]">₹{Number(item.total || rowTotal).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Subtotal / Tax rows */}
              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between px-4 py-1 text-slate-600">
                    <span>Sub Total</span>
                    <span className="font-bold font-mono">{fmt(invoice.subtotal)}</span>
                  </div>
                  {(invoice.gstRate > 0 || invoice.gstAmount > 0) && (
                    <div className="flex justify-between px-4 py-1 text-slate-600">
                      <span>Tax ({Math.round((invoice.gstRate || 0.18) * 100)}% GST)</span>
                      <span className="font-bold font-mono">{fmt(invoice.gstAmount)}</span>
                    </div>
                  )}
                  {/* SUBTOTAL / TOTAL footer row */}
                  <div className="flex justify-between bg-[#e8e8e8] px-4 py-2.5 mt-1">
                    <span className="text-[11px] font-black uppercase tracking-widest">Subtotal</span>
                    <div className="flex gap-8">
                      <span className="text-[11px] font-black uppercase tracking-widest">Total</span>
                      <span className="font-black font-mono text-[#1a1a1a]">{fmt(invoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BANK DETAILS + QR CODE ── */}
            <div className="flex justify-between items-start px-10 pt-8 pb-10 mt-4 border-t border-slate-200">
              {/* Bank details */}
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a] mb-3">Bank Details</p>
                {bankDetails ? (
                  <div className="text-[11px] text-slate-700 space-y-1 leading-relaxed whitespace-pre-line">
                    {bankDetails.split('\n').map((line, i) => {
                      const [label, ...rest] = line.split(':');
                      return rest.length ? (
                        <p key={i}>
                          <span className="font-bold">{label}:</span>{rest.join(':')}
                        </p>
                      ) : <p key={i}>{line}</p>;
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Bank details not configured — go to Settings → Bank Details to add them.
                  </p>
                )}

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Notes</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="ml-8 shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <img
                    src={canvasQR}
                    alt="Payment QR"
                    className="w-24 h-24 object-contain border border-slate-200 rounded"
                  />
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Scan to Pay</p>
                </div>
              </div>
            </div>

            {/* ── FOOTER NOTE ── */}
            <div className="bg-[#6C47FF] text-white text-center py-3 text-[10px] font-semibold tracking-wide">
              Thank you for your business! · {companyWebsite}
            </div>
          </div>
        )}
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            margin: 0 !important;
          }
          /* Hide non-printable elements cleanly */
          .print\\\\:hidden, .print\\\\:hidden * { 
            display: none !important; 
          }
          /* Ensure invoice area spans multiple pages cleanly instead of fixed layout */
          #invoice-print {
            position: relative;
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
