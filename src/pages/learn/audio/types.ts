export type AudioBookSummary = {
  id: string;
  title: string;
  coverUrl?: string | null;
  audioUrl?: string | null;
  description?: string | null;
  chaptersCount: number;
};

export type AudioBookDetail = {
  id: string;
  title: string;
  coverUrl?: string | null;
  audioUrl?: string | null;
  description?: string | null;
  chapters: AudioChapter[];
};

export type AudioChapter = {
  id: string;
  title: string;
  order: number;
  bookId: string;
  paragraphs: AudioParagraph[];
};

export type AudioParagraph = {
  id: string;
  /** Title or text */
  text: string;
  order: number;
  chapterId: string;
  audioUrl: string;
};

export type LastListened = {
  bookId: string;
  chapterId: string;
  paragraphId: string;
  /** seconds */
  positionSeconds: number;
  updatedAtIso: string;
};
