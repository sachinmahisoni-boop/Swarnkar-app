import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInvoiceAtomic,
  cancelInvoiceAtomic,
  sanitizeInvoicePayload,
  InvoiceCreationError,
  runBillingSelfTest
} from './firestoreSync';
import { GSTInvoice, JewelleryItem, Customer } from '../types';

// Mock Firebase module
vi.mock('./firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-123' }
  }
}));

// In-memory document store for test simulation
let docStore: Record<string, any> = {};

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...pathSegments) => pathSegments.join('/')),
  doc: vi.fn((_db, ...pathSegments) => pathSegments.join('/')),
  onSnapshot: vi.fn(),
  onSnapshotsInSync: vi.fn(() => () => {}),
  getDoc: vi.fn(async (path: string) => {
    const data = docStore[path];
    return {
      id: path.split('/').pop(),
      exists: () => data !== undefined && data !== null,
      data: () => data
    };
  }),
  getDocs: vi.fn(async () => ({ docs: [], empty: true })),
  setDoc: vi.fn(async (path: string, data: any) => {
    docStore[path] = data;
  }),
  updateDoc: vi.fn(async (path: string, data: any) => {
    docStore[path] = { ...(docStore[path] || {}), ...data };
  }),
  deleteDoc: vi.fn(async (path: string) => {
    delete docStore[path];
  }),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  deleteField: vi.fn(() => '__DELETE_FIELD__'),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  Timestamp: class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    toMillis() {
      return this.seconds * 1000 + Math.floor(this.nanoseconds / 1_000_000);
    }
    toDate() {
      return new Date(this.toMillis());
    }
    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }
    static fromMillis(ms: number) {
      return new MockTimestamp(Math.floor(ms / 1000), 0);
    }
    static fromDate(date: Date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
  },
  writeBatch: vi.fn(),
  runTransaction: vi.fn(async (_db, updateFunction) => {
    const mockTransaction = {
      get: vi.fn(async (path: string) => {
        const data = docStore[path];
        return {
          id: path.split('/').pop(),
          exists: () => data !== undefined && data !== null,
          data: () => data
        };
      }),
      set: vi.fn((path: string, data: any, options?: any) => {
        if (options && options.merge && docStore[path]) {
          docStore[path] = { ...docStore[path], ...data };
        } else {
          docStore[path] = data;
        }
      }),
      update: vi.fn((path: string, data: any) => {
        docStore[path] = { ...(docStore[path] || {}), ...data };
      }),
      delete: vi.fn((path: string) => {
        delete docStore[path];
      })
    };
    return await updateFunction(mockTransaction);
  })
}));

describe('Firestore Atomic Operations Tests', () => {
  const firmId = 'firm-test-01';

  beforeEach(() => {
    docStore = {
      [`firms/${firmId}`]: { ownerUid: 'test-user-123', name: 'Test Firm', staff: {} },
      ['users/test-user-123']: { uid: 'test-user-123', status: 'active', role: 'owner' }
    };
  });

  const mockInventory: JewelleryItem[] = [
    {
      id: 'item-gold-ring-1',
      firmId,
      tagNo: 'RING01',
      name: '22K Gold Ring',
      category: 'Gold',
      metal: 'Gold',
      purity: '22K',
      grossWeight: 5.0,
      netWeight: 5.0,
      stoneWeight: 0,
      stoneValue: 0,
      wastagePercentage: 2,
      makingChargeRate: 400,
      makingChargePerGram: 400,
      makingChargeType: 'per_gram',
      hsnCode: '7113',
      quantity: 10,
      minStockAlert: 2,
      barcode: 'BC123',
      huid: 'HUID123'
    }
  ];

  const mockCustomer: Customer = {
    id: 'cust-1',
    firmId,
    name: 'Ramesh Sharma',
    phone: '9876543210',
    address: 'Bhopal',
    city: 'Bhopal',
    state: 'Madhya Pradesh (23)',
    totalPurchases: 10000,
    outstandingBalance: 2000,
    createdAt: '2026-01-01'
  };

  it('generates sequential invoice numbers, deterministic series_count IDs, and increments users/{ownerUid}/usage/invoices atomically', async () => {
    docStore[`firms/${firmId}/inventory/item-gold-ring-1`] = { ...mockInventory[0] };
    docStore[`firms/${firmId}/customers/cust-1`] = { ...mockCustomer };

    const draft1: Omit<GSTInvoice, 'id' | 'invoiceNumber'> = {
      firmId,
      invoiceType: 'GST_INVOICE',
      date: '2026-11-11',
      customerId: 'cust-1',
      customerName: 'Ramesh Sharma',
      customerPhone: '9876543210',
      customerAddress: 'Bhopal',
      placeOfSupply: 'Madhya Pradesh (23)',
      isInterState: false,
      items: [
        {
          itemId: 'item-gold-ring-1',
          tagNo: 'RING01',
          name: '22K Gold Ring',
          category: 'Gold',
          hsnCode: '7113',
          metal: 'Gold',
          purity: '22K',
          grossWeight: 5,
          netWeight: 5,
          stoneWeight: 0,
          stoneValue: 0,
          metalRateApplied: 7000,
          metalCost: 35000,
          wastagePercentage: 2,
          wastageCost: 700,
          makingChargeType: 'per_gram',
          makingChargeRate: 400,
          makingCharge: 2000,
          subtotal: 37700,
          quantity: 1
        }
      ],
      itemsSubtotal: 37700,
      oldMetalDeduction: 0,
      taxableAmount: 37700,
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
      cgstAmount: 565.5,
      sgstAmount: 565.5,
      igstAmount: 0,
      totalTax: 1131,
      hallmarkingTotalFee: 0,
      discountAmount: 0,
      grandTotal: 38831,
      payment: {
        method: 'Cash',
        amountPaid: 38831,
        dueAmount: 0
      },
      status: 'Paid',
      hallmarkCertified: true
    };

    const inv1 = await createInvoiceAtomic(firmId, draft1, mockInventory, [mockCustomer], 'SMJ');
    expect(inv1.id).toBe('GST_INVOICE_1');
    expect(inv1.series).toBe('GST_INVOICE');
    expect(inv1.invoiceNumber).toMatch(/SMJ\/\d{4}-\d{2}\/0001/);
    expect(docStore['users/test-user-123/usage/invoices']?.count).toBe(1);
    expect(docStore['users/test-user-123/usage/invoices']?.lastInvoiceId).toBe('GST_INVOICE_1');
    expect(docStore['users/test-user-123/usage/invoices']?.lastFirmId).toBe(firmId);

    const draft2: Omit<GSTInvoice, 'id' | 'invoiceNumber'> = {
      ...draft1,
      items: [
        {
          ...draft1.items[0]
        }
      ]
    };

    const inv2 = await createInvoiceAtomic(firmId, draft2, mockInventory, [mockCustomer], 'SMJ');
    expect(inv2.id).toBe('GST_INVOICE_2');
    expect(inv2.invoiceNumber).toMatch(/SMJ\/\d{4}-\d{2}\/0002/);
    expect(docStore['users/test-user-123/usage/invoices']?.count).toBe(2);
    expect(docStore['users/test-user-123/usage/invoices']?.lastInvoiceId).toBe('GST_INVOICE_2');
  });

  it('deducts inventory stock quantity atomically on invoice creation', async () => {
    docStore[`firms/${firmId}/inventory/item-gold-ring-1`] = { ...mockInventory[0], quantity: 10 };

    const draft: Omit<GSTInvoice, 'id' | 'invoiceNumber'> = {
      firmId,
      invoiceType: 'GST_INVOICE',
      date: '2026-11-11',
      customerId: 'cust-1',
      customerName: 'Ramesh Sharma',
      customerPhone: '9876543210',
      customerAddress: 'Bhopal',
      placeOfSupply: 'Madhya Pradesh (23)',
      isInterState: false,
      items: [
        {
          itemId: 'item-gold-ring-1',
          tagNo: 'RING01',
          name: '22K Gold Ring',
          category: 'Gold',
          hsnCode: '7113',
          metal: 'Gold',
          purity: '22K',
          grossWeight: 5,
          netWeight: 5,
          stoneWeight: 0,
          stoneValue: 0,
          metalRateApplied: 7000,
          metalCost: 35000,
          wastagePercentage: 2,
          wastageCost: 700,
          makingChargeType: 'per_gram',
          makingChargeRate: 400,
          makingCharge: 2000,
          subtotal: 37700,
          quantity: 3
        }
      ],
      itemsSubtotal: 37700,
      oldMetalDeduction: 0,
      taxableAmount: 37700,
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
      cgstAmount: 565.5,
      sgstAmount: 565.5,
      igstAmount: 0,
      totalTax: 1131,
      hallmarkingTotalFee: 0,
      discountAmount: 0,
      grandTotal: 38831,
      payment: {
        method: 'Cash',
        amountPaid: 38831,
        dueAmount: 0
      },
      status: 'Paid',
      hallmarkCertified: true
    };

    await createInvoiceAtomic(firmId, draft, mockInventory, [mockCustomer], 'SMJ');
    const updatedItem = docStore[`firms/${firmId}/inventory/item-gold-ring-1`];
    expect(updatedItem.quantity).toBe(7); // 10 - 3 = 7
  });

  it('restores stock and customer balance on invoice cancellation, and rejects double-cancel', async () => {
    docStore[`firms/${firmId}/inventory/item-gold-ring-1`] = { ...mockInventory[0], quantity: 5 };
    docStore[`firms/${firmId}/customers/cust-1`] = { ...mockCustomer, totalPurchases: 50000, outstandingBalance: 10000 };

    const invoiceToCancel: GSTInvoice = {
      id: 'inv-101',
      invoiceNumber: 'SMJ/2026-27/0001',
      firmId,
      invoiceType: 'GST_INVOICE',
      date: '2026-11-11',
      customerId: 'cust-1',
      customerName: 'Ramesh Sharma',
      customerPhone: '9876543210',
      customerAddress: 'Bhopal',
      placeOfSupply: 'Madhya Pradesh (23)',
      isInterState: false,
      items: [
        {
          itemId: 'item-gold-ring-1',
          tagNo: 'RING01',
          name: '22K Gold Ring',
          category: 'Gold',
          hsnCode: '7113',
          metal: 'Gold',
          purity: '22K',
          grossWeight: 5,
          netWeight: 5,
          stoneWeight: 0,
          stoneValue: 0,
          metalRateApplied: 7000,
          metalCost: 35000,
          wastagePercentage: 2,
          wastageCost: 700,
          makingChargeType: 'per_gram',
          makingChargeRate: 400,
          makingCharge: 2000,
          subtotal: 37700,
          quantity: 2
        }
      ],
      itemsSubtotal: 37700,
      oldMetalDeduction: 0,
      taxableAmount: 37700,
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
      cgstAmount: 565.5,
      sgstAmount: 565.5,
      igstAmount: 0,
      totalTax: 1131,
      hallmarkingTotalFee: 0,
      discountAmount: 0,
      grandTotal: 38831,
      payment: {
        method: 'Cash',
        amountPaid: 28831,
        dueAmount: 10000
      },
      status: 'Partial',
      hallmarkCertified: true
    };

    docStore[`firms/${firmId}/invoices/inv-101`] = { ...invoiceToCancel };

    await cancelInvoiceAtomic(firmId, invoiceToCancel, 'Wrong billing', 'Owner');

    const restoredItem = docStore[`firms/${firmId}/inventory/item-gold-ring-1`];
    expect(restoredItem.quantity).toBe(7);

    const restoredCust = docStore[`firms/${firmId}/customers/cust-1`];
    expect(restoredCust.totalPurchases).toBe(11169);
    expect(restoredCust.outstandingBalance).toBe(0);

    const cancelledInv = docStore[`firms/${firmId}/invoices/inv-101`];
    expect(cancelledInv.status).toBe('Cancelled');
    expect(docStore['users/test-user-123/usage/invoices']?.lastCancelledInvoiceId).toBe('inv-101');

    await expect(cancelInvoiceAtomic(firmId, invoiceToCancel, 'Repeat cancel', 'Owner')).rejects.toThrow(
      'यह इनवॉइस पहले ही रद्द (Cancel) हो चुका है।'
    );
  });

  describe('sanitizeInvoicePayload', () => {
    it('removes undefined, sanitizes NaN and Infinity to 0, and converts Date to Timestamp', () => {
      const input = {
        name: 'Gold Ring',
        notes: undefined,
        price: NaN,
        infiniteRate: Infinity,
        createdAt: new Date('2026-11-14T10:00:00Z'),
        nested: {
          subVal: undefined,
          margin: -Infinity,
          validNum: 42
        },
        items: [
          { tag: 'A1', badNumber: NaN }
        ]
      };

      const sanitized = sanitizeInvoicePayload(input, 'testRoot');

      expect(sanitized.notes).toBeUndefined();
      expect('notes' in sanitized).toBe(false);
      expect(sanitized.price).toBe(0);
      expect(sanitized.infiniteRate).toBe(0);
      expect(sanitized.nested.subVal).toBeUndefined();
      expect(sanitized.nested.margin).toBe(0);
      expect(sanitized.nested.validNum).toBe(42);
      expect(sanitized.items[0].badNumber).toBe(0);
      expect(typeof (sanitized.createdAt as any).toMillis).toBe('function');
    });

    it('rejects nested arrays and names the offending field', () => {
      const badInput = {
        validArray: [
          ['nestedArrayItem']
        ]
      };

      expect(() => sanitizeInvoicePayload(badInput, 'invoicePayload')).toThrow(
        /Nested array detected at offending field: "invoicePayload\.validArray\[0\]"/
      );
    });
  });

  describe('createInvoiceAtomic Diagnostics & Self-Test', () => {
    it('catches failures and throws structured InvoiceCreationError with full diagnostics', async () => {
      // Intentionally missing owner user in docStore to trigger validation error
      delete docStore['users/test-user-123'];

      const draft: Omit<GSTInvoice, 'id' | 'invoiceNumber'> = {
        invoiceType: 'ESTIMATE_BILL',
        date: '2026-11-14',
        customerId: 'walkin',
        customerName: 'Cash Customer',
        customerPhone: '9999999999',
        customerAddress: 'Bhopal',
        placeOfSupply: 'Madhya Pradesh (23)',
        isInterState: false,
        items: [],
        itemsSubtotal: 0,
        oldMetalDeduction: 0,
        taxableAmount: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
        hallmarkingTotalFee: 0,
        discountAmount: 0,
        grandTotal: 0,
        payment: {
          method: 'Mixed',
          amountPaid: 0,
          dueAmount: 0
        },
        status: 'Paid',
        hallmarkCertified: false
      };

      try {
        await createInvoiceAtomic(firmId, draft, [], []);
        expect.unreachable('Should have thrown InvoiceCreationError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(InvoiceCreationError);
        expect(err.diagnostics).toBeDefined();
        expect(err.diagnostics.firmId).toBe(firmId);
        expect(err.diagnostics.series).toBe('ESTIMATE_BILL');
        expect(err.diagnostics.step).toBe('validation');
        expect(err.diagnostics.paymentMode).toBe('Mixed');
      }
    });

    it('runs runBillingSelfTest across all 4 combinations and cleans up test documents', async () => {
      docStore[`firms/${firmId}`] = { ownerUid: 'test-user-123', name: 'Test Firm', staff: {} };
      docStore['users/test-user-123'] = { uid: 'test-user-123', status: 'active', role: 'owner' };

      const summary = await runBillingSelfTest(firmId, {
        uid: 'test-user-123',
        isMasterAdmin: true
      });

      expect(summary.totalCases).toBe(4);
      expect(summary.passedCount).toBe(4);
      expect(summary.failedCount).toBe(0);
      expect(summary.results.length).toBe(4);

      // Verify each case passed
      const caseIds = summary.results.map(r => r.id);
      expect(caseIds).toContain('case_gst_cash');
      expect(caseIds).toContain('case_gst_mixed');
      expect(caseIds).toContain('case_est_cash');
      expect(caseIds).toContain('case_est_mixed');

      // Verify throwaway test items and customers were cleaned up
      const remainingTestDocs = Object.keys(docStore).filter(k => k.includes('selftest-item') || k.includes('selftest-cust'));
      expect(remainingTestDocs.length).toBe(0);
    });
  });
});
