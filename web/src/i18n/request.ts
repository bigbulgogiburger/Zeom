import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value;

  if (!locale) {
    const headerStore = await headers();
    const acceptLang = headerStore.get('accept-language') || '';
    locale = acceptLang.toLowerCase().startsWith('en') ? 'en' : 'ko';
  }

  if (locale !== 'ko' && locale !== 'en') {
    locale = 'ko';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
