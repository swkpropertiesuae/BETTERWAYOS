import type { SessionUser, UserRole } from '@/lib/domain/types';

export interface RoleCapabilities {
  canAccessExecutive: boolean;
  canAccessPrivacyFastTrack: boolean;
  canAccessOwnerConsolidatedVat: boolean;
  canWriteMasterDirect: boolean;
  canProposeMasterChange: boolean;
  canEditSecurityMasters: boolean;
  canApproveOwnerQueues: boolean;
  pipelineScope: 'ALL' | 'TEAM' | 'OWN' | 'NONE';
  canViewStandardAccounts: boolean;
  canManageWebsiteStudio: boolean;
  canManageHr: boolean;
  canViewFieldGpsAll: boolean;
  canUnmaskPhoneDirect: boolean;
}

const CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  OWNER: {
    canAccessExecutive: true,
    canAccessPrivacyFastTrack: true,
    canAccessOwnerConsolidatedVat: true,
    canWriteMasterDirect: true,
    canProposeMasterChange: true,
    canEditSecurityMasters: true,
    canApproveOwnerQueues: true,
    pipelineScope: 'ALL',
    canViewStandardAccounts: true,
    canManageWebsiteStudio: true,
    canManageHr: true,
    canViewFieldGpsAll: true,
    canUnmaskPhoneDirect: true,
  },
  TEAM_MANAGER: {
    canAccessExecutive: false,
    canAccessPrivacyFastTrack: false,
    canAccessOwnerConsolidatedVat: false,
    canWriteMasterDirect: false,
    canProposeMasterChange: false,
    canEditSecurityMasters: false,
    canApproveOwnerQueues: false,
    pipelineScope: 'TEAM',
    canViewStandardAccounts: false,
    canManageWebsiteStudio: false,
    canManageHr: false,
    canViewFieldGpsAll: true,
    canUnmaskPhoneDirect: false,
  },
  OPERATIONS_MANAGER: {
    canAccessExecutive: false,
    canAccessPrivacyFastTrack: false,
    canAccessOwnerConsolidatedVat: false,
    canWriteMasterDirect: false,
    canProposeMasterChange: false,
    canEditSecurityMasters: false,
    canApproveOwnerQueues: false,
    pipelineScope: 'TEAM',
    canViewStandardAccounts: false,
    canManageWebsiteStudio: false,
    canManageHr: false,
    canViewFieldGpsAll: true,
    canUnmaskPhoneDirect: false,
  },
  HR_MANAGER: {
    canAccessExecutive: false,
    canAccessPrivacyFastTrack: false,
    canAccessOwnerConsolidatedVat: false,
    canWriteMasterDirect: false,
    canProposeMasterChange: false,
    canEditSecurityMasters: false,
    canApproveOwnerQueues: false,
    pipelineScope: 'NONE',
    canViewStandardAccounts: false,
    canManageWebsiteStudio: false,
    canManageHr: true,
    canViewFieldGpsAll: false,
    canUnmaskPhoneDirect: false,
  },
  IT_MARKETING: {
    canAccessExecutive: false,
    canAccessPrivacyFastTrack: false,
    canAccessOwnerConsolidatedVat: false,
    canWriteMasterDirect: false,
    canProposeMasterChange: false,
    canEditSecurityMasters: false,
    canApproveOwnerQueues: false,
    pipelineScope: 'NONE',
    canViewStandardAccounts: false,
    canManageWebsiteStudio: true,
    canManageHr: false,
    canViewFieldGpsAll: false,
    canUnmaskPhoneDirect: false,
  },
  ADVISOR: {
    canAccessExecutive: false,
    canAccessPrivacyFastTrack: false,
    canAccessOwnerConsolidatedVat: false,
    canWriteMasterDirect: false,
    canProposeMasterChange: false,
    canEditSecurityMasters: false,
    canApproveOwnerQueues: false,
    pipelineScope: 'OWN',
    canViewStandardAccounts: false,
    canManageWebsiteStudio: false,
    canManageHr: false,
    canViewFieldGpsAll: false,
    canUnmaskPhoneDirect: false,
  },
  OFFICE_ADMIN: {
    canAccessExecutive: false,
    canAccessPrivacyFastTrack: false,
    canAccessOwnerConsolidatedVat: false,
    canWriteMasterDirect: false,
    canProposeMasterChange: true,
    canEditSecurityMasters: false,
    canApproveOwnerQueues: false,
    pipelineScope: 'TEAM',
    canViewStandardAccounts: true,
    canManageWebsiteStudio: false,
    canManageHr: true,
    canViewFieldGpsAll: true,
    canUnmaskPhoneDirect: false,
  },
};

export function getCapabilitiesForRole(role: UserRole): RoleCapabilities {
  return CAPABILITIES[role];
}

export function canAccessExecutive(user: SessionUser): boolean {
  return user.role === 'OWNER';
}

export function canViewRecord(
  user: SessionUser,
  resource: 'leads' | 'mortgage_cases' | 'case_documents' | 'privacy_fast_track_jobs' | 'privacy_fast_track_invoices',
  assignedUserId?: string | null,
  privateToOwnerId?: string | null,
): boolean {
  if (resource === 'privacy_fast_track_jobs' || resource === 'privacy_fast_track_invoices') {
    if (user.role !== 'OWNER') return false;
    if (privateToOwnerId && privateToOwnerId !== user.id) return false;
    return true;
  }

  const caps = getCapabilitiesForRole(user.role);
  if (caps.pipelineScope === 'ALL' || caps.pipelineScope === 'TEAM') return true;
  if (caps.pipelineScope === 'OWN') {
    return Boolean(assignedUserId && assignedUserId === user.id);
  }
  return false;
}
