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
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getCountFromServer,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import {
  ensureFirmRootDoc,
  clearFirmRootReady,
  createInvoiceAtomic,
  cancelInvoiceAtomic,
  uploadLocalStorageToFirestore,
  updateUserAccessByMaster,
  createOrUpdateStaffInvite,
  claimStaffInvitesForUser,
  writeAuditLog,
  MigrationProgress
} from './firestoreSync';
import {
  FULL_PERMISSIONS,
  MANAGER_PERMISSIONS,
  CASHIER_PERMISSIONS
} from './accessControl';
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

  const seedUser = async (
    uid: string,
    status: 'active' | 'trial' | 'pending' | 'suspended' = 'active',
    limit = 10,
    daysFromNow = 15,
    permissions = FULL_PERMISSIONS
  ) => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = asModularDb(ctx.firestore());
      await setDoc(doc(adminDb, 'users', uid), {
        uid,
        email: `${uid}@example.com`,
        role: 'owner',
        status,
        trialInvoiceLimit: limit,
        trialEndsAt: Timestamp.fromMillis(Date.now() + daysFromNow * 86400000),
        permissions,
        createdAt: '2026-11-12T00:00:00.000Z'
      });
    });
  };

  const seedPlatformAdmin = async (uid: string) => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = asModularDb(ctx.firestore());
      await setDoc(doc(adminDb, 'platform_admins', uid), {
        uid,
        createdAt: '2026-11-12T00:00:00.000Z'
      });
    });
  };

  describe('Security Rules (firestore.rules)', () => {
    it('denies all client writes to platform_admins and enforces strict schema, serverTimestamp, action allowlist & append-only audit_logs', async () => {
      await seedPlatformAdmin('master-uid');
      await seedUser('user-1', 'active');

      const masterDb = asModularDb(testEnv.authenticatedContext('master-uid').firestore());
      const userDb = asModularDb(testEnv.authenticatedContext('user-1').firestore());

      // Nobody on client may write platform_admins/{uid}
      await assertFails(setDoc(doc(userDb, 'platform_admins', 'user-1'), { uid: 'user-1' }));
      await assertFails(setDoc(doc(masterDb, 'platform_admins', 'other'), { uid: 'other' }));
      await assertSucceeds(getDoc(doc(masterDb, 'platform_admins', 'master-uid')));

      // Valid writeAuditLog (exact 6 keys, serverTimestamp, allowed action) succeeds
      await assertSucceeds(
        writeAuditLog(
          {
            action: 'TEST_ACTION',
            actorUid: 'master-uid',
            targetUid: 'user-1',
            targetFirmId: 'firm-1',
            details: 'Seeded test log'
          },
          { db: masterDb, uid: 'master-uid' }
        )
      );

      // Extra unexpected key MUST fail
      await assertFails(
        setDoc(doc(masterDb, 'audit_logs', 'log-extra'), {
          actorUid: 'master-uid',
          action: 'TEST_ACTION',
          targetUid: 'user-1',
          targetFirmId: '',
          details: 'd',
          extraField: 'tamper',
          createdAt: serverTimestamp()
        })
      );

      // Missing key MUST fail
      await assertFails(
        setDoc(doc(masterDb, 'audit_logs', 'log-missing'), {
          actorUid: 'master-uid',
          action: 'TEST_ACTION',
          details: 'd',
          createdAt: serverTimestamp()
        })
      );

      // Spoofed actorUid MUST fail
      await assertFails(
        setDoc(doc(userDb, 'audit_logs', 'log-spoof'), {
          actorUid: 'master-uid',
          action: 'TEST_ACTION',
          targetUid: '',
          targetFirmId: '',
          details: 'spoofed',
          createdAt: serverTimestamp()
        })
      );

      // Client-fabricated timestamp instead of serverTimestamp() MUST fail
      await assertFails(
        setDoc(doc(masterDb, 'audit_logs', 'log-fake-time'), {
          actorUid: 'master-uid',
          action: 'TEST_ACTION',
          targetUid: '',
          targetFirmId: '',
          details: 'fake time',
          createdAt: Timestamp.fromMillis(Date.now() - 86400000)
        })
      );

      // Disallowed action MUST fail
      await assertFails(
        setDoc(doc(masterDb, 'audit_logs', 'log-bad-action'), {
          actorUid: 'master-uid',
          action: 'ARBITRARY_UNLISTED_ACTION',
          targetUid: '',
          targetFirmId: '',
          details: 'bad action',
          createdAt: serverTimestamp()
        })
      );

      // Valid exact-schema doc succeeds, then update/delete MUST fail
      await assertSucceeds(
        setDoc(doc(masterDb, 'audit_logs', 'log-valid'), {
          actorUid: 'master-uid',
          action: 'UPDATE_USER_ACCESS',
          targetUid: 'user-1',
          targetFirmId: '',
          details: 'Approved trial',
          createdAt: serverTimestamp()
        })
      );
      await assertFails(updateDoc(doc(masterDb, 'audit_logs', 'log-valid'), { details: 'tampered' }));
      await assertFails(deleteDoc(doc(masterDb, 'audit_logs', 'log-valid')));
    });

    it('requires ownerUid == auth.uid when creating a firm root doc and denies strangers', async () => {
      await seedUser('owner-1', 'active');
      await seedUser('stranger-1', 'active');
      const ownerDb = asModularDb(testEnv.authenticatedContext('owner-1').firestore());
      const strangerDb = asModularDb(testEnv.authenticatedContext('stranger-1').firestore());

      await assertFails(
        setDoc(doc(ownerDb, 'firms', 'firm-spoof'), {
          ownerUid: 'other-user',
          name: 'Spoof Firm',
          staff: {}
        })
      );

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

      await assertSucceeds(
        setDoc(doc(ownerDb, 'firms', 'firm-1', 'inventory', 'item-1'), {
          id: 'item-1',
          name: 'Gold Ring',
          quantity: 2
        })
      );
      await assertSucceeds(getDoc(doc(ownerDb, 'firms', 'firm-1', 'inventory', 'item-1')));

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
      await seedUser('owner-1', 'active');
      await seedUser('cashier-1', 'active');
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const adminDb = asModularDb(ctx.firestore());
        await setDoc(doc(adminDb, 'firms', 'firm-1'), {
          ownerUid: 'owner-1',
          name: 'Test Firm',
          staff: { 'cashier-1': 'cashier' },
          staffPermissions: { 'cashier-1': { ...CASHIER_PERMISSIONS, invoiceCancel: true } }
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

      await assertFails(
        updateDoc(doc(cashierDb, 'firms', 'firm-1'), {
          staff: { 'cashier-1': 'manager' }
        })
      );

      await assertFails(updateDoc(doc(cashierDb, 'firms', 'firm-1', 'rates', 'daily'), { gold24k: 100 }));
      await assertFails(setDoc(doc(cashierDb, 'firms', 'firm-1', 'shop_details', 'main'), { name: 'Hacked' }));
      await assertFails(
        updateDoc(doc(cashierDb, 'firms', 'firm-1', 'sequence_counters', 'GST_INVOICE_2026-27'), {
          currentVal: 2
        })
      );

      await assertSucceeds(getDoc(doc(cashierDb, 'firms', 'firm-1', 'rates', 'daily')));
      await assertSucceeds(getDoc(doc(cashierDb, 'firms', 'firm-1', 'shop_details', 'main')));

      await assertFails(
        updateDoc(doc(cashierDb, 'firms', 'firm-1', 'invoices', 'inv-1'), {
          grandTotal: 10
        })
      );

      await assertSucceeds(
        updateDoc(doc(cashierDb, 'firms', 'firm-1', 'invoices', 'inv-1'), {
          status: 'Cancelled',
          cancelReason: 'Customer returned',
          cancelledBy: 'Cashier',
          cancelledAt: '2026-11-12'
        })
      );

      await assertSucceeds(updateDoc(doc(ownerDb, 'firms', 'firm-1', 'rates', 'daily'), { gold24k: 8600 }));
    });

    it('blocks deleting invoices and purchases even for owner, and enforces +1 counter monotonicity', async () => {
      await seedUser('owner-1', 'active');
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

      await assertFails(deleteDoc(doc(ownerDb, 'firms', 'firm-1', 'invoices', 'inv-1')));
      await assertFails(deleteDoc(doc(ownerDb, 'firms', 'firm-1', 'purchases', 'pur-1')));
      await assertSucceeds(deleteDoc(doc(ownerDb, 'firms', 'firm-1', 'inventory', 'item-1')));

      await assertFails(
        setDoc(doc(ownerDb, 'firms', 'firm-1', 'sequence_counters', 'EST_2026-27'), { currentVal: 5 })
      );
      await assertSucceeds(
        setDoc(doc(ownerDb, 'firms', 'firm-1', 'sequence_counters', 'EST_2026-27'), { currentVal: 1 })
      );

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
      await seedUser(ownerUid, 'active');
      const ownerDb = asModularDb(testEnv.authenticatedContext(ownerUid).firestore());

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

      const inv1 = await createInvoiceAtomic(
        firmId,
        buildDraft(1, 39135),
        [sampleItem],
        [sampleCustomer],
        'SMJ',
        { db: ownerDb, uid: ownerUid }
      );
      expect(inv1.invoiceNumber).toMatch(/^SMJ\/\d{4}-\d{2}\/0001$/);

      const inv2 = await createInvoiceAtomic(
        firmId,
        buildDraft(1, 39135),
        [sampleItem],
        [sampleCustomer],
        'SMJ',
        { db: ownerDb, uid: ownerUid }
      );
      expect(inv2.invoiceNumber).toMatch(/^SMJ\/\d{4}-\d{2}\/0002$/);

      const itemAfter2 = (await getDoc(doc(ownerDb, 'firms', firmId, 'inventory', sampleItem.id))).data();
      expect(itemAfter2?.quantity).toBe(1);

      const custAfter2 = (await getDoc(doc(ownerDb, 'firms', firmId, 'customers', sampleCustomer.id))).data();
      expect(custAfter2?.totalPurchases).toBe(39135 * 2);
      expect(custAfter2?.outstandingBalance).toBe(10000);

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
      await seedUser(ownerUid, 'active');
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
      expect(res.totalDocs).toBe(426);
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

  describe('Master Control, Approval Gate, Trial Quotas & Staff Invites', () => {
    it('blocks pending users from app data and prevents self-approval or privileged field injection', async () => {
      const pendingDb = asModularDb(testEnv.authenticatedContext('pending-u1').firestore());
      const otherDb = asModularDb(testEnv.authenticatedContext('pending-u2').firestore());

      // Cannot self-create with active status or privileged trial fields
      await assertFails(
        setDoc(doc(pendingDb, 'users', 'pending-u1'), {
          uid: 'pending-u1',
          role: 'owner',
          status: 'active',
          createdAt: '2026-11-12T00:00:00.000Z'
        })
      );
      await assertFails(
        setDoc(doc(pendingDb, 'users', 'pending-u1'), {
          uid: 'pending-u1',
          role: 'owner',
          status: 'pending',
          trialInvoiceLimit: 999,
          createdAt: '2026-11-12T00:00:00.000Z'
        })
      );

      // Valid pending self-registration succeeds
      await assertSucceeds(
        setDoc(doc(pendingDb, 'users', 'pending-u1'), {
          uid: 'pending-u1',
          email: 'shop1@example.com',
          displayName: 'Shop 1',
          role: 'owner',
          status: 'pending',
          createdAt: '2026-11-12T00:00:00.000Z',
          updatedAt: '2026-11-12T00:00:00.000Z',
          lastActiveAt: '2026-11-12T00:00:00.000Z'
        })
      );

      // Self cannot promote status or edit trial limit / expiry / permissions
      await assertFails(updateDoc(doc(pendingDb, 'users', 'pending-u1'), { status: 'active' }));
      await assertFails(updateDoc(doc(pendingDb, 'users', 'pending-u1'), { trialInvoiceLimit: 500 }));
      await assertFails(updateDoc(doc(pendingDb, 'users', 'pending-u1'), { permissions: FULL_PERMISSIONS }));

      // Pending user cannot create a firm
      await assertFails(
        setDoc(doc(pendingDb, 'firms', 'firm-pending-1'), {
          ownerUid: 'pending-u1',
          name: 'Blocked Shop',
          staff: {}
        })
      );

      // User cannot read another user's access doc
      await assertFails(getDoc(doc(otherDb, 'users', 'pending-u1')));
    });

    it('enforces tamper-resistant usage/invoices counter & trialEndsAt in firestore.rules', async () => {
      const trialUid = 'trial-user-1';
      const firmId = 'firm-trial-1';
      await seedUser(trialUid, 'trial', 2, 15, FULL_PERMISSIONS);

      const trialDb = asModularDb(testEnv.authenticatedContext(trialUid).firestore());
      await ensureFirmRootDoc(firmId, { name: 'Trial Jewellers' }, { db: trialDb, uid: trialUid });

      const draft: Omit<GSTInvoice, 'id' | 'invoiceNumber'> = {
        invoiceType: 'GST_INVOICE',
        date: '2026-11-12',
        customerId: 'walkin',
        customerName: 'Walk-in',
        customerPhone: '9999999999',
        customerAddress: 'Bhopal',
        placeOfSupply: 'Madhya Pradesh (23)',
        isInterState: false,
        items: [],
        itemsSubtotal: 10000,
        oldMetalDeduction: 0,
        taxableAmount: 10000,
        cgstRate: 1.5,
        sgstRate: 1.5,
        igstRate: 0,
        cgstAmount: 150,
        sgstAmount: 150,
        igstAmount: 0,
        totalTax: 300,
        hallmarkingTotalFee: 0,
        discountAmount: 0,
        grandTotal: 10300,
        payment: { method: 'Cash', amountPaid: 10300, dueAmount: 0 },
        status: 'Paid',
        hallmarkCertified: true
      };

      // Direct write to invoices WITHOUT incrementing users/{uid}/usage/invoices in the same tx MUST fail
      await assertFails(
        setDoc(doc(trialDb, 'firms', firmId, 'invoices', 'GST_INVOICE_1'), {
          ...draft,
          id: 'GST_INVOICE_1',
          series: 'GST_INVOICE',
          invoiceNumber: 'SMJ/2026-27/9999',
          firmId
        })
      );

      // Batch bypass test (Fix 1): creating 2 invoices with a single +1 on users/{uid}/usage/invoices MUST FAIL
      const batchSameSeries = writeBatch(trialDb);
      batchSameSeries.set(doc(trialDb, 'users', trialUid, 'usage', 'invoices'), {
        count: 1,
        lastInvoiceId: 'GST_INVOICE_1',
        lastFirmId: firmId,
        updatedAt: serverTimestamp()
      });
      batchSameSeries.set(doc(trialDb, 'firms', firmId, 'invoices', 'GST_INVOICE_1'), {
        ...draft,
        id: 'GST_INVOICE_1',
        series: 'GST_INVOICE',
        invoiceNumber: 'SMJ/2026-27/0001',
        firmId
      });
      batchSameSeries.set(doc(trialDb, 'firms', firmId, 'invoices', 'GST_INVOICE_2'), {
        ...draft,
        id: 'GST_INVOICE_2',
        series: 'GST_INVOICE',
        invoiceNumber: 'SMJ/2026-27/0002',
        firmId
      });
      await assertFails(batchSameSeries.commit());

      // Cross-series batch bypass test: GST_INVOICE_1 + ESTIMATE_BILL_1 with single +1 MUST ALSO FAIL
      const batchCrossSeries = writeBatch(trialDb);
      batchCrossSeries.set(doc(trialDb, 'users', trialUid, 'usage', 'invoices'), {
        count: 1,
        lastInvoiceId: 'GST_INVOICE_1',
        lastFirmId: firmId,
        updatedAt: serverTimestamp()
      });
      batchCrossSeries.set(doc(trialDb, 'firms', firmId, 'invoices', 'GST_INVOICE_1'), {
        ...draft,
        id: 'GST_INVOICE_1',
        series: 'GST_INVOICE',
        invoiceNumber: 'SMJ/2026-27/0001',
        firmId
      });
      batchCrossSeries.set(doc(trialDb, 'firms', firmId, 'invoices', 'ESTIMATE_BILL_1'), {
        ...draft,
        invoiceType: 'ESTIMATE_BILL',
        series: 'ESTIMATE_BILL',
        id: 'ESTIMATE_BILL_1',
        invoiceNumber: 'EST/2026-27/0001',
        firmId
      });
      await assertFails(batchCrossSeries.commit());

      // First 2 atomic invoices succeed and increment users/{trialUid}/usage/invoices counter
      const inv1 = await createInvoiceAtomic(firmId, draft, [], [], 'SMJ', { db: trialDb, uid: trialUid });
      const inv2 = await createInvoiceAtomic(firmId, draft, [], [], 'SMJ', { db: trialDb, uid: trialUid });
      expect(inv1.id).toBe('GST_INVOICE_1');
      expect(inv2.id).toBe('GST_INVOICE_2');

      const usageSnap = await getDoc(doc(trialDb, 'users', trialUid, 'usage', 'invoices'));
      expect(usageSnap.data()?.count).toBe(2);

      // 3rd invoice MUST fail (trial limit = 2)
      await expect(
        createInvoiceAtomic(firmId, draft, [], [], 'SMJ', { db: trialDb, uid: trialUid })
      ).rejects.toThrow(/ट्रायल बिल सीमा समाप्त/);

      // Fix 2 (Limit Per User, Not Per Firm): creating a second firm does NOT give a fresh quota
      const secondFirmId = 'firm-trial-2';
      await ensureFirmRootDoc(secondFirmId, { name: 'Trial Jewellers Branch 2' }, { db: trialDb, uid: trialUid });
      await expect(
        createInvoiceAtomic(secondFirmId, draft, [], [], 'SMJ', { db: trialDb, uid: trialUid })
      ).rejects.toThrow(/ट्रायल बिल सीमा समाप्त/);

      // Even direct batch on second firm attempting count: 1 on legacy path or users path MUST fail
      const bypassSecondFirmBatch = writeBatch(trialDb);
      bypassSecondFirmBatch.update(doc(trialDb, 'users', trialUid, 'usage', 'invoices'), {
        count: 3,
        lastInvoiceId: 'GST_INVOICE_3',
        lastFirmId: secondFirmId,
        updatedAt: serverTimestamp()
      });
      bypassSecondFirmBatch.set(doc(trialDb, 'firms', secondFirmId, 'invoices', 'GST_INVOICE_3'), {
        ...draft,
        id: 'GST_INVOICE_3',
        series: 'GST_INVOICE',
        invoiceNumber: 'SMJ/2026-27/0001',
        firmId: secondFirmId
      });
      await assertFails(bypassSecondFirmBatch.commit());
    });

    it('denies writes to operational collections after trial expiry or limit reached while keeping reads, export & invoice cancel working', async () => {
      const expiredUid = 'trial-expired-lockout';
      const staffUid = 'staff-expired-lockout';
      const firmId = 'firm-expired-lockout';

      // Create user initially active/unexpired so we can seed an active invoice, then expire trialEndsAt
      await seedUser(expiredUid, 'trial', 5, 10, FULL_PERMISSIONS);
      await seedUser(staffUid, 'trial', 5, 10, FULL_PERMISSIONS);

      const ownerDb = asModularDb(testEnv.authenticatedContext(expiredUid).firestore());
      const staffDb = asModularDb(testEnv.authenticatedContext(staffUid).firestore());

      await ensureFirmRootDoc(firmId, { name: 'Expired Lockout Jewellers' }, { db: ownerDb, uid: expiredUid });
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const adminDb = asModularDb(ctx.firestore());
        await updateDoc(doc(adminDb, 'firms', firmId), {
          staff: { [staffUid]: 'manager' },
          staffPermissions: { [staffUid]: MANAGER_PERMISSIONS }
        });
        await setDoc(doc(adminDb, 'firms', firmId, 'inventory', 'item-lock-1'), {
          id: 'item-lock-1',
          name: 'Gold Chain',
          quantity: 5
        });
        await setDoc(doc(adminDb, 'firms', firmId, 'customers', 'cust-lock-1'), {
          id: 'cust-lock-1',
          name: 'Sita Devi',
          totalPurchases: 0,
          outstandingBalance: 0
        });
      });

      const createdInv = await createInvoiceAtomic(
        firmId,
        {
          invoiceType: 'GST_INVOICE',
          date: '2026-11-12',
          customerId: 'cust-lock-1',
          customerName: 'Sita Devi',
          customerPhone: '9999999999',
          customerAddress: 'Bhopal',
          placeOfSupply: 'Madhya Pradesh (23)',
          isInterState: false,
          items: [
            {
              itemId: 'item-lock-1',
              tagNo: 'T1',
              name: 'Gold Chain',
              category: 'Chain',
              metal: 'Gold',
              purity: '22K',
              grossWeight: 10,
              netWeight: 10,
              stoneWeight: 0,
              stoneValue: 0,
              metalRateApplied: 7000,
              metalCost: 70000,
              wastagePercentage: 0,
              wastageCost: 0,
              makingChargeType: 'per_gram',
              makingChargeRate: 0,
              makingCharge: 0,
              subtotal: 70000,
              quantity: 1,
              hsnCode: '7113'
            }
          ],
          itemsSubtotal: 70000,
          oldMetalDeduction: 0,
          taxableAmount: 70000,
          cgstRate: 1.5,
          sgstRate: 1.5,
          igstRate: 0,
          cgstAmount: 1050,
          sgstAmount: 1050,
          igstAmount: 0,
          totalTax: 2100,
          hallmarkingTotalFee: 0,
          discountAmount: 0,
          grandTotal: 72100,
          payment: { method: 'Cash', amountPaid: 50000, dueAmount: 22100 },
          status: 'Partial',
          hallmarkCertified: true
        },
        [],
        [],
        'SMJ',
        { db: ownerDb, uid: expiredUid }
      );

      // Now expire the owner's trialEndsAt in the past
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const adminDb = asModularDb(ctx.firestore());
        await updateDoc(doc(adminDb, 'users', expiredUid), {
          trialEndsAt: Timestamp.fromMillis(Date.now() - 86400000)
        });
      });

      const lockedCollections = [
        'purchases',
        'inventory',
        'customers',
        'vendors',
        'karigars',
        'jobcards',
        'girvi',
        'gemstones',
        'expenses',
        'transfers'
      ];

      // Owner AND staff writes to all 10 operational collections MUST FAIL after expiry
      for (const colName of lockedCollections) {
        await assertFails(setDoc(doc(ownerDb, 'firms', firmId, colName, `new-${colName}`), { id: `new-${colName}` }));
        await assertFails(setDoc(doc(staffDb, 'firms', firmId, colName, `staff-${colName}`), { id: `staff-${colName}` }));
      }
      // Direct update to inventory or customer outside cancel transaction MUST FAIL
      await assertFails(updateDoc(doc(ownerDb, 'firms', firmId, 'inventory', 'item-lock-1'), { quantity: 99 }));
      await assertFails(updateDoc(doc(ownerDb, 'firms', firmId, 'customers', 'cust-lock-1'), { outstandingBalance: 0 }));

      // Reads (used for viewing & backup/export) MUST STILL SUCCEED
      await assertSucceeds(getDoc(doc(ownerDb, 'firms', firmId, 'inventory', 'item-lock-1')));
      await assertSucceeds(getDoc(doc(ownerDb, 'firms', firmId, 'invoices', createdInv.id)));
      await assertSucceeds(getDoc(doc(staffDb, 'firms', firmId, 'customers', 'cust-lock-1')));

      // Invoice Cancel MUST STILL SUCCEED and restore stock & customer balance atomically
      await assertSucceeds(
        cancelInvoiceAtomic(firmId, createdInv, 'Post-expiry customer return', 'Owner', {
          db: ownerDb,
          uid: expiredUid
        })
      );

      const invAfterCancel = (await getDoc(doc(ownerDb, 'firms', firmId, 'invoices', createdInv.id))).data();
      expect(invAfterCancel?.status).toBe('Cancelled');
      const itemAfterCancel = (await getDoc(doc(ownerDb, 'firms', firmId, 'inventory', 'item-lock-1'))).data();
      expect(itemAfterCancel?.quantity).toBe(5);
      const custAfterCancel = (await getDoc(doc(ownerDb, 'firms', firmId, 'customers', 'cust-lock-1'))).data();
      expect(custAfterCancel?.outstandingBalance).toBe(0);
    });

    it('enforces staff invitations, owner-capped permissions, and prevents staff claim escalation', async () => {
      const ownerPerms = { ...MANAGER_PERMISSIONS, staffManagement: true, girvi: false };
      await seedUser('owner-staff-test', 'active', 10, 15, ownerPerms);
      await seedUser('staff-u1', 'active', 10, 15, FULL_PERMISSIONS);
      await seedUser('staff-u2', 'active', 10, 15, FULL_PERMISSIONS);

      const ownerDb = asModularDb(testEnv.authenticatedContext('owner-staff-test').firestore());
      const staffDb = asModularDb(
        testEnv.authenticatedContext('staff-u1', { email: 'staff1@example.com' }).firestore()
      );
      const staff2Db = asModularDb(
        testEnv.authenticatedContext('staff-u2', { email: 'staff2@example.com' }).firestore()
      );

      await ensureFirmRootDoc('firm-staff-1', { name: 'Team Shop' }, { db: ownerDb, uid: 'owner-staff-test' });
      await setDoc(doc(ownerDb, 'firms', 'firm-staff-1', 'girvi', 'g1'), { id: 'g1', principalAmount: 5000 })
        .catch(() => {});

      await assertSucceeds(
        createOrUpdateStaffInvite(
          {
            firmId: 'firm-staff-1',
            firmName: 'Team Shop',
            ownerUid: 'owner-staff-test',
            email: 'staff1@example.com',
            role: 'cashier',
            permissions: { ...CASHIER_PERMISSIONS, girvi: true }, // girvi will be capped to false since owner doesn't have girvi
            ownerPermissions: ownerPerms
          },
          { db: ownerDb, uid: 'owner-staff-test' }
        )
      );

      // Fix 3: Invited staff CANNOT escalate role or other UIDs during claim
      const cappedCashierPerms = { ...CASHIER_PERMISSIONS, girvi: false };
      // 1) Escalating role to manager MUST fail
      await assertFails(
        updateDoc(doc(staffDb, 'firms', 'firm-staff-1'), {
          'staff.staff-u1': 'manager',
          'staffPermissions.staff-u1': cappedCashierPerms
        })
      );
      // 2) Injecting another UID into staff / staffPermissions / staffMembers MUST fail
      await assertFails(
        updateDoc(doc(staffDb, 'firms', 'firm-staff-1'), {
          staff: { 'staff-u1': 'cashier', 'other-hacker': 'manager' },
          staffPermissions: { 'staff-u1': cappedCashierPerms, 'other-hacker': FULL_PERMISSIONS }
        })
      );
      // 3) Escalating own staffPermissions beyond invite.permissions MUST fail
      await assertFails(
        updateDoc(doc(staffDb, 'firms', 'firm-staff-1'), {
          'staff.staff-u1': 'cashier',
          'staffPermissions.staff-u1': { ...cappedCashierPerms, purchases: true }
        })
      );

      // Valid claim via claimStaffInvitesForUser succeeds
      const claimed = await claimStaffInvitesForUser(
        { uid: 'staff-u1', email: 'staff1@example.com', displayName: 'Staff One' },
        { db: staffDb, uid: 'staff-u1' }
      );
      expect(claimed).toBe(1);

      // Second invited staff claiming when staff/staffPermissions/staffMembers already exist:
      await assertSucceeds(
        createOrUpdateStaffInvite(
          {
            firmId: 'firm-staff-1',
            firmName: 'Team Shop',
            ownerUid: 'owner-staff-test',
            email: 'staff2@example.com',
            role: 'cashier',
            permissions: CASHIER_PERMISSIONS,
            ownerPermissions: ownerPerms
          },
          { db: ownerDb, uid: 'owner-staff-test' }
        )
      );
      // Trying to overwrite staff-u1's entry in staffPermissions/staffMembers MUST FAIL
      await assertFails(
        updateDoc(doc(staff2Db, 'firms', 'firm-staff-1'), {
          'staff.staff-u2': 'cashier',
          'staffPermissions.staff-u2': CASHIER_PERMISSIONS,
          'staffPermissions.staff-u1': FULL_PERMISSIONS
        })
      );
      await assertFails(
        updateDoc(doc(staff2Db, 'firms', 'firm-staff-1'), {
          'staff.staff-u2': 'cashier',
          'staffPermissions.staff-u2': CASHIER_PERMISSIONS,
          'staffMembers.staff-u1': { uid: 'staff-u1', role: 'manager', permissions: FULL_PERMISSIONS }
        })
      );
      // Valid claim for staff-u2 succeeds without touching staff-u1
      const claimed2 = await claimStaffInvitesForUser(
        { uid: 'staff-u2', email: 'staff2@example.com', displayName: 'Staff Two' },
        { db: staff2Db, uid: 'staff-u2' }
      );
      expect(claimed2).toBe(1);

      // Staff can read/write inventory (cashier perm true & owner perm true)
      await assertSucceeds(
        setDoc(doc(staffDb, 'firms', 'firm-staff-1', 'inventory', 'item-s1'), { id: 'item-s1', name: 'Ring', quantity: 1 })
      );

      // Staff CANNOT write purchases or girvi (denied by staff & owner caps)
      await assertFails(
        setDoc(doc(staffDb, 'firms', 'firm-staff-1', 'purchases', 'pur-s1'), { id: 'pur-s1', grandTotal: 1000 })
      );
      await assertFails(
        setDoc(doc(staffDb, 'firms', 'firm-staff-1', 'girvi', 'g2'), { id: 'g2', principalAmount: 2000 })
      );
    });

    it('allows platform_admins user to approve users, customize permissions, and control any firm', async () => {
      await seedPlatformAdmin('master-uid');
      await seedUser('shop-owner-x', 'active', 10);
      const shopDb = asModularDb(testEnv.authenticatedContext('shop-owner-x').firestore());
      await setDoc(doc(shopDb, 'firms', 'firm-x'), {
        ownerUid: 'shop-owner-x',
        name: 'Shop X Jewellers',
        staff: {}
      });
      await setDoc(doc(shopDb, 'firms', 'firm-x', 'inventory', 'x1'), { id: 'x1', name: 'Ring', quantity: 4 });

      const masterDb = asModularDb(testEnv.authenticatedContext('master-uid').firestore());

      await assertSucceeds(
        updateUserAccessByMaster(
          'shop-owner-x',
          {
            status: 'trial',
            trialInvoiceLimit: 15,
            trialEndsAt: Timestamp.fromMillis(Date.now() + 30 * 86400000),
            permissions: { ...MANAGER_PERMISSIONS, reports: true }
          },
          'master-uid',
          { db: masterDb, uid: 'master-uid' }
        )
      );

      await assertSucceeds(getDoc(doc(masterDb, 'firms', 'firm-x', 'inventory', 'x1')));
      await assertSucceeds(
        updateDoc(doc(masterDb, 'firms', 'firm-x', 'inventory', 'x1'), { quantity: 10 })
      );
    });

    describe('POS Exact Transaction Reproductions (Master Admin, Active Owner, Trial Owner, Cashier with Mixed Payments)', () => {
      const sampleItem: JewelleryItem = {
        id: 'pos-gold-ring-1',
        tagNo: 'RING-001',
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
        makingChargeType: 'per_gram',
        hsnCode: '7113',
        quantity: 10,
        minStockAlert: 2,
        barcode: 'BC-RING-001'
      };

      const sampleCust: Customer = {
        id: 'pos-cust-1',
        name: 'Deepak Verma',
        phone: '9826011111',
        address: 'TT Nagar, Bhopal',
        city: 'Bhopal',
        state: 'Madhya Pradesh (23)',
        totalPurchases: 0,
        outstandingBalance: 0,
        createdAt: '2026-11-14T00:00:00.000Z'
      };

      const buildPosDraft = (type: 'GST_INVOICE' | 'ESTIMATE_BILL'): Omit<GSTInvoice, 'id' | 'invoiceNumber'> => ({
        invoiceType: type,
        date: '2026-11-14',
        customerId: sampleCust.id,
        customerName: sampleCust.name,
        customerPhone: sampleCust.phone,
        customerAddress: sampleCust.address,
        placeOfSupply: 'Madhya Pradesh (23)',
        isInterState: false,
        items: [
          {
            itemId: sampleItem.id,
            tagNo: sampleItem.tagNo,
            name: sampleItem.name,
            category: 'Gold',
            metal: 'Gold',
            purity: '22K',
            grossWeight: 5.0,
            netWeight: 5.0,
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
            hsnCode: '7113',
            quantity: 1
          }
        ],
        itemsSubtotal: 37700,
        oldMetalDeduction: 0,
        taxableAmount: 37700,
        cgstRate: type === 'GST_INVOICE' ? 1.5 : 0,
        sgstRate: type === 'GST_INVOICE' ? 1.5 : 0,
        igstRate: 0,
        cgstAmount: type === 'GST_INVOICE' ? 565.5 : 0,
        sgstAmount: type === 'GST_INVOICE' ? 565.5 : 0,
        igstAmount: 0,
        totalTax: type === 'GST_INVOICE' ? 1131 : 0,
        hallmarkingTotalFee: 0,
        discountAmount: 0,
        grandTotal: type === 'GST_INVOICE' ? 38831 : 37700,
        payment: {
          method: 'Mixed',
          amountPaid: 20000,
          dueAmount: type === 'GST_INVOICE' ? 18831 : 17700,
          transactionRef: 'MIXED-POS-REF-99'
        },
        status: 'Partial',
        notes: 'POS Sale with Mixed Payment',
        hallmarkCertified: true
      });

      const seedFirmEnv = async (firmId: string, ownerUid: string, cashierUid?: string) => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          const adminDb = asModularDb(ctx.firestore());
          const staffMap: Record<string, string> = {};
          const staffPermsMap: Record<string, any> = {};
          if (cashierUid) {
            staffMap[cashierUid] = 'cashier';
            staffPermsMap[cashierUid] = CASHIER_PERMISSIONS;
          }
          await setDoc(doc(adminDb, 'firms', firmId), {
            ownerUid,
            name: 'Shreem Mahal Jewellers',
            staff: staffMap,
            staffPermissions: staffPermsMap
          });
          await setDoc(doc(adminDb, 'firms', firmId, 'inventory', sampleItem.id), { ...sampleItem });
          await setDoc(doc(adminDb, 'firms', firmId, 'customers', sampleCust.id), { ...sampleCust });
        });
      };

      it('Master Admin: succeeds creating GST_INVOICE with Mixed payment and updates inventory/customer/counter/usage', async () => {
        const firmId = 'firm-pos-master-1';
        const ownerUid = 'owner-m1';
        const masterUid = 'master-admin-pos';
        await seedPlatformAdmin(masterUid);
        await seedUser(ownerUid, 'active');
        await seedFirmEnv(firmId, ownerUid);

        const masterDb = asModularDb(testEnv.authenticatedContext(masterUid).firestore());
        const createdInv = await createInvoiceAtomic(
          firmId,
          buildPosDraft('GST_INVOICE'),
          [sampleItem],
          [sampleCust],
          'SMJ',
          { db: masterDb, uid: masterUid, isMasterAdmin: true }
        );

        expect(createdInv.id).toMatch(/^GST_INVOICE_\d+$/);
        expect(createdInv.payment.method).toBe('Mixed');
        expect(createdInv.payment.amountPaid).toBe(20000);

        const invDoc = (await getDoc(doc(masterDb, 'firms', firmId, 'invoices', createdInv.id))).data();
        expect(invDoc?.id).toBe(createdInv.id);

        const itemDoc = (await getDoc(doc(masterDb, 'firms', firmId, 'inventory', sampleItem.id))).data();
        expect(itemDoc?.quantity).toBe(9);

        const custDoc = (await getDoc(doc(masterDb, 'firms', firmId, 'customers', sampleCust.id))).data();
        expect(custDoc?.totalPurchases).toBe(38831);
        expect(custDoc?.outstandingBalance).toBe(18831);
      });

      it('Master Admin: succeeds creating ESTIMATE_BILL with Mixed payment', async () => {
        const firmId = 'firm-pos-master-2';
        const ownerUid = 'owner-m2';
        const masterUid = 'master-admin-pos-2';
        await seedPlatformAdmin(masterUid);
        await seedUser(ownerUid, 'active');
        await seedFirmEnv(firmId, ownerUid);

        const masterDb = asModularDb(testEnv.authenticatedContext(masterUid).firestore());
        const createdInv = await createInvoiceAtomic(
          firmId,
          buildPosDraft('ESTIMATE_BILL'),
          [sampleItem],
          [sampleCust],
          'EST',
          { db: masterDb, uid: masterUid, isMasterAdmin: true }
        );

        expect(createdInv.id).toMatch(/^ESTIMATE_BILL_\d+$/);
        expect(createdInv.payment.method).toBe('Mixed');
        const invDoc = (await getDoc(doc(masterDb, 'firms', firmId, 'invoices', createdInv.id))).data();
        expect(invDoc?.invoiceType).toBe('ESTIMATE_BILL');
      });

      it('Owner (Active): succeeds with GST_INVOICE and Mixed payment', async () => {
        const firmId = 'firm-pos-owner-1';
        const ownerUid = 'owner-active-1';
        await seedUser(ownerUid, 'active');
        await seedFirmEnv(firmId, ownerUid);

        const ownerDb = asModularDb(testEnv.authenticatedContext(ownerUid).firestore());
        const createdInv = await createInvoiceAtomic(
          firmId,
          buildPosDraft('GST_INVOICE'),
          [sampleItem],
          [sampleCust],
          'SMJ',
          { db: ownerDb, uid: ownerUid }
        );

        expect(createdInv.id).toMatch(/^GST_INVOICE_1$/);
        expect(createdInv.payment.method).toBe('Mixed');

        const itemDoc = (await getDoc(doc(ownerDb, 'firms', firmId, 'inventory', sampleItem.id))).data();
        expect(itemDoc?.quantity).toBe(9);
      });

      it('Owner (Active): succeeds with ESTIMATE_BILL and Mixed payment', async () => {
        const firmId = 'firm-pos-owner-2';
        const ownerUid = 'owner-active-2';
        await seedUser(ownerUid, 'active');
        await seedFirmEnv(firmId, ownerUid);

        const ownerDb = asModularDb(testEnv.authenticatedContext(ownerUid).firestore());
        const createdInv = await createInvoiceAtomic(
          firmId,
          buildPosDraft('ESTIMATE_BILL'),
          [sampleItem],
          [sampleCust],
          'EST',
          { db: ownerDb, uid: ownerUid }
        );

        expect(createdInv.id).toMatch(/^ESTIMATE_BILL_1$/);
        expect(createdInv.payment.method).toBe('Mixed');
      });

      it('Owner (Trial): succeeds with GST_INVOICE and ESTIMATE_BILL with Mixed payment within trial quota', async () => {
        const firmId = 'firm-pos-trial-1';
        const ownerUid = 'owner-trial-1';
        await seedUser(ownerUid, 'trial', 5, 10);
        await seedFirmEnv(firmId, ownerUid);

        const ownerDb = asModularDb(testEnv.authenticatedContext(ownerUid).firestore());
        const inv1 = await createInvoiceAtomic(
          firmId,
          buildPosDraft('GST_INVOICE'),
          [sampleItem],
          [sampleCust],
          'SMJ',
          { db: ownerDb, uid: ownerUid }
        );
        expect(inv1.id).toBe('GST_INVOICE_1');
        expect(inv1.payment.method).toBe('Mixed');

        const inv2 = await createInvoiceAtomic(
          firmId,
          buildPosDraft('ESTIMATE_BILL'),
          [sampleItem],
          [sampleCust],
          'EST',
          { db: ownerDb, uid: ownerUid }
        );
        expect(inv2.id).toBe('ESTIMATE_BILL_2');
        expect(inv2.payment.method).toBe('Mixed');
      });

      it('Staff Cashier: succeeds with GST_INVOICE and ESTIMATE_BILL with Mixed payment', async () => {
        const firmId = 'firm-pos-cashier-1';
        const ownerUid = 'owner-cashier-head';
        const cashierUid = 'staff-cashier-pos';
        await seedUser(ownerUid, 'active');
        await seedUser(cashierUid, 'active');
        await seedFirmEnv(firmId, ownerUid, cashierUid);

        const cashierDb = asModularDb(testEnv.authenticatedContext(cashierUid).firestore());
        const invGst = await createInvoiceAtomic(
          firmId,
          buildPosDraft('GST_INVOICE'),
          [sampleItem],
          [sampleCust],
          'SMJ',
          { db: cashierDb, uid: cashierUid }
        );
        expect(invGst.id).toBe('GST_INVOICE_1');
        expect(invGst.payment.method).toBe('Mixed');

        const invEst = await createInvoiceAtomic(
          firmId,
          buildPosDraft('ESTIMATE_BILL'),
          [sampleItem],
          [sampleCust],
          'EST',
          { db: cashierDb, uid: cashierUid }
        );
        expect(invEst.id).toBe('ESTIMATE_BILL_2');
        expect(invEst.payment.method).toBe('Mixed');
      });
    });
  });
});

