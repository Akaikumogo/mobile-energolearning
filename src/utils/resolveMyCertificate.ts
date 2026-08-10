import { buildEnergoIdCertificate } from '@/components/certificate/buildEnergoIdCertificate';
import type { EmployeeCertificate } from '@/components/certificate/types';
import mobileApi, { type UserProfile } from '@/services/api';

/**
 * Avvalo `/certificates/me`, bo‘sh yoki xato bo‘lsa — `/auth/me` dan ENERGO ID kartasi.
 */
export async function resolveMyCertificate(): Promise<EmployeeCertificate | null> {
  let fromApi: EmployeeCertificate[] | null = null;
  try {
    fromApi = await mobileApi.getMyCertificates();
  } catch {
    fromApi = null;
  }

  const first = fromApi?.[0] ?? null;
  if (first?.certificateNumber) return first;

  let me: UserProfile;
  try {
    me = await mobileApi.me();
  } catch {
    return null;
  }

  if (!me?.id || !me.firstName) return null;
  return buildEnergoIdCertificate(me);
}
