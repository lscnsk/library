import type { Metadata } from 'next';
import { Literata, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const literata = Literata({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-literata',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'cyrillic-ext'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'lscnsk/library',
  description:
    'Минималистичный каталог цифровой библиотеки lscnsk_library с автообновлением и интеграцией читалки Cool_Read',
  openGraph: {
    title: 'lscnsk/library',
    description:
      'Минималистичный каталог цифровой библиотеки lscnsk_library с автообновлением и интеграцией читалки Cool_Read',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'lscnsk/library',
    description:
      'Минималистичный каталог цифровой библиотеки lscnsk_library с автообновлением и интеграцией читалки Cool_Read',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`scroll-smooth ${literata.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-[#23211f] text-[#fffff0] antialiased selection:bg-[#45413e] selection:text-[#fffff0] font-literata">
        {children}
      </body>
    </html>
  );
}
