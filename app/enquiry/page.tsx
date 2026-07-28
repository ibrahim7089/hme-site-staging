import type { Metadata } from 'next'
import { Clock3, LockKeyhole, MessageSquareText, Phone } from 'lucide-react'
import EnquiryForm from '@/components/EnquiryForm'
import PageHero from '@/components/PageHero'
import { normaliseEnquiryType } from '@/lib/enquiry'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Send an Enquiry | HME Customer Support',
  description: 'Send a secure online enquiry to HME about rates, transfers, bookings, business services, careers, feedback or privacy.',
}

type EnquiryPageProps = {
  searchParams: Promise<{ type?: string | string[]; subject?: string | string[] }>
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value || '').slice(0, 160)
}

export default async function EnquiryPage({ searchParams }: EnquiryPageProps) {
  const params = await searchParams
  const type = normaliseEnquiryType(params.type)
  const subject = first(params.subject)

  return (
    <>
      <PageHero
        pageKey="enquiry"
        eyebrow="Online Enquiry"
        title="Tell us how we can help"
        lead="Complete one clear form and HME will direct your enquiry to the right team."
      />
      <section className="bg-cloud py-14 md:py-20">
        <div className="wrap grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <aside className="rounded-card bg-gradient-to-br from-navy to-navy-deep p-7 text-white shadow-deep sm:p-8">
            <p className="eyebrow !text-[#FF9AAA]">Before you send</p>
            <h2 className="mt-3 text-2xl font-extrabold">A simple, secure first step</h2>
            <div className="mt-7 space-y-5">
              <div className="flex gap-3">
                <MessageSquareText className="mt-0.5 h-5 w-5 flex-none text-[#7FB2F5]" />
                <div><b className="block text-sm">Choose the right topic</b><p className="mt-1 text-xs leading-relaxed text-[#D4E0F2]">Your enquiry will be easier for the team to route and answer.</p></div>
              </div>
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 flex-none text-[#7FB2F5]" />
                <div><b className="block text-sm">Keep sensitive details private</b><p className="mt-1 text-xs leading-relaxed text-[#D4E0F2]">Never include passwords, PINs or full card and identity document numbers.</p></div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 flex-none text-[#7FB2F5]" />
                <div><b className="block text-sm">HME will follow up</b><p className="mt-1 text-xs leading-relaxed text-[#D4E0F2]">The right team will respond using your preferred contact method.</p></div>
              </div>
            </div>
            <div className="mt-8 border-t border-white/15 pt-6">
              <p className="text-xs text-[#D4E0F2]">Need urgent assistance?</p>
              <a href={`tel:${site.phone.replace(/[\s()-]/g, '')}`} className="mt-2 inline-flex items-center gap-2 font-bold text-white hover:underline">
                <Phone className="h-4 w-4" /> {site.phone}
              </a>
            </div>
          </aside>

          <EnquiryForm defaultType={type} defaultSubject={subject} />
        </div>
      </section>
    </>
  )
}
