import React, { useState } from 'react';
import {
  CloudUpload,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  FirmDataSnapshot,
  MigrationProgress,
  uploadLocalStorageToFirestore,
  downloadJSONFile,
  clearLegacyLocalStorageKeys
} from '../lib/firestoreSync';
import { getISTDate } from '../lib/invoiceNumber';

interface LegacyMigrationModalProps {
  isOpen: boolean;
  firmId: string;
  firmName: string;
  counts: Record<string, number>;
  totalCount: number;
  legacySnapshot: FirmDataSnapshot;
  onComplete: () => void;
  onSkip: () => void;
}

export const LegacyMigrationModal: React.FC<LegacyMigrationModalProps> = ({
  isOpen,
  firmId,
  firmName,
  counts,
  totalCount,
  legacySnapshot,
  onComplete,
  onSkip
}) => {
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [migrationDone, setMigrationDone] = useState(false);
  const [legacyCleared, setLegacyCleared] = useState(false);

  if (!isOpen) return null;

  const handleForceDownloadBackup = () => {
    const filename = `Swarnkar_PreMigration_Backup_${firmName.replace(/\s+/g, '_')}_${getISTDate().isoDateStr}.json`;
    downloadJSONFile(legacySnapshot, filename);
    setBackupDownloaded(true);
    setErrorMsg('');
  };

  const handleStartMigration = async () => {
    // Force a JSON backup download if not yet downloaded in this flow
    if (!backupDownloaded) {
      handleForceDownloadBackup();
    }

    setMigrating(true);
    setErrorMsg('');
    try {
      const result = await uploadLocalStorageToFirestore(firmId, legacySnapshot, {
        onProgress: (prog) => setProgress(prog),
        resume: true
      });
      if (result.success) {
        setMigrationDone(true);
        localStorage.setItem(`jewel_migration_done_${firmId}`, getISTDate().isoDateStr);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    } finally {
      setMigrating(false);
    }
  };

  const handleConfirmClearLegacy = () => {
    if (
      window.confirm(
        'क्या आप सुनिश्चित हैं? क्लाउड में डेटा सफलतापूर्वक सेव हो चुका है। लोकल ब्राउज़र की पुरानी कॉपी हटाने के बाद ऐप पूरी तरह Firestore से चलेगा।'
      )
    ) {
      clearLegacyLocalStorageKeys(firmId);
      setLegacyCleared(true);
    }
  };

  const pct =
    progress && progress.totalDocs > 0
      ? Math.round((progress.uploadedDocs / progress.totalDocs) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 rounded-2xl">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                लोकल डेटा को Firestore क्लाउड में माइग्रेट करें
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Firm: <strong className="text-amber-700 dark:text-amber-400">{firmName}</strong> • {totalCount} records found in browser storage
              </p>
            </div>
          </div>
          {!migrating && (
            <button
              onClick={onSkip}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Skip for now"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Record summary */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
          {(Object.entries(counts) as [string, number][])
            .filter(([, count]) => count > 0)
            .map(([col, count]) => (
              <div
                key={col}
                className="bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl p-2 text-center"
              >
                <div className="font-black text-amber-700 dark:text-amber-400 font-mono text-sm">
                  {count}
                </div>
                <div className="text-[10px] uppercase text-stone-500 dark:text-slate-400 font-bold truncate">
                  {col}
                </div>
              </div>
            ))}
        </div>

        {/* Step 1: Mandatory JSON Backup */}
        {!migrationDone && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Step 1: सुरक्षा हेतु पहले JSON बैकअप डाउनलोड आवश्यक है</span>
            </div>
            <p className="text-stone-600 dark:text-slate-300">
              डेटा अपलोड करने से पहले एक सुरक्षित JSON कॉपी डाउनलोड की जाएगी और लोकल स्टोरेज डेटा को बिना डिलीट किए सुरक्षित रखा जाएगा।
            </p>
            <button
              type="button"
              onClick={handleForceDownloadBackup}
              disabled={migrating}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
                backupDownloaded
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                {backupDownloaded ? '✅ JSON Backup Downloaded' : 'Download Mandatory JSON Backup (.json)'}
              </span>
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-stone-600 dark:text-slate-300">{progress.lastMessage}</span>
              <span className="font-mono text-amber-700 dark:text-amber-400">
                {progress.uploadedDocs} / {progress.totalDocs} ({pct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progress.phase === 'failed'
                    ? 'bg-rose-500'
                    : progress.phase === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${progress.phase === 'completed' ? 100 : pct}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 rounded-2xl text-xs font-bold text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Post-Migration Success & Optional Cleanup */}
        {migrationDone && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center gap-2 font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>डेटा सफलतापूर्वक Firestore क्लाउड में माइग्रेट हो गया!</span>
            </div>
            <p className="text-stone-600 dark:text-slate-300">
              आपकी लोकल ब्राउज़र बैकअप कॉपी अभी भी सुरक्षित रखी गई है। यदि आपने डेटा सत्यापित कर लिया है, तो आप पुरानी लोकल स्टोरेज कीज़ को हटा सकते हैं।
            </p>
            <div className="flex flex-wrap gap-2">
              {!legacyCleared ? (
                <button
                  type="button"
                  onClick={handleConfirmClearLegacy}
                  className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>पुराना लोकल डेटा हटाएँ (Clear Legacy Keys)</span>
                </button>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                  ✅ Legacy localStorage keys removed.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-stone-200 dark:border-slate-800 flex flex-wrap justify-end gap-2">
          {!migrationDone ? (
            <>
              <button
                type="button"
                onClick={onSkip}
                disabled={migrating}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-700 dark:text-slate-300 cursor-pointer"
              >
                बाद में करें (Skip)
              </button>
              <button
                type="button"
                onClick={handleStartMigration}
                disabled={migrating}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 shadow cursor-pointer disabled:opacity-60"
              >
                {migrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                <span>
                  {migrating
                    ? 'अपलोड हो रहा है...'
                    : errorMsg
                      ? 'Retry / Resume Migration'
                      : 'Backup Download करें व Cloud पर अपलोड करें'}
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow"
            >
              जारी रखें (Continue to ERP)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
