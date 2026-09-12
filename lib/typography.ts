/**
 * Typography helper for bookish editorial text formatting:
 * - Proper Russian guillemets « »
 * - Em-dash (—) instead of hyphens
 * - Non-breaking spaces (&nbsp; or \u00A0) after short prepositions and conjunctions
 * - Soft hyphens for proper word wrapping
 */

export function formatTypography(text: string): string {
  if (!text) return '';

  let res = text
    // Replace quotes
    .replace(/(^|[\s(\[{<])"([a-zA-Zа-яА-ЯёЁ0-9])/g, '$1«$2')
    .replace(/([a-zA-Zа-яА-ЯёЁ0-9.,!?:;])"/g, '$1»')
    .replace(/"/g, '»')
    // Replace hyphens to em-dashes
    .replace(/\s+-\s+/g, ' — ')
    .replace(/\s+--\s+/g, ' — ')
    .replace(/(\d+)-(\d+)/g, '$1–$2');

  // Bind short prepositions and conjunctions with non-breaking spaces
  res = res.replace(
    /(^|[\s(«])([вВнНиИкКуУсСоОаАяЯ]|об|Обиз|Из|за|За|от|От|до|До|по|По|не|Не|ни|Ни|же|ли|бы)\s+/g,
    '$1$2\u00A0'
  );

  return res;
}

export const formatRussianTypography = formatTypography;

export function extractYear(val?: string | number): number {
  if (!val) return 999999;
  const str = String(val);
  const match = str.match(/\b(\d{4})\b/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(str, 10);
  return isNaN(num) ? 999999 : num;
}

export function getApproximatePageCount(book: { pageCount?: number; fileSize?: number; formattedSize?: string }): number {
  if (book.pageCount && book.pageCount > 0) {
    return book.pageCount;
  }
  if (book.fileSize && book.fileSize > 0) {
    const bytes = book.fileSize;
    const estimatedTextBytes = bytes > 1024 * 1024 ? Math.min(bytes * 0.12 + 200 * 1024, 600 * 1024) : bytes * 0.75;
    return Math.max(1, Math.round(estimatedTextBytes / 1800));
  }
  if (book.formattedSize) {
    const match = book.formattedSize.match(/([\d.]+)\s*([КкMmМмGgГг]?[БbB])/);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      let bytes = val;
      if (unit.startsWith('К') || unit.startsWith('K')) bytes = val * 1024;
      else if (unit.startsWith('М') || unit.startsWith('M')) bytes = val * 1024 * 1024;
      const estimatedTextBytes = bytes > 1024 * 1024 ? Math.min(bytes * 0.12 + 200 * 1024, 600 * 1024) : bytes * 0.75;
      return Math.max(1, Math.round(estimatedTextBytes / 1800));
    }
  }
  return 100;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function estimateReadingTime(pageCount?: number, fileSize?: number): string {
  const pages = pageCount || (fileSize ? Math.max(10, Math.round(fileSize / (1024 * 3))) : 100);
  const minutes = Math.round(pages * 1.5); // ~1.5 min per page
  if (minutes < 60) {
    return `~${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `~${hours} ч ${remMinutes} мин` : `~${hours} ч`;
}

// Genre dictionary for translating internal FB2 tags to readable Russian labels
export const GENRE_MAP: Record<string, string> = {
  prose_classic: 'Классическая проза',
  prose_history: 'Историческая проза',
  prose_contemporary: 'Современная проза',
  prose_rus_classic: 'Русская классика',
  prose_su_classics: 'Советская классика',
  sf: 'Научная фантастика',
  sf_fantasy: 'Фэнтези',
  sf_cyberpunk: 'Киберпанк',
  sf_space: 'Космическая фантастика',
  sf_history: 'Альтернативная история',
  detective: 'Детектив',
  det_classic: 'Классический детектив',
  det_police: 'Полицейский детектив',
  thriller: 'Триллер',
  adventure: 'Приключения',
  adv_history: 'Исторические приключения',
  adv_maritime: 'Морские приключения',
  poetry: 'Поэзия',
  drama: 'Драматургия',
  humor: 'Юмор и сатира',
  antique: 'Античная литература',
  child_classic: 'Детская классика',
  nonfiction: 'Нон-фикшн',
  science: 'Научная литература',
  history: 'История',
  biography: 'Биографии и мемуары',
  philosophy: 'Философия',
  psychology: 'Психология'
};

export function formatGenreName(rawGenre: string): string {
  const normalized = rawGenre.trim().toLowerCase();
  return GENRE_MAP[normalized] || normalized.replace(/_/g, ' ');
}
