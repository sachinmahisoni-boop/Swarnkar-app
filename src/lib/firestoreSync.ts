import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  onSnapshotsInSync,
  query,
  where,
  limit,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  orderBy,
  addDoc,
  deleteField,
  serverTimestamp,
  Timestamp,
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
  Vendor,
  AppUserAccessRecord,
  MasterControlSettings,
  FirmUsageInvoicesDoc,
  UserUsageInvoicesDoc,
  StaffInviteRecord,
  AuditLogEntry,
  AuditAction,
  PublicSupportConfig,
  UserPermissions,
  StaffMemberMeta
} from '../types';
import { getISTDate, formatSequentialNumber } from './invoiceNumber';
import {
  DEFAULT_TRIAL_INVOICE_LIMIT,
  DEFAULT_TRIAL_DAYS,
  FULL_PERMISSIONS,
  RESTRICTED_PERMISSIONS,
  capStaffPermissionsToOwner,
  canUserAccessApp,
  canUserCreateInvoice,
  toEpochMs
} from './accessControl';

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
  isMasterAdmin?: boolean;
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
  if (
    value instanceof Date ||
    (typeof Timestamp === 'function' && value instanceof Timestamp) ||
    (typeof value === 'object' && typeof (value as any).toMillis === 'function' && typeof (value as any).toDate === 'function') ||
    (typeof value === 'object' && (typeof (value as any)._methodName === 'string' || value?.constructor?.name?.includes('FieldValue')))
  ) {
    return value;
  }
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
      if (!isOwner && !isStaff && !opts?.isMasterAdmin) {
        throw new Error('इस फर्म तक पहुँचने की अनुमति नहीं है (Permission denied).');
      }
    }
  });

  verifiedFirmRoots.set(firmId, uid);
}

function mapFirmDocToProfile(id: string, data: any, uid: string): JewellerProfile {
  return {
    id,
    firmId: id,
    userId: uid,
    ownerUid: data.ownerUid,
    staff: data.staff || {},
    staffPermissions: data.staffPermissions || {},
    staffMembers: data.staffMembers || {},
    code: data.code || 'FIRM-01',
    name: data.name || 'Jewellery Firm',
    counterName: data.counterName || 'Main Showroom Counter',
    counterType: data.counterType || 'Main Showroom',
    operatorName: data.operatorName || 'Owner',
    gstin: data.gstin || 'URP-UNREGISTERED',
    phone: data.phone || '',
    logoUrl: data.logoUrl,
    isDefault: data.ownerUid === uid
  } as JewellerProfile;
}

/**
 * Fetches all firms owned by or shared (via staff invite) with a signed-in user from Firestore
 */
export async function fetchUserFirms(
  uid: string,
  targetDb: Firestore = db
): Promise<JewellerProfile[]> {
  if (!uid) return [];
  const byId = new Map<string, JewellerProfile>();

  const ownedQuery = query(collection(targetDb, 'firms'), where('ownerUid', '==', uid));
  const ownedSnap = await getDocs(ownedQuery);
  ownedSnap.docs.forEach((d) => {
    byId.set(d.id, mapFirmDocToProfile(d.id, d.data(), uid));
  });

  // Also include firms where this user has accepted staff membership
  try {
    const staffInvitesQuery = query(
      collection(targetDb, 'staff_invites'),
      where('acceptedUid', '==', uid)
    );
    const inviteSnap = await getDocs(staffInvitesQuery);
    for (const invDoc of inviteSnap.docs) {
      const inv = invDoc.data() as StaffInviteRecord;
      if (inv.firmId && !byId.has(inv.firmId)) {
        try {
          const fSnap = await getDoc(doc(targetDb, 'firms', inv.firmId));
          if (fSnap.exists()) {
            const fData = fSnap.data();
            if (fData?.staff && uid in fData.staff) {
              byId.set(fSnap.id, mapFirmDocToProfile(fSnap.id, fData, uid));
            }
          }
        } catch {
          // Ignore firms whose owner was suspended or removed
        }
      }
    }
  } catch {
    // Non-fatal if staff_invites query has no matches
  }

  return Array.from(byId.values());
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

export interface SnapshotMetadataInfo {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

/**
 * Subscribes to a real-time Firestore collection for a specific firm.
 * Blocked until `firms/{firmId}` root doc is verified/created.
 */
export function subscribeToFirmCollection<T>(
  firmId: string,
  collectionName: string,
  onUpdate: (items: T[], meta?: SnapshotMetadataInfo) => void,
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
    { includeMetadataChanges: true },
    (snapshot) => {
      const items: T[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      onUpdate(items, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      });
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
  onUpdate: (data: T | null, meta?: SnapshotMetadataInfo) => void,
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
    { includeMetadataChanges: true },
    (snapshot) => {
      const meta: SnapshotMetadataInfo = {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      };
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as T, meta);
      } else {
        onUpdate(null, meta);
      }
    },
    (err) => {
      onError(err);
    }
  );
}

/**
 * Fires whenever Firestore finishes synchronizing all active listeners and pending writes.
 */
export function subscribeToSnapshotsInSync(
  onInSync: () => void,
  opts?: FirestoreOpts
): () => void {
  const targetDb = opts?.db || db;
  if (!targetDb) return () => {};
  return onSnapshotsInSync(targetDb, () => {
    onInSync();
  });
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

export function subscribeToUserInvoiceUsage(
  ownerUid: string,
  onUpdate: (usage: UserUsageInvoicesDoc | null, meta?: SnapshotMetadataInfo) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  if (!ownerUid) return () => {};
  const targetDb = opts?.db || db;
  const usageRef = doc(targetDb, 'users', ownerUid, 'usage', 'invoices');
  return onSnapshot(
    usageRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      const meta: SnapshotMetadataInfo = {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      };
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as UserUsageInvoicesDoc, meta);
      } else {
        onUpdate(null, meta);
      }
    },
    (err) => {
      onError(err);
    }
  );
}

export async function fetchUserInvoiceUsage(
  ownerUid: string,
  opts?: FirestoreOpts
): Promise<UserUsageInvoicesDoc | null> {
  if (!ownerUid) return null;
  const targetDb = opts?.db || db;
  try {
    const snap = await getDoc(doc(targetDb, 'users', ownerUid, 'usage', 'invoices'));
    return snap.exists() ? (snap.data() as UserUsageInvoicesDoc) : null;
  } catch {
    return null;
  }
}

/**
 * Atomically create invoice, deduct stock, update customer ledger, reserve sequence number,
 * and increment the tamper-resistant per-owner counter doc `users/{ownerUid}/usage/invoices`.
 * Invoice docId is derived strictly as `${series}_${nextUsageCount}` to prevent batch bypasses.
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
  const uid = opts?.uid || auth?.currentUser?.uid;
  const istInfo = getISTDate();
  const finYearStr = istInfo.financialYear.finYearStr;
  const monthKey = istInfo.isoDateStr.slice(0, 7);
  const series = invoiceDraft.invoiceType;
  const counterDocId = `${series}_${finYearStr}`;
  const counterRef = doc(targetDb, 'firms', firmId, 'sequence_counters', counterDocId);
  const firmRef = doc(targetDb, 'firms', firmId);

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
    const firmSnap = await transaction.get(firmRef);
    const firmData = firmSnap.exists() ? firmSnap.data() : null;
    const ownerUid = firmData?.ownerUid || uid;
    if (!ownerUid) {
      throw new Error('फर्म स्वामी (Owner UID) सत्यापित नहीं हो सका।');
    }

    const ownerRef = doc(targetDb, 'users', ownerUid);
    const usageRef = doc(targetDb, 'users', ownerUid, 'usage', 'invoices');
    const ownerSnap = await transaction.get(ownerRef);
    const actorRef = uid && uid !== ownerUid ? doc(targetDb, 'users', uid) : null;
    const actorSnap = actorRef ? await transaction.get(actorRef) : null;

    const usageSnap = await transaction.get(usageRef);
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
    const currentUsageCount = usageSnap.exists() ? Number(usageSnap.data()?.count || 0) : 0;
    const nextUsageCount = currentUsageCount + 1;
    const invoiceId = `${series}_${nextUsageCount}`;

    if (!opts?.isMasterAdmin && ownerSnap.exists()) {
      const ownerAccess = { uid: ownerSnap.id, ...ownerSnap.data() } as AppUserAccessRecord;
      const quotaCheck = canUserCreateInvoice(ownerAccess, currentUsageCount, Date.now(), false, FULL_PERMISSIONS);
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.reason || 'इनवॉइस बनाने की अनुमति नहीं है।');
      }
      if (actorSnap && actorSnap.exists()) {
        const actorAccess = { uid: actorSnap.id, ...actorSnap.data() } as AppUserAccessRecord;
        const actorCheck = canUserAccessApp(actorAccess, false);
        if (!actorCheck.allowed) {
          throw new Error(actorCheck.message || 'आपका खाता सक्रिय नहीं है।');
        }
      }
    }

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

    const prevUsageData = usageSnap.exists() ? usageSnap.data() : null;
    const nextMonthlyCount =
      prevUsageData?.monthKey === monthKey ? Number(prevUsageData?.monthlyCount || 0) + 1 : 1;

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

    // d. Increment tamper-resistant per-owner usage counter inside the SAME transaction
    const usagePayload: Record<string, any> = {
      count: nextUsageCount,
      monthKey,
      monthlyCount: nextMonthlyCount,
      lastInvoiceId: invoiceId,
      lastFirmId: firmId,
      updatedAt: serverTimestamp()
    };
    if (usageSnap.exists()) {
      transaction.update(usageRef, usagePayload);
    } else {
      transaction.set(usageRef, usagePayload);
    }

    // e. Save final invoice document with counter-derived ID
    const finalInvoice: GSTInvoice = stripUndefined({
      ...invoiceDraft,
      id: invoiceId,
      series,
      invoiceType: series,
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
 * Works even after trial expiry / invoice limit reached by stamping `lastCancelledInvoiceId`
 * on `users/{ownerUid}/usage/invoices` inside the same transaction.
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
  const uid = opts?.uid || auth?.currentUser?.uid;
  const invRef = doc(targetDb, 'firms', firmId, 'invoices', invoice.id);
  const firmRef = doc(targetDb, 'firms', firmId);

  const itemIds = Array.from(
    new Set(
      invoice.items
        .map(i => i.itemId)
        .filter((id): id is string => Boolean(id))
    )
  );

  await runTransaction(targetDb, async (transaction) => {
    // === 1. ALL READS FIRST ===
    const firmSnap = await transaction.get(firmRef);
    const ownerUid = (firmSnap.exists() ? firmSnap.data()?.ownerUid : null) || uid || '';
    const usageRef = ownerUid ? doc(targetDb, 'users', ownerUid, 'usage', 'invoices') : null;
    const usageSnap = usageRef ? await transaction.get(usageRef) : null;

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
    // a. Stamp cancellation on owner usage doc to authorize stock/ledger reversal post-expiry
    if (usageRef && usageSnap) {
      if (usageSnap.exists()) {
        transaction.update(usageRef, {
          lastCancelledInvoiceId: invoice.id,
          lastFirmId: firmId,
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.set(usageRef, {
          count: 0,
          lastCancelledInvoiceId: invoice.id,
          lastFirmId: firmId,
          updatedAt: serverTimestamp()
        });
      }
    }

    // b. Restore stock for linked items
    for (const [itemId, qtyToRestore] of restoreQtyByItemId.entries()) {
      const snap = itemSnapMap.get(itemId);
      if (snap && snap.exists()) {
        const currentQty = snap.data().quantity || 0;
        const itemRef = doc(targetDb, 'firms', firmId, 'inventory', itemId);
        transaction.update(itemRef, { quantity: currentQty + qtyToRestore });
      }
    }

    // c. Reverse customer ledger
    if (custRef && custSnap && custSnap.exists()) {
      const cData = custSnap.data();
      const newTotalPurchases = Math.max(0, (cData.totalPurchases || 0) - invData.grandTotal);
      const newOutstanding = Math.max(0, (cData.outstandingBalance || 0) - (invData.payment?.dueAmount || 0));
      transaction.update(custRef, {
        totalPurchases: newTotalPurchases,
        outstandingBalance: newOutstanding
      });
    }

    // d. Mark invoice as Cancelled
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

// ============================================================================
// MASTER ADMIN, USER ACCESS, AUDIT LOGS & STAFF RBAC
// ============================================================================

/**
 * Checks whether the signed-in user exists in server-provisioned `platform_admins/{uid}`.
 * Nothing on the client can write to `platform_admins`.
 */
export async function checkIsPlatformAdmin(
  uid?: string | null,
  opts?: FirestoreOpts
): Promise<boolean> {
  if (!uid) return false;
  const targetDb = opts?.db || db;
  try {
    const snap = await getDoc(doc(targetDb, 'platform_admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getPublicSupportConfig(
  opts?: FirestoreOpts
): Promise<PublicSupportConfig> {
  const targetDb = opts?.db || db;
  try {
    const snap = await getDoc(doc(targetDb, 'system_config', 'public'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: 'public',
        supportName: data.supportName || 'Platform Support Desk',
        supportPhone: data.supportPhone || '',
        supportEmail: data.supportEmail || '',
        updatedAt: data.updatedAt || ''
      };
    }
  } catch {
    // Ignore if unconfigured
  }
  return {
    id: 'public',
    supportName: 'Platform Support Desk',
    supportPhone: '',
    supportEmail: ''
  };
}

export async function savePublicSupportConfig(
  config: Omit<PublicSupportConfig, 'id' | 'updatedAt'>,
  opts?: FirestoreOpts
): Promise<void> {
  const targetDb = opts?.db || db;
  await setDoc(
    doc(targetDb, 'system_config', 'public'),
    stripUndefined({
      id: 'public',
      supportName: config.supportName || 'Platform Support Desk',
      supportPhone: config.supportPhone || '',
      supportEmail: config.supportEmail || '',
      updatedAt: new Date().toISOString()
    }),
    { merge: true }
  );
}

export async function getMasterControlSettings(
  opts?: FirestoreOpts
): Promise<MasterControlSettings> {
  const targetDb = opts?.db || db;
  try {
    const snap = await getDoc(doc(targetDb, 'system_config', 'master'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: 'master',
        defaultTrialInvoiceLimit:
          typeof data.defaultTrialInvoiceLimit === 'number'
            ? data.defaultTrialInvoiceLimit
            : DEFAULT_TRIAL_INVOICE_LIMIT,
        defaultTrialDays:
          typeof data.defaultTrialDays === 'number'
            ? data.defaultTrialDays
            : DEFAULT_TRIAL_DAYS,
        requireApprovalForNewSignups: data.requireApprovalForNewSignups !== false,
        updatedAt: data.updatedAt || '',
        updatedByUid: data.updatedByUid
      };
    }
  } catch {
    // Fallback to defaults if config doc doesn't exist yet or rules block
  }
  return {
    id: 'master',
    defaultTrialInvoiceLimit: DEFAULT_TRIAL_INVOICE_LIMIT,
    defaultTrialDays: DEFAULT_TRIAL_DAYS,
    requireApprovalForNewSignups: true,
    updatedAt: ''
  };
}

export async function saveMasterControlSettings(
  settings: MasterControlSettings,
  opts?: FirestoreOpts
): Promise<void> {
  const targetDb = opts?.db || db;
  await setDoc(
    doc(targetDb, 'system_config', 'master'),
    stripUndefined({
      ...settings,
      id: 'master',
      updatedAt: new Date().toISOString()
    }),
    { merge: true }
  );
}

/**
 * Ensures `users/{uid}` exists for any signed-in user.
 * First-time creation strictly sets `status: 'pending'` and `role: 'owner'`
 * with NO privileged fields (enforced by firestore.rules).
 */
export async function ensureUserAccessRecord(
  user: {
    uid: string;
    email?: string | null;
    emailVerified?: boolean;
    displayName?: string | null;
    phoneNumber?: string | null;
  },
  opts?: FirestoreOpts & {
    firmName?: string;
    phone?: string;
    ownerName?: string;
  }
): Promise<AppUserAccessRecord> {
  if (!user?.uid) {
    throw new Error('User UID is required.');
  }
  const targetDb = opts?.db || db;
  const userRef = doc(targetDb, 'users', user.uid);
  const nowIso = new Date().toISOString();

  const existingSnap = await getDoc(userRef);
  if (!existingSnap.exists()) {
    const newRecord: AppUserAccessRecord = stripUndefined({
      uid: user.uid,
      email: (user.email || '').trim().toLowerCase(),
      displayName: opts?.ownerName || user.displayName || (user.email ? user.email.split('@')[0] : 'Jeweller'),
      phone: opts?.phone || user.phoneNumber || '',
      firmName: opts?.firmName || '',
      role: 'owner',
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
      lastActiveAt: nowIso
    });
    await setDoc(userRef, newRecord);
    return newRecord;
  }

  const existingData = existingSnap.data() as AppUserAccessRecord;
  // Safe self-update keys allowed by firestore.rules: displayName, firmName, phone, lastActiveAt, updatedAt
  const safeProfilePatch: Record<string, any> = {
    lastActiveAt: nowIso,
    updatedAt: nowIso
  };
  if (opts?.ownerName && !existingData.displayName) {
    safeProfilePatch.displayName = opts.ownerName;
  }
  if (opts?.phone && !existingData.phone) {
    safeProfilePatch.phone = opts.phone;
  }
  if (opts?.firmName && !existingData.firmName) {
    safeProfilePatch.firmName = opts.firmName;
  }

  try {
    await updateDoc(userRef, stripUndefined(safeProfilePatch));
  } catch {
    // Non-fatal if metadata patch fails offline
  }

  return {
    ...existingData,
    ...safeProfilePatch,
    uid: user.uid
  };
}

export function subscribeToUserAccess(
  uid: string,
  onUpdate: (record: AppUserAccessRecord | null) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  if (!uid) return () => {};
  const targetDb = opts?.db || db;
  const userRef = doc(targetDb, 'users', uid);
  return onSnapshot(
    userRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ uid: snapshot.id, ...snapshot.data() } as AppUserAccessRecord);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      onError(err);
    }
  );
}

export async function fetchUserAccessOnce(
  uid: string,
  opts?: FirestoreOpts
): Promise<AppUserAccessRecord | null> {
  if (!uid) return null;
  const targetDb = opts?.db || db;
  try {
    const snap = await getDoc(doc(targetDb, 'users', uid));
    return snap.exists() ? ({ uid: snap.id, ...snap.data() } as AppUserAccessRecord) : null;
  } catch {
    return null;
  }
}

export async function updateUserProfileFields(
  uid: string,
  fields: { displayName?: string; phone?: string; firmName?: string },
  opts?: FirestoreOpts
): Promise<void> {
  if (!uid) throw new Error('User UID is required.');
  const targetDb = opts?.db || db;
  await updateDoc(
    doc(targetDb, 'users', uid),
    stripUndefined({
      ...fields,
      updatedAt: new Date().toISOString()
    })
  );
}

export function subscribeToAllUsers(
  onUpdate: (users: AppUserAccessRecord[]) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  const targetDb = opts?.db || db;
  return onSnapshot(
    collection(targetDb, 'users'),
    (snapshot) => {
      const list = snapshot.docs.map(
        (d) => ({ uid: d.id, ...d.data() } as AppUserAccessRecord)
      );
      list.sort((a, b) => (toEpochMs(b.createdAt) || 0) - (toEpochMs(a.createdAt) || 0));
      onUpdate(list);
    },
    (err) => onError(err)
  );
}

export async function updateUserAccessByMaster(
  targetUid: string,
  updates: Partial<
    Pick<
      AppUserAccessRecord,
      | 'status'
      | 'role'
      | 'trialInvoiceLimit'
      | 'trialEndsAt'
      | 'permissions'
      | 'adminNotes'
      | 'firmName'
      | 'displayName'
      | 'phone'
    >
  >,
  adminUid: string,
  opts?: FirestoreOpts
): Promise<void> {
  if (!targetUid) throw new Error('Target UID is required.');
  const targetDb = opts?.db || db;
  const nowIso = new Date().toISOString();
  const payload: Record<string, any> = {
    ...updates,
    updatedAt: nowIso
  };
  if (updates.trialEndsAt !== undefined && updates.trialEndsAt !== null) {
    const ms = toEpochMs(updates.trialEndsAt);
    if (ms !== null) {
      payload.trialEndsAt = Timestamp.fromMillis(ms);
    }
  }
  if (updates.status === 'active' || updates.status === 'trial') {
    payload.approvedAt = nowIso;
    payload.approvedBy = adminUid;
  }
  await setDoc(doc(targetDb, 'users', targetUid), stripUndefined(payload), { merge: true });
}

export async function deleteUserAccessRecord(
  targetUid: string,
  opts?: FirestoreOpts
): Promise<void> {
  if (!targetUid) throw new Error('Target UID is required.');
  const targetDb = opts?.db || db;
  await deleteDoc(doc(targetDb, 'users', targetUid));
}

export async function fetchAllFirmsForMaster(
  opts?: FirestoreOpts
): Promise<JewellerProfile[]> {
  const targetDb = opts?.db || db;
  const snap = await getDocs(collection(targetDb, 'firms'));
  return snap.docs.map((d) => mapFirmDocToProfile(d.id, d.data(), d.data().ownerUid || ''));
}

export function subscribeToAllFirmsForMaster(
  onUpdate: (firms: JewellerProfile[]) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  const targetDb = opts?.db || db;
  return onSnapshot(
    collection(targetDb, 'firms'),
    (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return mapFirmDocToProfile(d.id, data, data.ownerUid || '');
      });
      onUpdate(list);
    },
    (err) => onError(err)
  );
}

export async function fetchAllUserUsageForMaster(
  ownerUids: string[],
  opts?: FirestoreOpts
): Promise<Record<string, UserUsageInvoicesDoc>> {
  const targetDb = opts?.db || db;
  const uniqueUids = Array.from(new Set(ownerUids.filter(Boolean)));
  const entries = await Promise.all(
    uniqueUids.map(async (uid) => {
      try {
        const snap = await getDoc(doc(targetDb, 'users', uid, 'usage', 'invoices'));
        return [uid, snap.exists() ? (snap.data() as UserUsageInvoicesDoc) : { count: 0 }] as const;
      } catch {
        return [uid, { count: 0 }] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

export async function updateFirmMetaByMaster(
  firmId: string,
  updates: Partial<JewellerProfile>,
  opts?: FirestoreOpts
): Promise<void> {
  if (!firmId) throw new Error('Firm ID is required.');
  const targetDb = opts?.db || db;
  await setDoc(doc(targetDb, 'firms', firmId), stripUndefined(updates), { merge: true });
}

export async function deleteFirmByMaster(
  firmId: string,
  opts?: FirestoreOpts
): Promise<void> {
  if (!firmId) throw new Error('Firm ID is required.');
  const targetDb = opts?.db || db;
  await deleteDoc(doc(targetDb, 'firms', firmId));
}

// ============================================================================
// APPEND-ONLY AUDIT LOGS
// ============================================================================

export async function writeAuditLog(
  entry: {
    actorUid: string;
    action: AuditAction;
    targetUid?: string;
    targetFirmId?: string;
    details: string;
  },
  opts?: FirestoreOpts
): Promise<void> {
  const targetDb = opts?.db || db;
  await addDoc(collection(targetDb, 'audit_logs'), {
    actorUid: entry.actorUid,
    action: entry.action,
    targetUid: entry.targetUid || '',
    targetFirmId: entry.targetFirmId || '',
    details: String(entry.details || '').slice(0, 1000),
    createdAt: serverTimestamp()
  });
}

export function subscribeToAuditLogs(
  onUpdate: (logs: AuditLogEntry[]) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  const targetDb = opts?.db || db;
  const q = query(collection(targetDb, 'audit_logs'), orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as AuditLogEntry)
      );
      onUpdate(list);
    },
    (err) => onError(err)
  );
}

// ============================================================================
// STAFF INVITATIONS & PER-FIRM RBAC
// ============================================================================

export function subscribeToFirmStaffInvites(
  firmId: string,
  onUpdate: (invites: StaffInviteRecord[]) => void,
  onError: (err: Error) => void,
  opts?: FirestoreOpts
) {
  if (!firmId) return () => {};
  const targetDb = opts?.db || db;
  const q = query(collection(targetDb, 'staff_invites'), where('firmId', '==', firmId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as StaffInviteRecord)
      );
      onUpdate(list);
    },
    (err) => onError(err)
  );
}

export async function createOrUpdateStaffInvite(
  params: {
    firmId: string;
    firmName: string;
    ownerUid: string;
    email: string;
    displayName?: string;
    role: 'cashier' | 'manager';
    permissions: UserPermissions;
    ownerPermissions: UserPermissions;
  },
  opts?: FirestoreOpts
): Promise<StaffInviteRecord> {
  const targetDb = opts?.db || db;
  const emailLower = params.email.trim().toLowerCase();
  if (!emailLower || !emailLower.includes('@')) {
    throw new Error('कृपया स्टाफ का मान्य ईमेल पता दर्ज करें।');
  }
  const inviteId = `${params.firmId}__${emailLower}`;
  const cappedPermissions = capStaffPermissionsToOwner(params.permissions, params.ownerPermissions);
  const nowIso = new Date().toISOString();

  const existingSnap = await getDoc(doc(targetDb, 'staff_invites', inviteId));
  const existingData = existingSnap.exists() ? (existingSnap.data() as StaffInviteRecord) : null;

  const record: StaffInviteRecord = stripUndefined({
    id: inviteId,
    firmId: params.firmId,
    firmName: params.firmName,
    ownerUid: params.ownerUid,
    email: emailLower,
    displayName: params.displayName?.trim() || existingData?.displayName || emailLower.split('@')[0],
    role: params.role,
    permissions: cappedPermissions,
    status: existingData?.status === 'accepted' ? 'accepted' : 'pending',
    acceptedUid: existingData?.acceptedUid,
    acceptedAt: existingData?.acceptedAt,
    createdAt: existingData?.createdAt || nowIso,
    createdByUid: params.ownerUid
  });

  await setDoc(doc(targetDb, 'staff_invites', inviteId), record, { merge: true });

  // If the staff member already accepted previously, sync updated permissions onto firms/{firmId}
  if (existingData?.acceptedUid) {
    const uid = existingData.acceptedUid;
    const meta: StaffMemberMeta = {
      uid,
      email: emailLower,
      displayName: record.displayName,
      role: params.role,
      permissions: cappedPermissions,
      addedAt: existingData.acceptedAt || nowIso,
      addedByUid: params.ownerUid
    };
    await updateDoc(doc(targetDb, 'firms', params.firmId), {
      [`staff.${uid}`]: params.role,
      [`staffPermissions.${uid}`]: cappedPermissions,
      [`staffMembers.${uid}`]: meta
    });
  }

  return record;
}

export async function updateFirmStaffPermissions(
  params: {
    firmId: string;
    staffUid: string;
    email: string;
    role: 'cashier' | 'manager';
    permissions: UserPermissions;
    ownerPermissions: UserPermissions;
  },
  opts?: FirestoreOpts
): Promise<void> {
  const targetDb = opts?.db || db;
  const capped = capStaffPermissionsToOwner(params.permissions, params.ownerPermissions);
  const inviteId = `${params.firmId}__${params.email.trim().toLowerCase()}`;

  await updateDoc(doc(targetDb, 'firms', params.firmId), {
    [`staff.${params.staffUid}`]: params.role,
    [`staffPermissions.${params.staffUid}`]: capped,
    [`staffMembers.${params.staffUid}.role`]: params.role,
    [`staffMembers.${params.staffUid}.permissions`]: capped
  });

  try {
    await updateDoc(doc(targetDb, 'staff_invites', inviteId), {
      role: params.role,
      permissions: capped
    });
  } catch {
    // Invite doc may not exist if staff was added directly
  }
}

export async function removeFirmStaffMember(
  firmId: string,
  staffUid: string | undefined,
  email: string,
  opts?: FirestoreOpts
): Promise<void> {
  const targetDb = opts?.db || db;
  if (staffUid) {
    await updateDoc(doc(targetDb, 'firms', firmId), {
      [`staff.${staffUid}`]: deleteField(),
      [`staffPermissions.${staffUid}`]: deleteField(),
      [`staffMembers.${staffUid}`]: deleteField()
    });
  }
  const inviteId = `${firmId}__${email.trim().toLowerCase()}`;
  try {
    await deleteDoc(doc(targetDb, 'staff_invites', inviteId));
  } catch {
    // Ignore if invite already deleted
  }
}

/**
 * Claims any pending/matching `staff_invites` for the authenticated user's email
 * and registers their UID in `firms/{firmId}.staff` so they can access shared firms.
 */
export async function claimStaffInvitesForUser(
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  },
  opts?: FirestoreOpts
): Promise<number> {
  const emailLower = (user.email || '').trim().toLowerCase();
  if (!user.uid || !emailLower) return 0;
  const targetDb = opts?.db || db;
  let claimed = 0;

  try {
    const q = query(collection(targetDb, 'staff_invites'), where('email', '==', emailLower));
    const snap = await getDocs(q);
    const nowIso = new Date().toISOString();

    for (const invDoc of snap.docs) {
      const invite = invDoc.data() as StaffInviteRecord;
      if (!invite.firmId) continue;
      if (invite.ownerUid === user.uid) continue;

      const meta: StaffMemberMeta = {
        uid: user.uid,
        email: emailLower,
        displayName: user.displayName || invite.displayName || emailLower.split('@')[0],
        role: invite.role,
        permissions: invite.permissions || RESTRICTED_PERMISSIONS,
        addedAt: invite.acceptedAt || nowIso,
        addedByUid: invite.createdByUid || invite.ownerUid
      };

      try {
        await updateDoc(doc(targetDb, 'firms', invite.firmId), {
          [`staff.${user.uid}`]: invite.role,
          [`staffPermissions.${user.uid}`]: meta.permissions,
          [`staffMembers.${user.uid}`]: meta
        });

        if (invite.status !== 'accepted' || invite.acceptedUid !== user.uid) {
          await updateDoc(doc(targetDb, 'staff_invites', invDoc.id), {
            status: 'accepted',
            acceptedUid: user.uid,
            acceptedAt: nowIso
          });
        }
        claimed += 1;
      } catch (err) {
        console.warn('Could not claim invite for firm', invite.firmId, err);
      }
    }
  } catch (err) {
    console.warn('Failed checking staff_invites:', err);
  }

  return claimed;
}

