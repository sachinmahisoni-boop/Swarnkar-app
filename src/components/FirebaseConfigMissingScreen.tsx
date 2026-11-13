import React from 'react';
import { ShieldAlert, Terminal, ExternalLink, RefreshCw } from 'lucide-react';

interface Props {
  missingVars: string[];
  errorMsg?: string | null;
}

export const FirebaseConfigMissingScreen: React.FC<Props> = ({ missingVars, errorMsg }) => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-amber-500 selection:text-white">
      <div className="max-w-2xl w-full bg-stone-900 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-stone-900 to-rose-950 p-6 border-b border-rose-500/30 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="inline-block bg-rose-500/20 text-rose-300 text-[10px] font-bold px-3 py-1 rounded-full border border-rose-500/30 uppercase font-mono tracking-wider mb-2">
            Configuration Error • पर्यावरण परिवर्तनशील गायब
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Firebase Environment Variables Missing
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            Vercel deployment or local environment is missing required VITE_FIREBASE_* environment variables.
          </p>
        </div>

        <div className="p-6 space-y-5 text-xs">
          
          {/* Missing variables list */}
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl space-y-2">
            <h2 className="font-extrabold text-rose-300 text-xs flex items-center gap-1.5 uppercase">
              Missing Required Variables ({missingVars.length}):
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              {missingVars.map(v => (
                <div key={v} className="bg-stone-900 border border-rose-500/30 px-3 py-1.5 rounded-xl text-rose-300 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>{v}</span>
                </div>
              ))}
            </div>
            {errorMsg && (
              <p className="text-[11px] text-stone-400 pt-1 font-mono">{errorMsg}</p>
            )}
          </div>

          {/* How to fix on Vercel */}
          <div className="space-y-2">
            <h3 className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-400" />
              How to fix on Vercel:
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-stone-300 pl-1 text-[11px] leading-relaxed">
              <li>Open your project dashboard in <strong>Vercel</strong>.</li>
              <li>Go to <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.</li>
              <li>Add the following keys from your Firebase Console project settings:
                <ul className="list-disc list-inside pl-4 mt-1 text-stone-400 font-mono text-[10px] space-y-0.5">
                  <li>VITE_FIREBASE_API_KEY</li>
                  <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                  <li>VITE_FIREBASE_PROJECT_ID</li>
                  <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                  <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                  <li>VITE_FIREBASE_APP_ID</li>
                  <li>VITE_FIREBASE_FIRESTORE_DATABASE_ID (Optional if default)</li>
                </ul>
              </li>
              <li>Trigger a <strong>Redeploy</strong> in Vercel (environment variables take effect only on new builds).</li>
            </ol>
            <p className="text-[11px] text-stone-400 pt-1 leading-relaxed">
              <strong>Local / Preview:</strong> Copy <code className="text-amber-300 font-mono">.env.example</code> to <code className="text-amber-300 font-mono">.env</code> and fill in your Firebase project keys, then restart the dev server.
            </p>
          </div>

          {/* Action button */}
          <div className="pt-3 border-t border-stone-800 flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry / Refresh App</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
