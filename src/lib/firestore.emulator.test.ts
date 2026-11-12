import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getCountFromServer
} from 'firebase/firestore';
import {
  ensureFirmRootDoc,
  clearFirmRootReady,
  createInvoiceAtomic,
  cancelInvoiceAtomic,
  uploadLocalStorageToFirestore,
  MigrationProgress
} from './firestoreSync';
import { JewelleryItem, Customer, GSTInvoice } from '../types';

const PROJECT_ID = 'demo-swarnkar-test';

function parseEmulatorHost(): { host: string; port: number } {
  const envHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (envHost && envHost.includes(':')) {
    const [host, portStr] = envHost.split(':');
    const port = Number(portStr);
    if (host && Number.isFinite(port)) {
      return { host, port };
    }
  }
  return { host: '127.0.0.1', port: 8088 };
}

// Helper to get a modular Firestore handle accepted by firebase/firestore v13 APIs
function asModularDb(compatOrModularDb: any): Firestore {
  return (compatOrModularDb?._delegate || compatOrModularDb) as Firestore;
}

describe('Firestore Security Rules & Emulator Integration', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
    const { host, port } = parseEmulatorHost();
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host,
        port
      }
    });
  });

  beforeEach(async () => {
    clearFirmRootReady();
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe('Security Rules (firestore.rules)', () => {
    it('requires ownerUid == auth.uid when creating a firm root doc and denies strangers', async () => {
      const ownerDb = asModularDb(testEnv.authenticatedContext('owner-1').firestore());
      const strangerDb = asModularDb(testEnv.authenticatedContext('stranger-1').firestore());

      // Spoofed ownerUid must fail
      await assertFails(
        setDoc(doc(ownerDb, 'firms', 'firm-spoof'), {
          ownerUid: 'other-user',
          name: 'Spoof Firm',
          staff: {}
        })
      );

      // Valid firm creation by owner succeeds
      await assertSucceeds(
        setDoc(doc(ownerDb, 'firms', 'firm-1'), {
          ownerUid: 'owner-1',
          name: 'Shreem Mahal Jewellers',
          gstin: '23AABCS1234F1Z5',
          staff: {
            'cashier-1': 'cashier'
          }
        })
      );

      // Owner can read/write subcollections
      await assertSucceeds(
        setDoc(doc(ownerDb, 'firms', 'firm-1', 'inventory', 'item-1'), {
          id: 'item-1',
          name: 'Gold Ring',
          quantity: 2
        })
      );
      await assertSucceeds(getDoc(doc(ownerDb, 'firms', 'firm-1', 'inventory', 'item-1')));

      // Stranger cannot read or write firm doc or subcollections
      await assertFails(getDoc(doc(strangerDb, 'firms', 'firm-1')));
      await assertFails(getDoc(doc(strangerDb, 'firms', 'firm-1', 'inventory', 'item-1')));
      await assertFails(
        setDoc(doc(strangerDb, 'firms', 'firm-1', 'inventory', 'item-hack'), {
          id: 'item-hack',
          name: 'Hacked'
        })
      );
    });

    it('restricts cashier from writing rates/shop_details/sequence_counters and modifying protected invoice fields', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const adminDb = asModularDb(ctx.firestore());
        await setDoc(doc(adminDb, 'firms', 'firm-1'), {
          ownerUid: 'owner-1',
          name: 'Test Firm',
          staff: { 'cashier-1': 'cashier' }
        });
        await setDoc(doc(adminDb, 'firms', 'firm-1', 'rates', 'daily'), { gold24k: 8500 });
        await setDoc(doc(adminDb, 'firms', 'firm-1', 'shop_details', 'main'), { name: 'Test Firm' });
        await setDoc(doc(adminDb, 'firms', 'firm-1', 'sequence_counters', 'GST_INVOICE_2026-27'), {
          currentVal: 1
        });
        await setDoc(doc(adminDb, 'firms', 'firm-1', 'invoices', 'inv-1'), {
          id: 'inv-1',
          invoiceNumber: 'SMJ/2026-27/0001',
          grandTotal: 50000,
          status: 'Unpaid',
          payment: { method: 'Cash', amountPaid: 0, dueAmount: 50000 }
        });
      });

      const ownerDb = asModularDb(testEnv.authenticatedContext('owner-1').firestore());
      const cashierDb = asModularDb(testEnv.authenticatedContext('cashier-1').firestore());

      // Cashier CANNOT update firm ownerUid or staff map
      await assertFails(
        updateDoc(doc(cashierDb, 'firms', 'firm-1'), {
          staff: { 'cashier-1': 'manager' }
        })
      );

      // Cashier CANNOT write rates, shop_details, or sequence_counters
      await assertFails(updateDoc(doc(cashierDb, 'firms', 'firm-1', 'rates', 'daily'), { gold24k: 100 }));
      await assertFails(setDoc(doc(cashierDb, 'firms', 'firm-1', 'shop_details', 'main'), { name: 'Hacked' }));
      await assertFails(
        updateDoc(doc(cashierDb, 'firms', 'firm-1', 'sequence_counters', 'GST_INVOICE_2026-27'), {
          currentVal: 2
        })
      );

      // Cashier CAN read rates and shop_details
      await assertSucceeds(getDoc(doc(cashierDb, 'firms', 'firm-1', 'rates', 'daily')));
      await assertSucceeds(getDoc(doc(cashierDb, 'firms', 'firm-1', 'shop_details', 'main')));

      // Cashier CANNOT modify invoice grandTotal
      await assertFails(
        updateDoc(doc(cashierDb, 'firms', 'firm-1', 'invoices', 'inv-1'), {
          grandTotal: 10
        })
      );

      // Cashier CAN update payment / cancel fields on invoices
      await assertSucceeds(
        updateDoc(doc(cashierDb, 'firms', 'firm-1', 'invoices', 'inv-1'), {
          status: 'Cancelled',
          cancelReason: 'Customer returned',
          cancelledBy: 'Cashier',
          cancelledAt: '2026-11-12'
        })
      );

      // Owner CAN update rates & shop_details
      await assertSucceeds(updateDoc(doc(ownerDb, 'firms', 'firm-1', 'rates', 'daily'), { gold24k: 8600 }));
    });

    it('blocks deleting invoices and purchases even for owner, and enforces +1 counter monotonicity', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const adminDb = asModularDb(ctx.firestore());
        await setDoc(doc(adminDb, 'firms', 'firm-1'), {
          ownerUid: 'owner-1',
          name: 'Test Firm',
          staff: {}
        });
        await setDoc(doc(adminDb, 'firms', 'firm-1', 'invoices', 'inv-1'), { id: 'inv-1', status: 'Paid' });
        await setDoc(doc(adminDb, 'firms', 'firm-1', 'purchases', 'pur-1'), { id: 'pur-1', grandTotal: 10000 });
        await setDoc(doc(adminDb, 'firms', 'firm-1', 'inventory', 'item-1'), { id: 'item-1', quantity: 1 });
      });

      const ownerDb = asModularDb(testEnv.authenticatedContext('owner-1').firestore());

      // Deleting invoices or purchases is denied even for owner
      await assertFails(deleteDoc(doc(ownerDb, 'firms', 'firm-1', 'invoices', 'inv-1')));
      await assertFails(deleteDoc(doc(ownerDb, 'firms', 'firm-1', 'purchases', 'pur-1')));

      // Deleting inventory is allowed for owner
      await assertSucceeds(deleteDoc(doc(ownerDb, 'firms', 'firm-1', 'inventory', 'item-1')));

      // sequence_counters create must start at 1
      await assertFails(
        setDoc(doc(ownerDb, 'firms', 'firm-1', 'sequence_counters', 'EST_2026-27'), { currentVal: 5 })
      );
      await assertSucceeds(
        setDoc(doc(ownerDb, 'firms', 'firm-1', 'sequence_counters', 'EST_2026-27'), { currentVal: 1 })
      );

      // sequence_counters update must strictly be old + 1
      await assertFails(
        updateDoc(doc(ownerDb, 'firms', 'firm-1', 'sequence_counters', 'EST_2026-27'), { currentVal: 3 })
      );
      await assertFails(
        updateDoc(doc(ownerDb, 'firms', 'firm-1', 'sequence_counters', 'EST_2026-27'), { currentVal: 1 })
      );
      await assertSucceeds(
        updateDoc(doc(ownerDb, 'firms', 'firm-1', 'sequence_counters', 'EST_2026-27'), { currentVal: 2 })
      );
    });
  });

  describe('Atomic Transactions & Chunked Migration (firestoreSync.ts)', () => {
    const firmId = 'firm-erp-1';
    const ownerUid = 'owner-erp-1';

    it('creates consecutive sequential invoices, deducts stock, and rejects insufficient stock atomically', async () => {
      const ownerDb = asModularDb(testEnv.authenticatedContext(ownerUid).firestore());

      // Create firm root document first
      await ensureFirmRootDoc(
        firmId,
        { name: 'Shreem Mahal Jewellers', gstin: '23AABCS1234F1Z5' },
        { db: ownerDb, uid: ownerUid }
      );

      const sampleItem: JewelleryItem = {
        id: 'item-ring-1',
        tagNo: 'SMJ-R-001',
        name: '22K Gold Ring',
        category: 'Rings',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 5.5,
        netWeight: 5.0,
        stoneWeight: 0.5,
        stoneValue: 0,
        wastagePercentage: 2,
        makingChargeType: 'per_gram',
        makingChargeRate: 450,
        quantity: 3,
        minStockAlert: 1,
        hsnCode: '7113',
        barcode: 'SMJR001'
      };

      const sampleCustomer: Customer = {
        id: 'cust-1',
        name: 'Smt. Meena Sharma',
        phone: '9826011111',
        address: 'Bhopal',
        city: 'Bhopal',
        state: 'Madhya Pradesh (23)',
        totalPurchases: 0,
        outstandingBalance: 0,
        createdAt: '2026-11-12'
      };

      await setDoc(doc(ownerDb, 'firms', firmId, 'inventory', sampleItem.id), sampleItem);
      await setDoc(doc(ownerDb, 'firms', firmId, 'customers', sampleCustomer.id), sampleCustomer);

      const buildDraft = (qty: number, total: number): Omit<GSTInvoice, 'id' | 'invoiceNumber'> => ({
        invoiceType: 'GST_INVOICE',
        date: '2026-11-12',
        customerId: sampleCustomer.id,
        customerName: sampleCustomer.name,
        customerPhone: sampleCustomer.phone,
        customerAddress: sampleCustomer.address,
        placeOfSupply: 'Madhya Pradesh (23)',
        isInterState: false,
        items: [
          {
            itemId: sampleItem.id,
            tagNo: sampleItem.tagNo,
            name: sampleItem.name,
            category: sampleItem.category,
            metal: sampleItem.metal,
            purity: sampleItem.purity,
            grossWeight: 5.5,
            netWeight: 5.0,
            stoneWeight: 0.5,
            stoneValue: 0,
            wastagePercentage: 2,
            makingChargeType: 'per_gram',
            makingChargeRate: 450,
            quantity: qty,
            hsnCode: '7113',
            metalRateApplied: 7000,
            metalCost: 35000,
            wastageCost: 700,
            makingCharge: 2250,
            huidCharge: 45,
            subtotal: 37995
          }
        ],
        itemsSubtotal: 37995 * qty,
        oldMetalDeduction: 0,
        taxableAmount: 37995 * qty,
        cgstRate: 1.5,
        sgstRate: 1.5,
        igstRate: 0,
        cgstAmount: Math.round(37995 * qty * 0.015),
        sgstAmount: Math.round(37995 * qty * 0.015),
        igstAmount: 0,
        totalTax: Math.round(37995 * qty * 0.03),
        hallmarkingTotalFee: 45 * qty,
        discountAmount: 0,
        grandTotal: total,
        payment: {
          method: 'Cash',
          amountPaid: total - 5000,
          dueAmount: 5000
        },
        status: 'Partial',
        hallmarkCertified: true
      });

      // Invoice 1 (qty 1)
      const inv1 = await createInvoiceAtomic(
        firmId,
        buildDraft(1, 39135),
        [sampleItem],
        [sampleCustomer],
        'SMJ',
        { db: ownerDb, uid: ownerUid }
      );
      expect(inv1.invoiceNumber).toMatch(/^SMJ\/\d{4}-\d{2}\/0001$/);

      // Invoice 2 (qty 1)
      const inv2 = await createInvoiceAtomic(
        firmId,
        buildDraft(1, 39135),
        [sampleItem],
        [sampleCustomer],
        'SMJ',
        { db: ownerDb, uid: ownerUid }
      );
      expect(inv2.invoiceNumber).toMatch(/^SMJ\/\d{4}-\d{2}\/0002$/);

      // Verify stock deducted from 3 -> 1 and customer totals updated
      const itemAfter2 = (await getDoc(doc(ownerDb, 'firms', firmId, 'inventory', sampleItem.id))).data();
      expect(itemAfter2?.quantity).toBe(1);

      const custAfter2 = (await getDoc(doc(ownerDb, 'firms', firmId, 'customers', sampleCustomer.id))).data();
      expect(custAfter2?.totalPurchases).toBe(39135 * 2);
      expect(custAfter2?.outstandingBalance).toBe(10000);

      // Invoice 3 asking qty 2 (only 1 remaining) MUST fail atomically without modifying stock or counter
      await expect(
        createInvoiceAtomic(
          firmId,
          buildDraft(2, 78270),
          [sampleItem],
          [sampleCustomer],
          'SMJ',
          { db: ownerDb, uid: ownerUid }
        )
      ).rejects.toThrow(/स्टॉक में पर्याप्त मात्रा उपलब्ध नहीं है/);

      const itemAfterFail = (await getDoc(doc(ownerDb, 'firms', firmId, 'inventory', sampleItem.id))).data();
      expect(itemAfterFail?.quantity).toBe(1);

      // Cancel Invoice 1: restores stock from 1 -> 2 and reverses customer totals once
      await cancelInvoiceAtomic(firmId, inv1, 'Wrong weight entered', 'Owner', {
        db: ownerDb,
        uid: ownerUid
      });

      const inv1Snap = (await getDoc(doc(ownerDb, 'firms', firmId, 'invoices', inv1.id))).data();
      expect(inv1Snap?.status).toBe('Cancelled');
      expect(inv1Snap?.cancelReason).toBe('Wrong weight entered');

      const itemAfterCancel = (await getDoc(doc(ownerDb, 'firms', firmId, 'inventory', sampleItem.id))).data();
      expect(itemAfterCancel?.quantity).toBe(2);

      const custAfterCancel = (await getDoc(doc(ownerDb, 'firms', firmId, 'customers', sampleCustomer.id))).data();
      expect(custAfterCancel?.totalPurchases).toBe(39135);
      expect(custAfterCancel?.outstandingBalance).toBe(5000);

      // Double cancel MUST be rejected without double-restoring stock
      await expect(
        cancelInvoiceAtomic(firmId, inv1, 'Duplicate cancel', 'Owner', {
          db: ownerDb,
          uid: ownerUid
        })
      ).rejects.toThrow(/पहले ही रद्द/);

      const itemAfterDoubleCancel = (await getDoc(doc(ownerDb, 'firms', firmId, 'inventory', sampleItem.id))).data();
      expect(itemAfterDoubleCancel?.quantity).toBe(2);
    });

    it('creates firm root doc first and uploads >400 items in chunked batches', async () => {
      const ownerDb = asModularDb(testEnv.authenticatedContext(ownerUid).firestore());
      const items: JewelleryItem[] = Array.from({ length: 425 }, (_, i) => ({
        id: `bulk-item-${i}`,
        tagNo: `TAG-${i}`,
        name: `Gold Item ${i}`,
        category: 'Rings',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 5,
        netWeight: 5,
        stoneWeight: 0,
        stoneValue: 0,
        wastagePercentage: 0,
        makingChargeType: 'per_gram',
        makingChargeRate: 300,
        quantity: 1,
        minStockAlert: 1,
        hsnCode: '7113',
        barcode: `BAR-${i}`
      }));

      const phases: string[] = [];
      const res = await uploadLocalStorageToFirestore(
        'firm-bulk-1',
        {
          shopDetails: {
            firmId: 'firm-bulk-1',
            name: 'Bulk Jewellers',
            tagline: 'Gold & Silver',
            address: 'Bhopal',
            cityStatePincode: 'Bhopal MP 462042',
            phone: '9999999999',
            email: '',
            gstin: '23AABCS1234F1Z5',
            bisHallmarkRegNo: '',
            panNo: '',
            bankName: '',
            accountNo: '',
            ifscCode: '',
            terms: []
          },
          inventory: items,
          customers: [],
          invoices: [],
          vendors: [],
          purchases: [],
          expenses: [],
          transfers: [],
          karigars: [],
          jobCards: [],
          girviLoans: [],
          gemstones: [],
          profiles: []
        },
        {
          db: ownerDb,
          uid: ownerUid,
          resume: false,
          onProgress: (p: MigrationProgress) => {
            phases.push(`${p.phase}:${p.currentBatch}/${p.totalBatches}`);
          }
        }
      );

      expect(res.success).toBe(true);
      expect(res.totalDocs).toBe(426); // 425 inventory + 1 shop_details/main
      expect(res.uploadedDocs).toBe(426);
      expect(phases[0]).toContain('firm-root');
      expect(phases[phases.length - 1]).toContain('completed');

      const firmSnap = await getDoc(doc(ownerDb, 'firms', 'firm-bulk-1'));
      expect(firmSnap.exists()).toBe(true);
      expect(firmSnap.data()?.ownerUid).toBe(ownerUid);

      const countSnap = await getCountFromServer(collection(ownerDb, 'firms', 'firm-bulk-1', 'inventory'));
      expect(countSnap.data().count).toBe(425);
    }, 30000);
  });
});
