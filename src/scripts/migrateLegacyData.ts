/**
 * One-Time Legacy Data Migration Utility for Swarnkar App
 * 
 * IMPORTANT: DO NOT RUN AUTOMATICALLY!
 * This script safely migrates legacy un-scoped records (which do not have a firmId)
 * and tags them with your designated target firmId (e.g., 'prof-main').
 * 
 * How to run safely:
 * 1. Open your browser Developer Tools Console (F12 -> Console tab) on your app.
 * 2. Paste or import this function into the console.
 * 3. Call `migrateLegacyRecordsToFirm('prof-main')` replacing 'prof-main' with the target Firm ID.
 */

export function migrateLegacyRecordsToFirm(targetFirmId: string = 'prof-main'): { success: boolean; migratedCounts: Record<string, number> } {
  if (!targetFirmId) {
    console.error('Migration aborted: Target firmId is required.');
    return { success: false, migratedCounts: {} };
  }

  const collections = [
    { name: 'inventory', legacyKey: 'jewel_inventory' },
    { name: 'customers', legacyKey: 'jewel_customers' },
    { name: 'invoices', legacyKey: 'jewel_invoices' },
    { name: 'vendors', legacyKey: 'jewel_vendors' },
    { name: 'purchases', legacyKey: 'jewel_purchases' },
    { name: 'expenses', legacyKey: 'jewel_expenses' },
    { name: 'transfers', legacyKey: 'jewel_transfers' },
    { name: 'karigars', legacyKey: 'jewel_karigars' },
    { name: 'jobcards', legacyKey: 'jewel_jobcards' },
    { name: 'girvi', legacyKey: 'jewel_girvi' },
    { name: 'gemstones', legacyKey: 'jewel_gemstones_v1' },
  ];

  const migratedCounts: Record<string, number> = {};

  collections.forEach(({ name, legacyKey }) => {
    const scopedKey = `jewel_firm_${targetFirmId}_${name}`;
    const legacyRaw = localStorage.getItem(legacyKey);
    const existingScopedRaw = localStorage.getItem(scopedKey);

    let recordsToMigrate: any[] = [];

    if (legacyRaw) {
      try {
        recordsToMigrate = JSON.parse(legacyRaw);
      } catch (e) {
        console.warn(`Could not parse legacy data for ${legacyKey}`);
      }
    }

    let existingScopedRecords: any[] = [];
    if (existingScopedRaw) {
      try {
        existingScopedRecords = JSON.parse(existingScopedRaw);
      } catch (e) {
        existingScopedRecords = [];
      }
    }

    let migratedCount = 0;
    const updatedRecords = [...existingScopedRecords];

    recordsToMigrate.forEach((item) => {
      // Check if item already exists in scoped list
      const alreadyPresent = updatedRecords.some((existing) => existing.id && existing.id === item.id);
      if (!alreadyPresent) {
        const taggedItem = { ...item, firmId: targetFirmId };
        updatedRecords.push(taggedItem);
        migratedCount++;
      }
    });

    localStorage.setItem(scopedKey, JSON.stringify(updatedRecords));
    migratedCounts[name] = migratedCount;
    console.log(`[Migration] ${name}: Migrated ${migratedCount} legacy records to firm "${targetFirmId}"`);
  });

  console.log('✅ Migration finished safely without deleting existing firm records.', migratedCounts);
  return { success: true, migratedCounts };
}
