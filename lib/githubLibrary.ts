import { BookMetadata, BookFormat, RepoStatus, BooksResponse } from '@/types/book';
import { extractFB2Metadata, parseFilenameFallback } from './ebookParser';
import { formatBytes, estimateReadingTime } from './typography';

const GITHUB_REPO_OWNER = 'lscnsk';
const GITHUB_REPO_NAME = 'lscnsk_library';
const GITHUB_BRANCH = 'main';

const COOL_READ_URL = 'https://lscnsk.github.io/Cool_Read/';
const COOL_READ_REPO = 'https://github.com/lscnsk/Cool_Read';
const GITHUB_REPO_HTML = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
const GITHUB_UPLOAD_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/upload/${GITHUB_BRANCH}`;

interface CacheEntry {
  response: BooksResponse;
  timestamp: number;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds auto-revalidate

const BOOK_EXTENSIONS = ['.fb2', '.epub', '.pdf', '.txt', '.mobi', '.cbr', '.cbz'];

export async function getLibraryBooks(forceFresh = false): Promise<BooksResponse> {
  const now = Date.now();
  if (!forceFresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      ...memoryCache.response,
      cached: true
    };
  }

  try {
    const freshData = await fetchBooksFromGitHub();
    memoryCache = {
      response: freshData,
      timestamp: now
    };
    return freshData;
  } catch (error) {
    console.error('Failed to fetch from GitHub, attempting cache fallback:', error);
    if (memoryCache) {
      return {
        ...memoryCache.response,
        cached: true
      };
    }
    // If absolutely nothing cached yet, return graceful fallback
    return getFallbackLibrary();
  }
}

export function invalidateLibraryCache(): void {
  memoryCache = null;
}

interface RawFileItem {
  name: string;
  path: string;
  size: number;
  sha?: string;
  download_url?: string;
}

async function fetchBooksFromGitHub(): Promise<BooksResponse> {
  let files: RawFileItem[] = [];
  let source: RepoStatus['source'] = 'github-tree';
  let commitInfo: { sha?: string; message?: string; date?: string } = {};

  // Step 1: Fetch latest commit info to display in sync banner
  try {
    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits?per_page=1`,
      {
        headers: {
          'User-Agent': 'lscnsk-library-catalog/1.0',
          Accept: 'application/vnd.github.v3+json'
        },
        next: { revalidate: 30 }
      }
    );
    if (commitRes.ok) {
      const commits = await commitRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        commitInfo = {
          sha: commits[0].sha?.slice(0, 7),
          message: commits[0].commit?.message,
          date: commits[0].commit?.author?.date
        };
      }
    }
  } catch (e) {
    console.warn('Could not fetch commit info:', e);
  }

  // Step 2: Fetch full file tree using Git Tree API (recursive)
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/git/trees/${GITHUB_BRANCH}?recursive=1`,
      {
        headers: {
          'User-Agent': 'lscnsk-library-catalog/1.0',
          Accept: 'application/vnd.github.v3+json'
        },
        next: { revalidate: 30 }
      }
    );

    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (Array.isArray(treeData.tree)) {
        files = treeData.tree
          .filter((item: any) => item.type === 'blob')
          .map((item: any) => ({
            name: item.path.split('/').pop() || item.path,
            path: item.path,
            size: item.size || 0,
            sha: item.sha,
            download_url: `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${encodeURIComponent(item.path)}`
          }));
        source = 'github-tree';
      }
    }
  } catch (e) {
    console.warn('GitHub Git Tree API failed:', e);
  }

  // Step 3: Fallback to GitHub Contents API
  if (files.length === 0) {
    try {
      const contentsRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents`,
        {
          headers: {
            'User-Agent': 'lscnsk-library-catalog/1.0',
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      if (contentsRes.ok) {
        const contents = await contentsRes.json();
        if (Array.isArray(contents)) {
          files = contents
            .filter((c: any) => c.type === 'file')
            .map((c: any) => ({
              name: c.name,
              path: c.path,
              size: c.size || 0,
              sha: c.sha,
              download_url: c.download_url
            }));
          source = 'github-api';
        }
      }
    } catch (e) {
      console.warn('GitHub Contents API failed:', e);
    }
  }

  // Step 4: Fallback to jsDelivr Flat API
  if (files.length === 0) {
    try {
      const jsdRes = await fetch(
        `https://data.jsdelivr.com/v1/package/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_BRANCH}/flat?t=${Date.now()}`
      );
      if (jsdRes.ok) {
        const jsdData = await jsdRes.json();
        if (Array.isArray(jsdData.files)) {
          files = jsdData.files.map((f: any) => {
            const cleanPath = f.name.replace(/^\//, '');
            return {
              name: cleanPath.split('/').pop() || cleanPath,
              path: cleanPath,
              size: f.size || 0,
              download_url: `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${encodeURIComponent(cleanPath)}`
            };
          });
          source = 'jsdelivr';
        }
      }
    } catch (e) {
      console.warn('jsDelivr flat API failed:', e);
    }
  }

  // Filter out non-book files (e.g. README.md, .gitignore, licenses)
  const bookFiles = files.filter(f => {
    const lower = f.name.toLowerCase();
    return BOOK_EXTENSIONS.some(ext => lower.endsWith(ext));
  });

  // Step 5: Parse metadata for each book file in parallel
  const books: BookMetadata[] = await Promise.all(
    bookFiles.map(async file => {
      const rawUrl =
        file.download_url ||
        `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${encodeURIComponent(file.path)}`;
      const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_BRANCH}/${encodeURIComponent(file.path)}`;
      const githubUrl = `${GITHUB_REPO_HTML}/blob/${GITHUB_BRANCH}/${encodeURIComponent(file.path)}`;

      const fallback = parseFilenameFallback(file.name);
      let title = fallback.title;
      let author = fallback.author;
      let authorLastName: string | undefined = undefined;
      let series = fallback.series;
      let seriesNumber: string | number | undefined = undefined;
      let year: string | number | undefined = undefined;
      let genres: string[] = [];
      let annotation: string | undefined = undefined;
      let coverUrl: string | undefined = undefined;
      let pageCount: number | undefined = undefined;
      let language: string | undefined = undefined;

      const isFb2 = file.name.toLowerCase().endsWith('.fb2');

      if (isFb2) {
        try {
          // Fetch the file content
          let contentRes: Response | null = null;
          try {
            contentRes = await fetch(rawUrl, {
              headers: { 'User-Agent': 'lscnsk-library/1.0' }
            });
          } catch {
            contentRes = null;
          }

          if (!contentRes || !contentRes.ok) {
            try {
              contentRes = await fetch(cdnUrl);
            } catch {
              contentRes = null;
            }
          }

          if (contentRes && contentRes.ok) {
            const xml = await contentRes.text();
            const meta = extractFB2Metadata(xml);
            if (meta.title) title = meta.title;
            if (meta.author) author = meta.author;
            if (meta.authorLastName) authorLastName = meta.authorLastName;
            if (meta.series) series = meta.series;
            if (meta.seriesNumber) seriesNumber = meta.seriesNumber;
            if (meta.year) year = meta.year;
            if (meta.genres && meta.genres.length > 0) genres = meta.genres;
            if (meta.annotation) annotation = meta.annotation;
            if (meta.coverUrl) coverUrl = meta.coverUrl;
            if (meta.pageCount) pageCount = meta.pageCount;
            if (meta.language) language = meta.language;
          }
        } catch (e) {
          console.warn(`Could not extract FB2 metadata for ${file.name}:`, e);
        }
      }

      const id = `book-${file.sha || file.name.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '-')}`;

      return {
        id,
        filename: file.name,
        path: file.path,
        title,
        author: author || 'Автор не указан',
        authorLastName,
        series,
        seriesNumber,
        year,
        genres,
        annotation,
        coverUrl,
        format: fallback.format,
        fileSize: file.size,
        formattedSize: formatBytes(file.size),
        downloadUrl: rawUrl,
        rawUrl,
        cdnUrl,
        githubUrl,
        sha: file.sha,
        pageCount,
        estimatedReadingTime: estimateReadingTime(pageCount, file.size),
        language
      };
    })
  );

  // Derive unique genres, authors, series
  const allGenres = Array.from(new Set(books.flatMap(b => b.genres))).sort();
  const allAuthors = Array.from(
    new Set(books.map(b => b.author).filter(a => a && a !== 'Автор не указан'))
  ).sort();
  const allSeries = Array.from(
    new Set(books.map(b => b.series).filter((s): s is string => Boolean(s)))
  ).sort();

  const totalBytes = books.reduce((acc, b) => acc + b.fileSize, 0);

  const repoStatus: RepoStatus = {
    owner: GITHUB_REPO_OWNER,
    repo: GITHUB_REPO_NAME,
    branch: GITHUB_BRANCH,
    htmlUrl: GITHUB_REPO_HTML,
    uploadUrl: GITHUB_UPLOAD_URL,
    coolReadUrl: COOL_READ_URL,
    coolReadRepo: COOL_READ_REPO,
    lastSyncedAt: new Date().toISOString(),
    bookCount: books.length,
    source,
    latestCommitSha: commitInfo.sha,
    latestCommitMessage: commitInfo.message,
    latestCommitDate: commitInfo.date
  };

  return {
    books,
    repo: repoStatus,
    cached: false,
    totalSizeFormatted: formatBytes(totalBytes),
    genres: allGenres,
    authors: allAuthors,
    series: allSeries
  };
}

function getFallbackLibrary(): BooksResponse {
  const fallbackBook: BookMetadata = {
    id: 'book-ge-fb2',
    filename: 'GE.fb2',
    path: 'GE.fb2',
    title: 'Пробный камень. Избранное',
    author: 'Эдит Уортон',
    authorLastName: 'Уортон',
    series: 'Позолоченный век',
    genres: ['Классическая проза'],
    annotation:
      'В книгу вошли ранние произведения американской писательницы Эдит Уортон (1862–1937): сборники малой прозы «Сильнейшая склонность» (1899) и «Решающие мгновения» (1901), а также повесть «Пробный камень» (1900).',
    format: 'fb2',
    fileSize: 2010716,
    formattedSize: '1.9 МБ',
    downloadUrl: `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/GE.fb2`,
    rawUrl: `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/GE.fb2`,
    cdnUrl: `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_BRANCH}/GE.fb2`,
    githubUrl: `${GITHUB_REPO_HTML}/blob/${GITHUB_BRANCH}/GE.fb2`,
    pageCount: 320,
    estimatedReadingTime: '~6 ч',
    language: 'ru'
  };

  return {
    books: [fallbackBook],
    repo: {
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      branch: GITHUB_BRANCH,
      htmlUrl: GITHUB_REPO_HTML,
      uploadUrl: GITHUB_UPLOAD_URL,
      coolReadUrl: COOL_READ_URL,
      coolReadRepo: COOL_READ_REPO,
      lastSyncedAt: new Date().toISOString(),
      bookCount: 1,
      source: 'cache'
    },
    cached: true,
    totalSizeFormatted: '1.9 МБ',
    genres: ['Классическая проза'],
    authors: ['Эдит Уортон'],
    series: ['Позолоченный век']
  };
}
