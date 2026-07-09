'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      (deferredPrompt as unknown as { prompt: () => void }).prompt();
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-arcade-green flex items-center justify-center shrink-0">
          <Download size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-arcade-text">Add ArcadeZone to Home Screen</h4>
          <p className="text-xs text-arcade-text-muted mt-0.5">
            {isIOS
              ? 'Tap the share button then "Add to Home Screen"'
              : 'Install for quick access and offline support'}
          </p>
        </div>
        <button onClick={handleDismiss} className="p-1 text-arcade-text-muted">
          <X size={18} />
        </button>
      </div>
      {!isIOS && deferredPrompt && (
        <button onClick={handleInstall} className="btn-green mt-3 !py-2.5 !text-sm">
          Install App
        </button>
      )}
    </div>
  );
}
