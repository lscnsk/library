import { BookMetadata, RepoStatus, BooksResponse } from '@/types/book';
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
const CACHE_TTL_MS = 30 * 1000; // 30 seconds live cache

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
    console.warn('GitHub library fetch error:', error);
    if (memoryCache) {
      return {
        ...memoryCache.response,
        cached: true
      };
    }
    return getEmptyLibraryResponse();
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
  repo?: string;
}

async function fetchBooksFromGitHub(): Promise<BooksResponse> {
  let files: RawFileItem[] = [];
  let source: RepoStatus['source'] = 'github-tree';
  let commitInfo: { sha?: string; message?: string; date?: string } = {};
  let rateLimited = false;

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Check the dedicated book repository first, then root repository
  const reposToSearch = [GITHUB_REPO_NAME, 'library'];
  let activeRepo = GITHUB_REPO_NAME;

  for (const currentRepo of reposToSearch) {
    // 1. Fetch latest commit info
    try {
      const commitRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${currentRepo}/commits?per_page=1`,
        { headers }
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
      } else if (commitRes.status === 403) {
        rateLimited = true;
      }
    } catch {
      // ignore commit fetch error
    }

    // 2. Fetch full file tree using Git Trees API (recursive)
    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${currentRepo}/git/trees/${GITHUB_BRANCH}?recursive=1`,
        { headers }
      );

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        if (Array.isArray(treeData.tree)) {
          const repoFiles: RawFileItem[] = treeData.tree
            .filter((item: any) => item.type === 'blob')
            .map((item: any) => ({
              name: item.path.split('/').pop() || item.path,
              path: item.path,
              size: item.size || 0,
              sha: item.sha,
              repo: currentRepo,
              download_url: `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${currentRepo}/${GITHUB_BRANCH}/${encodeURIComponent(item.path)}`
            }));

          const bookOnly = repoFiles.filter(f => {
            const lower = f.name.toLowerCase();
            return BOOK_EXTENSIONS.some(ext => lower.endsWith(ext));
          });

          if (bookOnly.length > 0) {
            files = bookOnly;
            source = 'github-tree';
            activeRepo = currentRepo;
            break;
          }
        }
      } else if (treeRes.status === 403) {
        rateLimited = true;
      }
    } catch (e) {
      console.warn(`Git Tree API error for ${currentRepo}:`, e);
    }

    // 3. Fallback: GitHub Contents API
    if (files.length === 0) {
      try {
        const contentsRes = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${currentRepo}/contents?t=${Date.now()}`,
          { headers }
        );
        if (contentsRes.ok) {
          const contents = await contentsRes.json();
          if (Array.isArray(contents)) {
            const repoFiles: RawFileItem[] = contents
              .filter((c: any) => c.type === 'file')
              .map((c: any) => ({
                name: c.name,
                path: c.path,
                size: c.size || 0,
                sha: c.sha,
                repo: currentRepo,
                download_url: c.download_url
              }));

            const bookOnly = repoFiles.filter(f => {
              const lower = f.name.toLowerCase();
              return BOOK_EXTENSIONS.some(ext => lower.endsWith(ext));
            });

            if (bookOnly.length > 0) {
              files = bookOnly;
              source = 'github-api';
              activeRepo = currentRepo;
              break;
            }
          }
        }
      } catch (e) {
        console.warn(`GitHub Contents API error for ${currentRepo}:`, e);
      }
    }
  }

  // Filter book files
  const bookFiles = files.filter(f => {
    const lower = f.name.toLowerCase();
    return BOOK_EXTENSIONS.some(ext => lower.endsWith(ext));
  });

  // Parse metadata for each book file in parallel
  const parsedBooks = await Promise.all(
    bookFiles.map(async (file): Promise<BookMetadata | null> => {
      const repoName = file.repo || activeRepo;
      const rawUrl =
        file.download_url ||
        `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${repoName}/${GITHUB_BRANCH}/${encodeURIComponent(file.path)}`;
      const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${repoName}@${GITHUB_BRANCH}/${encodeURIComponent(file.path)}`;
      const githubUrl = `https://github.com/${GITHUB_REPO_OWNER}/${repoName}/blob/${GITHUB_BRANCH}/${encodeURIComponent(file.path)}`;

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
          let contentRes: Response | null = null;
          try {
            contentRes = await fetch(rawUrl);
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

  const books = parsedBooks.filter((b): b is BookMetadata => Boolean(b));

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
    repo: activeRepo,
    branch: GITHUB_BRANCH,
    htmlUrl: `https://github.com/${GITHUB_REPO_OWNER}/${activeRepo}`,
    uploadUrl: `https://github.com/${GITHUB_REPO_OWNER}/${activeRepo}/upload/${GITHUB_BRANCH}`,
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
    series: allSeries,
    rateLimited
  };
}

function getEmptyLibraryResponse(rateLimited = false): BooksResponse {
  return {
    books: [],
    repo: {
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      branch: GITHUB_BRANCH,
      htmlUrl: GITHUB_REPO_HTML,
      uploadUrl: GITHUB_UPLOAD_URL,
      coolReadUrl: COOL_READ_URL,
      coolReadRepo: COOL_READ_REPO,
      lastSyncedAt: new Date().toISOString(),
      bookCount: 0,
      source: 'github-tree'
    },
    cached: false,
    totalSizeFormatted: '0 B',
    genres: [],
    authors: [],
    series: [],
    rateLimited
  };
}
