import { GSTInvoice, InvoiceType, ShopDetails } from '../types';
import { formatSequentialNumber, getISTDate } from './invoiceNumber';

const DEVICE_INVOICES_KEY_PREFIX = 'jewel_device_invoices_';
const DEVICE_SEQ_KEY_PREFIX = 'jewel_device_seq_';
const DEVICE_FOLDER_NAME_PREFIX = 'jewel_device_folder_name_';
const DEVICE_PURCHASES_KEY_PREFIX = 'jewel_device_purchases_';

const FOLDER_DB_NAME = 'swarnkar_device_fs_v1';
const FOLDER_STORE_NAME = 'folder_handles';

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeInvoiceFileName(invoiceNumber: string): string {
  const cleaned = String(invoiceNumber || `INV-${Date.now()}`)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || `INV-${Date.now()}`;
}

/**
 * Retrieves all locally stored device invoices for a given firm ID.
 */
export function getLocalDeviceInvoices(firmId: string): GSTInvoice[] {
  if (typeof localStorage === 'undefined' || !firmId) return [];
  try {
    const raw = localStorage.getItem(`${DEVICE_INVOICES_KEY_PREFIX}${firmId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[getLocalDeviceInvoices] Failed to parse local invoices:', err);
    return [];
  }
}

/**
 * Saves or updates an invoice in the local device invoice folder.
 */
export function saveLocalDeviceInvoice(firmId: string, invoice: GSTInvoice): void {
  if (typeof localStorage === 'undefined' || !firmId || !invoice) return;
  try {
    const existing = getLocalDeviceInvoices(firmId);
    const index = existing.findIndex(
      (i) => i.id === invoice.id || (i.invoiceNumber && i.invoiceNumber === invoice.invoiceNumber)
    );
    let updated: GSTInvoice[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = invoice;
    } else {
      updated = [invoice, ...existing];
    }
    localStorage.setItem(`${DEVICE_INVOICES_KEY_PREFIX}${firmId}`, JSON.stringify(updated));
  } catch (err) {
    console.error('[saveLocalDeviceInvoice] Failed to save local invoice:', err);
  }
}

/**
 * Saves a batch of invoices to the local device invoice folder.
 */
export function saveLocalDeviceInvoicesBatch(firmId: string, invoices: GSTInvoice[]): void {
  if (typeof localStorage === 'undefined' || !firmId || !Array.isArray(invoices)) return;
  try {
    const existing = getLocalDeviceInvoices(firmId);
    const map = new Map<string, GSTInvoice>();
    existing.forEach((i) => {
      if (i.id) map.set(i.id, i);
    });
    invoices.forEach((i) => {
      if (i.id) map.set(i.id, i);
    });
    const merged = Array.from(map.values());
    localStorage.setItem(`${DEVICE_INVOICES_KEY_PREFIX}${firmId}`, JSON.stringify(merged));
  } catch (err) {
    console.error('[saveLocalDeviceInvoicesBatch] Failed to save batch:', err);
  }
}

/**
 * Deletes an invoice from the local device invoice folder.
 */
export function deleteLocalDeviceInvoice(firmId: string, invoiceId: string): void {
  if (typeof localStorage === 'undefined' || !firmId || !invoiceId) return;
  try {
    const existing = getLocalDeviceInvoices(firmId);
    const filtered = existing.filter((i) => i.id !== invoiceId && i.invoiceNumber !== invoiceId);
    localStorage.setItem(`${DEVICE_INVOICES_KEY_PREFIX}${firmId}`, JSON.stringify(filtered));
  } catch (err) {
    console.error('[deleteLocalDeviceInvoice] Failed to delete local invoice:', err);
  }
}

/**
 * Merges device-stored invoices with any cloud-fetched invoices so local device invoices
 * are never overwritten by Firestore subscription snapshots.
 */
export function mergeDeviceAndCloudInvoices(firmId: string, cloudInvoices: GSTInvoice[]): GSTInvoice[] {
  const localInvoices = getLocalDeviceInvoices(firmId);
  const byKey = new Map<string, GSTInvoice>();

  for (const inv of cloudInvoices || []) {
    if (!inv) continue;
    const key = inv.invoiceNumber || inv.id;
    byKey.set(key, inv);
  }

  for (const inv of localInvoices) {
    if (!inv) continue;
    const key = inv.invoiceNumber || inv.id;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, inv);
    } else if (inv.status === 'Cancelled' && existing.status !== 'Cancelled') {
      byKey.set(key, inv);
    } else if ((inv.payment?.amountPaid ?? 0) > (existing.payment?.amountPaid ?? 0)) {
      byKey.set(key, inv);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateCmp !== 0) return dateCmp;
    return String(b.invoiceNumber || b.id || '').localeCompare(String(a.invoiceNumber || a.id || ''));
  });
}

/**
 * Allocates the next sequential invoice number locally on the device without needing server sync.
 */
export function allocateNextDeviceInvoiceNumber(
  firmId: string,
  series: InvoiceType,
  prefix: string,
  knownInvoices: GSTInvoice[] = []
): { sequenceNo: number; invoiceNumber: string; finYearStr: string } {
  const finYearStr = getISTDate().financialYear.finYearStr;
  const seqKey = `${DEVICE_SEQ_KEY_PREFIX}${firmId}_${series}_${finYearStr}`;

  let storedSeq = 0;
  if (typeof localStorage !== 'undefined' && firmId) {
    const raw = localStorage.getItem(seqKey);
    storedSeq = raw ? parseInt(raw, 10) || 0 : 0;
  }

  const allKnown = [...knownInvoices, ...getLocalDeviceInvoices(firmId)];
  const expectedPrefix = `${prefix}/${finYearStr}/`;
  let maxObservedSeq = 0;
  for (const inv of allKnown) {
    if (!inv?.invoiceNumber) continue;
    if (inv.invoiceNumber.startsWith(expectedPrefix)) {
      const tail = inv.invoiceNumber.slice(expectedPrefix.length);
      const parsed = parseInt(tail, 10);
      if (Number.isFinite(parsed) && parsed > maxObservedSeq) {
        maxObservedSeq = parsed;
      }
    }
  }

  const nextSeq = Math.max(storedSeq, maxObservedSeq) + 1;
  if (typeof localStorage !== 'undefined' && firmId) {
    try {
      localStorage.setItem(seqKey, String(nextSeq));
    } catch {
      // Ignore storage quota warnings
    }
  }

  return {
    sequenceNo: nextSeq,
    invoiceNumber: formatSequentialNumber(prefix, finYearStr, nextSeq),
    finYearStr
  };
}

/**
 * Local fallback cache for vendor purchases (in case offline or batch sync is delayed).
 */
export function getLocalDevicePurchases<T = any>(firmId: string): T[] {
  if (typeof localStorage === 'undefined' || !firmId) return [];
  try {
    const raw = localStorage.getItem(`${DEVICE_PURCHASES_KEY_PREFIX}${firmId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalDevicePurchase<T extends { id: string }>(firmId: string, purchase: T): void {
  if (typeof localStorage === 'undefined' || !firmId || !purchase?.id) return;
  try {
    const existing = getLocalDevicePurchases<T>(firmId);
    const filtered = existing.filter((p: any) => p.id !== purchase.id);
    localStorage.setItem(`${DEVICE_PURCHASES_KEY_PREFIX}${firmId}`, JSON.stringify([purchase, ...filtered]));
  } catch {
    // Ignore storage errors
  }
}

export function isDeviceFolderPickerSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';
}

export function getConnectedDeviceFolderName(firmId: string): string | null {
  if (typeof localStorage === 'undefined' || !firmId) return null;
  return localStorage.getItem(`${DEVICE_FOLDER_NAME_PREFIX}${firmId}`);
}

function openFolderDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(FOLDER_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains(FOLDER_STORE_NAME)) {
        database.createObjectStore(FOLDER_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

async function saveFolderHandle(firmId: string, handle: any): Promise<void> {
  const database = await openFolderDb();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(FOLDER_STORE_NAME, 'readwrite');
    tx.objectStore(FOLDER_STORE_NAME).put(handle, `invoice_root_${firmId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  database.close();
}

async function loadFolderHandle(firmId: string): Promise<any | null> {
  try {
    const database = await openFolderDb();
    const handle = await new Promise<any>((resolve, reject) => {
      const tx = database.transaction(FOLDER_STORE_NAME, 'readonly');
      const req = tx.objectStore(FOLDER_STORE_NAME).get(`invoice_root_${firmId}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    database.close();
    return handle;
  } catch {
    return null;
  }
}

export async function disconnectDeviceInvoiceFolder(firmId: string): Promise<void> {
  if (typeof localStorage !== 'undefined' && firmId) {
    localStorage.removeItem(`${DEVICE_FOLDER_NAME_PREFIX}${firmId}`);
  }
  try {
    const database = await openFolderDb();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(FOLDER_STORE_NAME, 'readwrite');
      tx.objectStore(FOLDER_STORE_NAME).delete(`invoice_root_${firmId}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    database.close();
  } catch {
    // Ignore cleanup failures
  }
}

/**
 * Prompts the user to pick a folder on their device and creates an `Invoices` subfolder inside it.
 */
export async function connectDeviceInvoiceFolder(firmId: string): Promise<string | null> {
  if (!isDeviceFolderPickerSupported() || !firmId) return null;
  const picker = (window as any).showDirectoryPicker;
  const rootHandle = await picker({ mode: 'readwrite', id: 'swarnkar-invoices' });
  await rootHandle.getDirectoryHandle('Invoices', { create: true });
  await saveFolderHandle(firmId, rootHandle);
  const label = `${rootHandle.name}/Invoices`;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${DEVICE_FOLDER_NAME_PREFIX}${firmId}`, label);
  }
  return label;
}

/**
 * Writes an invoice HTML + JSON file into `<SelectedDeviceFolder>/Invoices/`.
 */
export async function writeInvoiceToConnectedFolder(
  firmId: string,
  invoice: GSTInvoice,
  htmlContent: string
): Promise<boolean> {
  if (!firmId || !invoice) return false;
  const rootHandle = await loadFolderHandle(firmId);
  if (!rootHandle) return false;

  try {
    if (typeof rootHandle.queryPermission === 'function') {
      let perm = await rootHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted' && typeof rootHandle.requestPermission === 'function') {
        perm = await rootHandle.requestPermission({ mode: 'readwrite' });
      }
      if (perm !== 'granted') return false;
    }

    const invoicesDir = await rootHandle.getDirectoryHandle('Invoices', { create: true });
    const baseName = sanitizeInvoiceFileName(invoice.invoiceNumber || invoice.id);

    const htmlHandle = await invoicesDir.getFileHandle(`${baseName}.html`, { create: true });
    const htmlWritable = await htmlHandle.createWritable();
    await htmlWritable.write(htmlContent);
    await htmlWritable.close();

    const jsonHandle = await invoicesDir.getFileHandle(`${baseName}.json`, { create: true });
    const jsonWritable = await jsonHandle.createWritable();
    await jsonWritable.write(JSON.stringify(invoice, null, 2));
    await jsonWritable.close();

    return true;
  } catch (err) {
    console.warn('[writeInvoiceToConnectedFolder] Failed writing to linked device folder:', err);
    return false;
  }
}

/**
 * Builds a clean standalone HTML invoice document (safe offline & ready for browser Print / PDF).
 */
export function buildStandaloneInvoiceHtmlDocument(
  invoice: GSTInvoice,
  shopDetails: ShopDetails,
  customLogo?: string,
  options?: {
    paperSize?: 'A4' | 'A5' | 'POS_80MM' | 'POS_58MM';
    orientation?: 'portrait' | 'landscape';
  }
): string {
  const isGST = invoice.invoiceType !== 'ESTIMATE_BILL';
  const fmt = (n: number) =>
    Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const logoSrc = customLogo || shopDetails.logoUrl || '';
  const paperSize = options?.paperSize || shopDetails.defaultInvoiceLayout || 'A4';
  const orientation = options?.orientation || 'portrait';
  const isThermal = paperSize === 'POS_80MM' || paperSize === 'POS_58MM';
  const pageCss = isThermal
    ? paperSize === 'POS_58MM'
      ? '58mm auto'
      : '80mm auto'
    : `${paperSize} ${orientation}`;
  const pageMarginCss = isThermal ? '2mm' : paperSize === 'A5' ? '7mm' : '10mm';
  const sheetMaxWidth = isThermal
    ? paperSize === 'POS_58MM'
      ? '54mm'
      : '76mm'
    : paperSize === 'A5'
    ? orientation === 'landscape'
      ? '794px'
      : '560px'
    : orientation === 'landscape'
    ? '1100px'
    : '794px';

  const rowsHtml = (invoice.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>
          <strong>${escapeHtml(item.name)}${(item.quantity || 1) > 1 ? ` (×${item.quantity})` : ''}</strong><br/>
          <small style="color:#555;">Tag: ${escapeHtml(item.tagNo)} | HSN: ${escapeHtml(item.hsnCode)}${item.huid ? ` | HUID: ${escapeHtml(item.huid)}` : ''}</small>
        </td>
        <td style="text-align:center;">${escapeHtml(item.purity)}</td>
        <td style="text-align:right;">${Number(item.grossWeight || 0).toFixed(2)}g</td>
        <td style="text-align:right;font-weight:bold;">${Number(item.netWeight || 0).toFixed(2)}g</td>
        <td style="text-align:right;">₹${fmt(item.metalRateApplied)}</td>
        <td style="text-align:right;">₹${fmt(item.makingCharge)}</td>
        <td style="text-align:right;font-weight:bold;">₹${fmt(item.subtotal)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(invoice.invoiceNumber)} - ${escapeHtml(shopDetails.name)}</title>
  <style>
    @page { size: ${pageCss}; margin: ${pageMarginCss}; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; background: #f5f5f4; margin: 0; padding: 14px; font-size: ${isThermal ? '11px' : '12px'}; }
    .action-bar { max-width: ${sheetMaxWidth}; margin: 0 auto 12px auto; display: flex; justify-content: space-between; align-items: center; gap: 8px; background: #1c1917; color: #fff; padding: 10px 14px; border-radius: 10px; }
    .print-btn { background: #f59e0b; color: #1c1917; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; }
    .sheet { max-width: ${sheetMaxWidth}; margin: 0 auto; background: #fff; border: 1px solid #d4d4d8; padding: ${isThermal ? '10px' : '18px'}; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #b45309; padding-bottom: 10px; margin-bottom: 12px; gap: 12px; }
    .shop-left { display: flex; align-items: center; gap: 10px; }
    .logo { width: 52px; height: 52px; object-fit: contain; border-radius: 6px; }
    h1 { margin: 0; font-size: ${isThermal ? '15px' : '20px'}; color: #451a03; text-transform: uppercase; }
    .badge { display: inline-block; padding: 4px 10px; font-weight: bold; border-radius: 4px; font-size: 11px; background: ${isGST ? '#fef3c7' : '#e2e8f0'}; border: 1px solid #d97706; }
    .meta { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 12px; gap: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
    th { background: #f1f5f9; text-align: left; }
    .totals-wrap { display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; }
    .totals-box { width: ${isThermal ? '100%' : '290px'}; margin-left: auto; }
    .tot-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .grand { background: #fef3c7; border: 1px solid #f59e0b; padding: 7px 10px; font-size: 14px; font-weight: bold; margin-top: 6px; display: flex; justify-content: space-between; border-radius: 4px; }
    .sigs { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 11px; }
    @media print {
      body { padding: 0; background: #fff; }
      .sheet { border: none; max-width: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <span style="font-size:12px;"><strong>${escapeHtml(invoice.invoiceNumber)}</strong> • ${escapeHtml(shopDetails.name)}</span>
    <button type="button" class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  </div>
  <div class="sheet">
    ${invoice.status === 'Cancelled' ? '<div style="padding:8px;border:2px solid #dc2626;color:#dc2626;text-align:center;font-weight:bold;margin-bottom:10px;">CANCELLED INVOICE</div>' : ''}
    <div class="header">
      <div class="shop-left">
        ${logoSrc ? `<img class="logo" src="${escapeHtml(logoSrc)}" alt="Logo" />` : ''}
        <div>
          <h1>${escapeHtml(shopDetails.name)}</h1>
          ${shopDetails.tagline ? `<div style="color:#92400e;font-size:11px;">${escapeHtml(shopDetails.tagline)}</div>` : ''}
          <div style="color:#475569;font-size:11px;">${escapeHtml(shopDetails.address || shopDetails.cityStatePincode)}</div>
          <div style="font-size:11px;font-weight:bold;">Ph: ${escapeHtml(shopDetails.phone)}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="badge">${isGST ? 'TAX INVOICE' : 'ESTIMATE BILL'}</div>
        ${isGST && shopDetails.gstin ? `<div style="margin-top:6px;font-size:11px;">GSTIN: <strong>${escapeHtml(shopDetails.gstin)}</strong></div>` : ''}
        ${isGST && shopDetails.bisHallmarkRegNo ? `<div style="font-size:11px;">BIS: <strong>${escapeHtml(shopDetails.bisHallmarkRegNo)}</strong></div>` : ''}
      </div>
    </div>

    <div class="meta">
      <div>
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:bold;">Customer</div>
        <div style="font-weight:bold;font-size:13px;">${escapeHtml(invoice.customerName)}</div>
        ${invoice.customerAddress ? `<div>${escapeHtml(invoice.customerAddress)}</div>` : ''}
        <div>Mob: <strong>${escapeHtml(invoice.customerPhone)}</strong></div>
        ${invoice.customerGSTIN ? `<div>GSTIN: <strong>${escapeHtml(invoice.customerGSTIN)}</strong></div>` : ''}
      </div>
      <div style="text-align:right;">
        <div>${isGST ? 'Invoice No:' : 'Estimate No:'} <strong>${escapeHtml(invoice.invoiceNumber)}</strong></div>
        <div>Date: <strong>${escapeHtml(invoice.date)}</strong></div>
        <div>Counter: <strong>${escapeHtml(invoice.counterName || 'Main Counter')}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align:center;width:28px;">#</th>
          <th>Description</th>
          <th style="text-align:center;">Purity</th>
          <th style="text-align:right;">Gross</th>
          <th style="text-align:right;">Net Wt</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Making</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="totals-wrap">
      <div style="font-size:10px;color:#475569;max-width:340px;">
        ${shopDetails.bankName ? `<div><strong>Bank:</strong> ${escapeHtml(shopDetails.bankName)} | <strong>A/C:</strong> ${escapeHtml(shopDetails.accountNo)} | <strong>IFSC:</strong> ${escapeHtml(shopDetails.ifscCode)}</div><br/>` : ''}
        <div><strong>Terms:</strong> Goods guaranteed BIS HUID Hallmarked. Saved directly on device.</div>
      </div>
      <div class="totals-box">
        <div class="tot-row"><span>Items Total:</span><span>₹${fmt(invoice.itemsSubtotal)}</span></div>
        ${invoice.oldMetalDeduction > 0 ? `<div class="tot-row"><span>Old Metal Credit:</span><span>-₹${fmt(invoice.oldMetalDeduction)}</span></div>` : ''}
        ${invoice.discountAmount > 0 ? `<div class="tot-row"><span>Discount:</span><span>-₹${fmt(invoice.discountAmount)}</span></div>` : ''}
        <div class="tot-row"><span>Taxable Amount:</span><span>₹${fmt(invoice.taxableAmount)}</span></div>
        ${isGST ? (invoice.isInterState
          ? `<div class="tot-row"><span>IGST (${invoice.igstRate || 3}%):</span><span>₹${fmt(invoice.igstAmount)}</span></div>`
          : `<div class="tot-row"><span>CGST (${invoice.cgstRate || 1.5}%):</span><span>₹${fmt(invoice.cgstAmount)}</span></div>
             <div class="tot-row"><span>SGST (${invoice.sgstRate || 1.5}%):</span><span>₹${fmt(invoice.sgstAmount)}</span></div>`) : ''}
        <div class="grand"><span>GRAND TOTAL:</span><span>₹${fmt(invoice.grandTotal)}</span></div>
        <div class="tot-row" style="margin-top:4px;"><span>Paid (${escapeHtml(invoice.payment?.method || 'Cash')}):</span><strong>₹${fmt(invoice.payment?.amountPaid)}</strong></div>
        ${(invoice.payment?.dueAmount || 0) > 0 ? `<div class="tot-row" style="color:#b91c1c;font-weight:bold;"><span>Balance Due:</span><span>₹${fmt(invoice.payment.dueAmount)}</span></div>` : ''}
      </div>
    </div>

    <div class="sigs">
      <div style="text-align:center;width:140px;border-top:1px solid #94a3b8;padding-top:4px;">Customer Signature</div>
      <div style="text-align:center;width:180px;border-top:1px solid #94a3b8;padding-top:4px;">For ${escapeHtml(shopDetails.name)}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads a standalone printable HTML invoice file to the user's device Downloads folder.
 */
export function downloadInvoiceHtmlFile(invoice: GSTInvoice, htmlContent: string): void {
  if (typeof document === 'undefined') return;
  const baseName = sanitizeInvoiceFileName(invoice.invoiceNumber || invoice.id);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Fallback helper: prints an invoice sheet via a clean isolated iframe.
 * Skips silently-failing mobile/WebView hidden-iframe paths so callers immediately use native window.print().
 */
export async function printHtmlViaIsolatedFrame(
  sheetInnerHtml: string,
  pageSizeCss: string,
  pageMarginCss: string,
  documentTitle: string
): Promise<boolean> {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return false;

  // Android Chrome, iOS Safari, and embedded mobile WebViews silently ignore iframe.contentWindow.print()
  // and lose user activation after async waits — caller must use synchronous window.print() there.
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile|wv\b/i.test(ua)) {
    return false;
  }

  const existingFrame = document.getElementById('swarnkar-isolated-print-frame') as HTMLIFrameElement | null;
  if (existingFrame) {
    existingFrame.remove();
  }

  const headStyles = Array.from(
    document.head.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((el) => {
      if (el.tagName.toLowerCase() === 'link') {
        const href = (el as HTMLLinkElement).href;
        return href ? `<link rel="stylesheet" href="${escapeHtml(href)}" />` : '';
      }
      return `<style>${el.innerHTML}</style>`;
    })
    .join('\n');

  const iframe = document.createElement('iframe');
  iframe.id = 'swarnkar-isolated-print-frame';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
  const frameWin = iframe.contentWindow;
  if (!frameDoc || !frameWin || typeof frameWin.print !== 'function') {
    iframe.remove();
    return false;
  }

  const fullDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(documentTitle)}</title>
  ${headStyles}
  <style>
    @page {
      size: ${pageSizeCss};
      margin: ${pageMarginCss};
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      color-scheme: light !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-hidden {
      display: none !important;
    }
    .print\\:hidden {
      display: none !important;
    }
    .printable-paper-sheet {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      margin: 0 auto !important;
      padding: 0 !important;
    }
    .print-break-after {
      page-break-after: always !important;
      break-after: page !important;
    }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; break-inside: avoid; }
  </style>
</head>
<body class="bg-white text-slate-900">
  ${sheetInnerHtml}
</body>
</html>`;

  frameDoc.open();
  frameDoc.write(fullDoc);
  frameDoc.close();

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      setTimeout(resolve, 120);
    };
    iframe.onload = finish;
    setTimeout(finish, 300);
  });

  try {
    frameWin.focus();
    frameWin.print();
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.remove();
      }
    }, 60_000);
    return true;
  } catch (err) {
    console.warn('[printHtmlViaIsolatedFrame] Isolated frame print failed, falling back:', err);
    iframe.remove();
    return false;
  }
}
