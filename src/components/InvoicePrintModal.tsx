import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GSTInvoice, ShopDetails } from '../types';
import { roundPaise } from '../lib/pricing';
import { ShreemLogo } from './ShreemLogo';
import {
  X,
  Printer,
  MessageCircle,
  Settings2,
  Sliders,
  Check,
  RectangleHorizontal,
  RectangleVertical,
  FileText,
  Receipt,
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
  copyCount: 1,
  fontScale: '100',
  showBankDetails: true,
  showTerms: true,
  showLogo: true,
  showHuidBadge: true,
};

function formatCurrency(amount: number): string {
  const rounded = roundPaise(amount || 0);
  const hasPaise = Math.abs(rounded - Math.round(rounded)) > 0.001;
  return rounded.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function getPaperLabel(paperSize: PaperSize): string {
  switch (paperSize) {
    case 'A4':
      return 'A4 (210×297mm)';
    case 'A5':
      return 'A5 (148×210mm)';
    case 'POS_80MM':
      return 'Thermal 80mm (3")';
    case 'POS_58MM':
      return 'Thermal 58mm (2")';
  }
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  invoices,
  shopDetails,
  customLogo,
}) => {
  const [preferences, setPreferences] = useState<PrintPreferences>(() => {
    const saved = localStorage.getItem('jewel_print_preferences');
    const shopDefault = shopDetails.defaultInvoiceLayout || 'A4';
    if (saved) {
      try {
        return { ...DEFAULT_PREFERENCES, paperSize: shopDefault, ...JSON.parse(saved) };
      } catch {
        return { ...DEFAULT_PREFERENCES, paperSize: shopDefault };
      }
    }
    return { ...DEFAULT_PREFERENCES, paperSize: shopDefault };
  });

  const [lastThermalSize, setLastThermalSize] = useState<'POS_80MM' | 'POS_58MM'>(() =>
    preferences.paperSize === 'POS_58MM' ? 'POS_58MM' : 'POS_80MM'
  );
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);

  // Respect ShopSettingsModal saved defaultInvoiceLayout whenever updated
  useEffect(() => {
    const shopDefault = shopDetails.defaultInvoiceLayout;
    if (!shopDefault) return;
    const prevShopDefault = localStorage.getItem('jewel_shop_default_layout');
    if (prevShopDefault !== shopDefault) {
      localStorage.setItem('jewel_shop_default_layout', shopDefault);
      setPreferences((prev) => ({
        ...prev,
        paperSize: shopDefault,
        orientation: 'portrait',
      }));
    }
  }, [shopDetails.defaultInvoiceLayout]);

  useEffect(() => {
    localStorage.setItem('jewel_print_preferences', JSON.stringify(preferences));
    if (preferences.paperSize === 'POS_80MM' || preferences.paperSize === 'POS_58MM') {
      setLastThermalSize(preferences.paperSize);
    }
  }, [preferences]);

  if (!isOpen || !invoices || invoices.length === 0) return null;

  const activeInvoice = invoices[0];
  const isGST = activeInvoice.invoiceType !== 'ESTIMATE_BILL';
  const isThermal =
    preferences.paperSize === 'POS_80MM' || preferences.paperSize === 'POS_58MM';
  const isA5 = preferences.paperSize === 'A5';

  const updatePref = <K extends keyof PrintPreferences>(
    key: K,
    value: PrintPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const buildWhatsAppUrl = () => {
    const itemsSummary = activeInvoice.items
      .map(
        (i) =>
          `• ${i.name} (${i.purity}) - Net Wt: ${i.netWeight.toFixed(2)}g | ₹${formatCurrency(i.subtotal)}`
      )
      .join('\n');

    const message = `*${isGST ? 'TAX INVOICE' : 'ESTIMATE MEMO'} - ${shopDetails.name}*
${isGST ? 'Invoice No:' : 'Estimate No:'} ${activeInvoice.invoiceNumber}
Date: ${activeInvoice.date}
Customer: ${activeInvoice.customerName}
Phone: ${activeInvoice.customerPhone}

*Ornaments Summary:*
${itemsSummary}
${
  activeInvoice.oldMetalExchange && activeInvoice.oldMetalExchange.totalCreditAmount > 0
    ? `\n*Old Metal Credit Deducted:* -₹${formatCurrency(activeInvoice.oldMetalExchange.totalCreditAmount)}`
    : ''
}

*Grand Total: ₹${formatCurrency(activeInvoice.grandTotal)}*
Payment: ${
      activeInvoice.payment.dueAmount > 0
        ? `Paid ₹${formatCurrency(activeInvoice.payment.amountPaid)} | Due ₹${formatCurrency(activeInvoice.payment.dueAmount)}`
        : 'Paid in Full'
    }

*${shopDetails.name}*
${shopDetails.address || shopDetails.cityStatePincode || 'Bhopal'}
Mobile: ${shopDetails.phone}`;

    let cleanPhone = activeInvoice.customerPhone
      ? activeInvoice.customerPhone.replace(/[^0-9]/g, '')
      : '';
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const copiesToRender = Array.from({ length: preferences.copyCount }, (_, i) => {
    if (i === 0) return 'ORIGINAL FOR RECIPIENT (ग्राहक प्रति)';
    if (i === 1) return 'DUPLICATE FOR SUPPLIER (दुकान प्रति / OFFICE COPY)';
    return 'TRIPLICATE FOR AUDIT (लेखा प्रति / AUDIT COPY)';
  });

  const getModalWidthClass = () => {
    if (preferences.paperSize === 'POS_58MM') return 'max-w-lg';
    if (preferences.paperSize === 'POS_80MM') return 'max-w-xl';
    if (preferences.paperSize === 'A5') {
      return preferences.orientation === 'landscape' ? 'max-w-4xl' : 'max-w-2xl';
    }
    return preferences.orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl';
  };

  const getSheetPreviewWidthClass = () => {
    if (preferences.paperSize === 'POS_58MM') {
      return 'w-[220px] max-w-full print:w-[54mm] print:max-w-[54mm]';
    }
    if (preferences.paperSize === 'POS_80MM') {
      return 'w-[302px] max-w-full print:w-[76mm] print:max-w-[76mm]';
    }
    if (preferences.paperSize === 'A5') {
      return preferences.orientation === 'landscape'
        ? 'max-w-[794px] w-full print:max-w-none print:w-full'
        : 'max-w-[560px] w-full print:max-w-none print:w-full';
    }
    return preferences.orientation === 'landscape'
      ? 'max-w-[1100px] w-full print:max-w-none print:w-full'
      : 'max-w-[794px] w-full print:max-w-none print:w-full';
  };

  const getSheetPaddingClass = () => {
    if (isThermal) {
      return preferences.paperSize === 'POS_58MM'
        ? 'p-2.5 print:p-0'
        : 'p-3 print:p-0';
    }
    if (isA5) {
      switch (preferences.marginSize) {
        case 'compact':
          return 'p-3 sm:p-4 print:p-0';
        case 'wide':
          return 'p-5 sm:p-7 print:p-0';
        case 'normal':
        default:
          return 'p-4 sm:p-5 print:p-0';
      }
    }
    switch (preferences.marginSize) {
      case 'compact':
        return 'p-3 sm:p-4 print:p-0';
      case 'wide':
        return 'p-6 sm:p-10 print:p-0';
      case 'normal':
      default:
        return 'p-5 sm:p-7 print:p-0';
    }
  };

  const getFontScaleStyle = (): React.CSSProperties => {
    if (preferences.fontScale === '90') return { fontSize: '90%' };
    if (preferences.fontScale === '110') return { fontSize: '110%' };
    return { fontSize: '100%' };
  };

  const pageSizeCss =
    preferences.paperSize === 'A4'
      ? `A4 ${preferences.orientation}`
      : preferences.paperSize === 'A5'
      ? `A5 ${preferences.orientation}`
      : preferences.paperSize === 'POS_80MM'
      ? '80mm auto'
      : '58mm auto';

  const pageMarginCss = isThermal
    ? '2mm'
    : isA5
    ? preferences.marginSize === 'compact'
      ? '4mm'
      : preferences.marginSize === 'wide'
      ? '11mm'
      : '7mm'
    : preferences.marginSize === 'compact'
    ? '5mm'
    : preferences.marginSize === 'wide'
    ? '15mm'
    : '10mm';

  const modalContent = (
    <div id="printable-invoice-portal-root">
      {/* Native Window Print Isolation & Dynamic @page Rules */}
      <style>{`
        @page {
          size: ${pageSizeCss};
          margin: ${pageMarginCss};
        }

        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body > *:not(#printable-invoice-portal-root) {
            display: none !important;
          }

          #printable-invoice-portal-root,
          #printable-invoice-modal-root,
          #printable-invoice-card,
          #printable-invoice-scroll-area {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          .printable-paper-sheet {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }

          .print-hidden {
            display: none !important;
          }

          .print-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div
        id="printable-invoice-modal-root"
        className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <div
          id="printable-invoice-card"
          className={`bg-white border border-stone-200 rounded-2xl w-full shadow-2xl overflow-hidden my-auto text-stone-900 flex flex-col max-h-[95vh] transition-all duration-200 ${getModalWidthClass()}`}
        >
          {/* TOP CONTROL TOOLBAR (Hidden during printing) */}
          <div className="p-3 sm:p-3.5 bg-stone-900 text-stone-100 flex flex-wrap items-center justify-between gap-2.5 print:hidden shrink-0 border-b border-stone-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="bg-amber-500 text-stone-950 text-xs font-mono font-black px-2.5 py-1 rounded-lg shadow-2xs shrink-0">
                {invoices.length > 1
                  ? `BATCH: ${invoices.length}`
                  : activeInvoice.invoiceNumber}
              </span>
              <div className="min-w-0">
                <h3 className="font-extrabold text-white text-sm leading-tight truncate">
                  {invoices.length > 1
                    ? 'Bulk Batch Print (थोक प्रिंट)'
                    : isGST
                    ? 'GST टैक्स इनवॉइस (Official Bill)'
                    : 'कच्चा बिल / कोटेशन (Estimate Memo)'}
                </h3>
                <p className="text-[11px] text-stone-400 truncate">
                  Active Layout: <strong className="text-amber-300">{getPaperLabel(preferences.paperSize)}</strong>
                  {!isThermal && (
                    <span> • {preferences.orientation === 'landscape' ? 'Landscape' : 'Portrait'}</span>
                  )}
                  {shopDetails.defaultInvoiceLayout && preferences.paperSize !== shopDetails.defaultInvoiceLayout && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          paperSize: shopDetails.defaultInvoiceLayout || 'A4',
                          orientation: 'portrait',
                        }))
                      }
                      className="ml-2 underline text-emerald-300 hover:text-emerald-200 cursor-pointer"
                    >
                      Use Shop Default ({shopDetails.defaultInvoiceLayout === 'POS_80MM' ? '80mm' : shopDetails.defaultInvoiceLayout})
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* QUICK PAPER LAYOUT TOGGLE BAR (A4 / A5 / Thermal) + ACTIONS */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Segmented Layout Toggle: A4 | A5 | Thermal */}
              <div
                role="group"
                aria-label="Select print paper layout"
                className="inline-flex items-center bg-stone-950 p-0.5 rounded-xl border border-stone-700"
              >
                <button
                  type="button"
                  onClick={() => updatePref('paperSize', 'A4')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    preferences.paperSize === 'A4'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => updatePref('paperSize', 'A5')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    preferences.paperSize === 'A5'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>A5</span>
                </button>
                <button
                  type="button"
                  onClick={() => updatePref('paperSize', lastThermalSize)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    isThermal
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Thermal</span>
                </button>
              </div>

              {/* Contextual Sub-Toggle: 80mm / 58mm for Thermal OR Portrait / Landscape for A4/A5 */}
              {isThermal ? (
                <div
                  role="group"
                  aria-label="Thermal paper width"
                  className="inline-flex items-center bg-stone-950 p-0.5 rounded-xl border border-stone-700 text-[11px]"
                >
                  <button
                    type="button"
                    onClick={() => updatePref('paperSize', 'POS_80MM')}
                    className={`px-2 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                      preferences.paperSize === 'POS_80MM'
                        ? 'bg-emerald-500 text-stone-950'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    80mm
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePref('paperSize', 'POS_58MM')}
                    className={`px-2 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                      preferences.paperSize === 'POS_58MM'
                        ? 'bg-emerald-500 text-stone-950'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    58mm
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    updatePref(
                      'orientation',
                      preferences.orientation === 'portrait' ? 'landscape' : 'portrait'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-stone-800 text-stone-200 border border-stone-700 hover:bg-stone-700 transition cursor-pointer"
                  title="Toggle Portrait / Landscape orientation"
                >
                  {preferences.orientation === 'landscape' ? (
                    <RectangleHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <RectangleVertical className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="hidden md:inline">
                    {preferences.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                  </span>
                </button>
              )}

              {/* More Settings Toggle */}
              <button
                type="button"
                onClick={() => setShowSettingsPanel((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  showSettingsPanel
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
                title="More printer settings (margins, copies, font scale, toggles)"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">सेटिंग्स</span>
              </button>

              {/* WhatsApp Share Link */}
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Share invoice summary on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              {/* Main Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                title="Print invoice with selected paper layout"
              >
                <Printer className="w-4 h-4" />
                <span>प्रिंट (Print)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close print preview"
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* EXPANDABLE PRINTER CONFIGURATOR PANEL (Hidden on print) */}
          {showSettingsPanel && (
            <div className="bg-stone-800 text-stone-100 p-4 border-b border-stone-700 space-y-3 print:hidden shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-stone-700">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> Printer & Page Configuration (प्रिंटर सेटिंग्स)
                </span>
                <span className="text-[11px] text-stone-400">
                  Preferences auto-saved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Paper Size */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-300 block text-[11px]">
                    1. पेपर साइज (Paper Size):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'A4', label: 'A4 Full' },
                        { id: 'A5', label: 'A5 Half' },
                        { id: 'POS_80MM', label: '80mm POS' },
                        { id: 'POS_58MM', label: '58mm POS' },
                      ] as { id: PaperSize; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updatePref('paperSize', opt.id)}
                        className={`p-1.5 rounded-lg border text-center transition font-bold text-[11px] cursor-pointer ${
                          preferences.paperSize === opt.id
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                            : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Orientation */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-300 block text-[11px]">
                    2. पेज दिशा (Orientation):
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={isThermal}
                      onClick={() => updatePref('orientation', 'portrait')}
                      className={`p-1.5 rounded-lg border text-left transition font-bold text-[11px] flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        preferences.orientation === 'portrait'
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                          : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <RectangleVertical className="w-3.5 h-3.5" />
                        <span>Portrait (सीधा)</span>
                      </span>
                      {preferences.orientation === 'portrait' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      disabled={isThermal}
                      onClick={() => updatePref('orientation', 'landscape')}
                      className={`p-1.5 rounded-lg border text-left transition font-bold text-[11px] flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        preferences.orientation === 'landscape'
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                          : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <RectangleHorizontal className="w-3.5 h-3.5" />
                        <span>Landscape (चौड़ा)</span>
                      </span>
                      {preferences.orientation === 'landscape' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 3. Copy Count */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-300 block text-[11px]">
                    3. कॉपियां (Copies):
                  </label>
                  <div className="flex items-center gap-1.5">
                    {([1, 2, 3] as CopyCount[]).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => updatePref('copyCount', cnt)}
                        className={`flex-1 p-1.5 rounded-lg border text-center transition font-bold text-[11px] cursor-pointer ${
                          preferences.copyCount === cnt
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                            : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                  <label className="font-bold text-stone-300 block text-[11px] pt-1">
                    फ़ॉन्ट स्केल (Font Size):
                  </label>
                  <div className="flex items-center gap-1.5">
                    {(['90', '100', '110'] as FontScale[]).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => updatePref('fontScale', sc)}
                        className={`flex-1 p-1 rounded-lg border text-center transition font-mono font-bold text-[10px] cursor-pointer ${
                          preferences.fontScale === sc
                            ? 'bg-amber-500 text-stone-950 border-amber-400'
                            : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {sc}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Margins */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-300 block text-[11px]">
                    4. पेज मार्जिन (Margins):
                  </label>
                  <div className="flex flex-col gap-1">
                    {(
                      [
                        { id: 'compact', label: 'Compact (कम जगह)' },
                        { id: 'normal', label: 'Normal (मानक)' },
                        { id: 'wide', label: 'Wide (अधिक मार्जिन)' },
                      ] as { id: MarginSize; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={isThermal}
                        onClick={() => updatePref('marginSize', m.id)}
                        className={`p-1.5 rounded-lg border text-left transition font-bold text-[11px] cursor-pointer disabled:opacity-40 ${
                          preferences.marginSize === m.id
                            ? 'bg-amber-500 text-stone-950 border-amber-400'
                            : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Display Toggles */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-300 block text-[11px]">
                    5. विवरण फ़िल्टर (Display):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 text-[11px]">
                    <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.showLogo}
                        onChange={(e) => updatePref('showLogo', e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Shop Logo</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.showBankDetails}
                        onChange={(e) => updatePref('showBankDetails', e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>बैंक विवरण (Bank)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.showTerms}
                        onChange={(e) => updatePref('showTerms', e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>शर्तें (Terms)</span>
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

          {/* PRINTABLE DOCUMENT PREVIEW & PRINT BODY */}
          <div
            id="printable-invoice-scroll-area"
            className="overflow-y-auto bg-stone-200/80 flex-1 p-3 sm:p-6 text-slate-900"
          >
            {invoices.map((invoice, invIdx) => {
              const invIsGST = invoice.invoiceType !== 'ESTIMATE_BILL';
              const invCancelled = invoice.status === 'Cancelled';
              const hasMoreInvoices = invIdx < invoices.length - 1;

              return (
                <React.Fragment key={invoice.id}>
                  {copiesToRender.map((copyLabel, copyIdx) => {
                    const hasMoreCopies = copyIdx < copiesToRender.length - 1;
                    const needsPageBreakAfter = hasMoreCopies || hasMoreInvoices;

                    return (
                      <div
                        key={copyIdx}
                        style={getFontScaleStyle()}
                        className={`printable-paper-sheet mx-auto bg-white border border-stone-300 shadow-lg rounded-lg ${getSheetPreviewWidthClass()} ${getSheetPaddingClass()} ${
                          copyIdx > 0 || invIdx > 0 ? 'mt-6 print:mt-0' : ''
                        } ${needsPageBreakAfter ? 'print-break-after' : ''}`}
                      >
                        {/* Paper-Size Preview Indicator (Screen Only) */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-200 pb-1.5 mb-2 print:hidden">
                          <span>PREVIEW: {getPaperLabel(preferences.paperSize)}</span>
                          <span>
                            {preferences.copyCount > 1
                              ? `Copy ${copyIdx + 1}/${preferences.copyCount}`
                              : isThermal
                              ? 'Continuous Roll'
                              : preferences.orientation.toUpperCase()}
                          </span>
                        </div>

                        {/* Copy Header Label (shown in both preview & print when multiple copies selected) */}
                        {preferences.copyCount > 1 && (
                          <div className="flex items-center justify-between bg-stone-100 border border-stone-300 px-2.5 py-0.5 rounded text-[10px] font-bold text-stone-700 mb-2">
                            <span>{copyLabel}</span>
                            <span className="font-mono">
                              Copy {copyIdx + 1} of {preferences.copyCount}
                            </span>
                          </div>
                        )}

                        {/* Cancelled Stamp */}
                        {invCancelled && (
                          <div className="mb-2 p-1.5 bg-rose-50 border-2 border-rose-500 rounded text-center text-rose-700 font-black text-xs uppercase tracking-widest">
                            CANCELLED INVOICE (रद्द किया गया बिल)
                          </div>
                        )}

                        {isThermal ? (
                          /* ============================================================ */
                          /* THERMAL POS RECEIPT LAYOUT (80mm / 58mm)                     */
                          /* ============================================================ */
                          <div
                            className={`font-mono text-slate-950 ${
                              preferences.paperSize === 'POS_58MM'
                                ? 'text-[10px] leading-tight'
                                : 'text-[11px] leading-snug'
                            }`}
                          >
                            {/* Shop Header */}
                            <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                              {preferences.showLogo && (customLogo || shopDetails.logoUrl) && (
                                <div className="flex justify-center mb-1">
                                  <ShreemLogo
                                    size="sm"
                                    showText={false}
                                    customLogo={customLogo || shopDetails.logoUrl}
                                    transparentBg={true}
                                  />
                                </div>
                              )}
                              <h2 className="font-black text-sm uppercase leading-tight">
                                {shopDetails.name}
                              </h2>
                              {shopDetails.tagline && (
                                <p className="text-[9px] text-slate-600">{shopDetails.tagline}</p>
                              )}
                              <p className="text-[9px] text-slate-700 mt-0.5">
                                {shopDetails.address || shopDetails.cityStatePincode}
                              </p>
                              <p className="text-[10px] font-bold mt-0.5">
                                Ph: {shopDetails.phone}
                              </p>
                              {invIsGST && shopDetails.gstin && (
                                <p className="text-[9px] font-bold text-slate-800">
                                  GSTIN: {shopDetails.gstin}
                                </p>
                              )}
                              {invIsGST && shopDetails.bisHallmarkRegNo && (
                                <p className="text-[9px] text-slate-700">
                                  BIS: {shopDetails.bisHallmarkRegNo}
                                </p>
                              )}
                            </div>

                            {/* Bill Type Badge */}
                            <div className="text-center font-black uppercase text-[10px] py-1 bg-slate-100 border border-slate-300 rounded mb-2">
                              {invIsGST ? 'TAX INVOICE' : 'ESTIMATE MEMO'}
                            </div>

                            {/* Bill Meta */}
                            <div className="border-b border-dashed border-slate-400 pb-1.5 mb-2 text-[10px] space-y-0.5">
                              <div className="flex justify-between gap-1">
                                <span>{invIsGST ? 'Inv No:' : 'Est No:'}</span>
                                <span className="font-bold text-right">{invoice.invoiceNumber}</span>
                              </div>
                              <div className="flex justify-between gap-1">
                                <span>Date:</span>
                                <span>{invoice.date}</span>
                              </div>
                              <div className="flex justify-between gap-1">
                                <span>Cust:</span>
                                <span className="font-bold text-right truncate max-w-[140px]">
                                  {invoice.customerName}
                                </span>
                              </div>
                              <div className="flex justify-between gap-1">
                                <span>Mob:</span>
                                <span>{invoice.customerPhone}</span>
                              </div>
                              {invoice.customerGSTIN && (
                                <div className="flex justify-between gap-1">
                                  <span>Cust GST:</span>
                                  <span className="font-bold">{invoice.customerGSTIN}</span>
                                </div>
                              )}
                            </div>

                            {/* Items Table */}
                            <div className="border-b border-dashed border-slate-400 pb-1.5 mb-2">
                              <table className="w-full text-left text-[9.5px]">
                                <thead>
                                  <tr className="border-b border-slate-300 font-bold">
                                    <th className="py-1">Item</th>
                                    <th className="py-1 text-right">NetWt</th>
                                    <th className="py-1 text-right">Amt</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {invoice.items.map((item, i) => (
                                    <tr key={i}>
                                      <td className="py-1 pr-1 align-top">
                                        <span className="font-bold block">
                                          {item.name}
                                          {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                                        </span>
                                        <span className="text-[8.5px] text-slate-600 block">
                                          {item.purity} • {item.tagNo} • HSN:{item.hsnCode}
                                        </span>
                                        {preferences.showHuidBadge && item.huid && (
                                          <span className="text-[8.5px] font-bold text-emerald-800 block">
                                            HUID: {item.huid}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-1 text-right align-top whitespace-nowrap">
                                        {item.netWeight.toFixed(2)}g
                                      </td>
                                      <td className="py-1 text-right align-top font-bold whitespace-nowrap">
                                        ₹{formatCurrency(item.subtotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Old Metal Exchange Deduction */}
                            {invoice.oldMetalExchange &&
                              invoice.oldMetalExchange.totalCreditAmount > 0 && (
                                <div className="border-b border-dashed border-slate-400 pb-1.5 mb-2 text-[9.5px] space-y-0.5">
                                  <div className="flex justify-between font-bold text-slate-900">
                                    <span>Old Metal Credit:</span>
                                    <span>
                                      -₹{formatCurrency(invoice.oldMetalExchange.totalCreditAmount)}
                                    </span>
                                  </div>
                                  <div className="text-[8.5px] text-slate-600">
                                    {invoice.oldMetalExchange.purity} {invoice.oldMetalExchange.metal}{' '}
                                    ({invoice.oldMetalExchange.grossWeight.toFixed(2)}g)
                                  </div>
                                </div>
                              )}

                            {/* Totals */}
                            <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px] space-y-0.5">
                              <div className="flex justify-between">
                                <span>Items Subtotal:</span>
                                <span>₹{formatCurrency(invoice.itemsSubtotal)}</span>
                              </div>

                              {invoice.oldMetalDeduction > 0 && (
                                <div className="flex justify-between">
                                  <span>Less Old Metal:</span>
                                  <span>-₹{formatCurrency(invoice.oldMetalDeduction)}</span>
                                </div>
                              )}

                              {invoice.discountAmount > 0 && (
                                <div className="flex justify-between">
                                  <span>Discount:</span>
                                  <span>-₹{formatCurrency(invoice.discountAmount)}</span>
                                </div>
                              )}

                              {invIsGST && (
                                <>
                                  <div className="flex justify-between border-t border-dotted border-slate-300 pt-0.5 font-bold">
                                    <span>Taxable Value:</span>
                                    <span>₹{formatCurrency(invoice.taxableAmount)}</span>
                                  </div>
                                  {invoice.isInterState ? (
                                    <div className="flex justify-between text-[9.5px]">
                                      <span>IGST ({invoice.igstRate || 3}%):</span>
                                      <span>₹{formatCurrency(invoice.igstAmount)}</span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex justify-between text-[9.5px]">
                                        <span>CGST ({invoice.cgstRate || 1.5}%):</span>
                                        <span>₹{formatCurrency(invoice.cgstAmount)}</span>
                                      </div>
                                      <div className="flex justify-between text-[9.5px]">
                                        <span>SGST ({invoice.sgstRate || 1.5}%):</span>
                                        <span>₹{formatCurrency(invoice.sgstAmount)}</span>
                                      </div>
                                    </>
                                  )}
                                </>
                              )}

                              <div className="flex justify-between font-black text-xs border-t border-slate-500 pt-1 mt-1">
                                <span>GRAND TOTAL:</span>
                                <span>₹{formatCurrency(invoice.grandTotal)}</span>
                              </div>

                              <div className="flex justify-between text-[9.5px] pt-0.5">
                                <span>Paid ({invoice.payment.method}):</span>
                                <span className="font-bold">
                                  ₹{formatCurrency(invoice.payment.amountPaid)}
                                </span>
                              </div>

                              {invoice.payment.dueAmount > 0 && (
                                <div className="flex justify-between font-bold text-rose-700 text-[9.5px]">
                                  <span>Balance Due:</span>
                                  <span>₹{formatCurrency(invoice.payment.dueAmount)}</span>
                                </div>
                              )}
                            </div>

                            {preferences.showBankDetails && shopDetails.bankName && (
                              <div className="text-[8.5px] text-slate-700 border-b border-dashed border-slate-300 pb-1.5 mb-1.5 text-center">
                                <div>
                                  Bank: {shopDetails.bankName} | A/C: {shopDetails.accountNo}
                                </div>
                                {shopDetails.ifscCode && <div>IFSC: {shopDetails.ifscCode}</div>}
                              </div>
                            )}

                            {preferences.showTerms && (
                              <div className="text-center text-[8.5px] text-slate-600 space-y-0.5 pt-0.5">
                                <p>• Goods guaranteed BIS HUID Hallmarked.</p>
                                <p>• Thank you for shopping with us!</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ============================================================ */
                          /* A4 & A5 STRUCTURED INVOICE LAYOUT (Portrait & Landscape)     */
                          /* ============================================================ */
                          <div className={isA5 ? 'space-y-2.5' : 'space-y-4'}>
                            {/* Header: Logo, Shop & Registration Info */}
                            <div
                              className={`border-b-2 border-amber-600 ${
                                isA5 ? 'pb-2' : 'pb-3'
                              }`}
                            >
                              <div className="flex flex-row items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {preferences.showLogo && (customLogo || shopDetails.logoUrl) && (
                                    <ShreemLogo
                                      size={isA5 ? 'sm' : 'lg'}
                                      showText={false}
                                      customLogo={customLogo || shopDetails.logoUrl}
                                      transparentBg={true}
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <h1
                                      className={`font-black text-amber-950 uppercase tracking-tight font-serif leading-none ${
                                        isA5 ? 'text-lg' : 'text-2xl sm:text-3xl'
                                      }`}
                                    >
                                      {shopDetails.name}
                                    </h1>
                                    {shopDetails.tagline && (
                                      <p
                                        className={`font-semibold text-amber-800 tracking-wide mt-0.5 ${
                                          isA5 ? 'text-[10px]' : 'text-xs'
                                        }`}
                                      >
                                        {shopDetails.tagline}
                                      </p>
                                    )}
                                    <p
                                      className={`text-slate-600 mt-0.5 font-medium ${
                                        isA5 ? 'text-[10px] max-w-xs' : 'text-xs max-w-md'
                                      }`}
                                    >
                                      {shopDetails.address || shopDetails.cityStatePincode}
                                    </p>
                                    <p
                                      className={`text-slate-700 font-semibold mt-0.5 ${
                                        isA5 ? 'text-[10px]' : 'text-xs'
                                      }`}
                                    >
                                      Phone:{' '}
                                      <span className="font-mono text-slate-900">
                                        {shopDetails.phone}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right space-y-1 shrink-0">
                                  <div
                                    className={`inline-block rounded font-black uppercase tracking-wider ${
                                      isA5 ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
                                    } ${
                                      invIsGST
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                        : 'bg-slate-200 text-slate-800 border border-slate-300'
                                    }`}
                                  >
                                    {invIsGST
                                      ? 'TAX INVOICE (कर बीजक)'
                                      : 'ESTIMATE BILL (अनुमान रसीद)'}
                                  </div>
                                  {invIsGST ? (
                                    <div
                                      className={`text-slate-700 font-mono space-y-0.5 ${
                                        isA5 ? 'text-[9.5px]' : 'text-[11px]'
                                      }`}
                                    >
                                      <div>
                                        GSTIN:{' '}
                                        <strong className="text-slate-950">
                                          {shopDetails.gstin}
                                        </strong>
                                      </div>
                                      {shopDetails.bisHallmarkRegNo && (
                                        <div>
                                          BIS Reg:{' '}
                                          <strong className="text-slate-950">
                                            {shopDetails.bisHallmarkRegNo}
                                          </strong>
                                        </div>
                                      )}
                                      {shopDetails.panNo && (
                                        <div>
                                          PAN:{' '}
                                          <strong className="text-slate-950">
                                            {shopDetails.panNo}
                                          </strong>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-[9.5px] text-slate-500 font-medium">
                                      * Quotation Estimate Only
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Customer & Invoice Meta Grid */}
                            <div
                              className={`grid grid-cols-2 gap-3 bg-slate-50 rounded-lg border border-slate-200 ${
                                isA5 ? 'p-2 text-[10.5px]' : 'p-3 text-xs'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-600 uppercase tracking-wider text-[9px] block">
                                  Customer Details:
                                </span>
                                <p className={`font-bold text-slate-900 ${isA5 ? 'text-xs' : 'text-sm'}`}>
                                  {invoice.customerName}
                                </p>
                                {invoice.customerAddress && (
                                  <p className="text-slate-600">{invoice.customerAddress}</p>
                                )}
                                <p className="text-slate-700">
                                  Mobile: <strong className="font-mono">{invoice.customerPhone}</strong>
                                </p>
                                {invoice.customerGSTIN && (
                                  <p className="text-slate-700">
                                    GSTIN: <strong className="font-mono">{invoice.customerGSTIN}</strong>
                                  </p>
                                )}
                              </div>

                              <div className="text-right space-y-0.5">
                                <div className="flex justify-end gap-2">
                                  <span className="text-slate-500">
                                    {invIsGST ? 'Invoice No:' : 'Estimate No:'}
                                  </span>
                                  <span className="font-mono font-bold text-slate-900">
                                    {invoice.invoiceNumber}
                                  </span>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <span className="text-slate-500">Date:</span>
                                  <span className="font-mono text-slate-900">{invoice.date}</span>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <span className="text-slate-500">Counter:</span>
                                  <span className="font-bold text-slate-800">
                                    {invoice.counterName || 'Main Counter'}
                                  </span>
                                </div>
                                {invoice.placeOfSupply && (
                                  <div className="flex justify-end gap-2">
                                    <span className="text-slate-500">Supply:</span>
                                    <span className="text-slate-900">{invoice.placeOfSupply}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ornaments Table: A5 Compact 7-Col vs A4 Full 10-Col */}
                            {isA5 ? (
                              <div>
                                <table className="w-full text-left text-[10px] border border-slate-300 border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                                      <th className="px-1.5 py-1 border-r border-slate-300 text-center w-6">
                                        #
                                      </th>
                                      <th className="px-1.5 py-1 border-r border-slate-300">
                                        Item / HSN / Tag
                                      </th>
                                      <th className="px-1.5 py-1 border-r border-slate-300 text-center">
                                        Purity
                                      </th>
                                      <th className="px-1.5 py-1 border-r border-slate-300 text-right">
                                        Gross / Net
                                      </th>
                                      <th className="px-1.5 py-1 border-r border-slate-300 text-right">
                                        Rate ₹/g
                                      </th>
                                      <th className="px-1.5 py-1 border-r border-slate-300 text-right">
                                        Making
                                      </th>
                                      <th className="px-1.5 py-1 text-right">Total ₹</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {invoice.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="px-1.5 py-1 text-center border-r border-slate-200 font-mono align-top">
                                          {idx + 1}
                                        </td>
                                        <td className="px-1.5 py-1 border-r border-slate-200 align-top">
                                          <span className="font-bold text-slate-900 block leading-tight">
                                            {item.name}
                                            {item.quantity > 1 ? ` (×${item.quantity})` : ''}
                                          </span>
                                          <span className="text-[9px] text-slate-600 font-mono block">
                                            HSN:{item.hsnCode} • {item.tagNo}
                                          </span>
                                          {preferences.showHuidBadge && item.huid && (
                                            <span className="inline-block text-[8.5px] text-emerald-800 font-bold font-mono">
                                              HUID: {item.huid}
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-1.5 py-1 text-center border-r border-slate-200 font-bold text-amber-900 align-top whitespace-nowrap">
                                          {item.purity}
                                        </td>
                                        <td className="px-1.5 py-1 text-right border-r border-slate-200 font-mono align-top whitespace-nowrap">
                                          <div className="text-slate-600 text-[9px]">
                                            G: {item.grossWeight.toFixed(2)}g
                                          </div>
                                          <div className="font-bold text-slate-900">
                                            N: {item.netWeight.toFixed(2)}g
                                          </div>
                                        </td>
                                        <td className="px-1.5 py-1 text-right border-r border-slate-200 font-mono align-top whitespace-nowrap">
                                          ₹{formatCurrency(item.metalRateApplied)}
                                        </td>
                                        <td className="px-1.5 py-1 text-right border-r border-slate-200 font-mono align-top whitespace-nowrap">
                                          ₹{formatCurrency(item.makingCharge)}
                                        </td>
                                        <td className="px-1.5 py-1 text-right font-mono font-bold text-slate-950 align-top whitespace-nowrap">
                                          ₹{formatCurrency(item.subtotal)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="overflow-x-auto print:overflow-visible">
                                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                                      <th className="p-1.5 border-r border-slate-300 text-center w-7">
                                        #
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300">
                                        Description of Jewellery
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300 text-center">
                                        HSN
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300 text-center">
                                        Purity
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300 text-right">
                                        Gross Wt
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300 text-right">
                                        Stone Wt
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300 text-right">
                                        Net Wt
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300 text-right">
                                        Rate ₹/g
                                      </th>
                                      <th className="p-1.5 border-r border-slate-300 text-right">
                                        Making
                                      </th>
                                      <th className="p-1.5 text-right">Total ₹</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {invoice.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-1.5 text-center border-r border-slate-200 font-mono">
                                          {idx + 1}
                                        </td>
                                        <td className="p-1.5 border-r border-slate-200">
                                          <span className="font-bold text-slate-900 block">
                                            {item.name}
                                            {item.quantity > 1 ? ` (×${item.quantity})` : ''}
                                          </span>
                                          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono flex-wrap">
                                            <span>Tag: {item.tagNo}</span>
                                            {preferences.showHuidBadge && item.huid && (
                                              <span className="text-emerald-800 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                                                HUID: {item.huid} (BIS)
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-1.5 text-center border-r border-slate-200 font-mono text-slate-600">
                                          {item.hsnCode}
                                        </td>
                                        <td className="p-1.5 text-center border-r border-slate-200 font-bold text-amber-900">
                                          {item.purity}
                                        </td>
                                        <td className="p-1.5 text-right border-r border-slate-200 font-mono">
                                          {item.grossWeight.toFixed(2)}g
                                        </td>
                                        <td className="p-1.5 text-right border-r border-slate-200 font-mono text-slate-600">
                                          {item.stoneWeight > 0
                                            ? `${item.stoneWeight.toFixed(2)}g`
                                            : '-'}
                                        </td>
                                        <td className="p-1.5 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                                          {item.netWeight.toFixed(2)}g
                                        </td>
                                        <td className="p-1.5 text-right border-r border-slate-200 font-mono">
                                          ₹{formatCurrency(item.metalRateApplied)}
                                        </td>
                                        <td className="p-1.5 text-right border-r border-slate-200 font-mono">
                                          ₹{formatCurrency(item.makingCharge)}
                                        </td>
                                        <td className="p-1.5 text-right font-mono font-bold text-slate-950">
                                          ₹{formatCurrency(item.subtotal)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Old Metal Buyback Deduction Box */}
                            {invoice.oldMetalExchange &&
                              invoice.oldMetalExchange.totalCreditAmount > 0 && (
                                <div
                                  className={`bg-amber-50/80 rounded-lg border border-amber-300 ${
                                    isA5 ? 'p-2 text-[10.5px]' : 'p-2.5 text-xs'
                                  }`}
                                >
                                  <span className="font-bold text-amber-950 block text-[10px] uppercase tracking-wide">
                                    Old Metal Buyback / Exchange (पुरानी सोना / चांदी वापसी):
                                  </span>
                                  <div className="grid grid-cols-4 gap-2 mt-0.5 text-[10.5px] font-mono">
                                    <div>
                                      Metal:{' '}
                                      <strong>
                                        {invoice.oldMetalExchange.purity}{' '}
                                        {invoice.oldMetalExchange.metal}
                                      </strong>
                                    </div>
                                    <div>
                                      Gross Wt:{' '}
                                      <strong>
                                        {invoice.oldMetalExchange.grossWeight.toFixed(2)}g
                                      </strong>
                                    </div>
                                    <div>
                                      Melt Loss:{' '}
                                      <strong>
                                        {invoice.oldMetalExchange.dustWastageGram.toFixed(2)}g
                                      </strong>
                                    </div>
                                    <div className="text-right font-bold text-rose-700">
                                      Credit: -₹
                                      {formatCurrency(
                                        invoice.oldMetalExchange.totalCreditAmount
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Invoice Totals & Calculations Grid (always 2-col on A4 & A5) */}
                            <div
                              className={`grid grid-cols-2 gap-3 pt-1 ${
                                isA5 ? 'text-[10.5px]' : 'text-xs gap-4'
                              }`}
                            >
                              {/* Left: Bank Details & Terms */}
                              <div className="space-y-1.5 text-slate-600">
                                {preferences.showBankDetails && shopDetails.bankName && (
                                  <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
                                    <span className="font-bold text-slate-800 block text-[9.5px] uppercase">
                                      Bank Account Details (NEFT/RTGS/UPI):
                                    </span>
                                    <div>
                                      Bank:{' '}
                                      <strong className="text-slate-900">
                                        {shopDetails.bankName}
                                      </strong>
                                    </div>
                                    <div>
                                      A/C No:{' '}
                                      <strong className="font-mono text-slate-900">
                                        {shopDetails.accountNo}
                                      </strong>
                                    </div>
                                    <div>
                                      IFSC:{' '}
                                      <strong className="font-mono text-slate-900">
                                        {shopDetails.ifscCode}
                                      </strong>
                                    </div>
                                  </div>
                                )}

                                {preferences.showTerms && (
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-700 block text-[10px]">
                                      Terms & Conditions:
                                    </span>
                                    <ul className="list-disc pl-3 text-[9.5px] space-y-0.5 text-slate-500 leading-snug">
                                      <li>
                                        All gold ornaments sold are 100% BIS 6-Digit HUID Hallmarked.
                                      </li>
                                      <li>
                                        Exchange value calculated on prevailing daily bullion rate.
                                      </li>
                                      <li>Subject to local jurisdiction only.</li>
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* Right: Tax & Grand Total */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-slate-600">
                                  <span>Gross Items Total:</span>
                                  <span className="font-mono font-bold text-slate-800">
                                    ₹{formatCurrency(invoice.itemsSubtotal)}
                                  </span>
                                </div>

                                {invoice.oldMetalDeduction > 0 && (
                                  <div className="flex justify-between text-rose-700">
                                    <span>Less: Old Metal Credit:</span>
                                    <span className="font-mono font-bold">
                                      - ₹{formatCurrency(invoice.oldMetalDeduction)}
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-800">
                                  <span>Taxable Amount:</span>
                                  <span className="font-mono">
                                    ₹{formatCurrency(invoice.taxableAmount)}
                                  </span>
                                </div>

                                {invIsGST &&
                                  (invoice.isInterState ? (
                                    <div className="flex justify-between text-slate-600">
                                      <span>IGST ({invoice.igstRate || 3}%):</span>
                                      <span className="font-mono font-bold">
                                        ₹{formatCurrency(invoice.igstAmount)}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex justify-between text-slate-600">
                                        <span>CGST ({invoice.cgstRate || 1.5}%):</span>
                                        <span className="font-mono font-bold">
                                          ₹{formatCurrency(invoice.cgstAmount)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-slate-600">
                                        <span>SGST ({invoice.sgstRate || 1.5}%):</span>
                                        <span className="font-mono font-bold">
                                          ₹{formatCurrency(invoice.sgstAmount)}
                                        </span>
                                      </div>
                                    </>
                                  ))}

                                {invoice.discountAmount > 0 && (
                                  <div className="flex justify-between text-emerald-700">
                                    <span>Discount / Round off:</span>
                                    <span className="font-mono font-bold">
                                      - ₹{formatCurrency(invoice.discountAmount)}
                                    </span>
                                  </div>
                                )}

                                <div
                                  className={`flex justify-between items-center bg-amber-100/90 border border-amber-300 rounded text-amber-950 font-black mt-1 ${
                                    isA5 ? 'p-1.5 text-xs' : 'p-2 text-sm'
                                  }`}
                                >
                                  <span>GRAND TOTAL:</span>
                                  <span className={`font-mono ${isA5 ? 'text-sm' : 'text-base'}`}>
                                    ₹{formatCurrency(invoice.grandTotal)}
                                  </span>
                                </div>

                                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] space-y-0.5">
                                  <div className="flex justify-between text-slate-700">
                                    <span>Payment ({invoice.payment.method}):</span>
                                    <span className="font-bold text-emerald-700">
                                      Paid ₹{formatCurrency(invoice.payment.amountPaid)}
                                    </span>
                                  </div>
                                  {invoice.payment.dueAmount > 0 && (
                                    <div className="flex justify-between text-rose-700 font-bold">
                                      <span>Balance Due:</span>
                                      <span>₹{formatCurrency(invoice.payment.dueAmount)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Signatures */}
                            <div
                              className={`border-t border-slate-300 flex justify-between items-end ${
                                isA5 ? 'pt-2.5 mt-2 text-[10px]' : 'pt-4 mt-4 text-xs'
                              }`}
                            >
                              <div className="text-center">
                                <div className="w-28 border-b border-slate-400 mb-1" />
                                <span className="text-[9.5px] text-slate-500">
                                  Customer&apos;s Signature
                                </span>
                              </div>

                              <div className="text-center">
                                <p className="text-[10.5px] font-bold text-slate-800">
                                  For {shopDetails.name}
                                </p>
                                <div
                                  className={`w-36 border-b border-slate-400 ${
                                    isA5 ? 'my-2' : 'my-3'
                                  }`}
                                />
                                <span className="text-[9.5px] text-slate-500">
                                  Authorised Signatory
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {hasMoreInvoices && (
                    <div className="my-4 py-2 text-center text-stone-500 text-[11px] font-bold uppercase tracking-widest print:hidden">
                      --- Next Invoice in Batch ({invIdx + 2} of {invoices.length}) ---
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
