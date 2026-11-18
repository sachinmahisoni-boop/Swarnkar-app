import { describe, it, expect, beforeEach } from 'vitest';
import {
  allocateNextDeviceInvoiceNumber,
  buildStandaloneInvoiceHtmlDocument,
  deleteLocalDeviceInvoice,
  getLocalDeviceInvoices,
  mergeDeviceAndCloudInvoices,
  printHtmlViaIsolatedFrame,
  sanitizeInvoiceFileName,
  saveLocalDeviceInvoice,
} from './deviceInvoiceStorage';
import { GSTInvoice, ShopDetails } from '../types';
import { getISTDate } from './invoiceNumber';

function setupMemoryLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
  return store;
}

function makeSampleInvoice(overrides: Partial<GSTInvoice> = {}): GSTInvoice {
  return {
    id: 'local-inv-1',
    invoiceType: 'GST_INVOICE',
    invoiceNumber: 'SMJ/2026-27/0001',
    date: '2026-11-18',
    customerId: 'walkin',
    customerName: 'Aarav Verma',
    customerPhone: '9876543210',
    customerAddress: 'Bhopal',
    placeOfSupply: 'Madhya Pradesh (23)',
    isInterState: false,
    items: [
      {
        itemId: 'item-1',
        tagNo: 'TAG-101',
        name: '22K Gold Ring',
        category: 'Ring',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 5.5,
        netWeight: 5.5,
        stoneWeight: 0,
        stoneValue: 0,
        metalRateApplied: 7200,
        metalCost: 39600,
        wastagePercentage: 0,
        wastageCost: 0,
        makingChargeType: 'per_gram',
        makingChargeRate: 500,
        makingCharge: 2750,
        huidCharge: 45,
        subtotal: 42395,
        hsnCode: '7113',
        quantity: 1,
      },
    ],
    itemsSubtotal: 42395,
    oldMetalDeduction: 0,
    taxableAmount: 42395,
    cgstRate: 1.5,
    sgstRate: 1.5,
    igstRate: 0,
    cgstAmount: 635.93,
    sgstAmount: 635.93,
    igstAmount: 0,
    totalTax: 1271.86,
    hallmarkingTotalFee: 45,
    discountAmount: 0,
    grandTotal: 43667,
    payment: {
      method: 'Cash',
      amountPaid: 43667,
      dueAmount: 0,
    },
    status: 'Paid',
    hallmarkCertified: true,
    ...overrides,
  };
}

describe('deviceInvoiceStorage', () => {
  beforeEach(() => {
    setupMemoryLocalStorage();
  });

  it('allocates sequential invoice numbers locally per firm & series without duplicates', () => {
    const finYear = getISTDate().financialYear.finYearStr;
    const first = allocateNextDeviceInvoiceNumber('firm-a', 'GST_INVOICE', 'SMJ', []);
    expect(first.sequenceNo).toBe(1);
    expect(first.invoiceNumber).toBe(`SMJ/${finYear}/0001`);

    const second = allocateNextDeviceInvoiceNumber('firm-a', 'GST_INVOICE', 'SMJ', []);
    expect(second.sequenceNo).toBe(2);
    expect(second.invoiceNumber).toBe(`SMJ/${finYear}/0002`);

    // Respects existing cloud/device invoice numbers even if storage counter starts lower
    const existing = [makeSampleInvoice({ invoiceNumber: `EST/${finYear}/0009`, invoiceType: 'ESTIMATE_BILL' })];
    const third = allocateNextDeviceInvoiceNumber('firm-a', 'ESTIMATE_BILL', 'EST', existing);
    expect(third.sequenceNo).toBe(10);
    expect(third.invoiceNumber).toBe(`EST/${finYear}/0010`);
  });

  it('saves, updates, merges with cloud invoices, and deletes device invoices cleanly', () => {
    const inv1 = makeSampleInvoice({ id: 'local-inv-1', invoiceNumber: 'SMJ/2026-27/0001', date: '2026-11-18' });
    const inv2 = makeSampleInvoice({ id: 'cloud-inv-2', invoiceNumber: 'SMJ/2026-27/0002', date: '2026-11-19' });

    saveLocalDeviceInvoice('firm-1', inv1);
    expect(getLocalDeviceInvoices('firm-1')).toHaveLength(1);

    // Merging with cloud invoices must NOT drop device-only inv1
    const merged = mergeDeviceAndCloudInvoices('firm-1', [inv2]);
    expect(merged.map((i) => i.invoiceNumber)).toEqual(['SMJ/2026-27/0002', 'SMJ/2026-27/0001']);

    // Local cancellation status takes precedence over stale cloud Paid status
    saveLocalDeviceInvoice('firm-1', { ...inv2, status: 'Cancelled', cancelReason: 'Return' });
    const mergedAfterCancel = mergeDeviceAndCloudInvoices('firm-1', [inv2]);
    expect(mergedAfterCancel[0].status).toBe('Cancelled');

    deleteLocalDeviceInvoice('firm-1', 'local-inv-1');
    expect(getLocalDeviceInvoices('firm-1').map((i) => i.id)).toEqual(['cloud-inv-2']);
  });

  it('sanitizes invoice filenames and builds self-contained escaped HTML document', () => {
    expect(sanitizeInvoiceFileName('SMJ/2026-27/0001')).toBe('SMJ-2026-27-0001');

    const shop: ShopDetails = {
      firmId: 'firm-1',
      name: 'Shreem Mahal & Sons <Jewellers>',
      tagline: 'Trusted Gold',
      address: 'Kolar Road, Bhopal',
      cityStatePincode: 'Bhopal 462042',
      phone: '9876543210',
      email: 'shop@example.com',
      gstin: '23ABCDE1234F1Z5',
      bisHallmarkRegNo: 'BIS-916',
      panNo: 'ABCDE1234F',
      bankName: 'SBI',
      accountNo: '123456',
      ifscCode: 'SBIN0001234',
      terms: ['BIS 916'],
    };

    const html = buildStandaloneInvoiceHtmlDocument(
      makeSampleInvoice({ customerName: '<script>alert(1)</script>' }),
      shop
    );
    expect(html).toContain('SMJ/2026-27/0001');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Shreem Mahal &amp; Sons &lt;Jewellers&gt;');
    expect(html).toContain('22K Gold Ring');
    expect(html).toContain('onclick="window.print()"');

    const thermalHtml = buildStandaloneInvoiceHtmlDocument(makeSampleInvoice(), shop, undefined, {
      paperSize: 'POS_80MM',
      orientation: 'portrait',
    });
    expect(thermalHtml).toContain('@page { size: 80mm auto; margin: 2mm; }');
  });

  it('returns false from printHtmlViaIsolatedFrame on mobile user agents so native window.print() handles printing', async () => {
    const origDoc = (globalThis as any).document;
    const origNav = (globalThis as any).navigator;
    try {
      (globalThis as any).document = { getElementById: () => null };
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126.0 Mobile Safari/537.36' },
      });
      const result = await printHtmlViaIsolatedFrame('<div>Invoice</div>', 'A4 portrait', '10mm', 'INV-1');
      expect(result).toBe(false);
    } finally {
      (globalThis as any).document = origDoc;
      if (origNav !== undefined) {
        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: origNav });
      }
    }
  });
});
