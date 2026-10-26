'use client';

import React, { useEffect } from 'react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH_RESOLVED || '';

export default function NotFound() {
  // A book added after the site was last built has no page of its own yet: show it from the main page
  useEffect(() => {
    const id = window.location.pathname.match(/\/book\/([^/]+)\/?$/)?.[1];
    if (id) window.location.replace(`${BASE}/#${id}`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#23211f] text-[#fffff0] font-literata p-4 text-center">
      <h2 className="text-3xl font-bold mb-4">404</h2>
      <p className="text-[#a8a29e] mb-6">Страница не найдена</p>
      <a
        href={`${BASE}/`}
        className="px-4 py-2 bg-[#363330] hover:bg-[#45413e] rounded-lg text-sm text-[#fffff0] transition-colors"
      >
        Вернуться в каталог
      </a>
    </div>
  );
}
