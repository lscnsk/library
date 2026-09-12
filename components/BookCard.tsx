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
      const targetUrls = [
        book.cdnUrl,
        book.rawUrl,
        book.downloadUrl
      ].filter(Boolean) as string[];

      let downloaded = false;

      for (const url of targetUrls) {
        try {
          const res = await fetch(url);
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
            downloaded = true;
            break;
          }
        } catch {
          // try next URL
        }
      }

      if (!downloaded) {
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
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article
      id={`book-article-${book.id}`}
      className="transition-all grid grid-cols-1 sm:grid-cols-[180px_1fr] md:grid-cols-[180px_1fr] lg:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start select-none"
    >
      {/* Left Column: Cover & Download Button & Format/Size line */}
      <div className="w-[180px] max-w-full mx-auto sm:mx-0 flex flex-col items-center sm:items-start shrink-0">
        {/* Cover box - identical dimensions and styling to catalog grid covers */}
        <div
          onClick={() => onSelect && onSelect(book)}
          className={`relative aspect-[1/1.45] w-full rounded-lg bg-gradient-to-br from-[#2a2421] to-[#171412] p-3 flex flex-col justify-between border border-white/10 overflow-hidden shadow-md book-shadow ${
            onSelect ? 'cursor-pointer hover:border-white/30 transition-colors' : ''
          }`}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-cover"
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

        {/* Download button and format/size beneath cover */}
        <div className="w-full mt-3 flex flex-col items-center gap-1.5">
          <button
            type="button"
            id={`download-btn-${book.id}`}
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-white text-stone-900 border border-stone-200 hover:bg-stone-100 cursor-pointer disabled:opacity-75"
            title={`Download ${book.filename}`}
          >
            {isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
                <span>Downloading...</span>
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
