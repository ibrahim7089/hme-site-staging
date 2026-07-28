import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/PageHero'
import FlagIcon from '@/components/FlagIcon'
import RateUnavailableNotice from '@/components/RateUnavailableNotice'
import { getPublishedTransferRates } from '@/lib/cms'
import { disclaimer as defaultDisclaimer } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Money Transfer Rates | Send Money Overseas',
  description: 'Check published HME Remit money transfer rates from Malaysia and contact a branch for the latest available rate and applicable fees.',
}

function displayDate(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

export default async function MoneyTransferRatesPage() {
  const published = await getPublishedTransferRates()
  const updatedAt = displayDate(published.effectiveAt)

  return (
    <>
      <PageHero pageKey="transfer-rates" eyebrow="Money Transfer Rates" title="Send with clarity"
        lead="Review published rates when available, then confirm the final rate and any applicable fee with your chosen branch." />
      <section className="py-14 md:py-20">
        <div className="wrap">
          {published.rates.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-card border border-line shadow-soft">
                <div className="grid grid-cols-[1.5fr_.8fr_1fr] bg-navy px-4 py-3.5 font-display text-xs font-bold uppercase tracking-widest text-[#B9C8E0] sm:grid-cols-[1.5fr_.8fr_1fr_1fr] sm:px-6">
                  <span>Destination</span><span className="text-right">Currency</span><span className="text-right">Rate / MYR</span><span className="hidden text-right sm:block">Fee</span>
                </div>
                {published.rates.map((row, index) => (
                  <div key={`${row.countryCode}-${row.currency}`} className={`grid grid-cols-[1.5fr_.8fr_1fr] items-center px-4 py-4 sm:grid-cols-[1.5fr_.8fr_1fr_1fr] sm:px-6 ${index % 2 ? 'bg-cloud' : 'bg-white'}`}>
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-navy sm:gap-3">
                      <FlagIcon country={row.countryCode} className="hidden h-6 w-8 sm:block" />{row.country}
                    </span>
                    <span className="text-right text-sm text-slate2">{row.currency}</span>
                    <span className="text-right font-mono text-sm font-semibold text-brand-blue">{row.rate}</span>
                    <span className="hidden text-right text-sm text-slate2 sm:block">{row.fee ? `RM ${row.fee}` : 'Confirm with branch'}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-xs text-slate2">{published.disclaimer || defaultDisclaimer}</p>
                  {updatedAt && <p className="mt-2 text-xs font-semibold text-navy">Last updated: {updatedAt}</p>}
                </div>
                <Link href="/locate-us" className="btn-primary">Find a Branch to Send</Link>
              </div>
            </>
          ) : <RateUnavailableNotice />}
        </div>
      </section>
    </>
  )
}
