/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import { BookMetadata, RepoStatus } from '@/types/book';
import {
  X,
  Search,
  BookOpen,
  ExternalLink,
  Download,
  Copy,
  Check,
  Calendar,
  User,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface CoolReadCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookMetadata[];
  repo?: RepoStatus;
  isSyncing?: boolean;
  onSync?: () => void;
  onSelectBook: (book: BookMetadata) => void;
}

type CatalogTab = 'all' | 'chronology' | 'authors' | 'series' | 'coolread';

function extractYear(val?: string | number): number {
  if (!val) return 999999;
  const str = String(val);
  const match = str.match(/\b(\d{4})\b/);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(str, 10);
  return isNaN(num) ? 999999 : num;
}

export function CoolReadCatalogModal({
  isOpen,
  onClose,
  books,
  repo,
  isSyncing = false,
  onSync,
  onSelectBook,
}: CoolReadCatalogModalProps) {
  const [activeTab, setActiveTab] = useState<CatalogTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const coolReadWebUrl = 'https://lscnsk.github.io/Cool_Read/';
  const coolReadRepoUrl = 'https://github.com/lscnsk/Cool_Read';

  // Chronologically sorted books (earliest year to latest year)
  const chronologicalBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const yearA = extractYear(a.year);
      const yearB = extractYear(b.year);
      if (yearA !== yearB) return yearA - yearB;
      return a.title.localeCompare(b.title, 'ru');
    });
  }, [books]);

  // Search filtered books
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return chronologicalBooks;
    const q = searchQuery.toLowerCase().trim();
    return chronologicalBooks.filter((b) => {
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.series && b.series.toLowerCase().includes(q)) ||
        (b.year && String(b.year).includes(q)) ||
        b.genres.some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [chronologicalBooks, searchQuery]);

  // Grouped by Author
  const authorsGrouped = useMemo(() => {
    const map = new Map<string, BookMetadata[]>();
    for (const b of chronologicalBooks) {
      const author = b.author || 'Автор не указан';
      if (!map.has(author)) map.set(author, []);
      map.get(author)!.push(b);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru'));
  }, [chronologicalBooks]);

  // Grouped by Series
  const seriesGrouped = useMemo(() => {
    const map = new Map<string, BookMetadata[]>();
    for (const b of chronologicalBooks) {
      if (b.series) {
        if (!map.has(b.series)) map.set(b.series, []);
        map.get(b.series)!.push(b);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru'));
  }, [chronologicalBooks]);

  // Grouped by Century / Decade or Year
  const yearsGrouped = useMemo(() => {
    const map = new Map<string, BookMetadata[]>();
    for (const b of chronologicalBooks) {
      const y = b.year ? String(b.year) : 'Год не указан';
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(b);
    }
    return Array.from(map.entries());
  }, [chronologicalBooks]);

  const handleCopy = (e: React.MouseEvent, book: BookMetadata) => {
    e.stopPropagation();
    const url = book.downloadUrl || book.rawUrl || book.cdnUrl || '';
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedId(book.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenInCoolRead = (e: React.MouseEvent, book: BookMetadata) => {
    e.stopPropagation();
    // Cool_Read accepts book url or opens reader
    const directUrl = book.rawUrl || book.cdnUrl || book.downloadUrl;
    const target = `${coolReadWebUrl}#url=${encodeURIComponent(directUrl)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="coolread-catalog-modal"
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] rounded-2xl bg-[#23211f] text-[#fffff0] border border-[#45413e] shadow-2xl overflow-hidden font-literata"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#45413e]/70 bg-[#1c1a18]">
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none" role="img" aria-label="Каталог">
              📚
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-literata font-bold text-base sm:text-lg text-[#fffff0]">
                  Каталог Cool_Read
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#363330] text-[#dfc894]">
                  {books.length} {books.length === 1 ? 'книга' : books.length < 5 ? 'книги' : 'книг'}
                </span>
              </div>
              <p className="text-xs text-[#a8a29e] tracking-tight">
                Хронологический каталог & интеграция с читалкой
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#45413e] bg-[#2a2724] text-xs text-[#d6d3d1] hover:text-[#fffff0] hover:bg-[#363330] transition-colors cursor-pointer disabled:opacity-60"
                title="Синхронизировать с GitHub"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#dfc894]' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Обновление...' : 'Обновить'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a8a29e] hover:text-[#fffff0] hover:bg-[#363330] transition-colors cursor-pointer"
              aria-label="Закрыть каталог"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="px-5 pt-3 pb-3 border-b border-[#45413e]/50 bg-[#1e1c1a] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#fffff0] text-[#1c1917] font-semibold'
                  : 'text-[#a8a29e] hover:text-[#fffff0] hover:bg-[#2e2b28]'
              }`}
            >
              Все книги ({books.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chronology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'chronology'
                  ? 'bg-[#fffff0] text-[#1c1917] font-semibold'
                  : 'text-[#a8a29e] hover:text-[#fffff0] hover:bg-[#2e2b28]'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>По годам</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('authors')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'authors'
                  ? 'bg-[#fffff0] text-[#1c1917] font-semibold'
                  : 'text-[#a8a29e] hover:text-[#fffff0] hover:bg-[#2e2b28]'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Авторы ({authorsGrouped.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('series')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'series'
                  ? 'bg-[#fffff0] text-[#1c1917] font-semibold'
                  : 'text-[#a8a29e] hover:text-[#fffff0] hover:bg-[#2e2b28]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Серии ({seriesGrouped.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('coolread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 text-[#dfc894] ${
                activeTab === 'coolread'
                  ? 'bg-[#dfc894] text-[#1c1917] font-semibold'
                  : 'hover:bg-[#2e2b28]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Cool_Read</span>
            </button>
          </div>

          {/* Quick Search */}
          {activeTab !== 'coolread' && (
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, автору, году..."
                className="w-full bg-[#171514] border border-[#45413e] rounded-lg pl-8 pr-3 py-1 text-xs text-[#fffff0] placeholder:text-[#a8a29e]/60 focus:outline-none focus:border-[#dfc894]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#a8a29e] hover:text-[#fffff0]"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: ALL BOOKS (CHRONOLOGICAL) */}
          {activeTab === 'all' && (
            <div className="space-y-3">
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-[#a8a29e] text-xs">
                  Ничего не найдено по запросу «{searchQuery}»
                </div>
              ) : (
                filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => {
                      onSelectBook(book);
                      onClose();
                    }}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#45413e]/40 bg-[#292624]/60 hover:bg-[#33302c] hover:border-[#dfc894]/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Thumbnail without any numbers */}
                      <div className="w-11 h-15 rounded bg-gradient-to-br from-[#38332f] to-[#1e1b19] border border-white/10 shrink-0 overflow-hidden relative shadow">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-[#dfc894]">
                            FB2
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-bold text-sm text-[#fffff0] group-hover:text-[#dfc894] transition-colors truncate">
                            {book.title}
                          </h4>
                          {book.year && (
                            <span className="text-[11px] font-mono text-[#dfc894] shrink-0">
                              ({book.year})
                            </span>
                          )}
                        </div>
                        <p className="text-xs italic text-[#d6d3d1] truncate">{book.author}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#a8a29e]">
                          {book.series && (
                            <span className="text-[#dfc894]/90 truncate max-w-[150px]">
                              {book.series}
                            </span>
                          )}
                          <span>•</span>
                          <span>{book.formattedSize}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenInCoolRead(e, book)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#dfc894] text-[#1c1917] hover:bg-[#edd8a6] text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Открыть в читалке Cool_Read"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>В Cool_Read</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, book)}
                        className="p-1.5 rounded-lg border border-[#45413e] hover:bg-[#3d3a36] text-[#a8a29e] hover:text-[#fffff0] transition-colors"
                        title="Скопировать ссылку на файл"
                      >
                        {copiedId === book.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: CHRONOLOGY / BY YEAR */}
          {activeTab === 'chronology' && (
            <div className="space-y-6">
              {yearsGrouped.map(([year, yearBooks]) => (
                <div key={year} className="space-y-2">
                  <div className="flex items-center gap-2 pb-1 border-b border-[#45413e]/40">
                    <Calendar className="w-3.5 h-3.5 text-[#dfc894]" />
                    <span className="font-bold text-sm text-[#dfc894] font-mono">
                      {year}
                    </span>
                    <span className="text-[11px] text-[#a8a29e]">
                      ({yearBooks.length} {yearBooks.length === 1 ? 'книга' : 'книг'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {yearBooks.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => {
                          onSelectBook(book);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg border border-[#45413e]/40 bg-[#292624]/60 hover:bg-[#33302c] hover:border-[#dfc894]/40 transition-all cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#fffff0] truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] italic text-[#a8a29e] truncate">
                            {book.author}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#dfc894] shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: AUTHORS */}
          {activeTab === 'authors' && (
            <div className="space-y-5">
              {authorsGrouped.map(([author, authorBooks]) => (
                <div key={author} className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-[#45413e]/40">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#dfc894]" />
                      <span className="font-bold text-sm text-[#fffff0]">{author}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#a8a29e]">
                      {authorBooks.length} {authorBooks.length === 1 ? 'книга' : 'книг'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {authorBooks.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => {
                          onSelectBook(book);
                          onClose();
                        }}
                        className="p-2 rounded-md hover:bg-[#33302c] transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="text-[#d6d3d1] hover:text-[#fffff0] truncate">
                          {book.title}
                        </span>
                        {book.year && (
                          <span className="text-[10px] font-mono text-[#dfc894] shrink-0 ml-2">
                            {book.year}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SERIES */}
          {activeTab === 'series' && (
            <div className="space-y-5">
              {seriesGrouped.length === 0 ? (
                <div className="text-center py-12 text-[#a8a29e] text-xs">
                  В каталоге пока нет книг с указанием серий
                </div>
              ) : (
                seriesGrouped.map(([seriesName, sBooks]) => (
                  <div key={seriesName} className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[#45413e]/40">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#dfc894]" />
                        <span className="font-bold text-sm text-[#dfc894]">«{seriesName}»</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#a8a29e]">
                        {sBooks.length} в серии
                      </span>
                    </div>

                    <div className="space-y-1.5 pl-2">
                      {sBooks.map((book) => (
                        <div
                          key={book.id}
                          onClick={() => {
                            onSelectBook(book);
                            onClose();
                          }}
                          className="p-2 rounded-md hover:bg-[#33302c] transition-colors cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <p className="text-[#fffff0] truncate">{book.title}</p>
                            <p className="text-[10px] italic text-[#a8a29e] truncate">
                              {book.author}
                            </p>
                          </div>
                          {book.year && (
                            <span className="text-[10px] font-mono text-[#dfc894] shrink-0 ml-2">
                              {book.year}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: COOL_READ INTEGRATION & ECOSYSTEM */}
          {activeTab === 'coolread' && (
            <div className="space-y-5 text-xs text-[#d6d3d1]">
              <div className="p-4 rounded-xl border border-[#dfc894]/30 bg-[#2a2622] space-y-2">
                <div className="flex items-center gap-2 text-[#dfc894] font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Читалка Cool_Read</span>
                </div>
                <p className="leading-relaxed">
                  Полноценная PWA-читалка для FB2, EPUB и TXT книг с закладками, офлайн-чтением,
                  типографикой и автоматической подгрузкой библиотеки{' '}
                  <span className="text-[#fffff0] font-semibold">lscnsk_library</span>.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href={coolReadWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#dfc894] text-[#1c1917] font-bold flex items-center gap-1.5 hover:bg-[#edd8a6] transition-colors"
                  >
                    <span>Открыть Cool_Read</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={coolReadRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-[#45413e] bg-[#23211f] text-[#fffff0] font-medium flex items-center gap-1.5 hover:bg-[#33302c] transition-colors"
                  >
                    <span>GitHub читалки</span>
                  </a>
                </div>
              </div>

              {/* Ecosystem steps */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#a8a29e]">
                  Возможности связки
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg border border-[#45413e]/40 bg-[#1c1a18]">
                    <span className="font-bold text-[#fffff0] block mb-1">
                      1. Прямая синхронизация
                    </span>
                    <span className="text-[#a8a29e]">
                      Все книги из вашего репозитория мгновенно доступны в каталоге читалки.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#45413e]/40 bg-[#1c1a18]">
                    <span className="font-bold text-[#fffff0] block mb-1">
                      2. Офлайн и закладки
                    </span>
                    <span className="text-[#a8a29e]">
                      Прогресс чтения и сохраненные книги остаются в IndexedDB браузера.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#45413e]/70 bg-[#1c1a18] flex items-center justify-between text-[11px] text-[#a8a29e]">
          <span>
            Репозиторий: <span className="text-[#fffff0]">lscnsk/lscnsk_library</span>
          </span>
          <a
            href={coolReadWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#dfc894] hover:underline flex items-center gap-1"
          >
            <span>Запустить читалку Cool_Read</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
