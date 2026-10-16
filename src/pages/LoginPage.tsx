import { Capacitor } from '@capacitor/core';
import AdminStyleLoginPage from './AdminStyleLoginPage';
import LegacyLoginPage from './LegacyLoginPage';

/**
 * Login tanlovi:
 * - Native ilova (Android) yoki eski mobile domen (elektrolearn-mobile.*) -> eski login.
 * - Boshqa holatlarda (umumiy domen) -> admin panelga o'xshash login.
 */
function shouldUseLegacyLogin(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('elektrolearn-mobile');
}

export default function LoginPage() {
  return shouldUseLegacyLogin() ? <LegacyLoginPage /> : <AdminStyleLoginPage />;
}