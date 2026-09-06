export type BookFormat = 'fb2' | 'epub' | 'pdf' | 'txt' | 'mobi' | 'cbr' | 'cbz' | 'other';

export interface BookMetadata {
  id: string;
  filename: string;
  path: string;
  title: string;
  author: string;
  authorLastName?: string;
  series?: string;
  seriesNumber?: string | number;
  year?: string | number;
  genres: string[];
  annotation?: string;
  coverUrl?: string; // Data URL or remote image URL
  format: BookFormat;
  fileSize: number;
  formattedSize: string;
  downloadUrl: string;
  rawUrl: string;
  cdnUrl: string;
  githubUrl: string;
  sha?: string;
  pageCount?: number;
  estimatedReadingTime?: string;
  language?: string;
}

export interface RepoStatus {
  owner: string;
  repo: string;
  branch: string;
  htmlUrl: string;
  uploadUrl: string;
  coolReadUrl: string;
  coolReadRepo: string;
  lastSyncedAt: string;
  bookCount: number;
  source: 'github-api' | 'github-tree' | 'jsdelivr' | 'cache';
  latestCommitSha?: string;
  latestCommitMessage?: string;
  latestCommitDate?: string;
}

export interface BooksResponse {
  books: BookMetadata[];
  repo: RepoStatus;
  cached: boolean;
  totalSizeFormatted: string;
  genres: string[];
  authors: string[];
  series: string[];
}

export interface BookPreviewChapter {
  title: string;
  content: string[];
}

export interface BookPreviewData {
  id: string;
  title: string;
  author: string;
  chapters: BookPreviewChapter[];
  annotation?: string;
}
