/** ID karta standart o'lchami (gorizontal): eni × balandligi. */
export const ID_CARD_WIDTH_CM = 8.5;
export const ID_CARD_HEIGHT_CM = 5.5;

export const ID_CARD_ASPECT_CLASS = 'aspect-[85/55]' as const;

/** Mobil: kichikroq masshtabda, lekin nisbati saqlanadi. */
export const ID_CARD_MOBILE_SCENE_CLASS = 'w-full max-w-[8.5cm]' as const;

export const ID_CARD_SIZE_LABEL = {
  uz: 'O‘lcham: 8,5 × 5,5 sm (masshtabda)',
  en: 'Size: 8.5 × 5.5 cm (scaled)',
  ru: 'Размер: 8,5 × 5,5 см (масштаб)',
} as const;

/** PNG eksport — yuqori sifat (≈10 px/mm). */
export const ID_CARD_EXPORT_WIDTH_PX = 850;

export const ID_CARD_EXPORT_STATIC_CLASS =
  'relative w-full aspect-[85/55] rounded-2xl [container-type:inline-size]' as const;

/** 3×4 rasm maydoni (sm) — container ichida nisbiy. */
export const ID_CARD_PHOTO_CLASS =
  'relative w-[29.4cqw] h-[31.8cqw] shrink-0 overflow-hidden rounded-[1cqw]' as const;

/** QR maydoni. */
export const ID_CARD_QR_BOX_CLASS =
  'aspect-square w-[25.3cqw] shrink-0 rounded-[1cqw] bg-white p-[0.85cqw] shadow-[0_2px_8px_rgba(0,0,0,0.35)]' as const;
