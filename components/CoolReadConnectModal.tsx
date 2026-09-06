'use client';

import React, { useState } from 'react';
import { BookMetadata } from '@/types/book';
import {
  X,
  Sparkles,
  ExternalLink,
  BookOpen,
  Download,
  Copy,
  Check,
  Smartphone,
  Laptop,
  CheckCircle2,
  Github,
} from 'lucide-react';

interface CoolReadConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBook?: BookMetadata | null;
}

export function CoolReadConnectModal({
  isOpen,
  onClose,
  selectedBook,
}: CoolReadConnectModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const coolReadWebUrl = 'https://lscnsk.github.io/Cool_Read/';
  const coolReadGithubUrl = 'https://github.com/lscnsk/Cool_Read';

  const handleCopyBookUrl = () => {
    if (selectedBook) {
      navigator.clipboard.writeText(selectedBook.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        id="cool-read-modal"
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#ded7cc] bg-[#faf8f5] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e2d7] bg-[#f4efe6] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b06f2e] text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1c1b18]">
                Связка с читалкой Cool_Read
              </h3>
              <p className="text-[11px] text-[#70685d]">
                Полноценная экосистема для чтения FB2, EPUB и PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#70685d] hover:bg-[#eae3d7] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-sm text-[#38332d]">
          {/* Selected Book Banner if invoked for a book */}
          {selectedBook && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e4d7be] bg-[#fbf6ec] p-3 text-xs">
              <div className="min-w-0">
                <span className="font-semibold text-[#82541a]">Выбранная книга:</span>
                <p className="font-serif font-bold text-[#2a241c] truncate">
                  {selectedBook.title}
                </p>
                <p className="text-[#6e6659] truncate">{selectedBook.author}</p>
              </div>

              <button
                type="button"
                onClick={handleCopyBookUrl}
                className="flex shrink-0 items-center gap-1 rounded-md border border-[#dac8a7] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#6e4918] hover:bg-[#f6ebd7]"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Скопировано' : 'Копировать URL'}</span>
              </button>
            </div>
          )}

          {/* About Cool_Read and the synergy */}
          <div className="space-y-2.5">
            <h4 className="font-serif text-base font-semibold text-[#1c1b18]">
              Как взаимодействуют каталог и читалка?
            </h4>
            <p className="text-xs leading-relaxed text-[#5c554b]">
              Репозиторий <span className="font-semibold text-[#1c1b18]">lscnsk_library</span> хранит вашу коллекцию электронных книг, а читалка{' '}
              <span className="font-semibold text-[#b06f2e]">Cool_Read</span> обеспечивает чтение с закладками, офлайн-сохранением и настройками шрифтов.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-3 rounded-xl border border-[#e8e2d7] bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0eae0] text-xs font-bold text-[#6a5e4f]">
                1
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[#1c1b18]">Прямая синхронизация каталога:</span>
                <p className="mt-0.5 text-[#635b51]">
                  Читалка Cool_Read автоматически обращается к репозиторию lscnsk_library и загружает список доступных книг прямо внутри своего интерфейса.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0eae0] text-xs font-bold text-[#6a5e4f]">
                2
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[#1c1b18]">Чтение любого файла:</span>
                <p className="mt-0.5 text-[#635b51]">
                  Вы можете скачать файл (FB2, EPUB, PDF) из этого сайта-каталога и открыть в читалке одним кликом или перетаскиванием (drag-and-drop).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0eae0] text-xs font-bold text-[#6a5e4f]">
                3
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[#1c1b18]">Офлайн-сохранение:</span>
                <p className="mt-0.5 text-[#635b51]">
                  Прочитанные страницы, прогресс и шрифтовые предпочтения сохраняются локально на вашем устройстве через IndexedDB.
                </p>
              </div>
            </div>
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs text-[#524b42]">
            <div className="flex items-center gap-2 rounded-lg bg-[#f4efe6] p-2.5">
              <Laptop className="h-4 w-4 text-[#8a5d24]" />
              <span>Веб-версия и PWA</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[#f4efe6] p-2.5">
              <Smartphone className="h-4 w-4 text-[#8a5d24]" />
              <span>Поддержка мобильных экранов</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#e8e2d7] bg-[#f4efe6] px-5 py-4">
          <a
            href={coolReadGithubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[#d6cfc2] bg-white px-3 py-2 text-xs font-medium text-[#4f4940] hover:bg-[#eae4d9] transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            <span>Репозиторий читалки</span>
          </a>

          <a
            id="open-coolread-live-btn"
            href={coolReadWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[#b06f2e] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#975d24] transition-all active:scale-98"
          >
            <span>Запустить читалку Cool_Read</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
