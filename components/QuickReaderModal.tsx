'use client';

import React, { useState, useEffect } from 'react';
import { BookMetadata, BookPreviewData } from '@/types/book';
import {
  X,
  Sparkles,
  Type,
  Sun,
  Moon,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface QuickReaderModalProps {
  book: BookMetadata | null;
  onClose: () => void;
  onOpenCoolRead: (book: BookMetadata) => void;
}

type ReaderTheme = 'paper' | 'light' | 'sepia' | 'dark';

export function QuickReaderModal({
  book,
  onClose,
  onOpenCoolRead,
}: QuickReaderModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BookPreviewData | null>(null);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState<number>(18);
  const [theme, setTheme] = useState<ReaderTheme>('dark');
  const [isTocOpen, setIsTocOpen] = useState(false);

  useEffect(() => {
    if (!book) return;

    let isMounted = true;

    const fetchPreview = async () => {
      try {
        const url = `/api/book-preview?url=${encodeURIComponent(book.rawUrl)}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Ошибка загрузки текста книги (${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          setPreview(data);
          setLoading(false);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Не удалось открыть книгу для чтения');
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [book]);

  if (!book) return null;

  const currentChapter = preview?.chapters[currentChapterIdx];

  // Theme styling definitions
  const themeStyles: Record<
    ReaderTheme,
    { bg: string; text: string; bar: string; border: string; activeTab: string }
  > = {
    paper: {
      bg: 'bg-[#faf7f0]',
      text: 'text-[#2a2723]',
      bar: 'bg-[#f2ece1]',
      border: 'border-[#e5ded0]',
      activeTab: 'bg-[#e8e0cf]',
    },
    light: {
      bg: 'bg-white',
      text: 'text-[#1c1b18]',
      bar: 'bg-[#f7f5f2]',
      border: 'border-[#eae5dd]',
      activeTab: 'bg-[#eae4da]',
    },
    sepia: {
      bg: 'bg-[#f4ecd8]',
      text: 'text-[#433522]',
      bar: 'bg-[#e8deca]',
      border: 'border-[#dad0ba]',
      activeTab: 'bg-[#dfd3bc]',
    },
    dark: {
      bg: 'bg-[#23211f]',
      text: 'text-[#fffff0]',
      bar: 'bg-[#2c2a28]',
      border: 'border-[#45413e]',
      activeTab: 'bg-[#363330]',
    },
  };

  const currentStyle = themeStyles[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        id="quick-reader-container"
        className={`relative flex h-full w-full max-w-4xl flex-col overflow-hidden sm:h-[94vh] sm:rounded-2xl sm:border ${currentStyle.border} ${currentStyle.bg} shadow-2xl transition-colors duration-200`}
      >
        {/* Top Control Bar */}
        <div
          className={`flex items-center justify-between border-b ${currentStyle.border} ${currentStyle.bar} px-4 py-3 transition-colors`}
        >
          {/* Left: Book title & TOC button */}
          <div className="flex items-center gap-3 min-w-0">
            {preview?.chapters && preview.chapters.length > 1 && (
              <button
                type="button"
                onClick={() => setIsTocOpen(!isTocOpen)}
                className={`flex items-center gap-1.5 rounded-lg border ${currentStyle.border} px-2.5 py-1.5 text-xs font-medium ${currentStyle.text} transition-colors hover:opacity-80`}
                title="Оглавление"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Оглавление</span>
              </button>
            )}

            <div className="min-w-0">
              <h3 className={`font-serif text-sm font-bold truncate ${currentStyle.text}`}>
                {book.title}
              </h3>
              <p className="text-xs opacity-75 truncate">{book.author}</p>
            </div>
          </div>

          {/* Right: Font size, themes, and close */}
          <div className="flex items-center gap-2">
            {/* Font size toggles */}
            <div className={`hidden sm:flex items-center rounded-lg border ${currentStyle.border} p-0.5`}>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className={`px-2 py-1 text-xs font-bold ${currentStyle.text} opacity-75 hover:opacity-100`}
                title="Уменьшить шрифт"
              >
                A-
              </button>
              <span className={`px-1 text-[11px] font-mono ${currentStyle.text} opacity-60`}>
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(26, s + 2))}
                className={`px-2 py-1 text-xs font-bold ${currentStyle.text} opacity-75 hover:opacity-100`}
                title="Увеличить шрифт"
              >
                A+
              </button>
            </div>

            {/* Theme switcher */}
            <div className={`flex items-center rounded-lg border ${currentStyle.border} p-0.5 text-xs`}>
              <button
                type="button"
                onClick={() => setTheme('paper')}
                className={`rounded px-2 py-1 ${theme === 'paper' ? currentStyle.activeTab : ''} transition-colors`}
                title="Бумага (Комфортный)"
              >
                Бумага
              </button>
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={`rounded px-2 py-1 ${theme === 'sepia' ? currentStyle.activeTab : ''} transition-colors`}
                title="Сепия"
              >
                Сепия
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`rounded px-2 py-1 ${theme === 'dark' ? currentStyle.activeTab : ''} transition-colors`}
                title="Ночь"
              >
                Ночь
              </button>
            </div>

            {/* CoolRead Button */}
            <button
              type="button"
              onClick={() => onOpenCoolRead(book)}
              className="flex items-center gap-1 rounded-lg bg-[#b06f2e] px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#975d24] transition-all"
              title="Открыть читалку Cool_Read"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden md:inline">В Cool_Read</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg p-1.5 ${currentStyle.text} opacity-70 hover:opacity-100 transition-opacity`}
              aria-label="Закрыть читалку"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Reader Content Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Table of contents slide-over drawer */}
          {isTocOpen && preview?.chapters && (
            <div
              className={`absolute inset-y-0 left-0 z-20 w-72 max-w-[85vw] border-r ${currentStyle.border} ${currentStyle.bar} p-4 shadow-xl overflow-y-auto transition-transform`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/10">
                <span className={`font-serif text-sm font-bold ${currentStyle.text}`}>
                  Оглавление
                </span>
                <button
                  type="button"
                  onClick={() => setIsTocOpen(false)}
                  className="rounded p-1 opacity-60 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-1">
                {preview.chapters.map((ch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentChapterIdx(idx);
                      setIsTocOpen(false);
                    }}
                    className={`w-full text-left rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                      idx === currentChapterIdx
                        ? `${currentStyle.activeTab} font-semibold`
                        : 'hover:opacity-80'
                    }`}
                  >
                    <span className="opacity-60 mr-1.5">{idx + 1}.</span>
                    <span>{ch.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reading text viewport */}
          <div className="h-full overflow-y-auto px-5 py-8 sm:px-12 md:px-16 scroll-smooth">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm opacity-60">
                <Loader2 className="h-7 w-7 animate-spin text-[#b06f2e]" />
                <p>Загрузка и парсинг текста книги...</p>
              </div>
            ) : error ? (
              <div className="mx-auto my-auto max-w-md text-center py-16">
                <p className="text-sm text-red-500 mb-3">{error}</p>
                <p className="text-xs opacity-75 mb-5">
                  Вы можете скачать файл книги напрямую или открыть её в читалке Cool_Read.
                </p>
                <div className="flex justify-center gap-3">
                  <a
                    href={book.downloadUrl}
                    download={book.filename}
                    className="rounded-lg bg-[#272523] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Скачать файл
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenCoolRead(book)}
                    className="rounded-lg bg-[#b06f2e] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Открыть в Cool_Read
                  </button>
                </div>
              </div>
            ) : currentChapter ? (
              <div className="mx-auto max-w-2xl pb-16">
                {/* Chapter Title */}
                <h2 className={`font-serif text-2xl font-bold mb-6 pb-2 border-b ${currentStyle.border} ${currentStyle.text}`}>
                  {currentChapter.title}
                </h2>

                {/* Paragraphs with custom font size */}
                <div
                  className="font-serif leading-relaxed space-y-4"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
                >
                  {currentChapter.content.map((p, i) => (
                    <p key={i} className="text-justify indent-6">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center opacity-60">
                Нет доступных глав для предпросмотра
              </div>
            )}
          </div>
        </div>

        {/* Bottom Chapter Navigation Bar */}
        {preview?.chapters && preview.chapters.length > 0 && (
          <div
            className={`flex items-center justify-between border-t ${currentStyle.border} ${currentStyle.bar} px-4 py-2.5 text-xs ${currentStyle.text}`}
          >
            <button
              type="button"
              disabled={currentChapterIdx <= 0}
              onClick={() => setCurrentChapterIdx((i) => Math.max(0, i - 1))}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium disabled:opacity-30 hover:opacity-80 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Предыдущая глава</span>
            </button>

            <span className="font-mono text-[11px] opacity-75">
              Глава {currentChapterIdx + 1} из {preview.chapters.length}
            </span>

            <button
              type="button"
              disabled={currentChapterIdx >= preview.chapters.length - 1}
              onClick={() =>
                setCurrentChapterIdx((i) =>
                  Math.min(preview.chapters.length - 1, i + 1)
                )
              }
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium disabled:opacity-30 hover:opacity-80 transition-opacity"
            >
              <span>Следующая глава</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
