import type { Metadata } from 'next'
import Image from 'next/image'
import PageHero from '@/components/PageHero'
import { getPublishedNews, type PublishedNewsArticle } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'News | HME Media',
  description: 'Company announcements, branch openings and regulatory updates from HME — Hasani Munawarah Exchange Sdn Bhd.',
}

const fallbackNews: PublishedNewsArticle[] = [
  {
    slug: 'new-sungai-petani-branch',
    publishedDate: '2026-03-01',
    title: 'HME opens new branch in Sungai Petani',
    summary: 'Expanding our nationwide network with a new full-service branch.',
    body: 'The new branch offers currency exchange, international money transfer and currency booking services for customers in Sungai Petani.',
    author: 'HME',
    active: true,
  },
  {
    slug: 'updated-customer-verification',
    publishedDate: '2026-01-01',
    title: 'Updated AML/CFT customer verification steps',
    summary: 'We have refreshed our customer due diligence process at all branches.',
    body: 'The updated steps support secure transactions and alignment with applicable Bank Negara Malaysia guidelines.',
    author: 'HME',
    active: true,
  },
  {
    slug: 'extended-payout-network',
    publishedDate: '2025-11-01',
    title: 'HME extends money transfer payout network',
    summary: 'More cash and account payout corridors are now supported.',
    body: 'Customers can access additional payout options through HME correspondent banking and remittance partners.',
    author: 'HME',
    active: true,
  },
]

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-MY', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

export default async function NewsPage() {
  const published = await getPublishedNews()
  const articles = published ?? fallbackNews

  return (
    <>
      <PageHero eyebrow="Media" title="News"
        lead="Company announcements, branch updates and regulatory news from HME." />
      <section className="py-20">
        {articles.length > 0 ? (
          <div className="wrap grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.slug} className="overflow-hidden rounded-card border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
                {article.image ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-cloud">
                    <Image
                      src={article.image}
                      alt={article.imageAlt || article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-[16/7] place-items-center bg-gradient-to-br from-navy to-[#17477b] px-6 text-center font-display text-lg font-bold text-white">
                    HME News
                  </div>
                )}
                <div className="flex flex-col p-6">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-red">
                    <time dateTime={article.publishedDate}>{displayDate(article.publishedDate)}</time>
                    <span className="text-slate2">{article.author || 'HME'}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-navy">{article.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate2">{article.summary}</p>
                  <details className="group mt-5 border-t border-line pt-4">
                    <summary className="cursor-pointer list-none text-sm font-bold text-brand-blue">
                      <span className="group-open:hidden">Read full update →</span>
                      <span className="hidden group-open:inline">Close update ↑</span>
                    </summary>
                    <div className="mt-4 whitespace-pre-line text-sm leading-6 text-slate2">{article.body}</div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="wrap">
            <div className="rounded-card border border-line bg-cloud p-8 text-center">
              <h2 className="text-xl font-bold text-navy">No news published</h2>
              <p className="mt-2 text-sm text-slate2">New company announcements will appear here.</p>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
