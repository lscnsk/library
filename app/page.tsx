/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BookMetadata, BooksResponse } from '@/types/book';
import { BookCard } from '@/components/BookCard';
import { getLibraryBooks } from '@/lib/githubLibrary';

export default function LibraryCatalogPage() {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected book for transformed view
  const [selectedBook, setSelectedBook] = useState<BookMetadata | null>(null);

  // Load books catalog directly (compatible with GitHub Pages static export)
  const fetchLibrary = useCallback(async (isRefresh = false) => {
    try {
      const data = await getLibraryBooks(isRefresh);
      setBooks(data.books || []);
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

    // Auto-refresh every 60s
    const timer = setInterval(() => {
      fetchLibrary(false);
    }, 60000);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, [fetchLibrary]);

  // Books in the same series as selectedBook (excluding the selected book)
  const seriesOtherBooks = useMemo(() => {
    if (!selectedBook?.series) return [];
    return books
      .filter((b) => b.series === selectedBook.series && b.id !== selectedBook.id)
      .sort((a, b) => {
        const numA = parseInt(String(a.seriesNumber || '0'), 10);
        const numB = parseInt(String(b.seriesNumber || '0'), 10);
        if (!isNaN(numA) && !isNaN(numB) && numA > 0 && numB > 0) {
          return numA - numB;
        }
        return a.title.localeCompare(b.title, 'ru');
      });
  }, [selectedBook, books]);

  // Other books by the same author if book has no series
  const authorOtherBooks = useMemo(() => {
    if (seriesOtherBooks.length > 0 || !selectedBook?.author) return [];
    return books
      .filter((b) => b.author === selectedBook.author && b.id !== selectedBook.id)
      .sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }, [selectedBook, books, seriesOtherBooks.length]);

  return (
    <div className="flex min-h-screen flex-col bg-[#23211f] text-[#fffff0] selection:bg-[#45413e] selection:text-[#fffff0]">
      {/* Main Catalog Body */}
      <main className="flex-1 w-full h-full overflow-y-auto scrollbar-hide px-4 md:px-8 pt-6 sm:pt-8 md:pt-10 pb-16 relative">
        <div className="max-w-6xl mx-auto">
          {/* Subheader: Fixed height and identical margins in both states to ensure zero layout shift */}
          <div className="h-10 mb-6 pb-2 border-b relative flex items-center justify-between border-[#45413e]/30">
            {selectedBook ? (
              <>
                <button
                  id="back-to-catalog-btn"
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-xs font-literata lowercase text-[#a8a29e] hover:text-[#fffff0] transition-colors py-1 px-2 rounded-md hover:bg-[#363330] cursor-pointer active:scale-95"
                  title="back to catalog"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>back to catalog</span>
                </button>

                <span className="lowercase select-none text-center font-literata text-sm md:text-base text-[#a8a29e]/80 tracking-widest truncate max-w-[200px] sm:max-w-md">
                  {selectedBook.series || 'lscnsk'}
                </span>

                <div className="w-32 hidden sm:block" />
              </>
            ) : (
              <>
                <div className="w-32" />
                <span className="lowercase select-none text-center font-literata text-sm md:text-base text-[#a8a29e]/80 tracking-widest">
                  lscnsk
                </span>
                <div className="w-32" />
              </>
            )}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-24 font-literata text-xs tracking-wider text-[#a8a29e] lowercase select-none">
              loading
            </div>
          ) : books.length === 0 ? (
            /* Empty state matching Cool_Read */
            <div className="text-center py-20 space-y-3 font-literata text-[#a8a29e]">
              <p className="text-base">Каталог пуст или обновляется</p>
              <div className="flex justify-center gap-3 items-center pt-1">
                <button
                  type="button"
                  onClick={() => fetchLibrary(true)}
                  className="text-xs px-3 py-1 rounded-md border border-stone-700 text-[#d6d3d1] hover:bg-stone-800 transition-all cursor-pointer"
                >
                  Проверить репозиторий
                </button>
              </div>
            </div>
          ) : selectedBook ? (
            /* Transformed View: Card of selected book at the exact same vertical level + continuous series cards scroll */
            <div className="space-y-8 animate-fadeIn">
              {/* Primary Open Book Card */}
              <BookCard book={selectedBook} isPrimary />

              {/* Other books in the series rendered as cards in the scroll */}
              {seriesOtherBooks.length > 0 && (
                <div className="pt-4">
                  <div className="mb-6 pb-2 flex items-center justify-between border-b border-[#45413e]/30">
                    <span className="font-literata font-bold text-sm sm:text-base text-[#fffff0]">
                      Книги в серии «{selectedBook.series}»
                    </span>
                    <span className="text-xs font-mono text-[#a8a29e] opacity-60">
                      {seriesOtherBooks.length + 1} в серии
                    </span>
                  </div>

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

              {/* Other books by the same author if book has no series */}
              {!selectedBook.series && authorOtherBooks.length > 0 && (
                <div className="pt-4">
                  <div className="mb-6 pb-2 flex items-center justify-between border-b border-[#45413e]/30">
                    <span className="font-literata font-bold text-sm sm:text-base text-[#fffff0]">
                      Другие книги автора {selectedBook.author}
                    </span>
                    <span className="text-xs font-mono text-[#a8a29e] opacity-60">
                      {authorOtherBooks.length} книг
                    </span>
                  </div>

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
            /* Main Books Panel: Pure covers grid with NO text under the covers */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  id={`book-card-${book.id}`}
                  onClick={() => {
                    setSelectedBook(book);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group cursor-pointer flex flex-col select-none"
                  title={`${book.title} — ${book.author}`}
                >
                  {/* Pure Book Cover Box (No text captions underneath) */}
                  <div className="relative aspect-[1/1.45] w-full rounded-lg bg-gradient-to-br from-[#2a2421] to-[#171412] p-3 flex flex-col justify-between border border-white/10 overflow-hidden shadow-md group-hover:border-[#dfc894]/40 transition-colors book-shadow">
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
                        <div className="text-[10px] uppercase tracking-widest text-[#dfc894] truncate">
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

                    {/* Series Number Badge if present */}
                    {book.seriesNumber && (
                      <div className="absolute top-2 right-2 z-20 rounded-md bg-black/75 backdrop-blur-xs border border-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#dfc894]">
                        #{book.seriesNumber}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
