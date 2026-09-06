'use client';

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  Github,
  Terminal,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileCode,
} from 'lucide-react';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: () => void;
  uploadUrl?: string;
  repoUrl?: string;
}

export function AddBookModal({
  isOpen,
  onClose,
  onSync,
  uploadUrl = 'https://github.com/lscnsk/lscnsk_library/upload/main',
  repoUrl = 'https://github.com/lscnsk/lscnsk_library',
}: AddBookModalProps) {
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  if (!isOpen) return null;

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook`
      : 'https://ваш-сайт.com/api/webhook';

  const cliSnippet = `# 1. Добавьте файл книги (.fb2, .epub, .pdf) в репозиторий\ngit add .\n\n# 2. Закоммитьте изменения\ngit commit -m "Добавлена новая книга"\n\n# 3. Отправьте в ветку main\ngit push origin main`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        id="add-book-modal"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#ded7cc] bg-[#faf8f5] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e2d7] bg-[#f4efe6] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#272523] text-white">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1c1b18]">
                Как добавить новые книги в каталог
              </h3>
              <p className="text-[11px] text-[#70685d]">
                Автоматическое обновление при пополнении репозитория
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

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-[#38332d]">
          {/* Method 1: Web Drag-and-Drop in GitHub */}
          <div className="rounded-xl border border-[#ded7cc] bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-md bg-[#eee7db] px-2 py-0.5 text-[11px] font-semibold text-[#5a5246] uppercase">
                  Способ 1 • Самый быстрый
                </span>
                <h4 className="mt-1 font-serif text-base font-bold text-[#1c1b18]">
                  Загрузка через веб-интерфейс GitHub
                </h4>
                <p className="mt-1 text-xs text-[#635b51] leading-relaxed">
                  Откройте страницу загрузки репозитория и просто перетащите файл книги (<strong>.fb2</strong>, <strong>.epub</strong>, <strong>.pdf</strong>) прямо в окно браузера.
                </p>
              </div>

              <a
                href={uploadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#272523] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#3d3a37] shadow-xs transition-colors"
              >
                <span>Загрузить на GitHub</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Method 2: Git CLI */}
          <div className="rounded-xl border border-[#ded7cc] bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="inline-block rounded-md bg-[#eee7db] px-2 py-0.5 text-[11px] font-semibold text-[#5a5246] uppercase">
                  Способ 2 • Терминал Git
                </span>
                <h4 className="mt-1 font-serif text-base font-bold text-[#1c1b18]">
                  Отправка через Git push
                </h4>
              </div>

              <button
                type="button"
                onClick={handleCopyCli}
                className="flex items-center gap-1 rounded-md border border-[#ded7cc] bg-[#faf8f5] px-2.5 py-1 text-xs font-medium text-[#4f4940] hover:bg-[#eae4d9]"
              >
                {copiedCli ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCli ? 'Скопировано' : 'Копировать команды'}</span>
              </button>
            </div>

            <pre className="rounded-lg bg-[#1f1e1d] p-3 text-xs text-[#e8e4dc] font-mono overflow-x-auto leading-relaxed">
              <code>{cliSnippet}</code>
            </pre>
          </div>

          {/* How Auto-Sync Works & Optional Webhook */}
          <div className="rounded-xl border border-[#e4dccf] bg-[#fbf6ec] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#b06f2e]" />
              <h4 className="font-serif text-sm font-bold text-[#2a241c]">
                Как сайт узнаёт о новых книгах?
              </h4>
            </div>

            <ul className="space-y-2 text-xs text-[#635b51]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Автоматический опрос:</strong> сайт периодически проверяет репозиторий на новые коммиты и файлы, а также при открытии вкладки или нажатии кнопки «Обновить».
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Умный парсер метаданных:</strong> формат FB2 считывает оригинальное название, автора, аннотацию, серию и встроенную обложку без сторонних сервисов.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Мгновенный Webhook (по желанию):</strong> добавьте URL ниже в настройки репозитория (<i>Settings → Webhooks → Add webhook</i>), и каталог будет обновляться в ту же секунду, когда проходит <code>git push</code>.
                </span>
              </li>
            </ul>

            {/* Webhook URL Field */}
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#e0cca8] bg-white p-2 text-xs">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full bg-transparent font-mono text-xs text-[#302b25] outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="flex shrink-0 items-center gap-1 rounded bg-[#f4ecd8] px-2.5 py-1 text-[11px] font-semibold text-[#7f5117] hover:bg-[#ebdcb9]"
              >
                {copiedWebhook ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedWebhook ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#e8e2d7] bg-[#f4efe6] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#6e675c] hover:bg-[#eae3d7]"
          >
            Закрыть
          </button>

          <button
            type="button"
            onClick={() => {
              onSync();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#272523] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3d3a37] transition-all"
          >
            <span>Проверить репозиторий сейчас</span>
          </button>
        </div>
      </div>
    </div>
  );
}
