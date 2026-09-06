/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useMemo, useState } from 'react';
import { BookMetadata } from '@/types/book';

interface BookCardProps {
  book: BookMetadata;
  isPrimary?: boolean;
  onSelect?: (book: BookMetadata) => void;
}

export function BookCard({ book, onSelect }: BookCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Clean description paragraphs matching Cool_Read reader format
  const paragraphs = useMemo(() => {
    if (!book.annotation) return [];
    const raw = book.annotation;
    if (raw.includes('<p>')) {
      const matches = raw.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
      if (matches && matches.length > 0) {
        return matches
          .map((m) => m.replace(/<[^>]+>/g, '').trim())
          .filter((t) => t.length > 0);
      }
    }
    const clean = raw.replace(/<[^>]+>/g, '').trim();
    const split = clean
      .split(/\n\s*\n/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    if (split.length > 0) return split;
    return clean ? [clean] : [];
  }, [book]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const targetUrl = book.rawUrl || book.downloadUrl || book.cdnUrl || '';
      const apiUrl = `/api/download?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(book.filename)}`;

      // Fetch blob to trigger direct device download with proper filename
      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = book.filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.warn('API route download not available, fetching directly via CDN:', err);
      try {
        // Direct jsDelivr CDN fetch (supports CORS for browser blob downloads on GitHub Pages)
        const cdnUrl =
          book.cdnUrl ||
          `https://cdn.jsdelivr.net/gh/lscnsk/lscnsk_library@main/${encodeURIComponent(book.path || book.filename)}`;
        const res = await fetch(cdnUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          a.download = book.filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
          }, 1000);
          return;
        }
      } catch (cdnErr) {
        console.warn('CDN download error:', cdnErr);
      }

      // Final fallback: direct link trigger
      const directUrl = book.downloadUrl || book.rawUrl || book.cdnUrl || '';
      const a = document.createElement('a');
      a.href = directUrl;
      a.download = book.filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 1000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article
      id={`book-article-${book.id}`}
      className="transition-all grid grid-cols-1 sm:grid-cols-[198px_1fr] md:grid-cols-[198px_1fr] lg:grid-cols-[198px_1fr] gap-4 sm:gap-6 md:gap-8 items-start select-none"
    >
      {/* Left Column: Cover & Download Button & Format/Size line */}
      <div className="w-full max-w-[198px] mx-auto sm:mx-0 flex flex-col items-center sm:items-start">
        {/* Cover box - identical dimensions and styling to catalog grid covers */}
        <div
          onClick={() => onSelect && onSelect(book)}
          className={`relative aspect-[1/1.45] w-full rounded-lg bg-gradient-to-br from-[#2a2421] to-[#171412] p-3 flex flex-col justify-between border border-white/10 overflow-hidden shadow-md book-shadow ${
            onSelect ? 'cursor-pointer hover:border-[#dfc894]/50 hover:shadow-2xl transition-all' : ''
          }`}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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

          {/* Series number badge */}
          {book.seriesNumber && (
            <div className="absolute top-2 right-2 z-20 rounded-md bg-black/75 backdrop-blur-xs border border-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#dfc894]">
              #{book.seriesNumber}
            </div>
          )}
        </div>

        {/* Download button and format/size beneath cover */}
        <div className="w-full mt-3 flex flex-col items-center gap-1.5">
          <button
            type="button"
            id={`download-btn-${book.id}`}
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow active:scale-95 bg-[#fffff0] text-[#1c1917] hover:bg-[#e7e5e4] cursor-pointer disabled:opacity-75"
            title={`Скачать ${book.filename}`}
          >
            {isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#1c1917] border-t-transparent rounded-full animate-spin" />
                <span>Загрузка...</span>
              </>
            ) : (
              <>
                <span className="text-xs leading-none">📥</span>
                <span>Download</span>
              </>
            )}
          </button>

          <div className="text-[10px] sm:text-[10.5px] font-mono whitespace-nowrap text-center w-full px-0.5 tracking-tight text-[#a8a29e] opacity-60">
            {(book.format || 'FB2').toUpperCase()} • {book.formattedSize}
            {book.pageCount ? ` • ~ ${book.pageCount} стр.` : ''}
          </div>
        </div>
      </div>

      {/* Right Column: Title, Author (Year), separator, and description */}
      <div className="flex-1 flex flex-col justify-start min-w-0 select-text">
        <h2 className="text-xl md:text-2xl font-literata font-bold leading-snug tracking-wide text-[#fffff0] mb-1">
          {book.title}
        </h2>

        {(book.author || book.year) && (
          <p className="text-sm md:text-base font-literata italic mb-3 text-[#d6d3d1]">
            {book.author}
            {book.year ? ` (${book.year})` : ''}
          </p>
        )}

        {paragraphs.length > 0 && (
          <div className="w-full h-px mb-3 bg-[#45413e]/40" />
        )}

        {paragraphs.length > 0 ? (
          <div className="space-y-3">
            {paragraphs.map((para, idx) => (
              <p
                key={idx}
                className="catalog-annotation-p font-literata text-xs sm:text-[13px] md:text-[13.5px] leading-[1.65] text-justify text-[#d6d3d1]"
                style={{
                  textIndent: 0,
                  textAlign: 'justify',
                  textJustify: 'inter-word',
                  letterSpacing: '-0.015em',
                  wordSpacing: 'normal',
                  hyphens: 'auto',
                  WebkitHyphens: 'auto',
                }}
              >
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="font-literata italic text-xs text-[#8e8780]">
            Описание отсутствует в файле книги
          </p>
        )}
      </div>
    </article>
  );
}
