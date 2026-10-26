// Read at build time: the list of books, for one page per book (/book/<id>/) whose
// title, description and cover show up as a preview when the link is shared.
export type CatalogEntry = { id: string; title: string; author: string; year?: string; description?: string; coverUrl?: string };

const CATALOG_URL = 'https://raw.githubusercontent.com/lscnsk/lscnsk_library/main/catalog.json';

let cached: Promise<CatalogEntry[]> | null = null;

export function loadCatalog(): Promise<CatalogEntry[]> {
  cached ??= fetch(CATALOG_URL, { cache: 'force-cache' })
    .then((r) => (r.ok ? r.json() : { books: [] }))
    .then((d) => (Array.isArray(d?.books) ? d.books : []))
    .catch(() => []);
  return cached;
}
