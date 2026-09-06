/**
 * Typography helper for bookish editorial text formatting:
 * - Proper Russian guillemets « »
 * - Em-dash (—) instead of hyphens
 * - Non-breaking spaces (&nbsp; or \u00A0) after short prepositions and conjunctions
 */

export function formatRussianTypography(text: string): string {
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
