import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  X, 
  FileSpreadsheet, 
  FileJson, 
  CloudUpload,
  RefreshCw,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { 
  downloadJSONFile, 
  downloadCSVFile, 
  uploadLocalStorageToFirestore,
  getLegacyLocalStorageData,
  clearLegacyLocalStorageKeys,
  MigrationProgress
} from '../lib/firestoreSync';
import { getISTDate } from '../lib/invoiceNumber';
import { GSTInvoice, JewelleryItem, Customer, ShopDetails } from '../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmId: string;
  firmName: string;
  allFirmData: {
    shopDetails?: ShopDetails;
    inventory: JewelleryItem[];
    customers: Customer[];
    invoices: GSTInvoice[];
    vendors: any[];
    purchases: any[];
    expenses: any[];
    transfers: any[];
    karigars: any[];
    jobCards: any[];
    girviLoans: any[];
    gemstones: any[];
    profiles: any[];
  };
  onRestoreData?: (restoredData: any) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  firmId,
  firmName,
  allFirmData,
  onRestoreData
}) => {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [message, setMessage] = useState('');
  const [canCleanupLegacy, setCanCleanupLegacy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const todayIst = getISTDate().isoDateStr;
  const legacyCheck = getLegacyLocalStorageData(firmId);

  const handleDownloadJSON = () => {
    const filename = `Swarnkar_Backup_${firmName.replace(/\s+/g, '_')}_${todayIst}.json`;
    downloadJSONFile(allFirmData, filename);
    setMessage('✅ Full JSON Backup Downloaded Successfully!');
  };

  const handleDownloadInvoicesCSV = () => {
    if (!allFirmData.invoices || allFirmData.invoices.length === 0) {
      alert('कोई बिक्री इनवॉइस उपलब्ध नहीं है।');
      return;
    }
    const rows = allFirmData.invoices.map(inv => ({
      InvoiceNo: inv.invoiceNumber,
      Type: inv.invoiceType,
      Date: inv.date,
      Customer: inv.customerName,
      Phone: inv.customerPhone,
      GSTIN: inv.customerGSTIN || 'URP',
      Subtotal: inv.itemsSubtotal,
      Discount: inv.discountAmount,
      Taxable: inv.taxableAmount,
      CGST: inv.cgstAmount,
      SGST: inv.sgstAmount,
      IGST: inv.igstAmount,
      GrandTotal: inv.grandTotal,
      Paid: inv.payment?.amountPaid || 0,
      Due: inv.payment?.dueAmount || 0,
      Status: inv.status
    }));

    downloadCSVFile(rows, `Invoices_${firmName.replace(/\s+/g, '_')}_${todayIst}.csv`);
    setMessage('✅ Invoices CSV Exported Successfully!');
  };

  const handleDownloadStockCSV = () => {
    if (!allFirmData.inventory || allFirmData.inventory.length === 0) {
      alert('कोई स्टॉक आइटम उपलब्ध नहीं है।');
      return;
    }
    const rows = allFirmData.inventory.map(item => ({
      TagNo: item.tagNo,
      HUID: item.huid || 'N/A',
      Name: item.name,
      Category: item.category,
      Metal: item.metal,
      Purity: item.purity,
      GrossWt: item.grossWeight,
      NetWt: item.netWeight,
      StoneWt: item.stoneWeight,
      StoneVal: item.stoneValue,
      MakingRate: item.makingChargeRate,
      CostPrice: item.costPrice || 0,
      Quantity: item.quantity,
      HSN: item.hsnCode,
      Barcode: item.barcode
    }));

    downloadCSVFile(rows, `Stock_Inventory_${firmName.replace(/\s+/g, '_')}_${todayIst}.csv`);
    setMessage('✅ Stock Inventory CSV Exported Successfully!');
  };

  const handleMigrateToFirestore = async () => {
    const sourceData = legacyCheck.hasData ? legacyCheck.snapshot : allFirmData;
    if (!window.confirm('पहले सुरक्षा के लिए JSON बैकअप डाउनलोड होगा, उसके बाद डेटा Firestore क्लाउड में अपलोड होगा। जारी रखें?')) {
      return;
    }

    // Force JSON backup download before migration
    const filename = `Swarnkar_PreSync_Backup_${firmName.replace(/\s+/g, '_')}_${todayIst}.json`;
    downloadJSONFile(sourceData, filename);

    setMigrating(true);
    setMessage('');
    try {
      const res = await uploadLocalStorageToFirestore(firmId, sourceData, {
        onProgress: (prog) => setProgress(prog),
        resume: true
      });
      setMessage(`🎉 डेटा सफलता-पूर्वक Firestore क्लाउड में अपलोड हो गया (${res.uploadedDocs} records)!`);
      localStorage.setItem(`jewel_migration_done_${firmId}`, todayIst);
      if (legacyCheck.hasData) {
        setCanCleanupLegacy(true);
      }
    } catch (err: any) {
      setMessage(`❌ Migration Error: ${err?.message || String(err)}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleCleanupLegacy = () => {
    if (window.confirm('क्या आप सुनिश्चित हैं कि आप पुराने ब्राउज़र localStorage कीज़ को हटाना चाहते हैं?')) {
      clearLegacyLocalStorageKeys(firmId);
      setCanCleanupLegacy(false);
      setMessage('✅ Legacy localStorage keys removed cleanly.');
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && onRestoreData) {
          onRestoreData(parsed);
          setMessage('✅ JSON रिस्टोर सफलता-पूर्वक संपन्न हुआ!');
        }
      } catch (err) {
        alert('गलत या क्षतिग्रस्त JSON फाइल! कृपया सही बैकअप चुनकर पुनः प्रयास करें।');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-slate-100 text-lg">
                डेटा सुरक्षा, बैकअप व क्लाउड सिंक (Backup & Migration)
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Firm: <strong className="text-amber-700 dark:text-amber-400">{firmName}</strong> ({firmId})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs font-bold text-amber-900 dark:text-amber-300">
            {message}
          </div>
        )}

        {/* Cloud Migration Section */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <CloudUpload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Firestore Cloud Real-Time Migration
            </span>
            <span className="text-[10px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
              Chunked & Resumable
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
            लोकल ब्राउज़र मेमोरी से समस्त रिकॉर्ड्स (स्टॉक, इनवॉइस, ग्राहक खाते, उधारी) को Firestore क्लाउड में सुरक्षित अपलोड करें। अपलोड से पहले JSON बैकअप स्वतः डाउनलोड होगा।
          </p>

          {progress && (
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between font-bold">
                <span>{progress.lastMessage}</span>
                <span className="font-mono">{progress.uploadedDocs}/{progress.totalDocs}</span>
              </div>
              <div className="w-full h-2 bg-amber-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${progress.phase === 'failed' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progress.totalDocs > 0 ? Math.round((progress.uploadedDocs / progress.totalDocs) * 100) : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleMigrateToFirestore}
              disabled={migrating}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
            >
              {migrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              <span>{migrating ? 'Firestore सिंक हो रहा है...' : 'Backup व Cloud अपलोड करें'}</span>
            </button>

            {canCleanupLegacy && (
              <button
                onClick={handleCleanupLegacy}
                className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Legacy LocalStorage</span>
              </button>
            )}
          </div>
        </div>

        {/* Download Backup Files */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase text-stone-600 dark:text-slate-400 tracking-wider">
            डाउनलोड व एक्सपोर्ट ऑप्शंस (Download & Export)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              onClick={handleDownloadJSON}
              className="p-3.5 bg-stone-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center group"
            >
              <FileJson className="w-6 h-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              <span>संपूर्ण डेटा बैकअप (.JSON)</span>
            </button>

            <button
              onClick={handleDownloadInvoicesCSV}
              className="p-3.5 bg-stone-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center group"
            >
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>बिक्री बिल एक्सपोर्ट (.CSV / Excel)</span>
            </button>

            <button
              onClick={handleDownloadStockCSV}
              className="p-3.5 bg-stone-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center group"
            >
              <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span>स्टॉक इन्वेंट्री एक्सपोर्ट (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="pt-3 border-t border-stone-200 dark:border-slate-800 space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-stone-600 dark:text-slate-400 tracking-wider">
            बैकअप रिस्टोर (Restore from JSON)
          </h4>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileRestore}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>JSON फाइल से डेटा रिस्टोर करें (Restore Data)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
