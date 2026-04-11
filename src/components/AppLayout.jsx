import React from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

/**
 * AppLayout wraps every authenticated page with the shared header and footer.
 *
 * Usage:
 *   <AppLayout>
 *     <main className="...">...</main>
 *   </AppLayout>
 *
 * Pass `noFooter` prop to suppress the footer (e.g. InvoiceDetail print view).
 * Pass `noPadBottom` to suppress the bottom padding used for mobile nav.
 */
export default function AppLayout({ children, noFooter = false, noPadBottom = false }) {
  return (
    <div className={`bg-surface font-body text-on-surface min-h-screen flex flex-col ${noPadBottom ? '' : 'pb-16 md:pb-0'}`}>
      <AppHeader />
      {children}
      {!noFooter && <AppFooter />}
    </div>
  );
}
