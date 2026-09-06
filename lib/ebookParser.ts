import { formatBytes, estimateReadingTime, formatRussianTypography, formatGenreName } from './typography';
import { BookMetadata, BookFormat, BookPreviewData, BookPreviewChapter } from '@/types/book';

interface ParsedMetadata {
  title: string;
  author: string;
  authorLastName?: string;
  series?: string;
  seriesNumber?: string | number;
  year?: string | number;
  genres: string[];
  annotation?: string;
  coverUrl?: string;
  pageCount?: number;
  language?: string;
}

/**
 * Parses FictionBook 2.0 (FB2) XML header and description.
 * Safe for large XML files as it only needs the head for metadata,
 * or full text when requested.
 */
export function extractFB2Metadata(xmlText: string): ParsedMetadata {
  let title = '';
  let author = '';
  let authorLastName = '';
  let series = '';
  let seriesNumber: string | number = '';
  let year = '';
  let annotation = '';
  let coverUrl = '';
  let language = '';
  const genres: string[] = [];

  // Extract <description> block
  const descMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/i);
  const descBlock = descMatch ? descMatch[1] : xmlText.slice(0, 20000);

  // 1. Title
  const titleMatch = descBlock.match(/<book-title>([\s\S]*?)<\/book-title>/i);
  if (titleMatch) {
    title = cleanXmlText(titleMatch[1]);
  }

  // 2. Author
  const authorMatch = descBlock.match(/<author>([\s\S]*?)<\/author>/i);
  if (authorMatch) {
    const authorBlock = authorMatch[1];
    const first = cleanXmlText(authorBlock.match(/<first-name>([\s\S]*?)<\/first-name>/i)?.[1] || '');
    const middle = cleanXmlText(authorBlock.match(/<middle-name>([\s\S]*?)<\/middle-name>/i)?.[1] || '');
    const last = cleanXmlText(authorBlock.match(/<last-name>([\s\S]*?)<\/last-name>/i)?.[1] || '');
    const nick = cleanXmlText(authorBlock.match(/<nickname>([\s\S]*?)<\/nickname>/i)?.[1] || '');

    authorLastName = last;
    if (first || last) {
      author = [first, middle, last].filter(Boolean).join(' ').trim();
    } else if (nick) {
      author = nick;
    }
  }

  // 3. Series / Sequence
  const seqMatch = descBlock.match(/<sequence[^>]*name="([^"]+)"(?:\s*number="([^"]*)")?/i);
  if (seqMatch) {
    series = seqMatch[1].trim();
    if (seqMatch[2]) {
      seriesNumber = seqMatch[2].trim();
    }
  }

  // 4. Genres
  const genreMatches = [...descBlock.matchAll(/<genre>([\s\S]*?)<\/genre>/gi)];
  for (const gm of genreMatches) {
    const g = cleanXmlText(gm[1]);
    if (g && !genres.includes(g)) {
      genres.push(formatGenreName(g));
    }
  }

  // 5. Annotation / Synopsis
  const annoMatch = descBlock.match(/<annotation>([\s\S]*?)<\/annotation>/i);
  if (annoMatch) {
    const pMatches = [...annoMatch[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)];
    if (pMatches.length > 0) {
      annotation = pMatches
        .map(p => cleanXmlText(p[1]))
        .filter(Boolean)
        .join('\n\n');
    } else {
      annotation = cleanXmlText(annoMatch[1]);
    }
  }

  // 6. Date / Year
  const dateMatch = descBlock.match(/<date[^>]*>([\s\S]*?)<\/date>/i);
  if (dateMatch) {
    year = cleanXmlText(dateMatch[1]);
  }

  // 7. Lang
  const langMatch = descBlock.match(/<lang>([\s\S]*?)<\/lang>/i);
  if (langMatch) {
    language = cleanXmlText(langMatch[1]);
  }

  // 8. Cover image from <coverpage> and <binary>
  const coverMatch = descBlock.match(/<coverpage>[\s\S]*?<image[^>]*href="#([^"]+)"/i);
  if (coverMatch) {
    const imageId = coverMatch[1];
    // Find binary tag matching this ID
    const binRegex = new RegExp(
      `<binary[^>]*id="${imageId}"[^>]*content-type="([^"]+)"[^>]*>([\\s\\S]*?)<\\/binary>`,
      'i'
    );
    const binMatch = xmlText.match(binRegex);
    if (binMatch) {
      const mime = binMatch[1].trim();
      const rawBase64 = binMatch[2].replace(/[\r\n\s]/g, '');
      if (rawBase64.length > 100) {
        coverUrl = `data:${mime};base64,${rawBase64}`;
      }
    }
  }

  // Calculate approximate page count from text length
  const bodyTextLen = xmlText.replace(/<binary[\s\S]*?<\/binary>/gi, '').length;
  const pageCount = Math.max(10, Math.round(bodyTextLen / 2000));

  return {
    title,
    author,
    authorLastName,
    series,
    seriesNumber,
    year,
    genres,
    annotation: formatRussianTypography(annotation),
    coverUrl,
    pageCount,
    language
  };
}

/**
 * Fallback parser for book filenames when XML metadata isn't available or fails.
 * Handles patterns like:
 * - "Author - Title.format"
 * - "Author - [Series] Title.format"
 * - "Title.format"
 */
export function parseFilenameFallback(filename: string): {
  title: string;
  author: string;
  format: BookFormat;
  series?: string;
} {
  const dotIndex = filename.lastIndexOf('.');
  const rawExt = dotIndex !== -1 ? filename.slice(dotIndex + 1).toLowerCase() : '';
  const baseName = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;

  let format: BookFormat = 'other';
  if (['fb2', 'epub', 'pdf', 'txt', 'mobi', 'cbr', 'cbz'].includes(rawExt)) {
    format = rawExt as BookFormat;
  }

  let author = '';
  let title = baseName.replace(/_/g, ' ').trim();
  let series: string | undefined = undefined;

  // Check for series in brackets e.g. "Author - [Series #1] Title"
  const bracketMatch = title.match(/\[(.*?)\]/);
  if (bracketMatch) {
    series = bracketMatch[1].trim();
    title = title.replace(/\[.*?\]/, '').replace(/\s+/g, ' ').trim();
  }

  // Check for "Author - Title"
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    author = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  return {
    title: title || filename,
    author: author || 'Автор не указан',
    format,
    series
  };
}

/**
 * Extracts readable chapters and sections from an FB2 file for the in-browser quick preview reader.
 */
export function extractFB2Preview(xmlText: string, bookTitle: string, bookAuthor: string): BookPreviewData {
  const chapters: BookPreviewChapter[] = [];

  // Extract annotation if any
  const annoMatch = xmlText.match(/<annotation>([\s\S]*?)<\/annotation>/i);
  let annotation: string | undefined = undefined;
  if (annoMatch) {
    annotation = cleanXmlText(annoMatch[1].replace(/<\/p>/gi, '\n\n'));
  }

  // Find <body> sections
  // Usually <section><title><p>Chapter Title</p></title><p>Text...</p></section>
  const bodyMatch = xmlText.match(/<body>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : xmlText;

  const sectionMatches = [...bodyContent.matchAll(/<section>([\s\S]*?)<\/section>/gi)];

  if (sectionMatches.length > 0) {
    sectionMatches.forEach((sMatch, idx) => {
      const secText = sMatch[1];
      const titleMatch = secText.match(/<title>([\s\S]*?)<\/title>/i);
      let chTitle = titleMatch ? cleanXmlText(titleMatch[1]) : `Раздел ${idx + 1}`;
      if (!chTitle.trim()) chTitle = `Раздел ${idx + 1}`;

      const paragraphs = [...secText.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
        .map(p => cleanXmlText(p[1]))
        .filter(p => p.length > 0 && !p.startsWith('<title>'));

      if (paragraphs.length > 0) {
        chapters.push({
          title: chTitle,
          content: paragraphs
        });
      }
    });
  }

  // If no sections with <p> found, fall back to global paragraphs
  if (chapters.length === 0) {
    const allP = [...bodyContent.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
      .map(p => cleanXmlText(p[1]))
      .filter(p => p.length > 0);

    if (allP.length > 0) {
      // Chunk into 30 paragraphs per chapter
      const chunkSize = 30;
      for (let i = 0; i < allP.length; i += chunkSize) {
        const slice = allP.slice(i, i + chunkSize);
        chapters.push({
          title: `Глава ${Math.floor(i / chunkSize) + 1}`,
          content: slice
        });
      }
    }
  }

  return {
    id: bookTitle,
    title: bookTitle,
    author: bookAuthor,
    annotation,
    chapters: chapters.slice(0, 20) // Provide top chapters for instant fast preview
  };
}

function cleanXmlText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/\s+/g, ' ')
    .trim();
}
