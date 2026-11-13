import { describe, it, expect } from 'vitest';
import {
  calculateTaxBreakdown,
  isInterStateSupply,
  validateGstin,
  checkComplianceWarnings,
  getStateCodeFromGstin,
  aggregateHsnSummary,
  resolveInvoiceGstRate
} from './gst';
import { GSTInvoice, InvoiceItem } from '../types';

function makeItem(overrides: Partial<InvoiceItem> = {}): InvoiceItem {
  return {
    tagNo: 'TAG-01',
    name: 'Gold Ring',
    category: 'Ring',
    metal: 'Gold',
    purity: '22K (916)',
    grossWeight: 5.5,
    netWeight: 5.0,
    stoneWeight: 0.5,
    stoneValue: 0,
    metalRateApplied: 7000,
    metalCost: 35000,
    wastagePercentage: 5,
    wastageCost: 1750,
    makingChargeType: 'per_gram',
    makingChargeRate: 500,
    makingCharge: 2500,
    subtotal: 39250,
    hsnCode: '7113',
    quantity: 1,
    ...overrides,
  };
}

function makeInvoice(overrides: Partial<GSTInvoice> = {}): GSTInvoice {
  return {
    id: 'inv-1',
    invoiceNumber: 'SMJ/2026-27/0001',
    invoiceType: 'GST_INVOICE',
    date: '2026-04-15',
    customerId: 'cust-1',
    customerName: 'Ramesh Sharma',
    customerPhone: '9876543210',
    customerAddress: 'Bhopal, MP',
    placeOfSupply: '23-Madhya Pradesh',
    isInterState: false,
    items: [makeItem()],
    itemsSubtotal: 39250,
    oldMetalDeduction: 0,
    taxableAmount: 39250,
    cgstRate: 1.5,
    sgstRate: 1.5,
    igstRate: 0,
    cgstAmount: 588.75,
    sgstAmount: 588.75,
    igstAmount: 0,
    totalTax: 1177.5,
    hallmarkingTotalFee: 0,
    discountAmount: 0,
    grandTotal: 40427.5,
    payment: { method: 'Cash', amountPaid: 40427.5, dueAmount: 0 },
    status: 'Paid',
    hallmarkCertified: true,
    ...overrides,
  };
}

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

describe('GSTR-1 HSN & Tax Rate Summary Aggregation', () => {
  it('excludes Cancelled invoices and tracks excluded count', () => {
    const active = makeInvoice({ id: 'inv-1', status: 'Paid' });
    const partial = makeInvoice({ id: 'inv-2', invoiceNumber: 'SMJ/2026-27/0002', status: 'Partial' });
    const cancelled = makeInvoice({ id: 'inv-3', invoiceNumber: 'SMJ/2026-27/0003', status: 'Cancelled' });

    const res = aggregateHsnSummary([active, partial, cancelled]);
    expect(res.includedInvoicesCount).toBe(2);
    expect(res.excludedCancelledCount).toBe(1);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].invoiceCount).toBe(2);
    expect(res.totals.taxableValue).toBe(78500);
    expect(res.totals.totalTax).toBe(2355);
  });

  it('groups by (hsnCode, gstRate) and separates 3% GST bills from 0% Estimate bills and 7117 imitation jewellery', () => {
    const mixedGstInv = makeInvoice({
      id: 'inv-mixed',
      items: [
        makeItem({ tagNo: 'G1', hsnCode: '7113', subtotal: 60000, netWeight: 8, grossWeight: 8.5, quantity: 1 }),
        makeItem({ tagNo: 'G2', hsnCode: '7113', subtotal: 40000, netWeight: 4, grossWeight: 4.5, quantity: 2 }),
        makeItem({
          tagNo: 'A1',
          metal: 'Artificial',
          category: 'Bangle',
          hsnCode: '7117',
          subtotal: 20000,
          netWeight: 0,
          grossWeight: 25,
          quantity: 3,
        }),
      ],
      itemsSubtotal: 120000,
      taxableAmount: 120000,
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
      cgstAmount: 1800,
      sgstAmount: 1800,
      igstAmount: 0,
      totalTax: 3600,
      grandTotal: 123600,
    });

    const estimateInv = makeInvoice({
      id: 'inv-est',
      invoiceNumber: 'EST/2026-27/0001',
      invoiceType: 'ESTIMATE_BILL',
      items: [makeItem({ hsnCode: '7113', subtotal: 10000, netWeight: 1.5, grossWeight: 1.6, quantity: 1 })],
      itemsSubtotal: 10000,
      taxableAmount: 10000,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
      grandTotal: 10000,
    });

    expect(resolveInvoiceGstRate(mixedGstInv)).toBe(3);
    expect(resolveInvoiceGstRate(estimateInv)).toBe(0);

    const res = aggregateHsnSummary([mixedGstInv, estimateInv]);
    expect(res.rows).toHaveLength(3);

    // Sorted by hsnCode asc, gstRate asc: 7113 @ 0%, 7113 @ 3%, 7117 @ 3%
    expect(res.rows[0].hsnCode).toBe('7113');
    expect(res.rows[0].gstRate).toBe(0);
    expect(res.rows[0].taxableValue).toBe(10000);
    expect(res.rows[0].totalTax).toBe(0);

    // 7113 @ 3% had 2 line items on 1 invoice -> invoiceCount should be 1, qty = 1 + 2 = 3, netWt = 8*1 + 4*2 = 16g
    expect(res.rows[1].hsnCode).toBe('7113');
    expect(res.rows[1].gstRate).toBe(3);
    expect(res.rows[1].invoiceCount).toBe(1);
    expect(res.rows[1].totalQuantity).toBe(3);
    expect(res.rows[1].totalNetWeight).toBe(16);
    expect(res.rows[1].taxableValue).toBe(100000);
    expect(res.rows[1].cgstAmount).toBe(1500);
    expect(res.rows[1].sgstAmount).toBe(1500);

    // 7117 @ 3%
    expect(res.rows[2].hsnCode).toBe('7117');
    expect(res.rows[2].gstRate).toBe(3);
    expect(res.rows[2].totalQuantity).toBe(3);
    expect(res.rows[2].taxableValue).toBe(20000);
    expect(res.rows[2].totalTax).toBe(600);
  });

  it('reconciles invoice-level discounts & old-gold deductions proportionally to exact paise', () => {
    const invWithDeduction = makeInvoice({
      id: 'inv-disc',
      items: [
        makeItem({ tagNo: 'T1', hsnCode: '7113', subtotal: 33333.33 }),
        makeItem({ tagNo: 'T2', hsnCode: '7117', metal: 'Artificial', subtotal: 66666.67 }),
      ],
      itemsSubtotal: 100000,
      oldMetalDeduction: 15000,
      discountAmount: 2500,
      taxableAmount: 82500,
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
      cgstAmount: 1237.5,
      sgstAmount: 1237.5,
      igstAmount: 0,
      totalTax: 2475,
      grandTotal: 84975,
    });

    const res = aggregateHsnSummary([invWithDeduction]);
    expect(res.totals.taxableValue).toBe(82500);
    expect(res.totals.cgstAmount).toBe(1237.5);
    expect(res.totals.sgstAmount).toBe(1237.5);
    expect(res.totals.totalTax).toBe(2475);
    expect(res.totals.totalValue).toBe(84975);
  });

  it('combines intra-state (CGST+SGST) and inter-state (IGST) amounts under the same HSN & rate', () => {
    const intra = makeInvoice({
      id: 'inv-intra',
      isInterState: false,
      taxableAmount: 50000,
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
      cgstAmount: 750,
      sgstAmount: 750,
      igstAmount: 0,
      totalTax: 1500,
    });
    const inter = makeInvoice({
      id: 'inv-inter',
      invoiceNumber: 'SMJ/2026-27/0002',
      isInterState: true,
      taxableAmount: 50000,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 3.0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 1500,
      totalTax: 1500,
    });

    const res = aggregateHsnSummary([intra, inter]);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].gstRate).toBe(3);
    expect(res.rows[0].taxableValue).toBe(100000);
    expect(res.rows[0].cgstAmount).toBe(750);
    expect(res.rows[0].sgstAmount).toBe(750);
    expect(res.rows[0].igstAmount).toBe(1500);
    expect(res.rows[0].totalTax).toBe(3000);
  });

  it('filters accurately by invoiceType, monthPrefix, and date range', () => {
    const aprGst = makeInvoice({ id: '1', date: '2026-04-10', invoiceType: 'GST_INVOICE' });
    const mayGst = makeInvoice({ id: '2', date: '2026-05-05', invoiceType: 'GST_INVOICE' });
    const aprEst = makeInvoice({
      id: '3',
      date: '2026-04-12',
      invoiceType: 'ESTIMATE_BILL',
      cgstRate: 0,
      sgstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      totalTax: 0,
    });

    const gstApr = aggregateHsnSummary([aprGst, mayGst, aprEst], {
      invoiceType: 'GST_INVOICE',
      monthPrefix: '2026-04',
    });
    expect(gstApr.includedInvoicesCount).toBe(1);
    expect(gstApr.totals.taxableValue).toBe(39250);

    const rangeRes = aggregateHsnSummary([aprGst, mayGst, aprEst], {
      invoiceType: 'ALL',
      startDate: '2026-04-11',
      endDate: '2026-05-06',
    });
    expect(rangeRes.includedInvoicesCount).toBe(2);
  });
});
