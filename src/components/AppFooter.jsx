import React from 'react';

const LOGO = 'https://teraforgedigitallab.com/images/logo.svg';

export default function AppFooter() {
  return (
    <footer className="w-full border-t border-outline-variant/10 px-8 py-5 mt-auto print:hidden">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 text-on-surface-variant text-xs">
        <div className="flex items-center gap-2">
          <img
            src={LOGO}
            alt=""
            className="h-4 w-auto opacity-60"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span>
            © {new Date().getFullYear()} Teraforge Digital Lab &middot; End-to-end solutions from ideation to launch
          </span>
        </div>
        <div className="flex gap-5">
          <a className="hover:text-primary transition-colors" href="#!">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#!">Audit Logs</a>
          <a className="hover:text-primary transition-colors" href="#!">Support</a>
        </div>
      </div>
    </footer>
  );
}
