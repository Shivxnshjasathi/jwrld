import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="bg-[#0A0A0B] text-on-surface min-h-screen flex flex-col items-center justify-center font-body-md p-6">
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center max-w-md w-full text-center border-outline-variant/30 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-error/10 rounded-full blur-[40px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/5 rounded-full blur-[40px] pointer-events-none"></div>
        
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-lg relative z-10">
          <span className="material-symbols-outlined text-[40px] text-error/80">wifi_off</span>
        </div>
        
        <h1 className="font-headline-md text-[24px] font-bold text-white mb-2 relative z-10 tracking-tight">
          You're Offline
        </h1>
        <p className="text-[14px] text-on-surface-variant mb-8 relative z-10 leading-relaxed">
          It looks like you've lost your internet connection. Please check your network settings and try again.
        </p>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-full btn-gradient py-4 rounded-xl font-bold uppercase tracking-wider mb-3 relative z-10 transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          Try Again
        </button>
        
        <Link 
          href="/home"
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl font-bold uppercase tracking-wider relative z-10 transition-colors text-white"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
