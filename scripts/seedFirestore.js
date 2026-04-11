/**
 * Firebase Firestore Seed Script
 * ================================
 * Run with:  node scripts/seedFirestore.js
 *
 * This creates:
 *  - config/main       → company settings
 *  - clients/          → 3 sample clients
 *  - invoices/         → 3 sample invoices
 *
 * Requirements:
 *  npm install firebase   (already installed in this project)
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, addDoc, collection, serverTimestamp, Timestamp,
} from 'firebase/firestore';

// ── paste your exact firebase config here ─────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyAG4WhQTJJlb0EA0cWHM9KWExxUv25dCXA',
  authDomain:        'tdl-invoice-management.firebaseapp.com',
  projectId:         'tdl-invoice-management',
  storageBucket:     'tdl-invoice-management.firebasestorage.app',
  messagingSenderId: '109742175283',
  appId:             '1:109742175283:web:22ed985f013ce0f0639f46',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── 1. config/main ────────────────────────────────────────────────────────────
async function seedConfig() {
  await setDoc(doc(db, 'config', 'main'), {
    companyName:  'Teraforge Digital Lab',
    logoUrl:      'https://teraforgedigitallab.com/images/logo.svg',
    website:      'https://teraforgedigitallab.com',
    phone:        '+91 98765 43210',
    address:      '7th Floor, Innovation Hub, Silicon Square, Bengaluru, Karnataka - 560001',
    gstin:        '29AADCB2230M1ZP',  // ← replace with your real GSTIN
    bankDetails:  'Bank: HDFC Bank\nAccount Name: Teraforge Digital Lab\nAccount No: 1234567890\nIFSC: HDFC0001234\nBranch: Koramangala, Bengaluru',
    qrCodeUrl:    '',
  }, { merge: true });
  console.log('✅  config/main seeded');
}

// ── 2. clients ────────────────────────────────────────────────────────────────
const CLIENTS = [
  {
    name:    'Acme Corp',
    email:   'billing@acmecorp.com',
    phone:   '+91 98001 11111',
    gstin:   '07AABCA1234B1Z5',
    address: '12 Business Park, Connaught Place, New Delhi - 110001',
    website: 'https://acmecorp.com',
    notes:   'Priority client — net-30 payment terms',
  },
  {
    name:    'Zephyr Solutions',
    email:   'accounts@zephyrsol.in',
    phone:   '+91 98002 22222',
    gstin:   '29AABCZ9876C1Z3',
    address: '45 Tech Hub, Whitefield, Bengaluru - 560066',
    website: 'https://zephyrsol.in',
    notes:   'Prefers invoice via email',
  },
  {
    name:    'Horizon Startups',
    email:   'pay@horizonstartups.com',
    phone:   '+91 98003 33333',
    gstin:   '',
    address: '8 Startup Lane, Powai, Mumbai - 400076',
    website: '',
    notes:   '',
  },
];

async function seedClients() {
  const refs = [];
  for (const client of CLIENTS) {
    const ref = await addDoc(collection(db, 'clients'), {
      ...client,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    refs.push({ id: ref.id, name: client.name });
    console.log(`  ✅  client: ${client.name} (${ref.id})`);
  }
  console.log('✅  clients seeded');
  return refs;
}

// ── 3. invoices ───────────────────────────────────────────────────────────────
function buildInvoice(clientRef, overrides) {
  const items = overrides.items || [
    { description: 'Web Development (MVP)', qty: 1, unitPrice: 50000, total: 50000 },
    { description: 'UI/UX Design',          qty: 1, unitPrice: 20000, total: 20000 },
  ];
  const subtotal   = items.reduce((s, i) => s + i.total, 0);
  const gstRate    = 0.18;
  const gstAmount  = subtotal * gstRate;
  const grandTotal = subtotal + gstAmount;

  return {
    invoiceNumber:  overrides.invoiceNumber,
    invoiceDate:    overrides.invoiceDate || new Date().toISOString().split('T')[0],
    status:         overrides.status || 'pending',
    clientId:       clientRef.id,
    clientName:     clientRef.name,
    clientEmail:    overrides.clientEmail || '',
    clientGST:      overrides.clientGST   || '',
    clientAddress:  overrides.clientAddress || '',
    items,
    subtotal,
    gstRate,
    gstAmount,
    grandTotal,
    notes: 'Payment due within 30 days. Please include invoice number in transfer reference.',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

async function seedInvoices(clientRefs) {
  const invoices = [
    buildInvoice(clientRefs[0], { invoiceNumber: 'TDL-202503-1001', status: 'paid',    invoiceDate: '2025-03-10' }),
    buildInvoice(clientRefs[1], { invoiceNumber: 'TDL-202504-1002', status: 'pending', invoiceDate: '2025-04-01',
      items: [{ description: 'AI Integration Consulting', qty: 5, unitPrice: 8000, total: 40000 }] }),
    buildInvoice(clientRefs[2], { invoiceNumber: 'TDL-202504-1003', status: 'overdue', invoiceDate: '2025-02-15' }),
  ];

  for (const inv of invoices) {
    const ref = await addDoc(collection(db, 'invoices'), inv);
    console.log(`  ✅  invoice: ${inv.invoiceNumber} → ${inv.status} (${ref.id})`);
  }
  console.log('✅  invoices seeded');
}

// ── Run ───────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('\n🚀  Seeding Firestore...\n');
    await seedConfig();
    const clientRefs = await seedClients();
    await seedInvoices(clientRefs);
    console.log('\n🎉  All done! Your Firestore is ready.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌  Seed failed:', err.message || err);
    process.exit(1);
  }
})();
