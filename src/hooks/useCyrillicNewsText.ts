import { useTranslation } from '@/hooks/useTranslation';

export function useCyrillicNewsText() {
  const { t } = useTranslation();
  return {
    newsLabel: t({ uz: 'Yangilik', en: 'News', ru: 'Новость' }),
    title: t({
      uz: 'Kirill alifbosi qo‘shildi',
      en: 'Cyrillic script is here',
      ru: 'Добавлена кириллица',
    }),
    body: t({
      uz: 'Endi platforma kontentini kirill alifbosida ko‘rishingiz mumkin. Darslar, savollar va kutubxona matnlari kirill yozuvida ko‘rsatiladi.',
      en: 'You can now view the platform content in the Uzbek Cyrillic script. Lessons, questions and library texts will be shown in Cyrillic.',
      ru: 'Теперь контент платформы можно просматривать на узбекской кириллице. Уроки, вопросы и тексты библиотеки будут показаны кириллицей.',
    }),
    tryLabel: t({ uz: 'Sinab ko‘rish', en: 'Try it', ru: 'Попробовать' }),
    cancelLabel: t({ uz: 'Bekor qilish', en: 'Cancel', ru: 'Отмена' }),
  };
}
