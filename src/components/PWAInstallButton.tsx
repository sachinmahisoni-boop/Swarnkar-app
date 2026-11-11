import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Smartphone, Share } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-md shadow-xs text-xs cursor-pointer transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-md shadow-xs text-xs cursor-pointer transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Install on iPhone</h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400">
                    <Share className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    1. Tap the <strong>Share</strong> button in the Safari toolbar.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-600 dark:text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-400 rounded-sm flex items-center justify-center text-[10px] font-bold">+</div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    2. Scroll down and tap <strong>'Add to Home Screen'</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-black text-slate-950 hover:bg-amber-600 transition shadow-md"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
