'use client';

import React from 'react';
import { BookOpen, RefreshCw, PlusCircle, ExternalLink, Github, Sparkles } from 'lucide-react';
import { RepoStatus } from '@/types/book';

interface HeaderProps {
  repo?: RepoStatus;
  isSyncing: boolean;
  onSync: () => void;
  onOpenAddBook: () => void;
  onOpenCoolRead: () => void;
  lastSyncedText?: string;
}

export function Header({
  repo,
  isSyncing,
  onSync,
  onOpenAddBook,
  onOpenCoolRead,
  lastSyncedText,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#e9e4dc] bg-[#faf8f5]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:py-4">
        {/* Brand & Repo context */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2b2927] text-[#fbfaf8] shadow-sm ring-1 ring-black/5">
            <BookOpen className="h-5 w-5 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold tracking-tight text-[#1c1b18] sm:text-xl">
                lscnsk <span className="text-[#8c857b] font-light">/</span> library
              </span>
              <span className="hidden rounded-full bg-[#eee9e0] px-2 py-0.5 text-[11px] font-medium tracking-wide text-[#615a51] sm:inline-flex">
                Каталог
              </span>
            </div>
            <p className="text-[12px] text-[#787167]">
              Книги репозитория{' '}
              <a
                href={repo?.htmlUrl || 'https://github.com/lscnsk/lscnsk_library'}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#c8c1b5] underline-offset-2 hover:text-[#1c1b18]"
              >
                lscnsk_library
              </a>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* CoolRead Button */}
          <button
            id="header-coolread-btn"
            type="button"
            onClick={onOpenCoolRead}
            className="group flex items-center gap-1.5 rounded-lg border border-[#e2dcd2] bg-[#f2eee7] px-2.5 py-1.5 text-xs font-medium text-[#3b3630] transition-all hover:border-[#cfc6b8] hover:bg-[#eae3d8] sm:px-3 sm:py-2 sm:text-sm"
            title="Интеграция с читалкой Cool_Read"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#b06f2e] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Читалка</span> Cool_Read
          </button>

          {/* Sync Button */}
          <button
            id="header-sync-btn"
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2dcd2] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3b3630] shadow-2xs transition-all hover:bg-[#f6f2ec] active:scale-98 disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
            title={lastSyncedText || 'Проверить обновления в репозитории'}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#6b645b] ${isSyncing ? 'animate-spin text-[#b06f2e]' : ''}`}
            />
            <span className="hidden md:inline">{isSyncing ? 'Синхронизация...' : 'Обновить'}</span>
          </button>

          {/* Add Book CTA */}
          <button
            id="header-add-book-btn"
            type="button"
            onClick={onOpenAddBook}
            className="flex items-center gap-1.5 rounded-lg bg-[#272523] px-3 py-1.5 text-xs font-medium text-[#faf8f5] shadow-xs transition-all hover:bg-[#3d3a37] active:scale-98 sm:px-3.5 sm:py-2 sm:text-sm"
          >
            <PlusCircle className="h-3.5 w-3.5 text-[#dcd7cc]" />
            <span>Закинуть книгу</span>
          </button>

          {/* GitHub link */}
          <a
            id="header-github-link"
            href={repo?.htmlUrl || 'https://github.com/lscnsk/lscnsk_library'}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[#e2dcd2] bg-white text-[#4f4940] transition-colors hover:bg-[#f6f2ec] hover:text-[#1c1b18] md:flex"
            aria-label="GitHub репозиторий"
            title="Открыть репозиторий на GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
