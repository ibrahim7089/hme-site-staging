import type { Metadata } from 'next'
import Image from 'next/image'
import PageHero from '@/components/PageHero'
import { getPublishedBlog, type PublishedArticle } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'Blog | HME Media',
  description: 'Guides and tips on foreign currency exchange, international money transfer and currency booking from HME.',
}

const fallbackPosts: PublishedArticle[] = [
  { slug: 'currency-exchange-trip-checklist', title: '5 things to check before exchanging currency for your trip', summary: "A quick checklist to make sure you're getting a fair rate and the right notes for your destination.", body: 'Compare the published rate, confirm note availability, bring valid identification, check branch hours and keep your transaction receipt.', publishedDate: '2026-02-15', author: 'HME', category: 'Travel tips', active: true },
  { slug: 'how-money-transfer-works', title: 'How international money transfer actually works', summary: 'A plain-language walkthrough of what happens between you sending money and your family receiving it.', body: 'Your transaction is verified, screened and sent through an approved remittance network before payout to the recipient. Processing time depends on the destination and payout method.', publishedDate: '2026-01-20', author: 'HME', category: 'Money transfer', active: true },
  { slug: 'when-to-book-currency', title: 'When should you book currency in advance?', summary: 'Why reserving currency ahead of time can make sense for larger trips or bulk currency needs.', body: 'Advance booking gives the branch time to confirm the currency and denomination you need. Contact your selected branch to confirm availability and collection arrangements.', publishedDate: '2025-12-10', author: 'HME', category: 'Currency booking', active: true },
]

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-MY', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

export default async function BlogPage() {
  const published = await getPublishedBlog()
  const posts = published ?? fallbackPosts

  return (
    <>
      <PageHero eyebrow="Media" title="Blog" lead="Guides and tips on currency exchange, money transfer and currency booking." />
      <section className="py-20">
        {posts.length > 0 ? <div className="wrap grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => <article key={post.slug} className="overflow-hidden rounded-card border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-soft">
            {post.image ? <div className="relative aspect-[16/9] overflow-hidden bg-cloud"><Image src={post.image} alt={post.imageAlt || post.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw" className="object-cover" /></div> : <div className="grid aspect-[16/7] place-items-center bg-gradient-to-br from-navy to-[#17477b] px-6 text-center font-display text-lg font-bold text-white">HME Guide</div>}
            <div className="p-6">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-red"><span>{post.category || 'Guide'}</span><time dateTime={post.publishedDate}>{displayDate(post.publishedDate)}</time></div>
              <h2 className="mt-3 text-xl font-bold text-navy">{post.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate2">{post.summary}</p>
              <details className="group mt-5 border-t border-line pt-4"><summary className="cursor-pointer list-none text-sm font-bold text-brand-blue"><span className="group-open:hidden">Read guide &rarr;</span><span className="hidden group-open:inline">Close guide &uarr;</span></summary><div className="mt-4 whitespace-pre-line text-sm leading-6 text-slate2">{post.body}</div></details>
            </div>
          </article>)}
        </div> : <div className="wrap"><div className="rounded-card border border-line bg-cloud p-8 text-center"><h2 className="text-xl font-bold text-navy">No blog posts published</h2><p className="mt-2 text-sm text-slate2">New customer guides will appear here.</p></div></div>}
      </section>
    </>
  )
}
