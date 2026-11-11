/**
 * GST Calculation, Place of Supply & Validation Utilities
 * 
 * TODO(CA): Confirm state code mapping and old-gold GST deduction rules with Chartered Accountant.
 */

import { roundPaise } from './pricing';

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
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
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
