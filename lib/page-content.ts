export type CmsImageSpec = {
  key: 'page-hero' | 'home-hero' | 'page-section'
  label: string
  width: number
  height: number
  ratio: string
  maxBytes: number
  formats: string
  note: string
}

export type PageHeroContent = {
  eyebrow: string
  title: string
  lead: string
  image: string
  imageAlt: string
}

export type PageSectionContent = {
  id: string
  name: string
  visible: boolean
  eyebrow: string
  heading: string
  body: string
  image: string
  imageAlt: string
}

export type PageContentPayload = {
  pageName: string
  path: string
  hero: PageHeroContent
  sections: PageSectionContent[]
}

export const heroImageSpec: CmsImageSpec = {
  key: 'page-hero',
  label: 'Full-width page hero',
  width: 1920,
  height: 1080,
  ratio: '16:9',
  maxBytes: 2 * 1024 * 1024,
  formats: 'WebP or AVIF preferred; JPG and PNG accepted',
  note: 'Keep faces and important details near the centre. Dark overlays are added automatically for readable text.',
}

export const sectionImageSpec: CmsImageSpec = {
  key: 'page-section',
  label: 'Page section image',
  width: 1200,
  height: 800,
  ratio: '3:2',
  maxBytes: 2 * 1024 * 1024,
  formats: 'WebP or AVIF preferred; JPG and PNG accepted',
  note: 'Use a clean landscape photo with enough space around the main subject.',
}

export const homeHeroImageSpec: CmsImageSpec = {
  key: 'home-hero',
  label: 'Home hero person cut-out',
  width: 1200,
  height: 1500,
  ratio: '4:5 portrait',
  maxBytes: 2 * 1024 * 1024,
  formats: 'Transparent WebP preferred; transparent PNG accepted',
  note: 'Use a full or three-quarter body cut-out with a transparent background. Leave space around the head and hands.',
}

type PageDefinition = {
  key: string
  name: string
  path: string
  hero: Omit<PageHeroContent, 'imageAlt'> & { imageAlt?: string }
}

export const websitePages: PageDefinition[] = [
  { key: 'home', name: 'Home page', path: '/', hero: { eyebrow: '', title: 'Money moves. Trust stays', lead: "Exchange foreign currency and send money overseas through HME's nationwide network of 50+ locations.", image: '/images/hero-person.webp', imageAlt: 'HME customer ready to exchange or send money' } },
  { key: 'about', name: 'About Us', path: '/about', hero: { eyebrow: 'About Us', title: 'About Hasani Munawarah Exchange', lead: 'A trusted Malaysian money services business built on decades of experience, strong compliance standards, and a genuine commitment to serving our communities.', image: '/images/about-hero.jpg', imageAlt: 'HME LG-K08A branch counter' } },
  { key: 'currency-exchange', name: 'Currency Exchange', path: '/currency-exchange', hero: { eyebrow: 'Currency Exchange', title: 'Buy and sell foreign currency with confidence', lead: "Major and selected currencies are handled across HME's branch network, with indicative published rates when available, proper receipts and counter support.", image: '/images/currency-exchange-counter.webp', imageAlt: 'Currency exchange service at an HME counter' } },
  { key: 'money-transfer', name: 'International Money Transfer', path: '/money-transfer', hero: { eyebrow: 'International Money Transfer', title: 'Send money home, the trusted way', lead: 'HME Remit moves your money overseas with transparent rates, secure verification and support at every HME branch.', image: '/images/moneytransfer-counter.webp', imageAlt: 'International money transfer service at HME' } },
  { key: 'currency-booking', name: 'Currency Booking', path: '/currency-booking', hero: { eyebrow: 'Currency Booking', title: 'Plan ahead. Collect with confidence.', lead: 'Ask your preferred HME branch to check currency availability and arrange a collection date.', image: '', imageAlt: '' } },
  { key: 'biz-fx', name: 'Business FX', path: '/corporate', hero: { eyebrow: 'Biz FX', title: 'Business foreign currency exchange', lead: 'HME supports recurring business foreign currency needs with competitive rates and compliant, documented processes.', image: '', imageAlt: '' } },
  { key: 'biz-remit', name: 'Business Remittance', path: '/biz-remit', hero: { eyebrow: 'Biz Remit', title: 'Business international money transfer', lead: 'Reliable outward money transfer for Malaysian businesses, supplier payments, trade settlements and payroll remittance.', image: '', imageAlt: '' } },
  { key: 'be-our-agent', name: 'Be Our Agent', path: '/be-our-agent', hero: { eyebrow: 'Be Our Agent', title: 'Grow with a trusted Malaysian MSB network', lead: 'If you operate an established business in Malaysia, talk to HME about agent opportunities and the requirements for your proposed location.', image: '/images/agent-handshake.webp', imageAlt: 'HME business partnership' } },
  { key: 'rates', name: 'Exchange Rates', path: '/rates', hero: { eyebrow: 'Rates', title: 'Rates with no guesswork', lead: 'Switch between currency exchange and money transfer. Final rates are confirmed at the branch.', image: '', imageAlt: '' } },
  { key: 'transfer-rates', name: 'Money Transfer Rates', path: '/money-transfer-rates', hero: { eyebrow: 'Money Transfer Rates', title: 'Send with clarity', lead: 'Review published rates when available, then confirm the final rate and applicable fee with your chosen branch.', image: '', imageAlt: '' } },
  { key: 'locate-us', name: 'Locate Us', path: '/locate-us', hero: { eyebrow: 'Locate Us', title: 'Find your nearest HME branch', lead: 'Search branches across Malaysia by state, city or service.', image: '/images/branches-counter.webp', imageAlt: 'HME branch network' } },
  { key: 'promotions', name: 'Promotions', path: '/promotions', hero: { eyebrow: 'Promotions', title: 'Current offers', lead: 'Take advantage of published offers across exchange, money transfer and currency booking.', image: '', imageAlt: '' } },
  { key: 'news', name: 'News', path: '/media/news', hero: { eyebrow: 'Media', title: 'News', lead: 'Company announcements, branch updates and regulatory news from HME.', image: '', imageAlt: '' } },
  { key: 'blog', name: 'Blog', path: '/media/blog', hero: { eyebrow: 'Media', title: 'Blog', lead: 'Guides and tips on currency exchange, money transfer and currency booking.', image: '', imageAlt: '' } },
  { key: 'career', name: 'Careers', path: '/career', hero: { eyebrow: 'Career', title: 'Grow your career in regulated financial services', lead: 'Join a team where compliance, technology and customer service come together.', image: '', imageAlt: '' } },
  { key: 'contact', name: 'Contact Us', path: '/contact', hero: { eyebrow: 'Contact Us', title: "We're here to help", lead: 'Questions about rates, a transaction, booking or partnership? Choose the channel that works best for you.', image: '', imageAlt: '' } },
  { key: 'enquiry', name: 'Online Enquiry', path: '/enquiry', hero: { eyebrow: 'Online Enquiry', title: 'Tell us how we can help', lead: 'Complete one clear form and HME will direct your enquiry to the right team.', image: '', imageAlt: '' } },
  { key: 'faq', name: 'FAQ', path: '/faq', hero: { eyebrow: 'FAQ', title: 'Questions, answered', lead: 'Everything customers ask most about rates, money transfer, booking and what to bring to the branch.', image: '', imageAlt: '' } },
  { key: 'compliance', name: 'Compliance', path: '/compliance', hero: { eyebrow: 'Compliance & Customer Protection', title: 'Built on trust, compliance & customer protection', lead: 'HME operates under Malaysian Money Services Business regulation.', image: '', imageAlt: '' } },
  { key: 'aml-policy', name: 'AML/CFT Policy', path: '/compliance/aml-policy', hero: { eyebrow: 'Compliance', title: 'AML/CFT Policy', lead: 'Our anti-money laundering and counter-financing of terrorism programme.', image: '', imageAlt: '' } },
  { key: 'privacy-policy', name: 'Privacy Policy', path: '/compliance/privacy-policy', hero: { eyebrow: 'Compliance', title: 'Privacy Policy', lead: 'How we collect, use and protect your personal data under the Personal Data Protection Act 2010.', image: '', imageAlt: '' } },
  { key: 'terms', name: 'Terms and Conditions', path: '/compliance/terms', hero: { eyebrow: 'Compliance', title: 'Terms and Conditions', lead: "The terms governing the use of HME's services.", image: '', imageAlt: '' } },
  { key: 'fees-charges', name: 'Fees and Charges', path: '/compliance/fees-charges', hero: { eyebrow: 'Compliance', title: 'Fees & Charges', lead: 'A clear breakdown of how pricing works across our services.', image: '', imageAlt: '' } },
  { key: 'fraud-prevention', name: 'Fraud Prevention', path: '/compliance/fraud-prevention', hero: { eyebrow: 'Compliance', title: 'Fraud Prevention', lead: 'Simple steps to protect yourself and report suspicious activity.', image: '', imageAlt: '' } },
  { key: 'customer-charter', name: 'Customer Charter', path: '/compliance/customer-charter', hero: { eyebrow: 'Compliance', title: 'Customer Charter', lead: 'What you can expect from HME at every branch, every time.', image: '', imageAlt: '' } },
  { key: 'communication-channels', name: 'Communication Channels', path: '/compliance/communication-channels', hero: { eyebrow: 'Compliance', title: 'Communication Channels', lead: 'Official ways to reach HME for enquiries, feedback or complaints.', image: '', imageAlt: '' } },
  { key: 'corporate-sustainability', name: 'Corporate Sustainability', path: '/compliance/corporate-sustainability', hero: { eyebrow: 'Compliance', title: 'Corporate Sustainability', lead: 'How HME contributes to sustainable development through responsible business operations.', image: '', imageAlt: '' } },
]

export function pageDefinition(key: string) {
  return websitePages.find((page) => page.key === key) || websitePages[0]
}

export function pageTemplate(key: string): PageContentPayload {
  const definition = pageDefinition(key)
  const sections: PageSectionContent[] = key === 'home' ? [
    {
      id: 'hme-way',
      name: 'The HME way',
      visible: true,
      eyebrow: 'The HME way',
      heading: 'Financial services should feel clear, secure and close to you',
      body: 'HME brings currency exchange, international transfers, booking and branch support into one nationwide network.\n\nWhether you are travelling, supporting family or running a business, your next step stays simple and familiar.',
      image: '',
      imageAlt: '',
    },
    {
      id: 'services',
      name: 'Services introduction',
      visible: true,
      eyebrow: 'Start with your need',
      heading: 'Five everyday needs. One trusted HME network.',
      body: 'Choose what you need today. Every service connects to the same experienced teams and nationwide branch network.',
      image: '',
      imageAlt: '',
    },
  ] : []
  return {
    pageName: definition.name,
    path: definition.path,
    hero: {
      ...definition.hero,
      imageAlt: definition.hero.imageAlt || '',
    },
    sections,
  }
}
