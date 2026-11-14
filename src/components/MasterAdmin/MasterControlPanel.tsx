import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  Sliders,
  Search,
  CheckCircle2,
  Ban,
  Trash2,
  Edit3,
  Eye,
  X,
  Sparkles,
  FileText,
  Save,
  History,
  Phone,
  Clock,
  BarChart3,
  PlayCircle,
  Copy,
  Check,
  AlertCircle,
  Bug,
  RefreshCw
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import {
  AppUserAccessRecord,
  AuditAction,
  AuditLogEntry,
  UserUsageInvoicesDoc,
  JewellerProfile,
  MasterControlSettings,
  PublicSupportConfig,
  UserApprovalStatus,
  UserPermissions,
  BillingSelfTestSummary,
  BillingSelfTestCaseResult
} from '../../types';
import {
  CASHIER_PERMISSIONS,
  DEFAULT_TRIAL_DAYS,
  DEFAULT_TRIAL_INVOICE_LIMIT,
  FULL_PERMISSIONS,
  MANAGER_PERMISSIONS,
  MODULE_PERMISSION_META,
  PERMISSION_PRESETS,
  RESTRICTED_PERMISSIONS,
  getTrialDaysRemaining,
  normalizePermissions,
  validateTrialFirestoreReadiness,
  toEpochMs
} from '../../lib/accessControl';
import {
  deleteFirmByMaster,
  deleteUserAccessRecord,
  fetchAllUserUsageForMaster,
  saveMasterControlSettings,
  savePublicSupportConfig,
  subscribeToAllFirmsForMaster,
  subscribeToAllUsers,
  subscribeToAuditLogs,
  updateFirmMetaByMaster,
  updateUserAccessByMaster,
  writeAuditLog,
  runBillingSelfTest
} from '../../lib/firestoreSync';
import { getISTDate } from '../../lib/invoiceNumber';

interface MasterControlPanelProps {
  currentAdminUid: string;
  currentAdminEmail?: string | null;
  masterSettings: MasterControlSettings;
  supportConfig: PublicSupportConfig;
  activeFirmId: string;
  onUpdateMasterSettings: (next: MasterControlSettings) => void;
  onUpdateSupportConfig: (next: PublicSupportConfig) => void;
  onInspectFirm: (firm: JewellerProfile) => void;
}

function formatDateInputValue(value?: any): string {
  const ms = toEpochMs(value);
  if (!ms) {
    const future = new Date(Date.now() + DEFAULT_TRIAL_DAYS * 86400000);
    return future.toISOString().slice(0, 10);
  }
  return new Date(ms).toISOString().slice(0, 10);
}

function formatReadableDate(value?: any): string {
  const ms = toEpochMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatReadableDateTime(value?: any): string {
  const ms = toEpochMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export const MasterControlPanel: React.FC<MasterControlPanelProps> = ({
  currentAdminUid,
  currentAdminEmail,
  masterSettings,
  supportConfig,
  activeFirmId,
  onUpdateMasterSettings,
  onUpdateSupportConfig,
  onInspectFirm,
}) => {
  const [subTab, setSubTab] = useState<'users' | 'firms' | 'audit' | 'rules'>('users');

  // Users state
  const [users, setUsers] = useState<AppUserAccessRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserApprovalStatus>('all');
  const [usersError, setUsersError] = useState<string | null>(null);

  // Firms & per-user usage counters
  const [firms, setFirms] = useState<JewellerProfile[]>([]);
  const [firmSearch, setFirmSearch] = useState('');
  const [firmsError, setFirmsError] = useState<string | null>(null);
  const [userUsageMap, setUserUsageMap] = useState<Record<string, UserUsageInvoicesDoc>>({});

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditError, setAuditError] = useState<string | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Permission & Quota Editor Modal state
  const [editingUser, setEditingUser] = useState<AppUserAccessRecord | null>(null);
  const [editStatus, setEditStatus] = useState<UserApprovalStatus>('trial');
  const [editTrialLimit, setEditTrialLimit] = useState<number>(DEFAULT_TRIAL_INVOICE_LIMIT);
  const [editTrialEndsDate, setEditTrialEndsDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(MANAGER_PERMISSIONS);
  const [savingUser, setSavingUser] = useState(false);

  // Delete confirmation state (no window.confirm)
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);
  const [confirmDeleteFirmId, setConfirmDeleteFirmId] = useState<string | null>(null);

  // Firm metadata edit modal
  const [editingFirm, setEditingFirm] = useState<JewellerProfile | null>(null);
  const [editFirmName, setEditFirmName] = useState('');
  const [editFirmGstin, setEditFirmGstin] = useState('');
  const [editFirmPhone, setEditFirmPhone] = useState('');
  const [editFirmCode, setEditFirmCode] = useState('');
  const [savingFirm, setSavingFirm] = useState(false);

  // Global trial defaults & support contact form
  const [defaultTrialLimitInput, setDefaultTrialLimitInput] = useState<number>(
    masterSettings.defaultTrialInvoiceLimit || DEFAULT_TRIAL_INVOICE_LIMIT
  );
  const [defaultTrialDaysInput, setDefaultTrialDaysInput] = useState<number>(
    masterSettings.defaultTrialDays || DEFAULT_TRIAL_DAYS
  );
  const [requireApprovalInput, setRequireApprovalInput] = useState<boolean>(
    masterSettings.requireApprovalForNewSignups !== false
  );
  const [supportNameInput, setSupportNameInput] = useState<string>(supportConfig.supportName || 'Platform Admin');
  const [supportPhoneInput, setSupportPhoneInput] = useState<string>(supportConfig.supportPhone || '');
  const [supportEmailInput, setSupportEmailInput] = useState<string>(supportConfig.supportEmail || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [selfTestSummary, setSelfTestSummary] = useState<BillingSelfTestSummary | null>(null);
  const [isRunningSelfTest, setIsRunningSelfTest] = useState(false);
  const [copiedSelfTest, setCopiedSelfTest] = useState(false);
  const [selfTestFirmId, setSelfTestFirmId] = useState<string>(activeFirmId || '');

  useEffect(() => {
    if (activeFirmId && !selfTestFirmId) {
      setSelfTestFirmId(activeFirmId);
    }
  }, [activeFirmId, selfTestFirmId]);

  const handleRunSelfTest = async () => {
    const target = selfTestFirmId || activeFirmId || (firms[0]?.id);
    if (!target) {
      alert('परीक्षण हेतु कोई फर्म उपलब्ध नहीं है। कृपया पहले एक फर्म जोड़ें।');
      return;
    }
    setIsRunningSelfTest(true);
    try {
      const summary = await runBillingSelfTest(target, {
        uid: currentAdminUid,
        isMasterAdmin: true
      });
      setSelfTestSummary(summary);
    } catch (err: any) {
      console.error('[MasterControlPanel] Billing self-test runtime error:', err);
      alert('Billing self-test runtime error: ' + (err?.message || String(err)));
    } finally {
      setIsRunningSelfTest(false);
    }
  };

  const handleCopySelfTestReport = async () => {
    if (!selfTestSummary) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(selfTestSummary, null, 2));
      setCopiedSelfTest(true);
      setTimeout(() => setCopiedSelfTest(false), 2500);
    } catch (clipErr) {
      console.warn('Clipboard copy failed:', clipErr);
    }
  };

  useEffect(() => {
    setDefaultTrialLimitInput(masterSettings.defaultTrialInvoiceLimit || DEFAULT_TRIAL_INVOICE_LIMIT);
    setDefaultTrialDaysInput(masterSettings.defaultTrialDays || DEFAULT_TRIAL_DAYS);
    setRequireApprovalInput(masterSettings.requireApprovalForNewSignups !== false);
  }, [masterSettings]);

  useEffect(() => {
    setSupportNameInput(supportConfig.supportName || 'Platform Admin');
    setSupportPhoneInput(supportConfig.supportPhone || '');
    setSupportEmailInput(supportConfig.supportEmail || '');
  }, [supportConfig]);

  useEffect(() => {
    const unsubUsers = subscribeToAllUsers(
      (list) => {
        setUsers(list);
        setUsersError(null);
      },
      (err) => setUsersError(err.message)
    );
    const unsubFirms = subscribeToAllFirmsForMaster(
      (list) => {
        setFirms(list);
        setFirmsError(null);
      },
      (err) => setFirmsError(err.message)
    );
    const unsubLogs = subscribeToAuditLogs(
      (logs) => {
        setAuditLogs(logs);
        setAuditError(null);
      },
      (err) => setAuditError(err.message)
    );
    return () => {
      unsubUsers();
      unsubFirms();
      unsubLogs();
    };
  }, []);

  useEffect(() => {
    const uids = Array.from(
      new Set([
        ...users.map((u) => u.uid),
        ...firms.map((f) => f.ownerUid || '').filter(Boolean)
      ])
    );
    if (uids.length === 0) {
      setUserUsageMap({});
      return;
    }
    let cancelled = false;
    fetchAllUserUsageForMaster(uids)
      .then((map) => {
        if (!cancelled) setUserUsageMap(map);
      })
      .catch(() => {
        // Non-fatal usage stats error
      });
    return () => {
      cancelled = true;
    };
  }, [users, firms]);

  const showSuccess = (text: string) => setFeedback({ type: 'success', text });
  const showError = (text: string) => setFeedback({ type: 'error', text });

  const usersByUid = useMemo(() => {
    const map: Record<string, AppUserAccessRecord> = {};
    for (const u of users) {
      map[u.uid] = u;
    }
    return map;
  }, [users]);

  // Usage per user UID directly from users/{ownerUid}/usage/invoices + owned firm count
  const userInvoiceUsageMap = useMemo(() => {
    const map: Record<string, { count: number; monthlyCount: number; firmCount: number }> = {};
    const currentMonthKey = getISTDate().isoDateStr.slice(0, 7);
    const firmCounts: Record<string, number> = {};
    for (const f of firms) {
      if (f.ownerUid) {
        firmCounts[f.ownerUid] = (firmCounts[f.ownerUid] || 0) + 1;
      }
    }
    const allUids = new Set([...Object.keys(userUsageMap), ...Object.keys(firmCounts)]);
    for (const uid of allUids) {
      const u = userUsageMap[uid];
      const count = Number(u?.count || 0);
      const monthly = u?.monthKey === currentMonthKey ? Number(u?.monthlyCount || 0) : 0;
      map[uid] = {
        count,
        monthlyCount: monthly,
        firmCount: firmCounts[uid] || 0
      };
    }
    return map;
  }, [firms, userUsageMap]);

  const dashboardMetrics = useMemo(() => {
    const currentMonthKey = getISTDate().isoDateStr.slice(0, 7);
    let invoicesThisMonth = 0;
    let totalInvoices = 0;
    for (const usage of Object.values(userUsageMap) as UserUsageInvoicesDoc[]) {
      totalInvoices += Number(usage?.count || 0);
      if (usage?.monthKey === currentMonthKey) {
        invoicesThisMonth += Number(usage?.monthlyCount || 0);
      }
    }
    return {
      totalUsers: users.length,
      pendingCount: users.filter((u) => u.status === 'pending').length,
      trialCount: users.filter((u) => u.status === 'trial').length,
      activeCount: users.filter((u) => u.status === 'active').length,
      suspendedCount: users.filter((u) => u.status === 'suspended').length,
      invoicesThisMonth,
      totalInvoices
    };
  }, [users, userUsageMap]);

  const logMasterAction = async (
    action: AuditAction,
    target: { targetUid?: string; firmId?: string },
    details: string
  ) => {
    try {
      await writeAuditLog({
        action,
        actorUid: currentAdminUid,
        targetUid: target.targetUid || '',
        targetFirmId: target.firmId || '',
        details
      });
    } catch (err) {
      console.warn('Failed to write audit log:', err);
    }
  };

  const openUserPermissionEditor = (u: AppUserAccessRecord) => {
    setEditingUser(u);
    setEditStatus(u.status);
    setEditTrialLimit(u.trialInvoiceLimit ?? masterSettings.defaultTrialInvoiceLimit ?? DEFAULT_TRIAL_INVOICE_LIMIT);
    const defaultEndsMs = Date.now() + (masterSettings.defaultTrialDays || DEFAULT_TRIAL_DAYS) * 86400000;
    setEditTrialEndsDate(formatDateInputValue(u.trialEndsAt || defaultEndsMs));
    setEditNotes(u.adminNotes || '');
    setEditPermissions(
      u.permissions
        ? normalizePermissions(u.permissions, RESTRICTED_PERMISSIONS)
        : u.status === 'active'
          ? { ...FULL_PERMISSIONS }
          : { ...MANAGER_PERMISSIONS }
    );
  };

  const handleSaveUserEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const endMs = editTrialEndsDate
        ? new Date(`${editTrialEndsDate}T23:59:59.999Z`).getTime()
        : Date.now() + (masterSettings.defaultTrialDays || DEFAULT_TRIAL_DAYS) * 86400000;

      await updateUserAccessByMaster(
        editingUser.uid,
        {
          status: editStatus,
          trialInvoiceLimit:
            editStatus === 'trial'
              ? Math.max(1, Math.floor(editTrialLimit || 1))
              : Math.max(0, Math.floor(editTrialLimit)),
          trialEndsAt: Timestamp.fromMillis(endMs),
          adminNotes: editNotes.trim(),
          permissions: editPermissions
        },
        currentAdminUid
      );

      await logMasterAction(
        'UPDATE_USER_ACCESS',
        { targetUid: editingUser.uid },
        `Status=${editStatus}, Limit=${editTrialLimit}, Ends=${editTrialEndsDate}`
      );

      showSuccess(`${editingUser.displayName || editingUser.email} की अनुमतियाँ व स्थिति अपडेट हो गई।`);
      setEditingUser(null);
    } catch (err: any) {
      showError(err?.message || 'अपडेट करने में त्रुटि हुई।');
    } finally {
      setSavingUser(false);
    }
  };

  const handleQuickStatusChange = async (
    user: AppUserAccessRecord,
    nextStatus: UserApprovalStatus,
    noteOverride?: string
  ) => {
    try {
      const updates: Parameters<typeof updateUserAccessByMaster>[1] = {
        status: nextStatus
      };
      if (nextStatus === 'trial') {
        const limit =
          user.trialInvoiceLimit && user.trialInvoiceLimit > 0
            ? user.trialInvoiceLimit
            : masterSettings.defaultTrialInvoiceLimit || DEFAULT_TRIAL_INVOICE_LIMIT;
        const defaultDays = masterSettings.defaultTrialDays || DEFAULT_TRIAL_DAYS;
        const existingEndMs = toEpochMs(user.trialEndsAt);
        const endMs =
          existingEndMs && existingEndMs > Date.now()
            ? existingEndMs
            : Date.now() + defaultDays * 86400000;

        updates.trialInvoiceLimit = limit;
        updates.trialEndsAt = Timestamp.fromMillis(endMs);
        updates.adminNotes = noteOverride ?? '';
        const existingNormalized = user.permissions
          ? normalizePermissions(user.permissions, RESTRICTED_PERMISSIONS)
          : null;
        const hasBillingAccess = Boolean(
          existingNormalized && (existingNormalized.billing || existingNormalized.estimates)
        );
        updates.permissions =
          user.status === 'pending' || !existingNormalized || !hasBillingAccess
            ? { ...MANAGER_PERMISSIONS }
            : existingNormalized;
      } else if (nextStatus === 'active') {
        updates.adminNotes = noteOverride ?? '';
        const existingNormalized = user.permissions
          ? normalizePermissions(user.permissions, RESTRICTED_PERMISSIONS)
          : null;
        const hasAnyPerm = Boolean(existingNormalized && Object.values(existingNormalized).some(Boolean));
        updates.permissions =
          user.status === 'pending' || !existingNormalized || !hasAnyPerm
            ? { ...FULL_PERMISSIONS }
            : existingNormalized;
      } else if (nextStatus === 'suspended' && noteOverride !== undefined) {
        updates.adminNotes = noteOverride;
      }

      await updateUserAccessByMaster(user.uid, updates, currentAdminUid);
      const statusActionMap: Record<UserApprovalStatus, AuditAction> = {
        trial: 'USER_STATUS_TRIAL',
        active: 'USER_STATUS_ACTIVE',
        pending: 'USER_STATUS_PENDING',
        suspended: 'USER_STATUS_SUSPENDED'
      };
      await logMasterAction(
        statusActionMap[nextStatus],
        { targetUid: user.uid },
        noteOverride ? `${nextStatus} (${noteOverride})` : `Changed user status to ${nextStatus}`
      );

      showSuccess(`${user.displayName || user.email} को ${nextStatus.toUpperCase()} कर दिया गया।`);
    } catch (err: any) {
      showError(err?.message || 'स्थिति बदलने में त्रुटि हुई।');
    }
  };

  const handleDeleteUser = async (user: AppUserAccessRecord) => {
    try {
      await deleteUserAccessRecord(user.uid);
      await logMasterAction(
        'DELETE_USER_REQUEST',
        { targetUid: user.uid },
        `Deleted user record (${user.email})`
      );
      setConfirmDeleteUid(null);
      showSuccess('यूज़र एक्सेस रिकॉर्ड हटाया गया।');
    } catch (err: any) {
      showError(err?.message || 'डिलीट करने में त्रुटि हुई।');
    }
  };

  const handleSaveFirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;
    setSavingFirm(true);
    try {
      await updateFirmMetaByMaster(editingFirm.id, {
        name: editFirmName.trim(),
        gstin: editFirmGstin.trim().toUpperCase(),
        phone: editFirmPhone.trim(),
        code: editFirmCode.trim()
      });
      await logMasterAction(
        'UPDATE_FIRM_META',
        { firmId: editingFirm.id, targetUid: editingFirm.ownerUid },
        `Updated firm ${editFirmName.trim()} (${editingFirm.id})`
      );
      showSuccess(`फर्म "${editFirmName}" अपडेट हो गई।`);
      setEditingFirm(null);
    } catch (err: any) {
      showError(err?.message || 'फर्म अपडेट करने में त्रुटि हुई।');
    } finally {
      setSavingFirm(false);
    }
  };

  const handleDeleteFirm = async (firm: JewellerProfile) => {
    try {
      await deleteFirmByMaster(firm.id);
      await logMasterAction(
        'DELETE_FIRM',
        { firmId: firm.id, targetUid: firm.ownerUid },
        `Deleted firm ${firm.name} (${firm.id})`
      );
      setConfirmDeleteFirmId(null);
      showSuccess('फर्म डेटाबेस से हटा दी गई।');
    } catch (err: any) {
      showError(err?.message || 'फर्म हटाने में त्रुटि हुई।');
    }
  };

  const handleSaveGlobalRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const nextSettings: MasterControlSettings = {
        ...masterSettings,
        id: 'master',
        defaultTrialInvoiceLimit: Math.max(1, Math.floor(defaultTrialLimitInput)),
        defaultTrialDays: Math.max(1, Math.floor(defaultTrialDaysInput)),
        requireApprovalForNewSignups: requireApprovalInput,
        updatedAt: new Date().toISOString(),
        updatedByUid: currentAdminUid
      };
      const nextSupport: PublicSupportConfig = {
        id: 'public',
        supportName: supportNameInput.trim() || 'Platform Admin',
        supportPhone: supportPhoneInput.trim(),
        supportEmail: supportEmailInput.trim(),
        updatedAt: new Date().toISOString()
      };

      await Promise.all([
        saveMasterControlSettings(nextSettings),
        savePublicSupportConfig({
          supportName: nextSupport.supportName,
          supportPhone: nextSupport.supportPhone,
          supportEmail: nextSupport.supportEmail
        })
      ]);

      await logMasterAction(
        'UPDATE_GLOBAL_SETTINGS',
        {},
        `Trial=${nextSettings.defaultTrialInvoiceLimit} bills / ${nextSettings.defaultTrialDays} days`
      );

      onUpdateMasterSettings(nextSettings);
      onUpdateSupportConfig(nextSupport);
      showSuccess('ग्लोबल ट्रायल नियम व सपोर्ट संपर्क विवरण सेव हो गए।');
    } catch (err: any) {
      showError(err?.message || 'नियम सेव करने में त्रुटि हुई।');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered datasets
  const filteredUsers = users.filter((u) => {
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const q = userSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.firmName || '').toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const filteredFirms = firms.filter((f) => {
    const q = firmSearch.trim().toLowerCase();
    return (
      !q ||
      (f.name || '').toLowerCase().includes(q) ||
      (f.gstin || '').toLowerCase().includes(q) ||
      (f.code || '').toLowerCase().includes(q) ||
      (f.phone || '').toLowerCase().includes(q) ||
      (f.ownerUid || '').toLowerCase().includes(q)
    );
  });

  const filteredLogs = auditLogs.filter((l) => {
    const q = auditSearch.trim().toLowerCase();
    const actorEmail = usersByUid[l.actorUid]?.email || '';
    const targetEmail = usersByUid[l.targetUid]?.email || '';
    return (
      !q ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.actorUid || '').toLowerCase().includes(q) ||
      actorEmail.toLowerCase().includes(q) ||
      (l.targetUid || '').toLowerCase().includes(q) ||
      targetEmail.toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.targetFirmId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-slate-900 to-stone-900 text-white rounded-3xl p-4 sm:p-6 border border-amber-500/30 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-300 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-stone-950">
                Platform Master Control
              </span>
              {currentAdminEmail && (
                <span className="text-xs font-mono text-amber-300">{currentAdminEmail}</span>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight mt-1">
              मास्टर कंट्रोल सेंटर (Users, Trial Quota, Firms &amp; Audit)
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              नए यूज़र रिक्वेस्ट Approve/Reject/Suspend करें, ट्रायल बिल व दिन की सीमा सेट करें और मॉड्यूल अनुमतियाँ नियंत्रित करें।
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-stone-950/70 p-1.5 rounded-2xl border border-stone-700/80">
          <button
            type="button"
            onClick={() => setSubTab('users')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'users'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users ({users.length})
            {dashboardMetrics.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px]">
                {dashboardMetrics.pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('firms')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'firms'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Firms ({firms.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'audit'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Logs
          </button>

          <button
            type="button"
            onClick={() => setSubTab('rules')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              subTab === 'rules'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Rules &amp; Support
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: USERS, USAGE DASHBOARD & APPROVALS */}
      {subTab === 'users' && (
        <div className="space-y-4">
          {/* Usage Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-stone-500 dark:text-slate-400">Total Users</div>
              <div className="text-2xl font-black text-stone-900 dark:text-white mt-0.5">{dashboardMetrics.totalUsers}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-stone-500 dark:text-slate-400">Pending Requests</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{dashboardMetrics.pendingCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800/60 rounded-2xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-stone-500 dark:text-slate-400">Trial Users</div>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">{dashboardMetrics.trialCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-stone-500 dark:text-slate-400">Active Unlimited</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{dashboardMetrics.activeCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-indigo-500" /> Invoices This Month
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{dashboardMetrics.invoicesThisMonth}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-stone-500 dark:text-slate-400">Suspended / Total Bills</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {dashboardMetrics.suspendedCount} <span className="text-xs font-mono text-stone-400">/ {dashboardMetrics.totalInvoices}</span>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="नाम, ईमेल, मोबाइल, दुकान या UID से खोजें..."
                className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['all', 'pending', 'trial', 'active', 'suspended'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold capitalize cursor-pointer transition ${
                    statusFilter === st
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {usersError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
              {usersError}
            </div>
          )}

          {/* Users List */}
          <div className="space-y-2.5">
            {filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-stone-500 dark:text-slate-400">
                कोई यूज़र रिकॉर्ड नहीं मिला।
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = u.uid === currentAdminUid;
                const enabledModuleCount = MODULE_PERMISSION_META.filter(
                  (m) => u.permissions?.[m.key]
                ).length;
                const usageStat = userInvoiceUsageMap[u.uid] || { count: 0, monthlyCount: 0, firmCount: 0 };
                const trialLimit = u.trialInvoiceLimit ?? masterSettings.defaultTrialInvoiceLimit ?? DEFAULT_TRIAL_INVOICE_LIMIT;
                const daysLeft = u.status === 'trial' ? getTrialDaysRemaining(u.trialEndsAt) : null;

                return (
                  <div
                    key={u.uid}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                      u.status === 'pending'
                        ? 'border-amber-300 dark:border-amber-700/70'
                        : 'border-stone-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-stone-900 dark:text-white">
                          {u.displayName || 'Unnamed Jeweller'}
                        </span>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-stone-950 uppercase">
                            You (Platform Admin)
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : u.status === 'trial'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : u.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {u.status}
                        </span>
                        {u.firmName && (
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            • {u.firmName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-slate-400">
                        <span>{u.email || 'No Email'}</span>
                        {u.phone && <span>M: {u.phone}</span>}
                        <span className="font-mono text-[10px] text-stone-400">UID: {u.uid}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-[11px]">
                        <span className="font-mono font-bold text-stone-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          Invoices: {usageStat.count}
                          {u.status === 'trial' ? ` / ${trialLimit}` : ' (Unlimited)'}
                          {usageStat.monthlyCount > 0 ? ` • ${usageStat.monthlyCount} this month` : ''}
                        </span>
                        {u.status === 'trial' && daysLeft !== null && (
                          <span className={`font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                            daysLeft === 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {daysLeft === 0 ? 'Trial Expired' : `${daysLeft}d left (${formatReadableDate(u.trialEndsAt)})`}
                          </span>
                        )}
                        {u.status === 'trial' && !validateTrialFirestoreReadiness(u).valid && (
                          <span className="font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            Trial Config Incomplete — Click Permissions &amp; Trial &gt; Save
                          </span>
                        )}
                        <span className="font-bold text-stone-600 dark:text-slate-400">
                          Modules: {enabledModuleCount}/{MODULE_PERMISSION_META.length}
                        </span>
                        <span className="text-stone-400">
                          Joined: {formatReadableDate(u.createdAt)} • Active: {formatReadableDate(u.lastActiveAt || u.updatedAt)}
                        </span>
                        {u.adminNotes && (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            Note: {u.adminNotes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {u.status !== 'trial' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(u, 'trial')}
                          className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Approve Trial
                        </button>
                      )}

                      {u.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(u, 'active')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Active
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openUserPermissionEditor(u)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Permissions &amp; Trial
                      </button>

                      {u.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(u, 'suspended', 'Registration request rejected by admin.')}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}

                      {u.status !== 'pending' && u.status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(u, 'suspended')}
                          className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Suspend
                        </button>
                      )}

                      {u.status === 'suspended' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(u, 'active', '')}
                          className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reactivate
                        </button>
                      )}

                      {confirmDeleteUid === u.uid ? (
                        <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950 px-2 py-1 rounded-xl border border-rose-300 dark:border-rose-700">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="text-[10px] font-black text-rose-700 dark:text-rose-300 cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUid(null)}
                            className="text-[10px] font-bold text-stone-600 dark:text-slate-400 ml-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteUid(u.uid)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl cursor-pointer transition"
                          title="Delete User Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL FIRMS & DATA CONTROL */}
      {subTab === 'firms' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={firmSearch}
                onChange={(e) => setFirmSearch(e.target.value)}
                placeholder="फर्म का नाम, कोड, GSTIN, फ़ोन या Owner UID से खोजें..."
                className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="text-xs font-bold text-stone-500 dark:text-slate-400">
              Total Cloud Firms: <strong className="text-stone-900 dark:text-white">{firms.length}</strong>
            </div>
          </div>

          {firmsError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
              {firmsError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFirms.map((f) => {
              const ownerUser = users.find((u) => u.uid === f.ownerUid);
              const isCurrentlyInspecting = activeFirmId === f.id;
              const usage = f.ownerUid ? userUsageMap[f.ownerUid] : undefined;
              return (
                <div
                  key={f.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3 ${
                    isCurrentlyInspecting
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-stone-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                        {f.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                        {f.code}
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 dark:text-slate-400 space-y-0.5">
                      <div>GSTIN: <span className="font-mono font-bold">{f.gstin || 'URP'}</span></div>
                      <div>Phone: {f.phone || 'N/A'} | Counter: {f.counterName}</div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">
                        Owner: {ownerUser?.displayName || ownerUser?.email || f.ownerUid || 'Unknown'}
                        {' • '}Owner Invoices: <strong className="font-mono">{usage?.count ?? 0}</strong>
                        {ownerUser?.status === 'trial' ? ` / ${ownerUser.trialInvoiceLimit ?? DEFAULT_TRIAL_INVOICE_LIMIT}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onInspectFirm(f)}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isCurrentlyInspecting ? 'Active Firm (Open)' : 'Open & Control Firm Data'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFirm(f);
                        setEditFirmName(f.name || '');
                        setEditFirmGstin(f.gstin || '');
                        setEditFirmPhone(f.phone || '');
                        setEditFirmCode(f.code || '');
                      }}
                      className="p-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl cursor-pointer transition"
                      title="Edit Firm Info"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {confirmDeleteFirmId === f.id ? (
                      <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950 px-2 py-1 rounded-xl border border-rose-300 dark:border-rose-700">
                        <button
                          type="button"
                          onClick={() => handleDeleteFirm(f)}
                          className="text-[10px] font-black text-rose-700 dark:text-rose-300 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFirmId(null)}
                          className="text-[10px] font-bold text-stone-600 dark:text-slate-400 ml-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteFirmId(f.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl cursor-pointer transition"
                        title="Delete Firm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: APPEND-ONLY AUDIT LOGS */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Action, Admin email, Target user या Firm ID से खोजें..."
                className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
              Immutable Audit Trail (Append-Only): {filteredLogs.length} entries
            </div>
          </div>

          {auditError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
              {auditError}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-slate-800">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 dark:text-slate-400">
                अभी कोई ऑडिट लॉग दर्ज नहीं है।
              </div>
            ) : (
              filteredLogs.map((log) => {
                const actorLabel = usersByUid[log.actorUid]?.email || log.actorUid;
                const targetLabel = log.targetUid ? (usersByUid[log.targetUid]?.email || log.targetUid) : '';
                return (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-black">
                          {log.action}
                        </span>
                        <span className="font-bold text-stone-800 dark:text-slate-200">{actorLabel}</span>
                        {targetLabel && (
                          <span className="text-stone-500 dark:text-slate-400">→ {targetLabel}</span>
                        )}
                        {log.targetFirmId && (
                          <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400">[{log.targetFirmId}]</span>
                        )}
                      </div>
                      <p className="text-stone-600 dark:text-slate-400 text-[11px]">{log.details}</p>
                    </div>
                    <div className="text-[11px] font-mono text-stone-400 shrink-0">
                      {formatReadableDateTime(log.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL TRIAL DEFAULTS, PUBLIC SUPPORT CONTACT & BILLING SELF-TEST */}
      {subTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <form
            onSubmit={handleSaveGlobalRules}
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xs"
          >
            <div className="flex items-center gap-2 border-b border-stone-100 dark:border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">
                  Global Trial Policy &amp; Admin Contact Settings
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  नए यूज़र के ट्रायल नियम और Pending/Suspended स्क्रीन पर दिखने वाला WhatsApp/फ़ोन नंबर सेट करें।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                  Default Trial Invoice Limit
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={defaultTrialLimitInput}
                  onChange={(e) => setDefaultTrialLimitInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                  Default Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={defaultTrialDaysInput}
                  onChange={(e) => setDefaultTrialDaysInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-slate-800/70 rounded-xl border border-stone-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={requireApprovalInput}
                onChange={(e) => setRequireApprovalInput(e.target.checked)}
                className="w-4 h-4 accent-amber-600"
              />
              <div>
                <div className="text-xs font-extrabold text-stone-900 dark:text-white">
                  Require Master Admin Approval for All New Signups
                </div>
                <div className="text-[11px] text-stone-500 dark:text-slate-400">
                  हर नया रजिस्टर यूज़र Pending रहेगा जब तक आप Approve न करें।
                </div>
              </div>
            </label>

            <div className="border-t border-stone-100 dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-extrabold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                Public Admin Support Contact (Approval Gate &amp; Trial Limit Screen)
              </h4>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                  Support Contact Name / Desk
                </label>
                <input
                  type="text"
                  value={supportNameInput}
                  onChange={(e) => setSupportNameInput(e.target.value)}
                  placeholder="e.g. Shreem Mahal ERP Support"
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                    Admin WhatsApp / Phone
                  </label>
                  <input
                    type="text"
                    value={supportPhoneInput}
                    onChange={(e) => setSupportPhoneInput(e.target.value)}
                    placeholder="+91 98260 00000"
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-mono text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                    Support Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={supportEmailInput}
                    onChange={(e) => setSupportEmailInput(e.target.value)}
                    placeholder="support@example.com"
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Saving...' : 'Save Global Rules & Contact'}
            </button>
          </form>

          {/* Billing Self-Test & Diagnostics Panel */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">
                    Billing Self-Test (बिलिंग आत्म-परीक्षण)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    4 ट्रांज़ैक्शन संयोजनों (GST &amp; Estimate, Cash &amp; Mixed) का लाइव टेस्ट
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
              यह टूल वास्तविक Firestore ट्रांज़ैक्शन पाथ चलाता है (reads: firm, owner, usage, counter, stock, customer ledger; writes: sequence counter, stock deduction, customer ledger, usage counter, invoice)। परीक्षण के पश्चात सभी थ्रो-अवे टेस्ट रिकॉर्ड्स (Invoices, Items, Customers) स्वतः डिलीट कर दिए जाते हैं।
            </p>

            {/* Target Firm Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                Target Test Firm (परीक्षण हेतु फर्म)
              </label>
              <select
                value={selfTestFirmId}
                onChange={(e) => setSelfTestFirmId(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 dark:text-white"
              >
                {firms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.id})
                  </option>
                ))}
                {!firms.some(f => f.id === activeFirmId) && activeFirmId && (
                  <option value={activeFirmId}>Active: {activeFirmId}</option>
                )}
              </select>
            </div>

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunSelfTest}
              disabled={isRunningSelfTest}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRunningSelfTest ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>सेल्फ-टेस्ट चल रहा है (Running 4 test cases...)...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Run Billing Self-Test (परीक्षण शुरू करें)</span>
                </>
              )}
            </button>

            {/* Results Display */}
            {selfTestSummary && (
              <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-900 dark:text-white">
                    परीक्षण परिणाम (Summary)
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Passed: {selfTestSummary.passedCount} / {selfTestSummary.totalCases}
                    </span>
                    {selfTestSummary.failedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                        Failed: {selfTestSummary.failedCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {selfTestSummary.results.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3 rounded-xl border text-xs ${
                        r.status === 'passed'
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200'
                          : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{r.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold ${
                            r.status === 'passed'
                              ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                              : 'bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100'
                          }`}
                        >
                          {r.status === 'passed' ? 'PASS' : 'FAIL'} ({r.durationMs}ms)
                        </span>
                      </div>
                      {r.invoiceId && (
                        <div className="text-[11px] font-mono text-stone-500 dark:text-slate-400 mt-1">
                          Created &amp; cleaned doc: {r.invoiceId}
                        </div>
                      )}
                      {r.errorMessage && (
                        <div className="text-[11px] font-mono text-rose-700 dark:text-rose-300 mt-1.5 p-1.5 bg-rose-100/60 dark:bg-rose-900/40 rounded">
                          Error ({r.errorCode}): {r.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCopySelfTestReport}
                  className="w-full py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedSelfTest ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>रिपोर्ट कॉपी हो गई! (Copied)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Self-Test Report (JSON)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER PERMISSIONS, TRIAL LIMIT & EXPIRY */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <form
            onSubmit={handleSaveUserEditor}
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
          >
            <div className="flex items-start justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  Permissions &amp; Trial Quota: {editingUser.displayName || editingUser.email}
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  {editingUser.email} • {editingUser.firmName || 'No Firm Name Yet'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status + Limit + Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserApprovalStatus)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 dark:text-white"
                >
                  <option value="pending">Pending Approval</option>
                  <option value="trial">Trial (Invoice &amp; Date Limited)</option>
                  <option value="active">Active (Unlimited Invoices)</option>
                  <option value="suspended">Suspended (Blocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                  Trial Invoice Limit
                </label>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  value={editTrialLimit}
                  onChange={(e) => setEditTrialLimit(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                  Trial Expiry Date
                </label>
                <input
                  type="date"
                  value={editTrialEndsDate}
                  onChange={(e) => setEditTrialEndsDate(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 dark:text-white"
                />
              </div>
            </div>

            {/* Quick Extend Buttons for Trial */}
            {editStatus === 'trial' && (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-bold text-stone-500 dark:text-slate-400">Extend Trial:</span>
                {[7, 15, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      const base = Math.max(Date.now(), editTrialEndsDate ? new Date(`${editTrialEndsDate}T00:00:00Z`).getTime() : Date.now());
                      setEditTrialEndsDate(new Date(base + days * 86400000).toISOString().slice(0, 10));
                    }}
                    className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-lg font-bold cursor-pointer"
                  >
                    +{days} Days
                  </button>
                ))}
                {[5, 10, 25].map((bills) => (
                  <button
                    key={bills}
                    type="button"
                    onClick={() => setEditTrialLimit((prev) => prev + bills)}
                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg font-bold cursor-pointer"
                  >
                    +{bills} Invoices
                  </button>
                ))}
              </div>
            )}

            {/* Quick Role Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400">Presets:</span>
              <button
                type="button"
                onClick={() => setEditPermissions({ ...PERMISSION_PRESETS.cashier || CASHIER_PERMISSIONS })}
                className="px-2.5 py-1 bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Cashier
              </button>
              <button
                type="button"
                onClick={() => setEditPermissions({ ...PERMISSION_PRESETS.manager || MANAGER_PERMISSIONS })}
                className="px-2.5 py-1 bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setEditPermissions({ ...PERMISSION_PRESETS.full || FULL_PERMISSIONS })}
                className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Full
              </button>
              <button
                type="button"
                onClick={() => setEditPermissions({ ...RESTRICTED_PERMISSIONS })}
                className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* 16 Granular Module & Action Permissions */}
            <div>
              <div className="text-xs font-extrabold text-stone-800 dark:text-slate-200 mb-2">
                Module &amp; Action Permissions (किस मॉड्यूल की अनुमति देनी है चुनें)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {MODULE_PERMISSION_META.map((mod) => (
                  <label
                    key={mod.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      editPermissions[mod.key]
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-stone-900 dark:text-white'
                        : 'bg-stone-50 dark:bg-slate-800/50 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{mod.label}</div>
                      <div className="text-[10px] opacity-80">{mod.hindi}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(editPermissions[mod.key])}
                      onChange={(e) =>
                        setEditPermissions((prev) => ({ ...prev, [mod.key]: e.target.checked }))
                      }
                      className="w-4 h-4 accent-emerald-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                Admin Remarks / Suspension Reason (Optional)
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g. 15-day trial approved with 10 GST invoices"
                className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingUser}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {savingUser ? 'Saving...' : 'Save Permissions & Status'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT FIRM METADATA */}
      {editingFirm && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3">
          <form
            onSubmit={handleSaveFirmEdit}
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-black text-sm text-stone-900 dark:text-white">
                Edit Firm Record ({editingFirm.id})
              </h3>
              <button
                type="button"
                onClick={() => setEditingFirm(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">Firm Name</label>
              <input
                type="text"
                required
                value={editFirmName}
                onChange={(e) => setEditFirmName(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">Firm Code</label>
                <input
                  type="text"
                  value={editFirmCode}
                  onChange={(e) => setEditFirmCode(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={editFirmPhone}
                  onChange={(e) => setEditFirmPhone(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">GSTIN</label>
              <input
                type="text"
                value={editFirmGstin}
                onChange={(e) => setEditFirmGstin(e.target.value)}
                className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingFirm(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingFirm}
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-black cursor-pointer"
              >
                {savingFirm ? 'Saving...' : 'Update Firm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
