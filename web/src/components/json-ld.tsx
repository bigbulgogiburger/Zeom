export function WebsiteJsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '천지연꽃신당',
    url: 'https://www.cheonjiyeon.com',
    logo: 'https://www.cheonjiyeon.com/og-image.png',
    description: '전문 상담사와 1:1 화상상담. 사주, 타로, 신점, 꿈해몽 전문가를 만나보세요.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Korean',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '천지연꽃신당',
    url: 'https://www.cheonjiyeon.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.cheonjiyeon.com/counselors?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

export function ServiceJsonLd() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: '천지연꽃신당',
    url: 'https://www.cheonjiyeon.com',
    description: '온라인 점사 상담 예약 플랫폼. 사주, 타로, 신점, 꿈해몽, 궁합 전문 상담사와 1:1 화상상담.',
    serviceType: ['사주 상담', '타로 상담', '신점 상담', '꿈해몽', '궁합 상담'],
    areaServed: {
      '@type': 'Country',
      name: 'KR',
    },
    availableLanguage: 'Korean',
    priceRange: '$$',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
    />
  );
}
