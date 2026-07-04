# HME Website — Next.js + Tailwind

Redesign of hmeremit.com.my for Hasani Munawarah Exchange Sdn Bhd.

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```

## Structure
- `app/` — App Router pages (14 pages, each with SEO metadata)
- `components/` — TopTrustBar, Header, HeroSection (signature rate board),
  RateWidget, ServiceCards, WhyChooseHME, RemittanceSteps, CurrencyExchangeSteps,
  BranchLocatorPreview, AgentCTA, ComplianceTrustSection, FAQSection, Footer,
  MobileStickyCTA, PageHero, SectionHeading, StepsCard
- `lib/` — site config, rates data, branches data

## Go-live checklist
1. Replace placeholder rates in `lib/rates.ts` with a live feed (API route or CMS).
2. Fill real branch data in `lib/branches.ts` + embed Google Maps in BranchLocatorPreview.
3. Fill licence/registration numbers and HQ address in `lib/site.ts`.
4. Wire forms (contact, agent, booking) to an API route or form service.
5. Replace emoji flags with SVG flag icons (e.g. `country-flag-icons` package) for consistency across devices.
6. Add real photography (branches, counters, staff) for About/Career.
7. Add sitemap.xml + robots.txt via `app/sitemap.ts` and `app/robots.ts`.
