// import type { AudioBook } from './types';

// // Mock data (replace with API later).
// // Audio is attached ONLY to paragraphs (rule).
// export const audioBooks: AudioBook[] = [
//   {
//     id: 'book-1',
//     title: 'Elektr xavfsizligi: Kirish',
//     coverUrl: null,
//     description:
//       'Asosiy tushunchalar va xavfsizlik qoidalari bo‘yicha qisqa audiokitob.',
//     chapters: [
//       {
//         id: 'ch-1',
//         bookId: 'book-1',
//         title: '1-bob: Asosiy qoidalar',
//         order: 1,
//         paragraphs: [
//           {
//             id: 'p-1',
//             chapterId: 'ch-1',
//             text: 'Elektr ishini boshlashdan oldin: ruxsat, tekshiruv, himoya.',
//             order: 1,
//             audioUrl:
//               'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4f/En-us-Tashkent.ogg/En-us-Tashkent.ogg.mp3',
//           },
//           {
//             id: 'p-2',
//             chapterId: 'ch-1',
//             text: 'Izolyatsiya va yerga ulash (grounding) nima uchun kerak.',
//             order: 2,
//             audioUrl:
//               'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3e/En-us-electrical_safety.ogg/En-us-electrical_safety.ogg.mp3',
//           },
//         ],
//       },
//       {
//         id: 'ch-2',
//         bookId: 'book-1',
//         title: '2-bob: Xatolar va oqibatlar',
//         order: 2,
//         paragraphs: [
//           {
//             id: 'p-3',
//             chapterId: 'ch-2',
//             text: 'O‘ldiruvchi xatolar: tartibni buzish, shoshilish, nazoratsiz ish.',
//             order: 1,
//             audioUrl:
//               'https://upload.wikimedia.org/wikipedia/commons/transcoded/4/49/En-us-mistake.ogg/En-us-mistake.ogg.mp3',
//           },
//         ],
//       },
//     ],
//   },
//   {
//     id: 'book-2',
//     title: 'Favqulodda holatlarda birinchi yordam',
//     coverUrl: null,
//     description:
//       'Tok urishi va hushdan ketish holatlarida qisqa tavsiyalar.',
//     chapters: [
//       {
//         id: 'ch-3',
//         bookId: 'book-2',
//         title: '1-bob: Tok urishi',
//         order: 1,
//         paragraphs: [
//           {
//             id: 'p-4',
//             chapterId: 'ch-3',
//             text: 'Tok urgan odamga yaqinlashishdan oldin energiyani uzing.',
//             order: 1,
//             audioUrl:
//               'https://upload.wikimedia.org/wikipedia/commons/transcoded/0/02/En-us-first_aid.ogg/En-us-first_aid.ogg.mp3',
//           },
//         ],
//       },
//     ],
//   },
// ];

// export function getBook(bookId: string) {
//   return audioBooks.find((b) => b.id === bookId) ?? null;
// }
