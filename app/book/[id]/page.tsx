import type { Metadata } from 'next';
import { LibraryCatalog } from '@/components/LibraryCatalog';
import { loadCatalog } from '@/lib/catalogServer';

export const dynamicParams = false;

export async function generateStaticParams() {
  const books = await loadCatalog();
  // A static export needs at least one page here
  return books.length ? books.map((b) => ({ id: b.id })) : [{ id: '_' }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const book = (await loadCatalog()).find((b) => b.id === id);
  if (!book) return { title: 'lscnsk/library' };
  const title = `${book.title} — ${book.author}`;
  const description = (book.description || '').split('\n')[0].slice(0, 300);
  const images = book.coverUrl ? [{ url: book.coverUrl }] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, type: 'book', siteName: 'lscnsk/library', images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: book.coverUrl ? [book.coverUrl] : undefined },
  };
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LibraryCatalog initialBookId={id} />;
}
