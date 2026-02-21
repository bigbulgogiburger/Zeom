'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GA_MEASUREMENT_ID, trackPageView } from './analytics';

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (GA_MEASUREMENT_ID && pathname) {
      trackPageView(document.title, pathname);
    }
  }, [pathname]);

  return null;
}
