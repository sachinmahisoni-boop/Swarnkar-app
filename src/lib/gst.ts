/**
 * GST Calculation, Place of Supply & Validation Utilities
 * 
 * TODO(CA): Confirm state code mapping and old-gold GST deduction rules with Chartered Accountant.
 */

import { GSTInvoice } from '../types';
import { getHsnAndGstRate, roundPaise } from './pricing';

export interface TaxBreakdown {
  taxableAmount: number;
  isInterState: boolean;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface HsnSummaryRow {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalGrossWeight: number;
  totalNetWeight: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalValue: number;
  invoiceCount: number;
}

export interface HsnSummaryOptions {
  invoiceType?: 'GST_INVOICE' | 'ESTIMATE_BILL' | 'ALL';
  monthPrefix?: string; // e.g. '2026-04' or 'All'
  startDate?: string;   // inclusive YYYY-MM-DD
  endDate?: string;     // inclusive YYYY-MM-DD
}

export interface HsnSummaryTotals {
  totalQuantity: number;
  totalGrossWeight: number;
  totalNetWeight: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalValue: number;
}

export interface HsnSummaryResult {
  rows: HsnSummaryRow[];
  totals: HsnSummaryTotals;
  includedInvoicesCount: number;
  excludedCancelledCount: number;
}

/**
 * Standard Indian Jewellery HSN Descriptions & UQC
 * TODO(CA): Confirm GSTR-1 Table 12 HSN descriptions and UQC ('PCS-PIECES' vs 'GMS-GRAMS') with Chartered Accountant.
 */
export const HSN_DESCRIPTIONS: Record<string, string> = {
  '7113': 'Articles of Jewellery & Parts thereof (Gold / Silver / Precious Metal)',
  '7117': 'Imitation / Artificial Jewellery',
  '7102': 'Diamonds (Cut, Polished or Unmounted)',
  '7103': 'Precious & Semi-Precious Gemstones',
  '7108': 'Gold Bullion / Unwrought or Semi-Manufactured Gold',
  '7106': 'Silver Bullion / Unwrought or Semi-Manufactured Silver',
  '7114': 'Articles of Goldsmiths or Silversmiths Wares',
};

export function getHsnDescription(hsnCode: string): string {
  const code = (hsnCode || '').trim().toUpperCase();
  return HSN_DESCRIPTIONS[code] || `Jewellery & Allied Articles (HSN ${code || '7113'})`;
}

export function getHsnUqc(hsnCode: string): string {
  const code = (hsnCode || '').trim().toUpperCase();
  // TODO(CA): Bullion (7108/7106) is typically reported in GMS-GRAMS while finished jewellery (7113/7117) may use PCS-PIECES or GMS-GRAMS. Confirm with CA.
  if (code === '7108' || code === '7106') return 'GMS-GRAMS';
  return 'PCS-PIECES';
}

function roundWeight(weight: number): number {
  return Math.round((weight + Number.EPSILON) * 1000) / 1000;
}

/**
 * Resolves the effective GST percentage for an invoice.
 * Estimate bills (Kachha) carry 0% GST; GST invoices sum CGST + SGST + IGST rates.
 */
export function resolveInvoiceGstRate(invoice: GSTInvoice): number {
  if (invoice.invoiceType === 'ESTIMATE_BILL') {
    return 0;
  }
  const explicitRate = roundPaise(
    (invoice.cgstRate || 0) + (invoice.sgstRate || 0) + (invoice.igstRate || 0)
  );
  if (explicitRate > 0) {
    return explicitRate;
  }
  if ((invoice.totalTax || 0) > 0 && (invoice.taxableAmount || 0) > 0) {
    return roundPaise((invoice.totalTax / invoice.taxableAmount) * 100);
  }
  return 0;
}

/**
 * Aggregates non-cancelled invoices by (HSN Code, GST Rate) for GSTR-1 Table 12 compliance.
 *
 * Invoice-level taxableAmount and CGST/SGST/IGST totals are proportionally allocated across
 * line items by item subtotal with rounding-remainder reconciliation on the final item so that
 * HSN totals match the accounting ledger to the exact paisa.
 *
 * TODO(CA): Verify proportional allocation of bill-level discounts and pre-tax old-gold
 * adjustments across multiple HSN codes with your Chartered Accountant.
 */
export function aggregateHsnSummary(
  invoices: GSTInvoice[],
  options: HsnSummaryOptions = {}
): HsnSummaryResult {
  const {
    invoiceType = 'ALL',
    monthPrefix = 'All',
    startDate,
    endDate,
  } = options;

  let includedInvoicesCount = 0;
  let excludedCancelledCount = 0;

  interface Bucket {
    hsnCode: string;
    gstRate: number;
    totalQuantity: number;
    totalGrossWeight: number;
    totalNetWeight: number;
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    invoiceKeys: Set<string>;
  }

  const buckets = new Map<string, Bucket>();

  for (const inv of invoices) {
    if (invoiceType !== 'ALL' && inv.invoiceType !== invoiceType) {
      continue;
    }
    if (monthPrefix && monthPrefix !== 'All' && !inv.date.startsWith(monthPrefix)) {
      continue;
    }
    if (startDate && inv.date < startDate) {
      continue;
    }
    if (endDate && inv.date > endDate) {
      continue;
    }

    if (inv.status === 'Cancelled') {
      excludedCancelledCount += 1;
      continue;
    }

    includedInvoicesCount += 1;
    const gstRate = resolveInvoiceGstRate(inv);
    const invKey = inv.id || inv.invoiceNumber;

    const invTaxable = roundPaise(inv.taxableAmount || 0);
    let invCgst = roundPaise(inv.cgstAmount || 0);
    let invSgst = roundPaise(inv.sgstAmount || 0);
    let invIgst = roundPaise(inv.igstAmount || 0);

    // Fallback for legacy invoices that populated totalTax without split fields
    if (invCgst === 0 && invSgst === 0 && invIgst === 0 && (inv.totalTax || 0) > 0) {
      const legacyTax = roundPaise(inv.totalTax);
      if (inv.isInterState) {
        invIgst = legacyTax;
      } else {
        invCgst = roundPaise(legacyTax / 2);
        invSgst = roundPaise(legacyTax - invCgst);
      }
    }

    const items = inv.items && inv.items.length > 0 ? inv.items : null;

    if (!items) {
      const hsnCode = '7113';
      const key = `${hsnCode}__${gstRate.toFixed(2)}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          hsnCode,
          gstRate,
          totalQuantity: 0,
          totalGrossWeight: 0,
          totalNetWeight: 0,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          invoiceKeys: new Set<string>(),
        };
        buckets.set(key, bucket);
      }
      bucket.taxableValue = roundPaise(bucket.taxableValue + invTaxable);
      bucket.cgstAmount = roundPaise(bucket.cgstAmount + invCgst);
      bucket.sgstAmount = roundPaise(bucket.sgstAmount + invSgst);
      bucket.igstAmount = roundPaise(bucket.igstAmount + invIgst);
      bucket.invoiceKeys.add(invKey);
      continue;
    }

    const totalItemsSubtotal = items.reduce(
      (sum, it) => sum + Math.max(0, it.subtotal || 0),
      0
    );

    let allocatedTaxable = 0;
    let allocatedCgst = 0;
    let allocatedSgst = 0;
    let allocatedIgst = 0;

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const ratio =
        totalItemsSubtotal > 0
          ? Math.max(0, item.subtotal || 0) / totalItemsSubtotal
          : 1 / items.length;

      const lineTaxable = isLast
        ? roundPaise(invTaxable - allocatedTaxable)
        : roundPaise(invTaxable * ratio);
      const lineCgst = isLast
        ? roundPaise(invCgst - allocatedCgst)
        : roundPaise(invCgst * ratio);
      const lineSgst = isLast
        ? roundPaise(invSgst - allocatedSgst)
        : roundPaise(invSgst * ratio);
      const lineIgst = isLast
        ? roundPaise(invIgst - allocatedIgst)
        : roundPaise(invIgst * ratio);

      allocatedTaxable = roundPaise(allocatedTaxable + lineTaxable);
      allocatedCgst = roundPaise(allocatedCgst + lineCgst);
      allocatedSgst = roundPaise(allocatedSgst + lineSgst);
      allocatedIgst = roundPaise(allocatedIgst + lineIgst);

      const rawHsn =
        (item.hsnCode || '').trim() ||
        getHsnAndGstRate(item.metal, item.category).hsnCode ||
        '7113';
      const hsnCode = rawHsn.toUpperCase();
      const key = `${hsnCode}__${gstRate.toFixed(2)}`;

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          hsnCode,
          gstRate,
          totalQuantity: 0,
          totalGrossWeight: 0,
          totalNetWeight: 0,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          invoiceKeys: new Set<string>(),
        };
        buckets.set(key, bucket);
      }

      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      bucket.totalQuantity += qty;
      bucket.totalGrossWeight = roundWeight(
        bucket.totalGrossWeight + (item.grossWeight || 0) * qty
      );
      bucket.totalNetWeight = roundWeight(
        bucket.totalNetWeight + (item.netWeight || 0) * qty
      );
      bucket.taxableValue = roundPaise(bucket.taxableValue + lineTaxable);
      bucket.cgstAmount = roundPaise(bucket.cgstAmount + lineCgst);
      bucket.sgstAmount = roundPaise(bucket.sgstAmount + lineSgst);
      bucket.igstAmount = roundPaise(bucket.igstAmount + lineIgst);
      bucket.invoiceKeys.add(invKey);
    });
  }

  const rows: HsnSummaryRow[] = Array.from(buckets.values())
    .map((b) => {
      const totalTax = roundPaise(b.cgstAmount + b.sgstAmount + b.igstAmount);
      const totalValue = roundPaise(b.taxableValue + totalTax);
      return {
        hsnCode: b.hsnCode,
        description: getHsnDescription(b.hsnCode),
        uqc: getHsnUqc(b.hsnCode),
        totalQuantity: b.totalQuantity,
        totalGrossWeight: roundWeight(b.totalGrossWeight),
        totalNetWeight: roundWeight(b.totalNetWeight),
        taxableValue: roundPaise(b.taxableValue),
        gstRate: b.gstRate,
        cgstAmount: roundPaise(b.cgstAmount),
        sgstAmount: roundPaise(b.sgstAmount),
        igstAmount: roundPaise(b.igstAmount),
        totalTax,
        totalValue,
        invoiceCount: b.invoiceKeys.size,
      };
    })
    .sort((a, b) => {
      const hsnCmp = a.hsnCode.localeCompare(b.hsnCode);
      if (hsnCmp !== 0) return hsnCmp;
      return a.gstRate - b.gstRate;
    });

  const totals: HsnSummaryTotals = rows.reduce<HsnSummaryTotals>(
    (acc, row) => ({
      totalQuantity: acc.totalQuantity + row.totalQuantity,
      totalGrossWeight: roundWeight(acc.totalGrossWeight + row.totalGrossWeight),
      totalNetWeight: roundWeight(acc.totalNetWeight + row.totalNetWeight),
      taxableValue: roundPaise(acc.taxableValue + row.taxableValue),
      cgstAmount: roundPaise(acc.cgstAmount + row.cgstAmount),
      sgstAmount: roundPaise(acc.sgstAmount + row.sgstAmount),
      igstAmount: roundPaise(acc.igstAmount + row.igstAmount),
      totalTax: roundPaise(acc.totalTax + row.totalTax),
      totalValue: roundPaise(acc.totalValue + row.totalValue),
    }),
    {
      totalQuantity: 0,
      totalGrossWeight: 0,
      totalNetWeight: 0,
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
      totalValue: 0,
    }
  );

  return {
    rows,
    totals,
    includedInvoicesCount,
    excludedCancelledCount,
  };
}

/**
 * Standard Indian State Code mapping from first 2 digits of GSTIN
 */
export const STATE_GST_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh'
};

/**
 * Extract 2-digit state code from GSTIN
 */
export function getStateCodeFromGstin(gstin?: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.substring(0, 2);
  return STATE_GST_CODES[code] ? code : null;
}

/**
 * Validates 15-character Indian GSTIN format
 */
export function validateGstin(gstin?: string): boolean {
  if (!gstin || gstin.trim() === '' || gstin === 'URP-UNREGISTERED') return true; // URP allowed
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.trim().toUpperCase());
}

/**
 * Determines whether supply is Inter-State (IGST) or Intra-State (CGST + SGST)
 */
export function isInterStateSupply(shopGstinOrState: string, customerGstinOrState: string): boolean {
  if (!shopGstinOrState || !customerGstinOrState) return false;

  const shopCode = getStateCodeFromGstin(shopGstinOrState);
  const customerCode = getStateCodeFromGstin(customerGstinOrState);

  if (shopCode && customerCode) {
    return shopCode !== customerCode;
  }

  // Fallback string matching on state names
  const shopClean = shopGstinOrState.toLowerCase().trim();
  const custClean = customerGstinOrState.toLowerCase().trim();
  
  if (shopClean.includes('madhya pradesh') || shopClean.includes('mp') || shopClean.startsWith('23')) {
    if (custClean.includes('madhya pradesh') || custClean.includes('mp') || custClean.startsWith('23')) {
      return false;
    }
    if (custClean.length > 0 && !custClean.includes('urp')) {
      return true;
    }
  }

  return false;
}

/**
 * Compute Tax Breakdown for a given taxable amount and GST rate (default 3.0%)
 */
export function calculateTaxBreakdown(
  taxableAmount: number,
  isInterState: boolean,
  gstRate: number = 3.0
): TaxBreakdown {
  const taxable = Math.max(0, taxableAmount);

  if (isInterState) {
    const igstAmount = roundPaise((taxable * gstRate) / 100);
    return {
      taxableAmount: taxable,
      isInterState: true,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount,
      totalTax: igstAmount
    };
  }

  const halfRate = gstRate / 2;
  const cgstAmount = roundPaise((taxable * halfRate) / 100);
  const sgstAmount = roundPaise((taxable * halfRate) / 100);
  const totalTax = roundPaise(cgstAmount + sgstAmount);

  return {
    taxableAmount: taxable,
    isInterState: false,
    cgstRate: halfRate,
    sgstRate: halfRate,
    igstRate: 0,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    totalTax
  };
}

/**
 * Checks compliance requirements:
 * 1. PAN required if invoice amount > ₹2,00,000
 * 2. Section 269ST Cash limit warning if cash paid >= ₹2,00,000
 */
export function checkComplianceWarnings(
  grandTotal: number,
  cashPaid: number,
  panNo?: string
): { panRequired: boolean; panMissing: boolean; section269STViolation: boolean; message?: string } {
  const panRequired = grandTotal > 200000;
  const panMissing = panRequired && (!panNo || panNo.trim().length < 10);
  const section269STViolation = cashPaid >= 200000;

  let message = '';
  if (panMissing) {
    message = '₹2 लाख से अधिक के बिल हेतु ग्राहक का PAN नंबर दर्ज करना अनिवार्य है (PAN Required for bills > ₹2 Lakhs).';
  } else if (section269STViolation) {
    message = 'चेतावनी: Income Tax Sec 269ST के तहत ₹2 लाख या अधिक का नगद (Cash) भुगतान प्रतिबंधित है। कृपया डिजिटल/बैंक माध्यम चुनें।';
  }

  return {
    panRequired,
    panMissing,
    section269STViolation,
    message
  };
}
