import { describe, it, expect } from 'vitest';
import {
  calculateTaxBreakdown,
  isInterStateSupply,
  validateGstin,
  checkComplianceWarnings,
  getStateCodeFromGstin
} from './gst';

describe('GST Calculation & Tax Compliance', () => {
  it('extracts state code correctly from GSTIN', () => {
    expect(getStateCodeFromGstin('23AAMCS9202B1Z8')).toBe('23'); // MP
    expect(getStateCodeFromGstin('27AAAAA0000A1Z5')).toBe('27'); // Maharashtra
  });

  it('validates 15-digit GSTIN regex', () => {
    expect(validateGstin('23AAMCS9202B1Z8')).toBe(true);
    expect(validateGstin('URP-UNREGISTERED')).toBe(true);
    expect(validateGstin('INVALID_GST_123')).toBe(false);
  });

  it('detects intra-state vs inter-state supply correctly', () => {
    // Both MP (23) -> Intra-state
    expect(isInterStateSupply('23AAMCS9202B1Z8', '23AAMCS1111A1Z1')).toBe(false);
    // MP (23) vs Maharashtra (27) -> Inter-state
    expect(isInterStateSupply('23AAMCS9202B1Z8', '27AAAAA0000A1Z5')).toBe(true);
  });

  it('calculates Intra-state CGST (1.5%) + SGST (1.5%) on ₹100,000 taxable value', () => {
    const tax = calculateTaxBreakdown(100000, false, 3.0);
    expect(tax.isInterState).toBe(false);
    expect(tax.cgstRate).toBe(1.5);
    expect(tax.sgstRate).toBe(1.5);
    expect(tax.cgstAmount).toBe(1500);
    expect(tax.sgstAmount).toBe(1500);
    expect(tax.igstAmount).toBe(0);
    expect(tax.totalTax).toBe(3000);
  });

  it('calculates Inter-state IGST (3.0%) on ₹100,000 taxable value', () => {
    const tax = calculateTaxBreakdown(100000, true, 3.0);
    expect(tax.isInterState).toBe(true);
    expect(tax.igstRate).toBe(3.0);
    expect(tax.cgstAmount).toBe(0);
    expect(tax.sgstAmount).toBe(0);
    expect(tax.igstAmount).toBe(3000);
    expect(tax.totalTax).toBe(3000);
  });

  it('warns when PAN is missing for bills > ₹2 Lakhs', () => {
    const check1 = checkComplianceWarnings(250000, 50000, '');
    expect(check1.panRequired).toBe(true);
    expect(check1.panMissing).toBe(true);

    const check2 = checkComplianceWarnings(250000, 50000, 'ABCDE1234F');
    expect(check2.panRequired).toBe(true);
    expect(check2.panMissing).toBe(false);
  });

  it('flags Section 269ST cash violation when cash >= ₹2 Lakhs', () => {
    const check = checkComplianceWarnings(250000, 200000, 'ABCDE1234F');
    expect(check.section269STViolation).toBe(true);
  });
});
