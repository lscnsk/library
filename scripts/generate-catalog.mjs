import fs from 'fs';
import path from 'path';

/**
 * Script to generate static catalog.json for GitHub Pages deployment.
 * Can be run locally or in GitHub Actions workflow before build step.
 * Usage: node scripts/generate-catalog.mjs
 */

const OUTPUT_PATH = path.join(process.cwd(), 'public', 'catalog.json');

function cleanXmlText(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFB2Metadata(xmlText) {
  let title = '';
  let author = '';
  let series = '';
  let seriesNumber = '';
  let year = '';
  let annotation = '';
  const genres = [];

  const descMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/i) ||
                    xmlText.match(/<title-info>([\s\S]*?)<\/title-info>/i);
  const descBlock = descMatch ? descMatch[1] : xmlText.slice(0, 40000);

  const titleMatch = descBlock.match(/<book-title[^>]*>([\s\S]*?)<\/book-title>/i);
  if (titleMatch) title = cleanXmlText(titleMatch[1]);

  const authorMatches = [...descBlock.matchAll(/<author[^>]*>([\s\S]*?)<\/author>/gi)];
  const authorsList = [];
  for (const am of authorMatches) {
    const authorBlock = am[1];
    const first = cleanXmlText(authorBlock.match(/<first-name[^>]*>([\s\S]*?)<\/first-name>/i)?.[1] || '');
    const last = cleanXmlText(authorBlock.match(/<last-name[^>]*>([\s\S]*?)<\/last-name>/i)?.[1] || '');
    const full = [first, last].filter(Boolean).join(' ').trim();
    if (full && !authorsList.includes(full)) authorsList.push(full);
  }
  author = authorsList.join(', ');

  const seqMatch = descBlock.match(/<sequence[^>]*name=[\"']([^\"']+)[\"'](?:\s*number=[\"']([^\"']*)[\"'])?/i);
  if (seqMatch) {
    series = (seqMatch[1] || '').trim();
    if (seqMatch[2]) seriesNumber = seqMatch[2].trim();
  }

  const genreMatches = [...descBlock.matchAll(/<genre[^>]*>([\s\S]*?)<\/genre>/gi)];
  for (const gm of genreMatches) {
    const g = cleanXmlText(gm[1]);
    if (g && !genres.includes(g)) genres.push(g);
  }

  return { title, author, series, seriesNumber, year, genres, annotation };
}

function main() {
  console.log('Generating static catalog.json...');
  
  const books = [];
  const booksDir = path.join(process.cwd(), 'books');

  if (fs.existsSync(booksDir)) {
    const files = fs.readdirSync(booksDir);
    for (const file of files) {
      if (file.endsWith('.fb2') || file.endsWith('.epub') || file.endsWith('.txt')) {
        const filePath = path.join(booksDir, file);
        const stats = fs.statSync(filePath);
        let meta = { title: file.replace(/\.[^/.]+$/, ''), author: 'Неизвестен', genres: [] };

        if (file.endsWith('.fb2')) {
          try {
            const xml = fs.readFileSync(filePath, 'utf-8');
            meta = { ...meta, ...parseFB2Metadata(xml) };
          } catch (e) {
            console.warn(`Could not parse ${file}:`, e.message);
          }
        }

        books.push({
          id: `book-${file.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          filename: file,
          path: file,
          title: meta.title || file,
          author: meta.author || 'Автор не указан',
          series: meta.series,
          seriesNumber: meta.seriesNumber,
          genres: meta.genres || [],
          annotation: meta.annotation,
          format: file.split('.').pop(),
          fileSize: stats.size,
          downloadUrl: `./books/${encodeURIComponent(file)}`,
          rawUrl: `./books/${encodeURIComponent(file)}`
        });
      }
    }
  }

  const catalogData = {
    version: '1.0',
    lastSyncedAt: new Date().toISOString(),
    books
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalogData, null, 2), 'utf-8');
  console.log(`Catalog generated successfully at ${OUTPUT_PATH} with ${books.length} books.`);
}

main();
