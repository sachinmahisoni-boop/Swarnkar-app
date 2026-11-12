import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
  setDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  Firestore
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  GSTInvoice,
  JewelleryItem,
  Customer,
  ShopDetails,
  JewellerProfile,
  PurchaseInvoice,
  Vendor
} from '../types';
import { getISTDate, formatSequentialNumber } from './invoiceNumber';

export interface FirmDataSnapshot {
  shopDetails?: ShopDetails;
  inventory: JewelleryItem[];
  customers: Customer[];
  invoices: GSTInvoice[];
  vendors: any[];
  purchases: any[];
  expenses: any[];
  transfers: any[];
  karigars: any[];
  jobCards: any[];
  girviLoans: any[];
  gemstones: any[];
  profiles: JewellerProfile[];
}

export interface FirestoreOpts {
  db?: Firestore;
  uid?: string;
}

export interface MigrationProgress {
  phase: 'firm-root' | 'uploading' | 'completed' | 'failed';
  totalDocs: number;
  uploadedDocs: number;
  currentBatch: number;
  totalBatches: number;
  failedBatches: { batchIndex: number; error: string }[];
  lastMessage: string;
}

export interface MigrationResult {
  success: boolean;
  totalDocs: number;
  uploadedDocs: number;
  failedBatches: { batchIndex: number; error: string }[];
}

// Tracks verified/created firm root docs per firmId -> uid
const verifiedFirmRoots = new Map<string, string>();

/**
 * Recursively removes undefined values because Firestore rejects undefined fields.
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(item => stripUndefined(item)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

export function isFirmRootReady(firmId: string, uid?: string): boolean {
  if (!firmId) return false;
  const activeUid = uid || auth?.currentUser?.uid;
  if (!activeUid) return false;
  return verifiedFirmRoots.get(firmId) === activeUid;
}

export function clearFirmRootReady(firmId?: string): void {
  if (firmId) {
    verifiedFirmRoots.delete(firmId);
  } else {
    verifiedFirmRoots.clear();
  }
}

/**
 * Ensures `firms/{firmId}` exists with { ownerUid, name, gstin, staff: {} }
 * in a transaction-safe way BEFORE any subcollection read/write.
 */
export async function ensureFirmRootDoc(
  firmId: string,
  firmMeta: {
    name: string;
    gstin?: string;
    phone?: string;
    code?: string;
    counterName?: string;
    counterType?: string;
    operatorName?: string;
  },
  opts?: FirestoreOpts
): Promise<void> {
  if (!firmId) throw new Error('Firm ID is required.');
  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('ऑथेंटिकेशन आवश्यक है। कृपया साइन इन करें।');
  }

  const firmRef = doc(targetDb, 'firms', firmId);
  await runTransaction(targetDb, async (transaction) => {
    const firmSnap = await transaction.get(firmRef);
    if (!firmSnap.exists()) {
      transaction.set(
        firmRef,
        stripUndefined({
          id: firmId,
          ownerUid: uid,
          name: firmMeta.name || 'Swarnkar Jewellery Shop',
          gstin: firmMeta.gstin || '',
          phone: firmMeta.phone || '',
          code: firmMeta.code || 'FIRM-01',
          counterName: firmMeta.counterName || 'Main Showroom Counter',
          counterType: firmMeta.counterType || 'Main Showroom',
          operatorName: firmMeta.operatorName || 'Owner',
          staff: {},
          createdAt: getISTDate().isoDateStr
        })
      );
    } else {
      const data = firmSnap.data();
      const isOwner = data?.ownerUid === uid;
      const isStaff = Boolean(data?.staff && typeof data.staff === 'object' && uid in data.staff);
      if (!isOwner && !isStaff) {
        throw new Error('इस फर्म तक पहुँचने की अनुमति नहीं है (Permission denied).');
      }
    }
  });

  verifiedFirmRoots.set(firmId, uid);
}

/**
 * Fetches all firms owned by a signed-in user from Firestore
 */
export async function fetchUserFirms(
  uid: string,
  targetDb: Firestore = db
): Promise<JewellerProfile[]> {
  if (!uid) return [];
  const q = query(collection(targetDb, 'firms'), where('ownerUid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      firmId: d.id,
      userId: uid,
      ownerUid: data.ownerUid,
      staff: data.staff || {},
      code: data.code || 'FIRM-01',
      name: data.name || 'Jewellery Firm',
      counterName: data.counterName || 'Main Showroom Counter',
      counterType: data.counterType || 'Main Showroom',
      operatorName: data.operatorName || 'Owner',
      gstin: data.gstin || 'URP-UNREGISTERED',
      phone: data.phone || '',
      isDefault: true
    } as JewellerProfile;
  });
}

/**
 * Checks whether Firestore already has records for the given firm
 */
export async function checkFirmHasFirestoreData(
  firmId: string,
  opts?: FirestoreOpts
): Promise<boolean> {
  if (!firmId) return false;
  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;
  if (!isFirmRootReady(firmId, uid)) {
    throw new Error(`Firm root document firms/${firmId} is not verified yet.`);
  }

  const colsToCheck = ['invoices', 'inventory', 'customers', 'purchases', 'gemstones'];
  for (const colName of colsToCheck) {
    const snap = await getDocs(query(collection(targetDb, 'firms', firmId, colName), limit(1)));
    if (!snap.empty) return true;
  }
  return false;
}

/**
 * Subscribes to a real-time Firestore collection for a specific firm.
 * Blocked until `firms/{firmId}` root doc is verified/created.
 */
export function subscribeToFirmCollection<T>(
  firmId: string,
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  if (!firmId) return () => {};
  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;

  if (!isFirmRootReady(firmId, uid)) {
    onError(new Error(`Firm root document firms/${firmId} is not initialized. Listener blocked.`));
    return () => {};
  }

  const colRef = collection(targetDb, 'firms', firmId, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      onUpdate(items);
    },
    (err) => {
      onError(err);
    }
  );
}

/**
 * Subscribes to a single Firestore document (e.g., shop_details/main).
 * Blocked until `firms/{firmId}` root doc is verified/created.
 */
export function subscribeToFirmDoc<T>(
  firmId: string,
  collectionName: string,
  docId: string,
  onUpdate: (data: T | null) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  if (!firmId || !docId) return () => {};
  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;

  if (!isFirmRootReady(firmId, uid)) {
    onError(new Error(`Firm root document firms/${firmId} is not initialized. Listener blocked.`));
    return () => {};
  }

  const docRef = doc(targetDb, 'firms', firmId, collectionName, docId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      onError(err);
    }
  );
}

/**
 * Save single document into Firestore (blocked until firm root doc exists)
 */
export async function saveFirmDoc<T extends { id: string }>(
  firmId: string,
  collectionName: string,
  data: T,
  opts?: FirestoreOpts
): Promise<void> {
  if (!firmId || !data.id) {
    throw new Error('Firm ID and Document ID are required for Firestore write.');
  }
  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;
  if (!isFirmRootReady(firmId, uid)) {
    throw new Error(`Firm root document firms/${firmId} is not initialized yet. Write to ${collectionName} blocked.`);
  }
  const docRef = doc(targetDb, 'firms', firmId, collectionName, data.id);
  await setDoc(docRef, stripUndefined(data), { merge: true });
}

/**
 * Delete single document from Firestore (blocked until firm root doc exists)
 */
export async function deleteFirmDoc(
  firmId: string,
  collectionName: string,
  docId: string,
  opts?: FirestoreOpts
): Promise<void> {
  if (!firmId || !docId) {
    throw new Error('Firm ID and Document ID are required for Firestore delete.');
  }
  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;
  if (!isFirmRootReady(firmId, uid)) {
    throw new Error(`Firm root document firms/${firmId} is not initialized yet. Delete from ${collectionName} blocked.`);
  }
  const docRef = doc(targetDb, 'firms', firmId, collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * Atomically save purchase invoice, update vendor balance, and add inward stock items
 */
export async function createPurchaseAtomic(
  firmId: string,
  purchase: PurchaseInvoice,
  stockItemsToInsert: JewelleryItem[],
  vendor?: Vendor,
  opts?: FirestoreOpts
): Promise<void> {
  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;
  if (!isFirmRootReady(firmId, uid)) {
    throw new Error(`Firm root document firms/${firmId} is not initialized yet.`);
  }

  const batch = writeBatch(targetDb);
  const purRef = doc(targetDb, 'firms', firmId, 'purchases', purchase.id);
  batch.set(purRef, stripUndefined({ ...purchase, firmId }), { merge: true });

  if (vendor) {
    const venRef = doc(targetDb, 'firms', firmId, 'vendors', vendor.id);
    batch.set(
      venRef,
      stripUndefined({
        ...vendor,
        firmId,
        cashBalanceDue: vendor.cashBalanceDue + purchase.balanceDue,
        totalPurchasesAmount: vendor.totalPurchasesAmount + purchase.grandTotal
      }),
      { merge: true }
    );
  }

  for (const item of stockItemsToInsert) {
    const itemRef = doc(targetDb, 'firms', firmId, 'inventory', item.id);
    batch.set(itemRef, stripUndefined({ ...item, firmId }), { merge: true });
  }

  await batch.commit();
}

/**
 * Reserve next sequential invoice/voucher number atomically using Firestore transaction
 */
export async function reserveNextSequenceNumber(
  firmId: string,
  counterType: 'GST_INVOICE' | 'ESTIMATE_BILL' | 'PURCHASE' | 'GIRVI' | 'KARIGAR',
  prefix: string,
  opts?: FirestoreOpts
): Promise<string> {
  const targetDb = opts?.db || db;
  const istInfo = getISTDate();
  const finYearStr = istInfo.financialYear.finYearStr;
  const counterDocId = `${counterType}_${finYearStr}`;
  const counterRef = doc(targetDb, 'firms', firmId, 'sequence_counters', counterDocId);

  return await runTransaction(targetDb, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextVal = 1;
    if (counterSnap.exists()) {
      nextVal = (counterSnap.data().currentVal || 0) + 1;
    }
    transaction.set(
      counterRef,
      { currentVal: nextVal, finYear: finYearStr, lastUpdated: istInfo.isoDateStr },
      { merge: true }
    );
    return formatSequentialNumber(prefix, finYearStr, nextVal);
  });
}

/**
 * Atomically create invoice, deduct stock, update customer ledger, and reserve sequence number.
 * Executes ALL transaction.get() calls BEFORE any writes.
 */
export async function createInvoiceAtomic(
  firmId: string,
  invoiceDraft: Omit<GSTInvoice, 'id' | 'invoiceNumber'>,
  inventory: JewelleryItem[],
  currentCustomers: Customer[],
  prefix: string = 'SMJ',
  opts?: FirestoreOpts
): Promise<GSTInvoice> {
  const targetDb = opts?.db || db;
  const istInfo = getISTDate();
  const finYearStr = istInfo.financialYear.finYearStr;
  const counterDocId = `${invoiceDraft.invoiceType}_${finYearStr}`;
  const counterRef = doc(targetDb, 'firms', firmId, 'sequence_counters', counterDocId);

  const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Collect unique inventory item IDs
  const itemIds = Array.from(
    new Set(
      invoiceDraft.items
        .map(i => i.itemId)
        .filter((id): id is string => Boolean(id))
    )
  );

  // Aggregate total required quantity per itemId across cart lines
  const requiredQtyByItemId = new Map<string, { qty: number; name: string }>();
  for (const item of invoiceDraft.items) {
    if (item.itemId) {
      const existing = requiredQtyByItemId.get(item.itemId);
      requiredQtyByItemId.set(item.itemId, {
        qty: (existing?.qty || 0) + (item.quantity || 1),
        name: item.name
      });
    }
  }

  const createdInvoice = await runTransaction(targetDb, async (transaction) => {
    // === 1. ALL READS FIRST ===
    const counterSnap = await transaction.get(counterRef);

    const itemSnapshots = await Promise.all(
      itemIds.map(id => transaction.get(doc(targetDb, 'firms', firmId, 'inventory', id)))
    );
    const itemSnapMap = new Map<string, any>();
    itemIds.forEach((id, idx) => {
      itemSnapMap.set(id, itemSnapshots[idx]);
    });

    let custSnap: any = null;
    let custRef: any = null;
    if (invoiceDraft.customerId && invoiceDraft.customerId !== 'walkin') {
      custRef = doc(targetDb, 'firms', firmId, 'customers', invoiceDraft.customerId);
      custSnap = await transaction.get(custRef);
    }

    // === 2. VALIDATION INSIDE TRANSACTION USING FRESH READS ===
    for (const [itemId, req] of requiredQtyByItemId.entries()) {
      const snap = itemSnapMap.get(itemId);
      const freshQty = snap && snap.exists() ? (snap.data().quantity || 0) : 0;
      if (!snap || !snap.exists() || freshQty < req.qty) {
        throw new Error(
          `स्टॉक में पर्याप्त मात्रा उपलब्ध नहीं है (${req.name}): उपलब्ध ${freshQty}, आवश्यक ${req.qty}`
        );
      }
    }

    // === 3. PREPARE WRITES ===
    let nextSeq = 1;
    if (counterSnap.exists()) {
      nextSeq = (counterSnap.data().currentVal || 0) + 1;
    }
    const actualInvoiceNumber = formatSequentialNumber(prefix, finYearStr, nextSeq);

    // === 4. ALL WRITES AFTER READS ===
    // a. Update sequence counter
    transaction.set(
      counterRef,
      { currentVal: nextSeq, finYear: finYearStr, lastUpdated: istInfo.isoDateStr },
      { merge: true }
    );

    // b. Deduct stock from inventory
    for (const [itemId, req] of requiredQtyByItemId.entries()) {
      const snap = itemSnapMap.get(itemId);
      const freshQty = snap.data().quantity || 0;
      const newQty = freshQty - req.qty;
      const itemRef = doc(targetDb, 'firms', firmId, 'inventory', itemId);
      transaction.update(itemRef, { quantity: newQty });
    }

    // c. Update customer ledger
    if (custRef && custSnap && custSnap.exists()) {
      const cData = custSnap.data();
      const newTotalPurchases = (cData.totalPurchases || 0) + invoiceDraft.grandTotal;
      const newOutstanding = (cData.outstandingBalance || 0) + (invoiceDraft.payment?.dueAmount || 0);
      transaction.update(custRef, {
        totalPurchases: newTotalPurchases,
        outstandingBalance: newOutstanding
      });
    }

    // d. Save final invoice document
    const finalInvoice: GSTInvoice = stripUndefined({
      ...invoiceDraft,
      id: invoiceId,
      invoiceNumber: actualInvoiceNumber,
      firmId
    });

    const invRef = doc(targetDb, 'firms', firmId, 'invoices', invoiceId);
    transaction.set(invRef, finalInvoice);

    return finalInvoice;
  });

  return createdInvoice;
}

/**
 * Atomically cancel invoice, restore stock, and reverse customer ledger.
 * Executes ALL transaction.get() calls BEFORE any writes.
 */
export async function cancelInvoiceAtomic(
  firmId: string,
  invoice: GSTInvoice,
  cancelReason: string,
  cancelledBy: string,
  opts?: FirestoreOpts
): Promise<void> {
  const targetDb = opts?.db || db;
  const invRef = doc(targetDb, 'firms', firmId, 'invoices', invoice.id);

  const itemIds = Array.from(
    new Set(
      invoice.items
        .map(i => i.itemId)
        .filter((id): id is string => Boolean(id))
    )
  );

  await runTransaction(targetDb, async (transaction) => {
    // === 1. ALL READS FIRST ===
    const invSnap = await transaction.get(invRef);
    if (!invSnap.exists()) {
      throw new Error('इनवॉइस नहीं मिला।');
    }

    const invData = invSnap.data() as GSTInvoice;
    if (invData.status === 'Cancelled') {
      throw new Error('यह इनवॉइस पहले ही रद्द (Cancel) हो चुका है।');
    }

    // Aggregate quantities to restore per itemId from stored invoice
    const restoreQtyByItemId = new Map<string, number>();
    const allItemIds = new Set(itemIds);
    for (const item of invData.items || []) {
      if (item.itemId) {
        allItemIds.add(item.itemId);
        restoreQtyByItemId.set(
          item.itemId,
          (restoreQtyByItemId.get(item.itemId) || 0) + (item.quantity || 1)
        );
      }
    }

    const uniqueRestoreIds = Array.from(allItemIds);
    const itemSnapshots = await Promise.all(
      uniqueRestoreIds.map(id => transaction.get(doc(targetDb, 'firms', firmId, 'inventory', id)))
    );
    const itemSnapMap = new Map<string, any>();
    uniqueRestoreIds.forEach((id, idx) => {
      itemSnapMap.set(id, itemSnapshots[idx]);
    });

    let custSnap: any = null;
    let custRef: any = null;
    if (invData.customerId && invData.customerId !== 'walkin') {
      custRef = doc(targetDb, 'firms', firmId, 'customers', invData.customerId);
      custSnap = await transaction.get(custRef);
    }

    // === 2. ALL WRITES AFTER READS ===
    // a. Restore stock for linked items
    for (const [itemId, qtyToRestore] of restoreQtyByItemId.entries()) {
      const snap = itemSnapMap.get(itemId);
      if (snap && snap.exists()) {
        const currentQty = snap.data().quantity || 0;
        const itemRef = doc(targetDb, 'firms', firmId, 'inventory', itemId);
        transaction.update(itemRef, { quantity: currentQty + qtyToRestore });
      }
    }

    // b. Reverse customer ledger
    if (custRef && custSnap && custSnap.exists()) {
      const cData = custSnap.data();
      const newTotalPurchases = Math.max(0, (cData.totalPurchases || 0) - invData.grandTotal);
      const newOutstanding = Math.max(0, (cData.outstandingBalance || 0) - (invData.payment?.dueAmount || 0));
      transaction.update(custRef, {
        totalPurchases: newTotalPurchases,
        outstandingBalance: newOutstanding
      });
    }

    // c. Mark invoice as Cancelled
    transaction.update(invRef, {
      status: 'Cancelled',
      cancelReason,
      cancelledBy,
      cancelledAt: getISTDate().isoDateStr
    });
  });
}

const MIGRATION_COLLECTIONS: { colName: string; snapshotKey: keyof FirmDataSnapshot; legacyGlobalKey: string }[] = [
  { colName: 'inventory', snapshotKey: 'inventory', legacyGlobalKey: 'jewel_inventory' },
  { colName: 'customers', snapshotKey: 'customers', legacyGlobalKey: 'jewel_customers' },
  { colName: 'invoices', snapshotKey: 'invoices', legacyGlobalKey: 'jewel_invoices' },
  { colName: 'vendors', snapshotKey: 'vendors', legacyGlobalKey: 'jewel_vendors' },
  { colName: 'purchases', snapshotKey: 'purchases', legacyGlobalKey: 'jewel_purchases' },
  { colName: 'expenses', snapshotKey: 'expenses', legacyGlobalKey: 'jewel_expenses' },
  { colName: 'transfers', snapshotKey: 'transfers', legacyGlobalKey: 'jewel_transfers' },
  { colName: 'karigars', snapshotKey: 'karigars', legacyGlobalKey: 'jewel_karigars' },
  { colName: 'jobcards', snapshotKey: 'jobCards', legacyGlobalKey: 'jewel_jobcards' },
  { colName: 'girvi', snapshotKey: 'girviLoans', legacyGlobalKey: 'jewel_girvi' },
  { colName: 'gemstones', snapshotKey: 'gemstones', legacyGlobalKey: 'jewel_gemstones_v1' }
];

function readJsonArrayFromLocalStorage(key: string): any[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Reads legacy/existing firm data from localStorage WITHOUT modifying or deleting any keys.
 */
export function getLegacyLocalStorageData(firmId: string): {
  hasData: boolean;
  totalCount: number;
  counts: Record<string, number>;
  snapshot: FirmDataSnapshot;
} {
  const counts: Record<string, number> = {};
  const snapshot: FirmDataSnapshot = {
    inventory: [],
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
  };

  if (!firmId || typeof localStorage === 'undefined') {
    return { hasData: false, totalCount: 0, counts, snapshot };
  }

  let totalCount = 0;

  for (const { colName, snapshotKey, legacyGlobalKey } of MIGRATION_COLLECTIONS) {
    const scopedKey = `jewel_firm_${firmId}_${colName}`;
    const scopedList = readJsonArrayFromLocalStorage(scopedKey);
    let combined = [...scopedList];

    if (firmId === 'prof-main' || firmId === 'firm-main') {
      const legacyGlobalList = readJsonArrayFromLocalStorage(legacyGlobalKey);
      const seenIds = new Set(combined.map(x => x?.id).filter(Boolean));
      for (const item of legacyGlobalList) {
        if (item && (!item.id || !seenIds.has(item.id))) {
          combined.push(item);
        }
      }
    }

    (snapshot[snapshotKey] as any[]) = combined;
    counts[colName] = combined.length;
    totalCount += combined.length;
  }

  const shopRaw = localStorage.getItem(`jewel_firm_${firmId}_shop_details`);
  if (shopRaw) {
    try {
      snapshot.shopDetails = JSON.parse(shopRaw);
    } catch {
      // Ignore malformed legacy shop details
    }
  }

  return {
    hasData: totalCount > 0,
    totalCount,
    counts,
    snapshot
  };
}

/**
 * Deletes legacy localStorage firm keys ONLY after explicit user confirmation post-migration.
 */
export function clearLegacyLocalStorageKeys(firmId: string): void {
  if (!firmId || typeof localStorage === 'undefined') return;
  localStorage.removeItem(`jewel_firm_${firmId}_shop_details`);
  for (const { colName, legacyGlobalKey } of MIGRATION_COLLECTIONS) {
    localStorage.removeItem(`jewel_firm_${firmId}_${colName}`);
    if (firmId === 'prof-main' || firmId === 'firm-main') {
      localStorage.removeItem(legacyGlobalKey);
    }
  }
}

const MIGRATION_BATCH_LIMIT = 400;

/**
 * Uploads local data to Firestore for a firm:
 * (a) Creates firm root doc FIRST in its own transaction and waits;
 * (b) Writes subcollection documents in chunked batches of <= 400 ops;
 * (c) Reports progress and failures;
 * (d) Idempotent & resumable via checkpointing in localStorage.
 */
export async function uploadLocalStorageToFirestore(
  firmId: string,
  data: FirmDataSnapshot,
  opts?: FirestoreOpts & {
    onProgress?: (progress: MigrationProgress) => void;
    resume?: boolean;
  }
): Promise<MigrationResult> {
  if (!firmId) {
    throw new Error('Firm ID is required for migration.');
  }

  const targetDb = opts?.db || db;
  const uid = opts?.uid || auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('ऑथेंटिकेशन आवश्यक है। क्लाउड सिंक के लिए साइन इन करें।');
  }

  const onProgress = opts?.onProgress;
  const checkpointKey = `jewel_migration_checkpoint_${firmId}`;

  // Step (a): Create/verify firm root doc FIRST in its own transaction and wait
  onProgress?.({
    phase: 'firm-root',
    totalDocs: 0,
    uploadedDocs: 0,
    currentBatch: 0,
    totalBatches: 0,
    failedBatches: [],
    lastMessage: `Verifying firm root document firms/${firmId}...`
  });

  await ensureFirmRootDoc(
    firmId,
    {
      name: data.shopDetails?.name || 'Swarnkar Jewellery Shop',
      gstin: data.shopDetails?.gstin || '',
      phone: data.shopDetails?.phone || ''
    },
    { db: targetDb, uid }
  );

  // Build flat list of subcollection write operations
  interface WriteOp {
    docKey: string;
    colName: string;
    docId: string;
    payload: Record<string, any>;
  }

  const ops: WriteOp[] = [];

  if (data.shopDetails) {
    ops.push({
      docKey: 'shop_details/main',
      colName: 'shop_details',
      docId: 'main',
      payload: stripUndefined({ ...data.shopDetails, firmId })
    });
  }

  const collectionsMap: [string, any[]][] = [
    ['inventory', data.inventory || []],
    ['customers', data.customers || []],
    ['invoices', data.invoices || []],
    ['vendors', data.vendors || []],
    ['purchases', data.purchases || []],
    ['expenses', data.expenses || []],
    ['transfers', data.transfers || []],
    ['karigars', data.karigars || []],
    ['jobcards', data.jobCards || []],
    ['girvi', data.girviLoans || []],
    ['gemstones', data.gemstones || []]
  ];

  for (const [colName, list] of collectionsMap) {
    for (const item of list) {
      if (item && item.id) {
        ops.push({
          docKey: `${colName}/${item.id}`,
          colName,
          docId: item.id,
          payload: stripUndefined({ ...item, firmId })
        });
      }
    }
  }

  // Load resumable checkpoint if enabled
  let completedKeys = new Set<string>();
  if (opts?.resume !== false && typeof localStorage !== 'undefined') {
    const rawCheckpoint = localStorage.getItem(checkpointKey);
    if (rawCheckpoint) {
      try {
        const parsed = JSON.parse(rawCheckpoint);
        if (Array.isArray(parsed)) {
          completedKeys = new Set(parsed);
        }
      } catch {
        completedKeys = new Set();
      }
    }
  }

  const pendingOps = ops.filter(op => !completedKeys.has(op.docKey));
  const totalDocs = ops.length;
  let uploadedDocs = totalDocs - pendingOps.length;

  // Step (b): Chunk into batches of <= 400 operations
  const chunks: WriteOp[][] = [];
  for (let i = 0; i < pendingOps.length; i += MIGRATION_BATCH_LIMIT) {
    chunks.push(pendingOps.slice(i, i + MIGRATION_BATCH_LIMIT));
  }

  const totalBatches = chunks.length;
  const failedBatches: { batchIndex: number; error: string }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    onProgress?.({
      phase: 'uploading',
      totalDocs,
      uploadedDocs,
      currentBatch: i + 1,
      totalBatches,
      failedBatches: [...failedBatches],
      lastMessage: `Uploading batch ${i + 1} of ${totalBatches} (${chunk.length} records)...`
    });

    try {
      const batch = writeBatch(targetDb);
      for (const op of chunk) {
        const ref = doc(targetDb, 'firms', firmId, op.colName, op.docId);
        batch.set(ref, op.payload, { merge: true });
      }
      await batch.commit();

      uploadedDocs += chunk.length;
      for (const op of chunk) {
        completedKeys.add(op.docKey);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(checkpointKey, JSON.stringify(Array.from(completedKeys)));
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      failedBatches.push({ batchIndex: i + 1, error: errorMsg });
    }
  }

  if (failedBatches.length > 0) {
    onProgress?.({
      phase: 'failed',
      totalDocs,
      uploadedDocs,
      currentBatch: totalBatches,
      totalBatches,
      failedBatches,
      lastMessage: `Migration finished with ${failedBatches.length} failed batch(es). You can safely retry to resume.`
    });

    throw new Error(
      `Migration partially failed (${uploadedDocs}/${totalDocs} uploaded). Failed batches: ${failedBatches
        .map(b => `#${b.batchIndex}: ${b.error}`)
        .join('; ')}`
    );
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(checkpointKey);
  }

  onProgress?.({
    phase: 'completed',
    totalDocs,
    uploadedDocs,
    currentBatch: totalBatches,
    totalBatches,
    failedBatches: [],
    lastMessage: `All ${uploadedDocs} records uploaded to Firestore successfully.`
  });

  return {
    success: true,
    totalDocs,
    uploadedDocs,
    failedBatches: []
  };
}

/**
 * Downloads JSON Backup File
 */
export function downloadJSONFile(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads CSV File
 */
export function downloadCSVFile(rows: any[], filename: string) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(',');
  const csvLines = rows.map(r =>
    Object.values(r)
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const csvContent = '\uFEFF' + [headers, ...csvLines].join('\n'); // UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
