import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#23211f] text-[#fffff0] font-literata p-4 text-center">
      <h2 className="text-3xl font-bold mb-4">404</h2>
      <p className="text-[#a8a29e] mb-6">Страница не найдена</p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#363330] hover:bg-[#45413e] rounded-lg text-sm text-[#fffff0] transition-colors"
      >
        Вернуться в каталог
      </Link>
    </div>
  );
}
