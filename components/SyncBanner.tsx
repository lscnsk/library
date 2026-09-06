'use client';

import React from 'react';
import { GitBranch, CheckCircle2, RefreshCw, Radio, BookCheck, HardDrive, Info } from 'lucide-react';
import { RepoStatus } from '@/types/book';

interface SyncBannerProps {
  repo?: RepoStatus;
  bookCount: number;
  totalSizeFormatted: string;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSyncGuide: () => void;
}

export function SyncBanner({
  repo,
  bookCount,
  totalSizeFormatted,
  isSyncing,
  onSync,
  onOpenSyncGuide,
}: SyncBannerProps) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'недавно';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'недавно';
    }
  };

  return (
    <div className="border-b border-[#ece7df] bg-[#f5f1eb]/70 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-[#635c52]">
        {/* Left info: branch & sync */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#4f4940]">
            <GitBranch className="h-3.5 w-3.5 text-[#887f71]" />
            <span>lscnsk/lscnsk_library</span>
            <span className="rounded bg-[#eae4da] px-1.5 py-0.2 text-[10px] text-[#554e44]">
              {repo?.branch || 'main'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            <span>
              {isSyncing ? 'Проверка новых коммитов...' : `Синхронизировано в ${formatTime(repo?.lastSyncedAt)}`}
            </span>
          </div>

          {repo?.latestCommitMessage && (
            <div className="hidden max-w-[280px] truncate text-[#787167] lg:inline-block">
              Коммит: <span className="italic">{repo.latestCommitMessage}</span>
            </div>
          )}
        </div>

        {/* Right stats & webhook modal link */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[#4f4940]">
            <span className="inline-flex items-center gap-1 font-medium">
              <BookCheck className="h-3.5 w-3.5 text-[#887f71]" />
              {bookCount} {bookCount === 1 ? 'книга' : bookCount > 1 && bookCount < 5 ? 'книги' : 'книг'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[#6b645b]">
              <HardDrive className="h-3.5 w-3.5 text-[#887f71]" />
              {totalSizeFormatted}
            </span>
          </div>

          <button
            id="sync-guide-btn"
            type="button"
            onClick={onOpenSyncGuide}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-[#7d5c2e] hover:bg-[#eae3d5] hover:text-[#5c421e] transition-colors"
          >
            <Info className="h-3 w-3" />
            <span>Автообновление (Webhook)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
