'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Minus, X } from 'lucide-react';
import { BookMetadata } from '@/types/book';

export interface CatalogSeriesItem {
  id: string;
  name: string;
  authors: string[];
}

export interface CatalogFilterState {
  type: 'all' | 'series' | 'author';
  value?: string;
  searchQuery?: string;
}

interface CatalogSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookMetadata[];
  currentFilter: CatalogFilterState;
  onSelectFilter: (filter: CatalogFilterState) => void;
  onSelectBook?: (book: BookMetadata) => void;
}

export function CatalogSidebar({
  isOpen,
  onClose,
  books,
  currentFilter,
  onSelectFilter,
  onSelectBook,
}: CatalogSidebarProps) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentFilter.searchQuery || '');

  // Extract series with unique authors and count from books list
  const seriesList = useMemo<CatalogSeriesItem[]>(() => {
    const map = new Map<string, Set<string>>();
    books.forEach((book) => {
      const seriesName = book.series ? book.series.trim() : 'Без серии';
      if (!map.has(seriesName)) {
        map.set(seriesName, new Set());
      }
      if (book.author) {
        map.get(seriesName)!.add(book.author.trim());
      }
    });

    return Array.from(map.entries())
      .map(([name, authorsSet]) => ({
        id: name,
        name,
        authors: Array.from(authorsSet),
      }))
      .sort((a, b) => {
        if (a.name === 'Без серии') return 1;
        if (b.name === 'Без серии') return -1;
        return a.name.localeCompare(b.name, 'ru');
      });
  }, [books]);

  // Collapsed series set (default all expanded)
  const [collapsedSeries, setCollapsedSeries] = useState<Set<string>>(new Set());

  const toggleSeriesExpand = (seriesName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesName)) {
        next.delete(seriesName);
      } else {
        next.add(seriesName);
      }
      return next;
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Matched search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedBooks = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.series && b.series.toLowerCase().includes(q)) ||
        (b.year && String(b.year).includes(q)) ||
        b.genres.some((g) => g.toLowerCase().includes(q))
    );

    const matchedSeries = seriesList.filter(
      (s) => s.name !== 'Без серии' && s.name.toLowerCase().includes(q)
    );

    const authorSet = new Set<string>();
    books.forEach((b) => {
      if (b.author && b.author.toLowerCase().includes(q)) {
        authorSet.add(b.author);
      }
    });
    const matchedAuthors = Array.from(authorSet);

    return {
      books: matchedBooks,
      series: matchedSeries,
      authors: matchedAuthors,
      total: matchedBooks.length + matchedSeries.length + matchedAuthors.length,
    };
  }, [books, seriesList, searchQuery]);

  const isRootActive = currentFilter.type === 'all' && !currentFilter.searchQuery;

  const getItemClass = (isActive: boolean) => {
    if (isActive) {
      return 'bg-[#45413e] text-[#fffff0] shadow-sm border border-[#57534e]';
    }
    return 'text-[#d6d3d1] hover:bg-[#363330] hover:text-[#fffff0] border border-transparent';
  };

  const getChevronClass = (isExp: boolean) => {
    return isExp
      ? 'text-[#fffff0] hover:bg-[#363330]'
      : 'text-[#888] hover:text-[#fffff0] hover:bg-[#363330]';
  };

  const getConnectorClass = () => {
    return 'pl-4 border-l border-[#45413e]/40 ml-4 my-1';
  };

  // Escape key handler to close sidebar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="catalog-sidebar"
        className="w-full max-w-sm sm:max-w-md h-full bg-[#23211f] text-[#fffff0] border-l border-[#45413e] flex flex-col shadow-2xl overflow-hidden font-literata animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Styled exactly as ChapterSidebar in Cool_Read */}
        <div className="h-16 sm:h-20 px-4 sm:px-6 border-b border-[#45413e] flex items-center justify-between shrink-0 bg-[#1c1a18]">
          {isSearchMode ? (
            <div className="flex items-center gap-2 w-full">
              <span className="p-1.5 text-2xl leading-none shrink-0 flex items-center justify-center select-none emoji" role="img" aria-label="Search">
                🔍
              </span>
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="search"
                  autoFocus
                  className="w-full h-9 bg-[#363330] border border-[#45413e] focus:border-[#777] rounded-lg pl-3 pr-8 text-sm text-[#fffff0] placeholder:text-[#a8a29e] focus:outline-none transition-colors leading-snug [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-1 text-[#a8a29e] hover:text-[#fffff0] transition-colors rounded cursor-pointer flex items-center justify-center"
                    title="Clear"
                    aria-label="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSearchMode(false);
                  setSearchQuery('');
                  onSelectFilter({ type: 'all' });
                }}
                className="p-1.5 text-2xl leading-none hover:scale-110 active:scale-95 transition-transform shrink-0 cursor-pointer flex items-center justify-center"
                title="Close"
                aria-label="Close"
              >
                <span className="emoji leading-none select-none" role="img" aria-label="Close">
                  ❌
                </span>
              </button>
            </div>
          ) : (
            <>
              <h2 className="flex items-center gap-3 text-[#fffff0] min-w-0 flex-1 py-1">
                <span className="text-3xl leading-none shrink-0 emoji select-none" role="img" aria-label="Catalog">
                  🗂️
                </span>
                <span className="font-literata font-bold text-2xl tracking-wide leading-normal overflow-visible select-none">
                  Catalog
                </span>
              </h2>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSearchMode(true)}
                  className="p-1.5 text-2xl leading-none hover:scale-110 active:scale-95 transition-transform shrink-0 cursor-pointer flex items-center justify-center"
                  title="Search"
                  aria-label="Search"
                >
                  <span className="emoji leading-none select-none" role="img" aria-label="Search">
                    🔍
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-2xl leading-none hover:scale-110 active:scale-95 transition-transform shrink-0 cursor-pointer flex items-center justify-center"
                  title="Close"
                  aria-label="Close"
                >
                  <span className="emoji leading-none select-none" role="img" aria-label="Close">
                    ❌
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Tree & Search Results - Styled as ChapterSidebar in Cool_Read */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide select-none space-y-1">
          {isSearchMode && searchQuery.trim() ? (
            /* SEARCH RESULTS VIEW */
            <div className="space-y-4 pt-1">
              {searchResults && searchResults.total === 0 && (
                <div className="py-10 text-center text-xs text-[#a8a29e] font-literata italic">
                  nothing
                </div>
              )}

              {/* Matched Books */}
              {searchResults && searchResults.books.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#a8a29e] uppercase tracking-wider font-mono">
                    BOOKS ({searchResults.books.length})
                  </div>
                  {searchResults.books.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => {
                        if (onSelectBook) {
                          onSelectBook(book);
                        } else {
                          onSelectFilter({ type: 'all', searchQuery: book.title });
                        }
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-start gap-3 hover:bg-[#363330] text-[#d6d3d1] hover:text-[#fffff0] cursor-pointer group border border-transparent hover:border-[#45413e]/40"
                    >
                      <span className="text-sm shrink-0 pt-0.5 select-none" role="img" aria-label="Book">📖</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-literata font-medium text-xs text-[#fffff0] leading-snug group-hover:underline group-hover:text-[#fff]">
                          {book.title}
                        </div>
                        <div className="text-[11px] text-[#a8a29e] truncate mt-0.5">
                          {book.author}
                          {book.series ? ` • ${book.series}` : ''}
                          {book.year ? ` (${book.year})` : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Matched Series */}
              {searchResults && searchResults.series.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-[#45413e]/30">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#a8a29e] uppercase tracking-wider font-mono">
                    SERIES ({searchResults.series.length})
                  </div>
                  {searchResults.series.map((series) => (
                    <button
                      key={series.id}
                      type="button"
                      onClick={() => {
                        onSelectFilter({ type: 'series', value: series.name });
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2.5 hover:bg-[#363330] text-[#d6d3d1] hover:text-[#fffff0] cursor-pointer group border border-transparent hover:border-[#45413e]/40"
                    >
                      <span className="text-xs shrink-0 text-[#fffff0] opacity-60 group-hover:opacity-100">🔖</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-literata font-medium text-xs text-[#fffff0] truncate">
                          {series.name}
                        </div>
                        {series.authors.length > 0 && (
                          <div className="text-[11px] text-[#a8a29e] truncate mt-0.5">
                            {series.authors.join(', ')}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Matched Authors */}
              {searchResults && searchResults.authors.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-[#45413e]/30">
                  <div className="px-2 py-1 text-[11px] font-bold text-[#a8a29e] uppercase tracking-wider font-mono">
                    AUTHORS ({searchResults.authors.length})
                  </div>
                  {searchResults.authors.map((author) => (
                    <button
                      key={author}
                      type="button"
                      onClick={() => {
                        onSelectFilter({ type: 'author', value: author });
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2.5 hover:bg-[#363330] text-[#d6d3d1] hover:text-[#fffff0] cursor-pointer group border border-transparent hover:border-[#45413e]/40"
                    >
                      <span className="text-sm shrink-0 select-none" role="img" aria-label="Author">✍️</span>
                      <div className="font-literata italic text-xs text-[#fffff0] truncate flex-1">
                        {author}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* STANDARD HIERARCHY TREE */
            <>
              {/* ROOT LEVEL: lscnsk (Shows all books) */}
              <div className="select-none">
                <button
                  type="button"
                  onClick={() => {
                    onSelectFilter({ type: 'all' });
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2.5 cursor-pointer ${getItemClass(
                    isRootActive
                  )}`}
                >
                  <span className={`text-xs shrink-0 ${isRootActive ? 'text-[#fffff0]' : 'opacity-30'}`}>
                    {isRootActive ? '🔖' : <Minus size={12} />}
                  </span>
                  <span className="font-literata font-bold text-xs tracking-wider flex-1">
                    lscnsk
                  </span>
                </button>
              </div>

              {/* LEVEL 1: SERIES */}
              <div className="pt-1 space-y-1">
                {seriesList.map((series) => {
                  const isSeriesActive =
                    currentFilter.type === 'series' && currentFilter.value === series.name;
                  const isExpanded = !collapsedSeries.has(series.name);
                  const hasChildren = series.authors && series.authors.length > 0;

                  return (
                    <div key={series.id} className="select-none">
                      <div className="flex items-stretch gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectFilter({ type: 'series', value: series.name });
                            onClose();
                          }}
                          className={`flex-1 text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2.5 overflow-hidden cursor-pointer ${getItemClass(
                            isSeriesActive
                          )}`}
                        >
                          <span
                            className={`text-xs shrink-0 ${
                              isSeriesActive ? 'text-[#fffff0]' : 'opacity-30'
                            }`}
                          >
                            {isSeriesActive ? '🔖' : <Minus size={12} />}
                          </span>
                          <span className="flex-1 text-xs leading-snug line-clamp-1 break-words font-medium">
                            {series.name}
                          </span>
                        </button>

                        {hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => toggleSeriesExpand(series.name, e)}
                            className={`px-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${getChevronClass(
                              isExpanded
                            )}`}
                            title={isExpanded ? 'Свернуть' : 'Развернуть'}
                          >
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        )}
                      </div>

                      {/* LEVEL 2: AUTHORS (Nested under Series) */}
                      {hasChildren && isExpanded && (
                        <div className={getConnectorClass()}>
                          <div className="space-y-0.5">
                            {series.authors.map((author) => {
                              const isAuthorActive =
                                currentFilter.type === 'author' &&
                                currentFilter.value === author;

                              return (
                                <button
                                  key={author}
                                  type="button"
                                  onClick={() => {
                                    onSelectFilter({ type: 'author', value: author });
                                    onClose();
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center gap-2 cursor-pointer ${getItemClass(
                                    isAuthorActive
                                  )}`}
                                >
                                  <span
                                    className={`text-xs shrink-0 ${
                                      isAuthorActive ? 'text-[#fffff0]' : 'opacity-30'
                                    }`}
                                  >
                                    {isAuthorActive ? '🔖' : <Minus size={10} />}
                                  </span>
                                  <span className="font-literata italic text-xs tracking-wide flex-1 truncate">
                                    {author}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
