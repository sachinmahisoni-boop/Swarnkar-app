import React, { useState, useEffect, useRef } from 'react';
import { GSTInvoice, ShopDetails } from '../types';
import { ShreemLogo } from './ShreemLogo';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  MessageCircle, 
  FileText, 
  Settings2,
  Sliders,
  Maximize2,
  Copy,
  Check,
  Building2,
  Sparkles,
  QrCode,
  ExternalLink,
  RectangleHorizontal,
  RectangleVertical
} from 'lucide-react';

export type PaperSize = 'A4' | 'A5' | 'POS_80MM' | 'POS_58MM';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginSize = 'compact' | 'normal' | 'wide';
export type CopyCount = 1 | 2 | 3;
export type FontScale = '90' | '100' | '110';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: GSTInvoice[] | null;
  shopDetails: ShopDetails;
  customLogo?: string;
}

interface PrintPreferences {
  paperSize: PaperSize;
  orientation: PageOrientation;
  marginSize: MarginSize;
  copyCount: CopyCount;
  fontScale: FontScale;
  showBankDetails: boolean;
  showTerms: boolean;
  showLogo: boolean;
  showHuidBadge: boolean;
}

const DEFAULT_PREFERENCES: PrintPreferences = {
  paperSize: 'A4',
  orientation: 'portrait',
  marginSize: 'normal',
  copyCount: 1, // Default 1 single copy
  fontScale: '100',
  showBankDetails: true,
  showTerms: true,
  showLogo: true,
  showHuidBadge: true
};

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoices,
  shopDetails,
  customLogo,
}) => {
  const [preferences, setPreferences] = useState<PrintPreferences>(() => {
    const saved = localStorage.getItem('jewel_print_preferences');
    if (saved) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PREFERENCES;
  });

  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('jewel_print_preferences', JSON.stringify(preferences));
  }, [preferences]);

  if (!isOpen || !invoices || invoices.length === 0) return null;

  const activeInvoice = invoices[0];
  const isGST = activeInvoice.invoiceType !== 'ESTIMATE_BILL';

  // Robust printing handler with popup window isolation
  const handlePrint = () => {
    try {
      const printContent = printableRef.current;
      if (!printContent) {
        window.print();
        return;
      }

      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${isGST ? 'Tax Invoice' : 'Estimate'} - ${invoices.length > 1 ? `Batch of ${invoices.length}` : activeInvoice.invoiceNumber}</title>
              <style>
                @page {
                  size: ${
                    preferences.paperSize === 'A4'
                      ? `A4 ${preferences.orientation}`
                      : preferences.paperSize === 'A5'
                      ? `A5 ${preferences.orientation}`
                      : preferences.paperSize === 'POS_80MM'
                      ? '80mm auto'
                      : '58mm auto'
                  };
                  margin: ${
                    preferences.paperSize.startsWith('POS')
                      ? '2mm'
                      : preferences.marginSize === 'compact'
                      ? '5mm'
                      : preferences.marginSize === 'wide'
                      ? '15mm'
                      : '10mm'
                  };
                }
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  background: white !important;
                  color: black !important;
                  margin: 0;
                  padding: 10px;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
                .print-break-after { page-break-after: always; break-after: page; }
              </style>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 400);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Print window error, falling back to window.print:', err);
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    const itemsSummary = activeInvoice.items
      .map(i => `• ${i.name} (${i.purity}) - Net Wt: ${i.netWeight}g | ₹${i.subtotal.toLocaleString('en-IN')}`)
      .join('\n');

    const message = `*${isGST ? 'TAX INVOICE' : 'ESTIMATE MEMO'} - ${shopDetails.name}*
${isGST ? 'Invoice No:' : 'Estimate No:'} ${activeInvoice.invoiceNumber}
Date: ${activeInvoice.date}
Customer: ${activeInvoice.customerName}
Phone: ${activeInvoice.customerPhone}

*Ornaments Summary:*
${itemsSummary}
${activeInvoice.oldMetalExchange && activeInvoice.oldMetalExchange.totalCreditAmount > 0 ? `\n*Old Metal Credit Deducted:* -₹${activeInvoice.oldMetalExchange.totalCreditAmount.toLocaleString('en-IN')}` : ''}

*Grand Total: ₹${activeInvoice.grandTotal.toLocaleString('en-IN')}*
Payment: ${activeInvoice.payment.dueAmount > 0 ? `Paid ₹${activeInvoice.payment.amountPaid.toLocaleString('en-IN')} | Due ₹${activeInvoice.payment.dueAmount.toLocaleString('en-IN')}` : 'Paid in Full'}

*${shopDetails.name}*
${shopDetails.address || shopDetails.cityStatePincode || 'Bhopal'}
Mobile: ${shopDetails.phone}`;

    let cleanPhone = activeInvoice.customerPhone ? activeInvoice.customerPhone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  const updatePref = <K extends keyof PrintPreferences>(key: K, value: PrintPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Generate copy labels array
  const copiesToRender = Array.from({ length: preferences.copyCount }, (_, i) => {
    if (i === 0) return 'ORIGINAL COPY (ग्राहक प्रति)';
    if (i === 1) return 'DUPLICATE COPY (दुकान प्रति / OFFICE COPY)';
    return 'TRIPLICATE COPY (लेखा प्रति / AUDIT COPY)';
  });

  // Calculate margin class
  const getMarginStyle = () => {
    switch (preferences.marginSize) {
      case 'compact': return 'p-2 sm:p-3';
      case 'wide': return 'p-6 sm:p-10';
      case 'normal':
      default: return 'p-4 sm:p-6';
    }
  };

  // Calculate font scale style
  const getFontScaleClass = () => {
    switch (preferences.fontScale) {
      case '90': return 'text-[92%]';
      case '110': return 'text-[108%]';
      default: return 'text-[100%]';
    }
  };

  // Calculate card width based on paper size & orientation
  const getCardWidthClass = () => {
    if (preferences.paperSize === 'POS_80MM') return 'max-w-md';
    if (preferences.paperSize === 'POS_58MM') return 'max-w-sm';
    if (preferences.orientation === 'landscape') return 'max-w-6xl';
    return 'max-w-4xl';
  };

  return (
    <div id="printable-invoice-modal-root" className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      
      {/* CSS Rule Injection for Window Printing */}
      <style>{`
        @media print {
          /* Hide app UI elements outside the modal during print */
          header, sidebar, nav, main, footer, .no-print {
            display: none !important;
          }

          @page {
            size: ${
              preferences.paperSize === 'A4'
                ? `A4 ${preferences.orientation}`
                : preferences.paperSize === 'A5'
                ? `A5 ${preferences.orientation}`
                : preferences.paperSize === 'POS_80MM'
                ? '80mm auto'
                : '58mm auto'
            };
            margin: ${
              preferences.paperSize.startsWith('POS')
                ? '2mm'
                : preferences.marginSize === 'compact'
                ? '5mm'
                : preferences.marginSize === 'wide'
                ? '15mm'
                : '10mm'
            };
          }

          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #printable-invoice-modal-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            backdrop-filter: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          #printable-invoice-card {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-hidden {
            display: none !important;
          }

          .print-break-after {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      <div id="printable-invoice-card" className={`bg-white border border-stone-200 rounded-3xl w-full shadow-2xl overflow-hidden my-auto text-stone-900 flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full transition-all duration-300 ${getCardWidthClass()}`}>
        
        {/* TOP CONTROL TOOLBAR (Hidden during printing) */}
        <div className="p-3 sm:p-4 bg-stone-900 text-stone-100 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0 border-b border-stone-800">
          
          <div className="flex items-center space-x-2.5">
            <span className="bg-amber-500 text-stone-950 text-xs font-mono font-black px-2.5 py-1 rounded-lg shadow-2xs">
              {invoices.length > 1 ? `BATCH: ${invoices.length}` : activeInvoice.invoiceNumber}
            </span>
            <div>
              <h3 className="font-extrabold text-white text-sm leading-tight">
                {invoices.length > 1 ? 'Bulk Batch Print (थोक प्रिंट)' : isGST ? 'GST टैक्स इनवॉइस (Official Bill)' : 'कच्चा बिल / कोटेशन (Estimate Memo)'}
              </h3>
              <p className="text-[11px] text-stone-400">
                प्रिंट फॉर्मेट, हॉरिजॉन्टल (Landscape) ओरिएंटेशन व मार्जिन चुनें
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            
            {/* Format & Settings Toggle */}
            <button
              onClick={() => setShowSettingsPanel(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                showSettingsPanel 
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm' 
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>प्रिंटर सेटिंग्स ({preferences.paperSize} • {preferences.orientation === 'landscape' ? 'Landscape' : 'Portrait'})</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Share invoice summary on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Main Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Click to print invoice with selected format"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट इनवॉइस (Print Bill)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EXPANDABLE PRINTER CONFIGURATOR PANEL (Hidden on print) */}
        {showSettingsPanel && (
          <div className="bg-stone-800 text-stone-100 p-4 border-b border-stone-700 space-y-4 print:hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-700">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4" /> Custom Invoice Printer Configuration (प्रिंटर, ओरिएंटेशन व पेज अनुकूलन)
              </span>
              <span className="text-[11px] text-stone-400">
                आपकी सेटिंग्स स्वतः सेव (Auto-Saved) होंगी
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              
              {/* 1. Printer Paper Size / Format */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block text-[11px]">
                  1. प्रिंटर पेपर साइज (Paper Size):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => updatePref('paperSize', 'A4')}
                    className={`p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.paperSize === 'A4'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    📄 A4 (Full Page)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('paperSize', 'A5')}
                    className={`p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.paperSize === 'A5'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    📑 A5 (Half Page)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('paperSize', 'POS_80MM')}
                    className={`p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.paperSize === 'POS_80MM'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    🧾 3" Thermal (80mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('paperSize', 'POS_58MM')}
                    className={`p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.paperSize === 'POS_58MM'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    🧾 2" POS (58mm)
                  </button>
                </div>
              </div>

              {/* 2. Page Orientation (Portrait vs Landscape Horizontal) */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block text-[11px]">
                  2. पेज दिशा (Orientation):
                </label>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => updatePref('orientation', 'portrait')}
                    className={`p-2 rounded-xl border text-left transition font-bold text-xs flex items-center justify-between ${
                      preferences.orientation === 'portrait'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                    title="Portrait (Vertical) - सीधा पन्ना"
                  >
                    <span className="flex items-center gap-1.5">
                      <RectangleVertical className="w-3.5 h-3.5" />
                      <span>Portrait (सीधा)</span>
                    </span>
                    {preferences.orientation === 'portrait' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => updatePref('orientation', 'landscape')}
                    className={`p-2 rounded-xl border text-left transition font-bold text-xs flex items-center justify-between ${
                      preferences.orientation === 'landscape'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                    title="Landscape (Horizontal) - चौड़ा हॉरिजॉन्टल पन्ना"
                  >
                    <span className="flex items-center gap-1.5">
                      <RectangleHorizontal className="w-3.5 h-3.5" />
                      <span>Landscape (चौड़ा)</span>
                    </span>
                    {preferences.orientation === 'landscape' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 3. Copy Count Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block text-[11px]">
                  3. कॉपियों की संख्या (Copies):
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updatePref('copyCount', 1)}
                    className={`flex-1 p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.copyCount === 1
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                    title="Print 1 single copy only"
                  >
                    1 Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('copyCount', 2)}
                    className={`flex-1 p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.copyCount === 2
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                    title="Print 2 copies: Original + Office Copy"
                  >
                    2 Copies
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('copyCount', 3)}
                    className={`flex-1 p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.copyCount === 3
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                    title="Print 3 copies: Customer + Office + Audit"
                  >
                    3 Copies
                  </button>
                </div>
              </div>

              {/* 4. Page Margin Size */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block text-[11px]">
                  4. पेज मार्जिन (Margins):
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updatePref('marginSize', 'compact')}
                    className={`flex-1 p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.marginSize === 'compact'
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    Compact (4mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('marginSize', 'normal')}
                    className={`flex-1 p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.marginSize === 'normal'
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    Normal (10mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('marginSize', 'wide')}
                    className={`flex-1 p-2 rounded-xl border text-center transition font-bold text-xs ${
                      preferences.marginSize === 'wide'
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    Wide (18mm)
                  </button>
                </div>
              </div>

              {/* 5. Display Toggles */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-300 block text-[11px]">
                  5. विवरण फ़िल्टर (Display):
                </label>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showBankDetails}
                      onChange={(e) => updatePref('showBankDetails', e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>बैंक विवरण</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showTerms}
                      onChange={(e) => updatePref('showTerms', e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>शर्तें</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.showHuidBadge}
                      onChange={(e) => updatePref('showHuidBadge', e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>HUID Tag Info</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PRINTABLE DOCUMENT BODY */}
        <div ref={printableRef} className={`overflow-y-auto bg-white flex-1 text-slate-900 print:overflow-visible print:p-0 ${getMarginStyle()}`}>
          
          {invoices.map((invoice, invIdx) => (
            <React.Fragment key={invoice.id}>
              {copiesToRender.map((copyLabel, copyIdx) => (
            <div 
              key={copyIdx} 
              className={`space-y-4 ${
                copyIdx > 0 ? 'mt-6 pt-6 border-t-2 border-dashed border-slate-300 print-break-after' : ''
              } ${getFontScaleClass()}`}
            >
              
              {/* Optional Copy Header Label if multiple copies selected */}
              {preferences.copyCount > 1 && (
                <div className="flex items-center justify-between bg-stone-100 border border-stone-300 px-3 py-1 rounded text-[11px] font-bold text-stone-700 print-hidden">
                  <span>{copyLabel}</span>
                  <span className="font-mono text-[10px]">Page {copyIdx + 1} of {preferences.copyCount}</span>
                </div>
              )}

              {/* RENDER BASED ON SELECTED PAPER SIZE */}
              {preferences.paperSize === 'POS_80MM' || preferences.paperSize === 'POS_58MM' ? (
                /* ============================================================ */
                /* THERMAL POS RECEIPT LAYOUT (3-inch 80mm & 2-inch 58mm) */
                /* ============================================================ */
                <div className={`mx-auto bg-white border border-slate-200 p-3 rounded shadow-xs print:border-none print:shadow-none print:p-0 font-mono text-xs text-slate-950 ${
                  preferences.paperSize === 'POS_58MM' ? 'max-w-[220px] text-[10px]' : 'max-w-[300px]'
                }`}>
                  {/* Shop Header */}
                  <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                    {preferences.showLogo && (
                      <div className="flex justify-center mb-1">
                        <ShreemLogo size="sm" showText={false} customLogo={customLogo || shopDetails.logoUrl} transparentBg={true} />
                      </div>
                    )}
                    <h2 className="font-bold text-sm uppercase leading-tight">{shopDetails.name}</h2>
                    <p className="text-[10px] text-slate-600">{shopDetails.tagline}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{shopDetails.address || shopDetails.cityStatePincode}</p>
                    <p className="text-[10px] font-bold mt-0.5">Ph: {shopDetails.phone}</p>
                    {isGST && shopDetails.gstin && (
                      <p className="text-[10px] text-slate-700">GSTIN: {shopDetails.gstin}</p>
                    )}
                  </div>

                  {/* Bill Type Badge */}
                  <div className="text-center font-bold uppercase text-[11px] py-1 bg-slate-100 border border-slate-300 rounded mb-2">
                    {isGST ? 'TAX INVOICE' : 'ESTIMATE MEMO'}
                  </div>

                  {/* Bill Details */}
                  <div className="border-b border-dashed border-slate-300 pb-2 mb-2 text-[11px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>{isGST ? 'Inv No:' : 'Est No:'}</span>
                      <span className="font-bold">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{invoice.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-bold truncate max-w-[140px]">{invoice.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{invoice.customerPhone}</span>
                    </div>
                  </div>

                  {/* Items Summary Table */}
                  <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="border-b border-slate-300">
                          <th className="py-1">Item</th>
                          <th className="py-1 text-right">Net Wt</th>
                          <th className="py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoice.items.map((item, i) => (
                          <tr key={i}>
                            <td className="py-1 pr-1">
                              <span className="font-bold block">{item.name}</span>
                              <span className="text-[9px] text-slate-600">{item.purity} • Tag: {item.tagNo}</span>
                              {preferences.showHuidBadge && item.huid && (
                                <span className="block text-[8px] font-bold text-emerald-800">HUID: {item.huid}</span>
                              )}
                            </td>
                            <td className="py-1 text-right align-top">{item.netWeight.toFixed(2)}g</td>
                            <td className="py-1 text-right align-top font-bold">₹{item.subtotal.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Old Metal Exchange Deduction */}
                  {invoice.oldMetalExchange && invoice.oldMetalExchange.totalCreditAmount > 0 && (
                    <div className="border-b border-dashed border-slate-300 pb-1.5 mb-2 text-[10px] space-y-0.5">
                      <div className="flex justify-between text-amber-900 font-bold">
                        <span>Old Metal Credit:</span>
                        <span>-₹{invoice.oldMetalExchange.totalCreditAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[9px] text-slate-600">
                        {invoice.oldMetalExchange.purity} {invoice.oldMetalExchange.metal} ({invoice.oldMetalExchange.grossWeight.toFixed(2)}g)
                      </div>
                    </div>
                  )}

                  {/* Calculations */}
                  <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Items Subtotal:</span>
                      <span>₹{invoice.itemsSubtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {isGST && (
                      <>
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>CGST (1.5%):</span>
                          <span>₹{invoice.cgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>SGST (1.5%):</span>
                          <span>₹{invoice.sgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}

                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 text-[10px]">
                        <span>Discount:</span>
                        <span>-₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-extrabold text-sm border-t border-slate-400 pt-1 text-slate-950">
                      <span>GRAND TOTAL:</span>
                      <span>₹{invoice.grandTotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between text-[10px] pt-0.5">
                      <span>Paid ({invoice.payment.method}):</span>
                      <span className="font-bold">₹{invoice.payment.amountPaid.toLocaleString('en-IN')}</span>
                    </div>

                    {invoice.payment.dueAmount > 0 && (
                      <div className="flex justify-between text-rose-700 font-bold text-[10px]">
                        <span>Balance Due:</span>
                        <span>₹{invoice.payment.dueAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Terms */}
                  {preferences.showTerms && (
                    <div className="text-center text-[9px] text-slate-600 space-y-0.5 pt-1">
                      <p>• Goods sold guaranteed BIS HUID Hallmarked.</p>
                      <p>• Thank you for shopping with us!</p>
                    </div>
                  )}
                </div>
              ) : (
                /* ============================================================ */
                /* STANDARD LASER / INKJET LAYOUT (A4 & A5 Portrait / Landscape) */
                /* ============================================================ */
                <div className={`border border-slate-300 rounded-xl p-4 sm:p-6 shadow-xs print:border-none print:p-0 print:shadow-none space-y-4 bg-white ${
                  preferences.orientation === 'landscape' ? 'w-full' : ''
                }`}>
                  
                  {/* Header: Logo & Shop Details */}
                  <div className="border-b-2 border-amber-600 pb-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      
                      <div className="flex items-center gap-3">
                        {preferences.showLogo && (
                          <ShreemLogo size={preferences.paperSize === 'A5' ? 'md' : 'lg'} showText={false} customLogo={customLogo || shopDetails.logoUrl} transparentBg={true} />
                        )}
                        <div>
                          <h1 className={`font-black text-amber-950 uppercase tracking-tight font-serif leading-none ${
                            preferences.paperSize === 'A5' ? 'text-xl' : 'text-2xl sm:text-3xl'
                          }`}>
                            {shopDetails.name}
                          </h1>
                          <p className="text-xs font-semibold text-amber-800 tracking-wide mt-0.5">
                            {shopDetails.tagline}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 max-w-md font-medium">
                            {shopDetails.address || shopDetails.cityStatePincode}
                          </p>
                          <p className="text-xs text-slate-700 font-semibold mt-0.5">
                            Phone: <span className="font-mono text-slate-900">{shopDetails.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className={`inline-block px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${
                          isGST ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-slate-200 text-slate-800 border border-slate-300'
                        }`}>
                          {isGST ? 'TAX INVOICE (कर बीजक)' : 'ESTIMATE BILL (अनुमान रसीद)'}
                        </div>
                        {isGST ? (
                          <div className="text-[11px] text-slate-700 font-mono space-y-0.5">
                            <div>GSTIN: <strong className="text-slate-950">{shopDetails.gstin}</strong></div>
                            {shopDetails.bisHallmarkRegNo && <div>BIS Reg No: <strong className="text-slate-950">{shopDetails.bisHallmarkRegNo}</strong></div>}
                            {shopDetails.panNo && <div>PAN: <strong className="text-slate-950">{shopDetails.panNo}</strong></div>}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-medium">
                            * Quotation Estimate Only - Non-taxable memo
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Customer & Invoice Info Meta Box */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">Customer Details:</span>
                      <p className="font-bold text-sm text-slate-900">{invoice.customerName}</p>
                      <p className="text-slate-600">{invoice.customerAddress}</p>
                      <p className="text-slate-700">Mobile: <strong className="font-mono">{invoice.customerPhone}</strong></p>
                      {invoice.customerGSTIN && (
                        <p className="text-slate-700">Customer GSTIN: <strong className="font-mono">{invoice.customerGSTIN}</strong></p>
                      )}
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="flex justify-end gap-2 sm:gap-4">
                        <span className="text-slate-500">{isGST ? 'Invoice No:' : 'Estimate No:'}</span>
                        <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-end gap-2 sm:gap-4">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-mono text-slate-900">{invoice.date}</span>
                      </div>
                      <div className="flex justify-end gap-2 sm:gap-4">
                        <span className="text-slate-500">Counter:</span>
                        <span className="font-bold text-slate-800">{invoice.counterName || 'Main Counter'}</span>
                      </div>
                      {invoice.placeOfSupply && (
                        <div className="flex justify-end gap-2 sm:gap-4">
                          <span className="text-slate-500">Place of Supply:</span>
                          <span className="text-slate-900">{invoice.placeOfSupply}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ornaments Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                          <th className="p-1.5 border-r border-slate-300 text-center w-7">#</th>
                          <th className="p-1.5 border-r border-slate-300">Description of Jewellery</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">HSN</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">Purity</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Gross Wt</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Stone Wt</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Net Wt</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Rate ₹/g</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Making</th>
                          <th className="p-1.5 text-right">Total ₹</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {invoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-1.5 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-200">
                              <span className="font-bold text-slate-900 block">{item.name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
                                <span>Tag: {item.tagNo}</span>
                                {preferences.showHuidBadge && item.huid && (
                                  <span className="text-emerald-800 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                                    HUID: {item.huid} (BIS 916)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-1.5 text-center border-r border-slate-200 font-mono text-slate-600">{item.hsnCode}</td>
                            <td className="p-1.5 text-center border-r border-slate-200 font-bold text-amber-900">{item.purity}</td>
                            <td className="p-1.5 text-right border-r border-slate-200 font-mono">{item.grossWeight.toFixed(2)}g</td>
                            <td className="p-1.5 text-right border-r border-slate-200 font-mono text-slate-600">
                              {item.stoneWeight > 0 ? `${item.stoneWeight.toFixed(2)}g` : '-'}
                            </td>
                            <td className="p-1.5 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                              {item.netWeight.toFixed(2)}g
                            </td>
                            <td className="p-1.5 text-right border-r border-slate-200 font-mono">₹{item.metalRateApplied.toLocaleString('en-IN')}</td>
                            <td className="p-1.5 text-right border-r border-slate-200 font-mono">₹{item.makingCharge.toLocaleString('en-IN')}</td>
                            <td className="p-1.5 text-right font-mono font-bold text-slate-950">₹{item.subtotal.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Old Metal Buyback Deduction Box */}
                  {invoice.oldMetalExchange && invoice.oldMetalExchange.totalCreditAmount > 0 && (
                    <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-300 text-xs">
                      <span className="font-bold text-amber-950 block text-[11px] uppercase tracking-wide">
                        Old Metal Buyback / Exchange (पुरानी सोना / चांदी वापसी):
                      </span>
                      <div className="grid grid-cols-4 gap-2 mt-0.5 text-[11px] font-mono">
                        <div>Metal: <strong>{invoice.oldMetalExchange.purity} {invoice.oldMetalExchange.metal}</strong></div>
                        <div>Gross Wt: <strong>{invoice.oldMetalExchange.grossWeight.toFixed(2)}g</strong></div>
                        <div>Melt Loss: <strong>{invoice.oldMetalExchange.dustWastageGram.toFixed(2)}g</strong></div>
                        <div className="text-right font-bold text-rose-700">
                          Credit: -₹{invoice.oldMetalExchange.totalCreditAmount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invoice Totals & Calculations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    
                    {/* Left: Bank Details & Terms */}
                    <div className="space-y-2 text-slate-600 text-[11px]">
                      {preferences.showBankDetails && shopDetails.bankName && (
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="font-bold text-slate-800 block text-[10px] uppercase">Bank Account Details (NEFT/RTGS/UPI):</span>
                          <div>Bank: <strong className="text-slate-900">{shopDetails.bankName}</strong></div>
                          <div>A/C No: <strong className="font-mono text-slate-900">{shopDetails.accountNo}</strong></div>
                          <div>IFSC: <strong className="font-mono text-slate-900">{shopDetails.ifscCode}</strong></div>
                        </div>
                      )}

                      {preferences.showTerms && (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-700 block text-[10px]">Terms & Conditions:</span>
                          <ul className="list-disc pl-3 text-[10px] space-y-0.5 text-slate-500">
                            <li>All gold ornaments sold are 100% BIS 6-Digit HUID Hallmarked.</li>
                            <li>Exchange value calculated on prevailing daily bullion rate in Sarafa.</li>
                            <li>Subject to local jurisdiction only.</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Right: Tax & Grand Total */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Gross Items Total:</span>
                        <span className="font-mono font-bold text-slate-800">₹{invoice.itemsSubtotal.toLocaleString('en-IN')}</span>
                      </div>

                      {invoice.oldMetalDeduction > 0 && (
                        <div className="flex justify-between text-rose-700">
                          <span>Less: Old Metal Credit:</span>
                          <span className="font-mono font-bold">- ₹{invoice.oldMetalDeduction.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-800">
                        <span>Taxable Amount:</span>
                        <span className="font-mono">₹{invoice.taxableAmount.toLocaleString('en-IN')}</span>
                      </div>

                      {isGST && (
                        invoice.isInterState ? (
                          <div className="flex justify-between text-slate-600">
                            <span>IGST (3.0%):</span>
                            <span className="font-mono font-bold">₹{invoice.igstAmount.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-slate-600">
                              <span>CGST (1.5%):</span>
                              <span className="font-mono font-bold">₹{invoice.cgstAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>SGST (1.5%):</span>
                              <span className="font-mono font-bold">₹{invoice.sgstAmount.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )
                      )}

                      {invoice.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount / Round off:</span>
                          <span className="font-mono font-bold">- ₹{invoice.discountAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center p-2 bg-amber-100/90 border border-amber-300 rounded text-amber-950 font-black text-sm mt-1.5">
                        <span>GRAND TOTAL:</span>
                        <span className="font-mono text-base">₹{invoice.grandTotal.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                        <div className="flex justify-between text-slate-700">
                          <span>Payment ({invoice.payment.method}):</span>
                          <span className="font-bold text-emerald-700">Paid ₹{invoice.payment.amountPaid.toLocaleString('en-IN')}</span>
                        </div>
                        {invoice.payment.dueAmount > 0 && (
                          <div className="flex justify-between text-rose-700 font-bold">
                            <span>Balance Due:</span>
                            <span>₹{invoice.payment.dueAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Signatures */}
                  <div className="border-t border-slate-300 pt-4 mt-4 flex justify-between items-end text-xs">
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1"></div>
                      <span className="text-[10px] text-slate-500">Customer's Signature</span>
                    </div>

                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-800">For {shopDetails.name}</p>
                      <div className="w-36 border-b border-slate-400 my-3"></div>
                      <span className="text-[10px] text-slate-500">Authorised Signatory</span>
                    </div>
                  </div>

                </div>
              )}

              </div>
            ))}
            
            {/* Batch Print Page Break for next invoice */}
            {invIdx < invoices.length - 1 && (
              <div className="print-break-after border-t-4 border-double border-slate-400 my-8 py-4 text-center text-slate-400 no-print font-bold uppercase tracking-widest">
                --- Next Invoice in Batch (अगला बिल) ---
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      </div>
    </div>
  );
};
