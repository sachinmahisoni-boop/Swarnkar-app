import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { GSTInvoice, JewelleryItem, Customer, ShopDetails, JewellerProfile } from '../types';
import { getISTDate, formatSequentialNumber } from './invoiceNumber';
import { checkStockAvailability } from './stock';

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

/**
 * Subscribes to a real-time Firestore collection for a specific firm
 */
export function subscribeToFirmCollection<T>(
  firmId: string,
  collectionName: string,
  onUpdate: (items: T[]) => void,
  onError?: (err: any) => void
) {
  if (!firmId) return () => {};

  const colRef = collection(db, 'firms', firmId, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      onUpdate(items);
    },
    (err) => {
      console.warn(`Firestore subscription error on ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save single document into Firestore
 */
export async function saveFirmDoc<T extends { id: string }>(
  firmId: string,
  collectionName: string,
  data: T
): Promise<void> {
  if (!firmId || !data.id) return;
  const docRef = doc(db, 'firms', firmId, collectionName, data.id);
  await setDoc(docRef, data, { merge: true });
}

/**
 * Delete single document from Firestore
 */
export async function deleteFirmDoc(
  firmId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  if (!firmId || !docId) return;
  const docRef = doc(db, 'firms', firmId, collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * Reserve next sequential invoice/voucher number atomically using Firestore transaction
 */
export async function reserveNextSequenceNumber(
  firmId: string,
  counterType: 'GST_INVOICE' | 'ESTIMATE_BILL' | 'PURCHASE' | 'GIRVI' | 'KARIGAR',
  prefix: string
): Promise<string> {
  const istInfo = getISTDate();
  const finYearStr = istInfo.financialYear.finYearStr;
  const counterDocId = `${counterType}_${finYearStr}`;
  const counterRef = doc(db, 'firms', firmId, 'sequence_counters', counterDocId);

  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextVal = 1;
    if (counterSnap.exists()) {
      nextVal = (counterSnap.data().currentVal || 0) + 1;
    }
    transaction.set(counterRef, { currentVal: nextVal, finYear: finYearStr, lastUpdated: new Date().toISOString() }, { merge: true });
    return formatSequentialNumber(prefix, finYearStr, nextVal);
  });
}

/**
 * Atomically create invoice, deduct stock, update customer ledger, and reserve sequence number
 */
export async function createInvoiceAtomic(
  firmId: string,
  invoiceDraft: Omit<GSTInvoice, 'id' | 'invoiceNumber'>,
  inventory: JewelleryItem[],
  currentCustomers: Customer[],
  prefix: string = 'SMJ'
): Promise<GSTInvoice> {
  const istInfo = getISTDate();
  const finYearStr = istInfo.financialYear.finYearStr;
  const counterDocId = `${invoiceDraft.invoiceType}_${finYearStr}`;
  const counterRef = doc(db, 'firms', firmId, 'sequence_counters', counterDocId);

  const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Collect unique inventory item IDs
  const itemIds = Array.from(new Set(
    invoiceDraft.items
      .map(i => i.itemId)
      .filter((id): id is string => Boolean(id))
  ));

  const createdInvoice = await runTransaction(db, async (transaction) => {
    // === 1. ALL READS FIRST ===
    const counterSnap = await transaction.get(counterRef);

    // Read item snapshots
    const itemSnapshots = await Promise.all(
      itemIds.map(id => transaction.get(doc(db, 'firms', firmId, 'inventory', id)))
    );
    const itemSnapMap = new Map<string, any>();
    itemIds.forEach((id, idx) => {
      itemSnapMap.set(id, itemSnapshots[idx]);
    });

    // Read customer snapshot if applicable
    let custSnap: any = null;
    let custRef: any = null;
    if (invoiceDraft.customerId) {
      custRef = doc(db, 'firms', firmId, 'customers', invoiceDraft.customerId);
      custSnap = await transaction.get(custRef);
    }

    // === 2. VALIDATION INSIDE TRANSACTION ===
    for (const item of invoiceDraft.items) {
      if (item.itemId) {
        const snap = itemSnapMap.get(item.itemId);
        const freshQty = snap && snap.exists() ? (snap.data().quantity || 0) : 0;
        const requiredQty = item.quantity || 1;
        if (freshQty < requiredQty) {
          throw new Error(`स्टॉक में पर्याप्त मात्रा उपलब्ध नहीं है (${item.name}): उपलब्ध ${freshQty}, आवश्यक ${requiredQty}`);
        }
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
    transaction.set(counterRef, { currentVal: nextSeq, finYear: finYearStr, lastUpdated: istInfo.isoDateStr }, { merge: true });

    // b. Deduct stock from inventory
    for (const item of invoiceDraft.items) {
      if (item.itemId) {
        const snap = itemSnapMap.get(item.itemId);
        if (snap && snap.exists()) {
          const freshQty = snap.data().quantity || 0;
          const newQty = freshQty - (item.quantity || 1);
          const itemRef = doc(db, 'firms', firmId, 'inventory', item.itemId);
          transaction.update(itemRef, { quantity: newQty });
        }
      }
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
    const finalInvoice: GSTInvoice = {
      ...invoiceDraft,
      id: invoiceId,
      invoiceNumber: actualInvoiceNumber,
      firmId
    };

    const invRef = doc(db, 'firms', firmId, 'invoices', invoiceId);
    transaction.set(invRef, finalInvoice);

    return finalInvoice;
  });

  return createdInvoice;
}

/**
 * Atomically cancel invoice, restore stock, and reverse customer ledger
 */
export async function cancelInvoiceAtomic(
  firmId: string,
  invoice: GSTInvoice,
  cancelReason: string,
  cancelledBy: string
): Promise<void> {
  const invRef = doc(db, 'firms', firmId, 'invoices', invoice.id);

  const itemIds = Array.from(new Set(
    invoice.items
      .map(i => i.itemId)
      .filter((id): id is string => Boolean(id))
  ));

  await runTransaction(db, async (transaction) => {
    // === 1. ALL READS FIRST ===
    const invSnap = await transaction.get(invRef);
    if (!invSnap.exists()) {
      throw new Error('इनवॉइस नहीं मिला।');
    }

    const invData = invSnap.data() as GSTInvoice;
    if (invData.status === 'Cancelled') {
      throw new Error('यह इनवॉइस पहले ही रद्द (Cancel) हो चुका है।');
    }

    // Read item snapshots
    const itemSnapshots = await Promise.all(
      itemIds.map(id => transaction.get(doc(db, 'firms', firmId, 'inventory', id)))
    );
    const itemSnapMap = new Map<string, any>();
    itemIds.forEach((id, idx) => {
      itemSnapMap.set(id, itemSnapshots[idx]);
    });

    // Read customer snapshot
    let custSnap: any = null;
    let custRef: any = null;
    if (invData.customerId) {
      custRef = doc(db, 'firms', firmId, 'customers', invData.customerId);
      custSnap = await transaction.get(custRef);
    }

    // === 2. ALL WRITES AFTER READS ===
    // a. Restore stock for linked items
    for (const item of invData.items) {
      if (item.itemId) {
        const snap = itemSnapMap.get(item.itemId);
        if (snap && snap.exists()) {
          const currentQty = snap.data().quantity || 0;
          const itemRef = doc(db, 'firms', firmId, 'inventory', item.itemId);
          transaction.update(itemRef, { quantity: currentQty + (item.quantity || 1) });
        }
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

/**
 * Uploads local localStorage data to Firestore for a firm
 */
export async function uploadLocalStorageToFirestore(firmId: string, data: FirmDataSnapshot): Promise<void> {
  if (!firmId) return;

  if (!auth.currentUser || !auth.currentUser.uid) {
    throw new Error('ऑथेंटिकेशन आवश्यक है। क्लाउड सिंक के लिए साइन इन करें।');
  }

  const batch = writeBatch(db);

  // Shop Details & Firm Profile Root
  if (data.shopDetails) {
    const firmDocRef = doc(db, 'firms', firmId);
    batch.set(firmDocRef, {
      ownerUid: auth.currentUser.uid,
      name: data.shopDetails.name,
      phone: data.shopDetails.phone,
      gstin: data.shopDetails.gstin,
      lastSynced: getISTDate().isoDateStr
    }, { merge: true });

    const shopRef = doc(db, 'firms', firmId, 'shop_details', 'main');
    batch.set(shopRef, data.shopDetails, { merge: true });
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
        const ref = doc(db, 'firms', firmId, colName, item.id);
        batch.set(ref, { ...item, firmId }, { merge: true });
      }
    }
  }

  await batch.commit();
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
