/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookMetadata } from '@/types/book';
import { CatalogFilterState } from '@/components/CatalogSidebar';
import { formatTypography, getApproximatePageCount } from '@/lib/typography';
import { RefreshCw, Download, Check, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';

interface CatalogViewProps {
  books: BookMetadata[];
  currentFilter: CatalogFilterState;
  onResetFilter: () => void;
  onSelectBook: (book: BookMetadata) => void;
  onOpenReader?: (book: BookMetadata) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function CatalogView({
  books,
  currentFilter,
  onResetFilter,
  onSelectBook,
  onOpenReader,
  isLoading = false,
  onRefresh,
}: CatalogViewProps) {
  const catalogContainerRef = useRef<HTMLDivElement>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (book: BookMetadata) => {
    const directUrl = book.downloadUrl || book.rawUrl || book.cdnUrl;
    if (!directUrl) return;

    setDownloadingIds((prev) => new Set(prev).add(book.id));

    try {
      // Trigger download
      const anchor = document.createElement('a');
      anchor.href = directUrl;
      anchor.download = book.filename || `${book.title}.fb2`;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setDownloadedIds((prev) => new Set(prev).add(book.id));
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(book.id);
        return next;
      });
    }
  };

  // Automatic micro-typography optimization for catalog annotations (from Cool_Read)
  useEffect(() => {
    const container = catalogContainerRef.current;
    if (!container) return;

    let animFrameId: number;
    const optimizeCatalogTypography = () => {
      const paragraphs = Array.from(
        container.querySelectorAll<HTMLElement>('.catalog-annotation-p')
      );
      if (!paragraphs.length) return;

      paragraphs.forEach((p) => {
        const text = p.textContent ? p.textContent.trim() : '';
        if (text.length < 15) return;
      });
    };

    const scheduleOpt = () => {
      cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(optimizeCatalogTypography);
    };

    scheduleOpt();
    window.addEventListener('resize', scheduleOpt);
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', scheduleOpt);
    };
  }, [books, currentFilter]);

  return (
    <div
      ref={catalogContainerRef}
      className="w-full space-y-6"
    >
      {/* Active Filter Banner if filtered */}
      {(currentFilter.type !== 'all' || currentFilter.searchQuery) && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#292624] border border-[#45413e] text-xs font-literata text-[#d6d3d1]">
          <div className="flex items-center gap-2">
            <span className="text-[#dfc894] font-bold">Фильтр:</span>
            <span>
              {currentFilter.type === 'series' && `Серия «${currentFilter.value}»`}
              {currentFilter.type === 'author' && `Автор: ${currentFilter.value}`}
              {currentFilter.searchQuery && `Поиск: «${currentFilter.searchQuery}»`}
            </span>
            <span className="text-[#a8a29e] font-mono text-[11px]">
              ({books.length} {books.length === 1 ? 'книга' : 'книг'})
            </span>
          </div>

          <button
            type="button"
            onClick={onResetFilter}
            className="px-2.5 py-1 rounded-md bg-[#363330] hover:bg-[#45413e] text-[#fffff0] text-xs transition-colors cursor-pointer"
          >
            Сбросить фильтр ✕
          </button>
        </div>
      )}

      {/* Empty State */}
      {books.length === 0 && (
        <div className="text-center py-20 space-y-3 font-literata text-[#a8a29e]">
          {isLoading ? (
            <div className="py-8 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-t-transparent border-[#dfc894] rounded-full animate-spin" />
            </div>
          ) : currentFilter.searchQuery || currentFilter.value ? (
            <div className="py-4 space-y-2">
              <p className="text-base font-medium text-[#fffff0]">Ничего не найдено</p>
              <button
                type="button"
                onClick={onResetFilter}
                className="text-xs text-[#dfc894] underline hover:text-[#fffff0] cursor-pointer"
              >
                Показать весь каталог
              </button>
            </div>
          ) : (
            <div className="py-4 space-y-2">
              <p className="text-base">Каталог пуст или обновляется</p>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="px-3 py-1.5 rounded-lg border border-[#45413e] text-xs text-[#dfc894] hover:bg-[#363330] cursor-pointer"
                >
                  Обновить каталог
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Book Articles (Exact Cool_Read Two-Column Layout) */}
      <div className="space-y-6 sm:space-y-8">
        {books.map((book) => {
          const isDownloading = downloadingIds.has(book.id);
          const isDownloaded = downloadedIds.has(book.id);
          const approxPages = getApproximatePageCount(book);

          const paragraphs = book.annotation
            ? book.annotation
                .split(/\n+/)
                .map((p) => p.trim())
                .filter(Boolean)
            : [];

          return (
            <article
              key={book.id}
              id={`catalog-book-${book.id}`}
              className="group flex flex-col sm:flex-row gap-5 md:gap-7 p-4 sm:p-6 rounded-2xl border border-[#45413e]/40 bg-[#292624]/40 hover:bg-[#292624]/70 hover:border-[#dfc894]/40 transition-all duration-300"
            >
              {/* COLUMN 1: 3D COVER & ACTION BUTTONS */}
              <div className="flex flex-col items-center sm:items-start shrink-0 w-full sm:w-44 md:w-48">
                {/* Book Cover (No numbering!) */}
                <div
                  onClick={() => onSelectBook(book)}
                  className="relative aspect-[1/1.45] w-36 sm:w-full rounded-lg bg-gradient-to-br from-[#2a2421] to-[#171412] p-3 flex flex-col justify-between border border-white/10 overflow-hidden shadow-md group-hover:border-[#dfc894]/40 transition-all cursor-pointer book-shadow"
                >
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      {/* Cover Header */}
                      <div className="text-center border-b border-white/10 pb-1.5 font-literata text-[10px] sm:text-[11px] text-[#dfc894]/90 uppercase tracking-widest truncate">
                        {book.series || 'lscnsk library'}
                      </div>

                      {/* Cover Body */}
                      <div className="my-auto text-center py-2">
                        <h3 className="font-literata font-bold text-xs sm:text-sm text-[#fffff0] line-clamp-3 mb-1 leading-snug">
                          {book.title}
                        </h3>
                        <p className="font-literata italic text-[11px] sm:text-xs opacity-75 text-[#fffff0]">
                          {book.author}
                        </p>
                      </div>

                      {/* Cover Footer */}
                      <div className="text-center border-t border-white/10 pt-1.5 flex items-center justify-center font-mono text-[9px] opacity-60 text-[#fffff0]">
                        <span className="font-bold tracking-widest uppercase">lscnsk</span>
                      </div>
                    </>
                  )}

                  {/* Spine lighting overlay */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-white/20 via-white/5 to-transparent pointer-events-none z-10" />
                </div>

                {/* Actions below cover */}
                <div className="w-36 sm:w-full mt-3.5 flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5 w-full">
                    {/* Primary Action Button */}
                    <button
                      type="button"
                      onClick={() => handleDownload(book)}
                      disabled={isDownloading}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer ${
                        isDownloaded
                          ? 'bg-[#363330] border border-[#45413e] text-[#a8a29e]'
                          : isDownloading
                          ? 'bg-white/80 text-stone-600 border border-stone-300 cursor-wait'
                          : 'bg-[#fffff0] text-[#1c1917] hover:bg-[#dfc894]'
                      }`}
                      title="Скачать файл книги"
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
                          <span className="text-[11px]">Загрузка...</span>
                        </>
                      ) : isDownloaded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px]">Скачано</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Скачать</span>
                        </>
                      )}
                    </button>

                    {/* Quick View / Read Button */}
                    <button
                      type="button"
                      onClick={() => onSelectBook(book)}
                      className="p-1.5 rounded-lg border border-[#45413e] bg-[#23211f] hover:bg-[#363330] text-[#dfc894] hover:text-[#fffff0] transition-colors cursor-pointer"
                      title="Подробнее о книге"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Format & Details Badge */}
                  <div
                    className="text-[10px] font-mono whitespace-nowrap flex items-center justify-center text-center w-full text-[#a8a29e] opacity-70"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {(book.format || 'FB2').toUpperCase()} • {book.formattedSize}
                    {approxPages > 0 ? ` • ~ ${approxPages} стр.` : ''} • 16+
                  </div>
                </div>
              </div>

              {/* COLUMN 2: METADATA & TYPOGRAPHIC ANNOTATION */}
              <div className="flex-1 flex flex-col justify-start min-w-0">
                {/* Title */}
                <h2
                  onClick={() => onSelectBook(book)}
                  className="text-xl md:text-2xl font-literata font-bold leading-snug tracking-wide text-[#fffff0] hover:text-[#dfc894] transition-colors cursor-pointer mb-1"
                >
                  {book.title}
                </h2>

                {/* Author with Year */}
                {(book.author || book.year) && (
                  <p className="text-sm md:text-base font-literata italic text-[#d6d3d1] mb-3">
                    {book.author}
                    {book.year ? ` (${book.year})` : ''}
                  </p>
                )}

                {/* Subtle Divider */}
                {paragraphs.length > 0 && (
                  <div className="w-full h-px mb-3 bg-[#45413e]/40" />
                )}

                {/* Annotation with Paragraph Indents & Micro-typography */}
                {paragraphs.length > 0 ? (
                  <div className="space-y-1">
                    {paragraphs.map((paragraph, pIdx) => (
                      <p
                        key={pIdx}
                        className="catalog-annotation-p font-literata text-xs sm:text-[13px] md:text-[13.5px] leading-[1.65] text-justify select-text text-[#d6d3d1]"
                        style={{
                          textIndent: pIdx === 0 ? 0 : '1.25em',
                          textAlign: 'justify',
                          textJustify: 'inter-word',
                          letterSpacing: '-0.015em',
                          wordSpacing: 'normal',
                          hyphens: 'auto',
                          WebkitHyphens: 'auto',
                        }}
                      >
                        {formatTypography(paragraph)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="font-literata italic text-xs text-[#a8a29e]/70">
                    Аннотация отсутствует в метаданных издания.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
