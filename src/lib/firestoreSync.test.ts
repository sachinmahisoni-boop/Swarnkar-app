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
  collection: vi.fn(),
  doc: vi.fn((_db, ...pathSegments) => pathSegments.join('/')),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  runTransaction: vi.fn(async (_db, updateFunction) => {
    const mockTransaction = {
      get: vi.fn(async (path: string) => {
        const data = docStore[path];
        return {
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
    docStore = {};
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

  it('generates sequential invoice numbers with no gaps across 2 consecutive invoices', async () => {
    // Seed initial mock items & customer in store
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
    // Setup initial store state
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

    // Cancel invoice
    await cancelInvoiceAtomic(firmId, invoiceToCancel, 'Wrong billing', 'Owner');

    // 1. Stock restored: 5 + 2 = 7
    const restoredItem = docStore[`firms/${firmId}/inventory/item-gold-ring-1`];
    expect(restoredItem.quantity).toBe(7);

    // 2. Customer ledger reversed
    const restoredCust = docStore[`firms/${firmId}/customers/cust-1`];
    expect(restoredCust.totalPurchases).toBe(11169); // 50000 - 38831
    expect(restoredCust.outstandingBalance).toBe(0); // 10000 - 10000

    // 3. Status updated to Cancelled
    const cancelledInv = docStore[`firms/${firmId}/invoices/inv-101`];
    expect(cancelledInv.status).toBe('Cancelled');

    // 4. Double cancel attempt must throw
    await expect(cancelInvoiceAtomic(firmId, invoiceToCancel, 'Repeat cancel', 'Owner')).rejects.toThrow(
      'यह इनवॉइस पहले ही रद्द (Cancel) हो चुका है।'
    );
  });
});
