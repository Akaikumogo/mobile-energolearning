import { Capacitor } from '@capacitor/core';
import { domToBlob } from 'modern-screenshot';

/** Guvohnoma foni — PNG chetlarida shaffof joy qolmasligi uchun. */
const EXPORT_BACKGROUND = '#050a14';

export async function captureCertificatePng(node: HTMLElement): Promise<Blob> {
  const blob = await domToBlob(node, {
    type: 'image/png',
    scale: 2,
    backgroundColor: EXPORT_BACKGROUND,
  });
  if (!blob) throw new Error('Rasm yaratilmadi');
  return blob;
}

/**
 * Rasmni CORS orqali yuklab, data URL ga aylantiradi.
 * Canvas'ga chizishda tashqi domen rasmi "tainted" bo'lmasligi uchun kerak.
 * Muvaffaqiyatsiz bo'lsa null — karta siluetni ko'rsatadi.
 */
export async function toDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Faylni o‘qib bo‘lmadi'));
    reader.readAsDataURL(blob);
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await blobToDataUrl(blob);
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

/** Qurilma xotirasiga (native) yoki brauzer yuklamalariga (web) saqlaydi. */
export async function saveCertificatePng(blob: Blob, fileName: string) {
  if (!Capacitor.isNativePlatform()) {
    downloadInBrowser(blob, fileName);
    return;
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  await Filesystem.writeFile({
    path: fileName,
    data: await blobToBase64(blob),
    directory: Directory.Documents,
    recursive: true,
  });
}

/** Native ulashish oynasi; web'da Web Share API, u ham bo'lmasa — yuklab olish. */
export async function shareCertificatePng(
  blob: Blob,
  fileName: string,
  title: string,
) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    // Cache — ulashishdan keyin tizim o'zi tozalaydi.
    const written = await Filesystem.writeFile({
      path: fileName,
      data: await blobToBase64(blob),
      directory: Directory.Cache,
      recursive: true,
    });

    await Share.share({ title, files: [written.uri] });
    return;
  }

  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return;
  }

  downloadInBrowser(blob, fileName);
}

function downloadInBrowser(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
