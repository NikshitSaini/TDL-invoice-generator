import React from 'react';

const LOGO = 'https://teraforgedigitallab.com/images/logo.svg';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        {/* Animated outer ring */}
        <div className="absolute -inset-4 border-2 border-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />
        <div className="absolute -inset-4 border-t-2 border-primary rounded-full animate-spin" />
        
        {/* Logo */}
        <div className="relative w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden border border-outline-variant/10">
          <img 
            src={LOGO} 
            alt="Teraforge Digital Lab" 
            className="w-12 h-12 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {/* Fallback if logo fails */}
          <div className="absolute inset-0 flex items-center justify-center font-black text-primary text-xl select-none pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            TDL
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold font-headline tracking-tight text-on-surface">
          Teraforge Digital Lab
        </h2>
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
        </div>
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-4">
          Initializing financial command centre...
        </p>
      </div>
    </div>
  );
}
