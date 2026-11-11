import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileJson, 
  CloudUpload,
  RefreshCw
} from 'lucide-react';
import { 
  downloadJSONFile, 
  downloadCSVFile, 
  uploadLocalStorageToFirestore 
} from '../lib/firestoreSync';
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
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const filename = `Swarnkar_Backup_${firmName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
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

    downloadCSVFile(rows, `Invoices_${firmName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
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

    downloadCSVFile(rows, `Stock_Inventory_${firmName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    setMessage('✅ Stock Inventory CSV Exported Successfully!');
  };

  const handleMigrateToFirestore = async () => {
    if (!window.confirm('क्या आप इस लोकल डेटा को Firestore क्लाउड में सुरक्षित अपलोड करना चाहते हैं? (Current Local Storage will be backed up)')) {
      return;
    }

    setMigrating(true);
    setMessage('');
    try {
      await uploadLocalStorageToFirestore(firmId, allFirmData);
      setMessage('🎉 डेटा सफलता-पूर्वक Firestore क्लाउड में अपलोड व सिंक हो गया है!');
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Migration Error: ${err.message || String(err)}`);
    } finally {
      setMigrating(false);
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
              Automatic Multi-Device Sync
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
            लोकल ब्राउज़र मेमोरी से समस्त रिकॉर्ड्स (स्टॉक, इनवॉइस, ग्राहक खाते, उधारी) को Firestore क्लाउड में 1-क्लिक अपलोड करें ताकि मोबाइल या अन्य पीसी बदलने पर डेटा सुरक्षित रहे।
          </p>
          <button
            onClick={handleMigrateToFirestore}
            disabled={migrating}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
          >
            {migrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>{migrating ? 'Firestore सिंक हो रहा है...' : 'लोकल डेटा Firestore क्लाउड में अपलोड करें'}</span>
          </button>
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
