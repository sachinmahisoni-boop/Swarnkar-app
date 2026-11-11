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

  // Stock check
  const stockCheck = checkStockAvailability(invoiceDraft.items, inventory);
  if (!stockCheck.canFulfill) {
    const errMsg = stockCheck.issues.map(i => i.error).join('; ');
    throw new Error(errMsg || 'स्टॉक में पर्याप्त मात्रा उपलब्ध नहीं है।');
  }

  const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const createdInvoice = await runTransaction(db, async (transaction) => {
    // 1. Get counter
    const counterSnap = await transaction.get(counterRef);
    let nextSeq = 1;
    if (counterSnap.exists()) {
      nextSeq = (counterSnap.data().currentVal || 0) + 1;
    }

    const actualInvoiceNumber = formatSequentialNumber(prefix, finYearStr, nextSeq);

    // 2. Reserve counter
    transaction.set(counterRef, { currentVal: nextSeq, finYear: finYearStr }, { merge: true });

    // 3. Deduct stock for linked items
    for (const item of invoiceDraft.items) {
      if (item.itemId) {
        const itemRef = doc(db, 'firms', firmId, 'inventory', item.itemId);
        const itemSnap = await transaction.get(itemRef);
        if (itemSnap.exists()) {
          const currentQty = itemSnap.data().quantity || 0;
          const newQty = Math.max(0, currentQty - (item.quantity || 1));
          transaction.update(itemRef, { quantity: newQty });
        }
      }
    }

    // 4. Update customer ledger
    if (invoiceDraft.customerId) {
      const custRef = doc(db, 'firms', firmId, 'customers', invoiceDraft.customerId);
      const custSnap = await transaction.get(custRef);
      if (custSnap.exists()) {
        const cData = custSnap.data();
        const newTotalPurchases = (cData.totalPurchases || 0) + invoiceDraft.grandTotal;
        const newOutstanding = (cData.outstandingBalance || 0) + (invoiceDraft.payment?.dueAmount || 0);
        transaction.update(custRef, {
          totalPurchases: newTotalPurchases,
          outstandingBalance: newOutstanding
        });
      }
    }

    // 5. Save Invoice
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

  await runTransaction(db, async (transaction) => {
    const invSnap = await transaction.get(invRef);
    if (!invSnap.exists()) {
      throw new Error('इनवॉइस नहीं मिला।');
    }

    // Restore stock
    for (const item of invoice.items) {
      if (item.itemId) {
        const itemRef = doc(db, 'firms', firmId, 'inventory', item.itemId);
        const itemSnap = await transaction.get(itemRef);
        if (itemSnap.exists()) {
          const currentQty = itemSnap.data().quantity || 0;
          transaction.update(itemRef, { quantity: currentQty + (item.quantity || 1) });
        }
      }
    }

    // Reverse customer ledger
    if (invoice.customerId) {
      const custRef = doc(db, 'firms', firmId, 'customers', invoice.customerId);
      const custSnap = await transaction.get(custRef);
      if (custSnap.exists()) {
        const cData = custSnap.data();
        const newTotalPurchases = Math.max(0, (cData.totalPurchases || 0) - invoice.grandTotal);
        const newOutstanding = Math.max(0, (cData.outstandingBalance || 0) - (invoice.payment?.dueAmount || 0));
        transaction.update(custRef, {
          totalPurchases: newTotalPurchases,
          outstandingBalance: newOutstanding
        });
      }
    }

    // Update invoice record to Cancelled status
    transaction.update(invRef, {
      status: 'Cancelled',
      cancelReason,
      cancelledBy,
      cancelledAt: new Date().toISOString()
    });
  });
}

/**
 * Uploads local localStorage data to Firestore for a firm
 */
export async function uploadLocalStorageToFirestore(firmId: string, data: FirmDataSnapshot): Promise<void> {
  if (!firmId) return;

  const batch = writeBatch(db);

  // Shop Details & Firm Profile Root
  if (data.shopDetails) {
    const firmDocRef = doc(db, 'firms', firmId);
    batch.set(firmDocRef, {
      ownerUid: auth.currentUser?.uid || 'anonymous',
      name: data.shopDetails.name,
      phone: data.shopDetails.phone,
      gstin: data.shopDetails.gstin,
      lastSynced: new Date().toISOString()
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
