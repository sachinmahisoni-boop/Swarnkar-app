import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveSyncStatus,
  getSyncStatusPresentation,
  formatRelativeSyncTime,
} from './syncStatus';

describe('syncStatus helpers', () => {
  it('resolves Offline whenever browser is offline (unless permission/sync error)', () => {
    expect(
      resolveEffectiveSyncStatus({ isOnline: false, syncStatus: 'synced', pendingWritesCount: 0 })
    ).toBe('offline');

    expect(
      resolveEffectiveSyncStatus({ isOnline: false, syncStatus: 'syncing', pendingWritesCount: 2 })
    ).toBe('offline');

    expect(
      resolveEffectiveSyncStatus({ isOnline: false, syncStatus: 'permission-error' })
    ).toBe('permission-error');
  });

  it('resolves Syncing... when online with pending writes or syncing state', () => {
    expect(
      resolveEffectiveSyncStatus({ isOnline: true, syncStatus: 'synced', pendingWritesCount: 3 })
    ).toBe('syncing');

    expect(
      resolveEffectiveSyncStatus({ isOnline: true, syncStatus: 'syncing', pendingWritesCount: 0 })
    ).toBe('syncing');
  });

  it('resolves Synced when online and all pending writes are flushed', () => {
    expect(
      resolveEffectiveSyncStatus({ isOnline: true, syncStatus: 'synced', pendingWritesCount: 0 })
    ).toBe('synced');
  });

  it('produces Syncing..., Synced, and Offline presentations with pulse modes', () => {
    const syncing = getSyncStatusPresentation({
      status: 'syncing',
      pendingWritesCount: 2,
    });
    expect(syncing.label).toBe('Syncing...');
    expect(syncing.hint).toBe('2 pending');
    expect(syncing.pulseMode).toBe('active');

    const now = 1_700_000_050_000;
    const syncedBurst = getSyncStatusPresentation({
      status: 'synced',
      syncSource: 'cloud',
      lastSyncedAt: now - 3000,
      isUpdatingAnim: true,
      nowMs: now,
    });
    expect(syncedBurst.label).toBe('Synced');
    expect(syncedBurst.hint).toBe('Updated');
    expect(syncedBurst.pulseMode).toBe('burst');

    const syncedIdle = getSyncStatusPresentation({
      status: 'synced',
      syncSource: 'cloud',
      lastSyncedAt: now - 15_000,
      isUpdatingAnim: false,
      nowMs: now,
    });
    expect(syncedIdle.label).toBe('Synced');
    expect(syncedIdle.hint).toBe('15s ago');
    expect(syncedIdle.pulseMode).toBe('idle');

    const offlineQueued = getSyncStatusPresentation({
      status: 'offline',
      pendingWritesCount: 4,
    });
    expect(offlineQueued.label).toBe('Offline');
    expect(offlineQueued.hint).toBe('4 queued');
    expect(offlineQueued.pulseMode).toBe('offline');
  });

  it('formats relative sync timestamps cleanly', () => {
    const now = 1_700_000_120_000;
    expect(formatRelativeSyncTime(null, now)).toBe('Not yet synced');
    expect(formatRelativeSyncTime(now - 2_000, now)).toBe('Just now');
    expect(formatRelativeSyncTime(now - 42_000, now)).toBe('42s ago');
    expect(formatRelativeSyncTime(now - 180_000, now)).toBe('3m ago');
  });
});
