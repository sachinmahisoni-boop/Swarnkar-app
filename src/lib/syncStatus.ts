export type SyncStatusType = 'synced' | 'offline' | 'permission-error' | 'syncing' | 'error';

export interface ResolveSyncStatusInput {
  isOnline: boolean;
  isSynced?: boolean;
  syncStatus?: SyncStatusType;
  pendingWritesCount?: number;
}

export interface SyncStatusPresentation {
  status: SyncStatusType;
  label: 'Syncing...' | 'Synced' | 'Offline' | 'Permission error' | 'Sync error';
  hint: string;
  pulseMode: 'active' | 'idle' | 'burst' | 'offline' | 'error';
}

export function formatSyncTime(timestamp?: number | null): string {
  if (!timestamp) return 'Not yet synced';
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatRelativeSyncTime(timestamp?: number | null, nowMs: number = Date.now()): string {
  if (!timestamp) return 'Not yet synced';
  const diffSec = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return formatSyncTime(timestamp);
}

export function resolveEffectiveSyncStatus({
  isOnline,
  isSynced = true,
  syncStatus,
  pendingWritesCount = 0,
}: ResolveSyncStatusInput): SyncStatusType {
  if (syncStatus === 'permission-error' || syncStatus === 'error') {
    return syncStatus;
  }
  if (!isOnline) {
    return 'offline';
  }
  if (syncStatus === 'syncing' || pendingWritesCount > 0) {
    return 'syncing';
  }
  if (syncStatus === 'synced' || isSynced) {
    return 'synced';
  }
  return 'error';
}

export function getSyncStatusPresentation(params: {
  status: SyncStatusType;
  pendingWritesCount?: number;
  syncSource?: 'cloud' | 'cache';
  lastSyncedAt?: number | null;
  isUpdatingAnim?: boolean;
  nowMs?: number;
}): SyncStatusPresentation {
  const {
    status,
    pendingWritesCount = 0,
    syncSource = 'cloud',
    lastSyncedAt = null,
    isUpdatingAnim = false,
    nowMs = Date.now(),
  } = params;

  if (status === 'permission-error') {
    return {
      status,
      label: 'Permission error',
      hint: 'Action needed',
      pulseMode: 'error',
    };
  }

  if (status === 'error') {
    return {
      status,
      label: 'Sync error',
      hint: 'Retry sync',
      pulseMode: 'error',
    };
  }

  if (status === 'offline') {
    return {
      status,
      label: 'Offline',
      hint: pendingWritesCount > 0 ? `${pendingWritesCount} queued` : 'Cached',
      pulseMode: 'offline',
    };
  }

  if (status === 'syncing') {
    return {
      status,
      label: 'Syncing...',
      hint: pendingWritesCount > 0 ? `${pendingWritesCount} pending` : 'Updating',
      pulseMode: 'active',
    };
  }

  const hint = isUpdatingAnim
    ? 'Updated'
    : syncSource === 'cache'
      ? 'Cache'
      : lastSyncedAt
        ? formatRelativeSyncTime(lastSyncedAt, nowMs)
        : 'Live';

  return {
    status: 'synced',
    label: 'Synced',
    hint,
    pulseMode: isUpdatingAnim ? 'burst' : 'idle',
  };
}
