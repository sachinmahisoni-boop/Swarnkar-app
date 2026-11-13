import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInvoiceAtomic, cancelInvoiceAtomic } from './firestoreSync';
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
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  deleteField: vi.fn(() => '__DELETE_FIELD__'),
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

  it('generates sequential invoice numbers and increments firms/{firmId}/usage/invoices atomically', async () => {
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
    expect(inv1.invoiceNumber).toMatch(/SMJ\/\d{4}-\d{2}\/0001/);
    expect(docStore[`firms/${firmId}/usage/invoices`]?.count).toBe(1);

    const draft2: Omit<GSTInvoice, 'id' | 'invoiceNumber'> = {
      ...draft1,
      items: [
        {
          ...draft1.items[0]
        }
      ]
    };

    const inv2 = await createInvoiceAtomic(firmId, draft2, mockInventory, [mockCustomer], 'SMJ');
    expect(inv2.invoiceNumber).toMatch(/SMJ\/\d{4}-\d{2}\/0002/);
    expect(docStore[`firms/${firmId}/usage/invoices`]?.count).toBe(2);
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

    await expect(cancelInvoiceAtomic(firmId, invoiceToCancel, 'Repeat cancel', 'Owner')).rejects.toThrow(
      'यह इनवॉइस पहले ही रद्द (Cancel) हो चुका है।'
    );
  });
});
