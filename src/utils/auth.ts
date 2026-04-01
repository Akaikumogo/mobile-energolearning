import type { UserProfile } from '@/services/api';

export function readCachedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function needsOrganizationSelection(user: UserProfile | null): boolean {
  if (!user) return false;
  if (user.role !== 'USER') return false;
  return (user.organizations?.length ?? 0) === 0;
}
