/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BookMetadata } from '@/types/book';
import { BookCard } from '@/components/BookCard';
import { CatalogSidebar, CatalogFilterState } from '@/components/CatalogSidebar';
import { getLibraryBooks } from '@/lib/githubLibrary';
import { extractYear } from '@/lib/typography';

export default function LibraryCatalogPage() {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  
  // Catalog Sidebar drawer state & filter
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<CatalogFilterState>({ type: 'all' });

  // Selected book for transformed view
  const [selectedBook, setSelectedBook] = useState<BookMetadata | null>(null);

  // Load books catalog directly
  const fetchLibrary = useCallback(async (isRefresh = false) => {
    try {
      const data = await getLibraryBooks(isRefresh);
      setBooks(data.books || []);
      if (data.rateLimited) setRateLimited(true);
    } catch (err) {
      console.warn('Failed to load books catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function loadInitial() {
      try {
        const data = await getLibraryBooks(false);
        if (isSubscribed) {
          setBooks(data.books || []);
          if (data.rateLimited) setRateLimited(true);
        }
      } catch (e) {
        console.warn('Failed to load initial catalog:', e);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    // Auto-refresh periodically
    const timer = setInterval(() => {
      fetchLibrary(false);
    }, 60000);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, [fetchLibrary]);

  // Chronologically sorted books (earliest year to latest year)
  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const yearA = extractYear(a.year);
      const yearB = extractYear(b.year);
      if (yearA !== yearB) return yearA - yearB;
      return a.title.localeCompare(b.title, 'ru');
    });
  }, [books]);

  // Filtered books based on currentFilter from CatalogSidebar
  const filteredBooks = useMemo(() => {
    let list = sortedBooks;

    if (filter.type === 'series' && filter.value) {
      list = list.filter((b) => (b.series || 'Без серии') === filter.value);
    } else if (filter.type === 'author' && filter.value) {
      list = list.filter((b) => b.author === filter.value);
    }

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase().trim();
      list = list.filter((b) => {
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.series && b.series.toLowerCase().includes(q)) ||
          (b.year && String(b.year).includes(q)) ||
          b.genres.some((g) => g.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [sortedBooks, filter]);

  // Active series or author title to display in top panel
  const currentSeriesName = useMemo(() => {
    if (selectedBook) {
      return selectedBook.series || selectedBook.author || null;
    }
    if (filter.type === 'series' && filter.value) {
      return filter.value;
    }
    if (filter.type === 'author' && filter.value) {
      return filter.value;
    }
    return null;
  }, [selectedBook, filter]);

  // Books in the same series as selectedBook (excluding the selected book, sorted chronologically)
  const seriesOtherBooks = useMemo(() => {
    if (!selectedBook?.series) return [];
    return sortedBooks
      .filter((b) => b.series === selectedBook.series && b.id !== selectedBook.id)
      .sort((a, b) => {
        const yearA = extractYear(a.year);
        const yearB = extractYear(b.year);
        if (yearA !== yearB) return yearA - yearB;
        return a.title.localeCompare(b.title, 'ru');
      });
  }, [selectedBook, sortedBooks]);

  // Other books by the same author if book has no series (sorted chronologically)
  const authorOtherBooks = useMemo(() => {
    if (seriesOtherBooks.length > 0 || !selectedBook?.author) return [];
    return sortedBooks
      .filter((b) => b.author === selectedBook.author && b.id !== selectedBook.id)
      .sort((a, b) => {
        const yearA = extractYear(a.year);
        const yearB = extractYear(b.year);
        if (yearA !== yearB) return yearA - yearB;
        return a.title.localeCompare(b.title, 'ru');
      });
  }, [selectedBook, sortedBooks, seriesOtherBooks.length]);

  return (
    <div className="flex min-h-screen flex-col bg-[#23211f] text-[#fffff0] selection:bg-[#45413e] selection:text-[#fffff0]">
      {/* Main Catalog Body */}
      <main className="flex-1 w-full h-full overflow-y-auto scrollbar-hide px-4 md:px-8 pb-16 relative">
        <div className="max-w-5xl mx-auto">
          {/* Header Bar: Left "lscnsk/library[/Series]", Right Back arrow + Catalog emoji buttons */}
          <div className="h-16 sm:h-20 mb-6 sm:mb-8 border-b flex items-center justify-between border-[#45413e]/30 gap-3">
            {/* Left corner: Unified lscnsk/library[/series] title */}
            <div className="flex items-center min-w-0 pr-2 overflow-visible">
              <h1
                id="site-title"
                onClick={() => {
                  setSelectedBook(null);
                  setFilter({ type: 'all' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-2xl sm:text-3xl md:text-4xl font-literata font-bold tracking-normal text-[#fffff0] cursor-pointer select-none flex items-baseline gap-1 py-1"
              >
                <span className="shrink-0 leading-tight">lscnsk/library</span>
                {currentSeriesName && (
                  <span className="text-[#a8a29e] font-normal italic truncate max-w-[180px] sm:max-w-sm md:max-w-md leading-tight">
                    /{currentSeriesName}
                  </span>
                )}
              </h1>
            </div>

            {/* Right corner: Back arrow emoji (⬅️) to the left of Catalog emoji button (🗂️) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(selectedBook || filter.type !== 'all' || filter.searchQuery) && (
                <button
                  id="back-to-catalog-btn"
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    setFilter({ type: 'all' });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-1 flex items-center justify-center text-3xl sm:text-4xl hover:scale-110 active:scale-95 transition-transform cursor-pointer select-none"
                  title="Назад"
                  aria-label="Назад"
                >
                  <span className="inline-block emoji leading-none" role="img" aria-label="Назад">
                    ⬅️
                  </span>
                </button>
              )}

              <button
                id="catalog-sidebar-btn"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 flex items-center justify-center text-3xl sm:text-4xl hover:scale-110 active:scale-95 transition-transform cursor-pointer select-none"
                title="Catalog"
                aria-label="Catalog"
              >
                <span className="inline-block emoji leading-none" role="img" aria-label="Catalog">
                  🗂️
                </span>
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-24 font-literata text-xs tracking-wider text-[#a8a29e] lowercase select-none">
              loading
            </div>
          ) : sortedBooks.length === 0 ? (
            /* Empty state matching Cool_Read */
            <div className="text-center py-20 space-y-3 font-literata text-[#a8a29e]">
              <p className="text-base">{rateLimited ? 'Превышен лимит запросов к GitHub API. Пожалуйста, подождите немного.' : 'Каталог пуст'}</p>
            </div>
          ) : selectedBook ? (
            /* Transformed View: Card of selected book + continuous series cards scroll */
            <div className="space-y-8 animate-fadeIn">
              {/* Primary Open Book Card */}
              <BookCard book={selectedBook} isPrimary />

              {/* Other books in the series rendered directly under a divider line */}
              {seriesOtherBooks.length > 0 && (
                <div className="pt-2">
                  <div className="border-b border-[#45413e]/30 mb-8" />

                  <div className="space-y-8">
                    {seriesOtherBooks.map((otherBook) => (
                      <BookCard
                        key={otherBook.id}
                        book={otherBook}
                        onSelect={(b) => {
                          setSelectedBook(b);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other books by the same author if book has no series directly under a divider line */}
              {!selectedBook.series && authorOtherBooks.length > 0 && (
                <div className="pt-2">
                  <div className="border-b border-[#45413e]/30 mb-8" />

                  <div className="space-y-8">
                    {authorOtherBooks.map((otherBook) => (
                      <BookCard
                        key={otherBook.id}
                        book={otherBook}
                        onSelect={(b) => {
                          setSelectedBook(b);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Main Books Panel: Pure covers grid with NO numbers on covers and sorted chronologically */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  id={`book-card-${book.id}`}
                  onClick={() => {
                    setSelectedBook(book);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group cursor-pointer flex flex-col select-none"
                  title={`${book.title} — ${book.author}${book.year ? ` (${book.year})` : ''}`}
                >
                  {/* Pure Book Cover Box (No numbering, no text captions underneath) */}
                  <div className="relative aspect-[1/1.45] w-full rounded-lg bg-gradient-to-br from-[#2a2421] to-[#171412] p-3 flex flex-col justify-between border border-white/10 overflow-hidden shadow-md group-hover:border-white/30 transition-colors book-shadow">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full flex flex-col justify-between text-[#fffff0] z-10">
                        <div className="text-[10px] uppercase tracking-widest text-[#a8a29e] truncate">
                          {book.series || 'lscnsk'}
                        </div>
                        <div className="my-auto text-center px-1">
                          <h3 className="font-literata font-bold text-xs sm:text-sm leading-snug line-clamp-3 text-[#fffff0]">
                            {book.title}
                          </h3>
                          <p className="font-literata italic text-[11px] opacity-75 text-[#fffff0] mt-1 line-clamp-1">
                            {book.author}
                          </p>
                        </div>
                        <div className="text-right font-mono text-[9px] opacity-60 uppercase text-[#fffff0]">
                          .{book.format}
                        </div>
                      </div>
                    )}

                    {/* Spine reflection overlay */}
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-white/20 via-white/5 to-transparent pointer-events-none z-10" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Table of Contents / Catalog Sidebar Drawer */}
      <CatalogSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        books={sortedBooks}
        currentFilter={filter}
        onSelectFilter={(newFilter) => {
          setFilter(newFilter);
          setSelectedBook(null);
        }}
        onSelectBook={(book) => {
          setSelectedBook(book);
          setFilter({ type: 'all' });
          setIsSidebarOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}


