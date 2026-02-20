'use client';

import { useLocale } from 'next-intl';

const LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'EN' },
] as const;

export default function LanguageSwitcher() {
  const currentLocale = useLocale();

  function switchLocale(locale: string) {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${365 * 24 * 60 * 60}`;
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {LOCALES.map((loc, i) => (
        <span key={loc.code} className="flex items-center">
          {i > 0 && <span className="text-[#a49484]/40 mx-1">/</span>}
          <button
            onClick={() => switchLocale(loc.code)}
            className={`px-1.5 py-0.5 rounded transition-colors duration-200 ${
              currentLocale === loc.code
                ? 'text-[#C9A227] font-bold'
                : 'text-[#a49484] hover:text-[#C9A227]'
            }`}
          >
            {loc.label}
          </button>
        </span>
      ))}
    </div>
  );
}
