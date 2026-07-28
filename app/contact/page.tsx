import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, CheckCircle2, MessageCircle, MessageSquareText, Phone } from 'lucide-react'
import PageHero from '@/components/PageHero'
import { getPublishedContact, type PublishedContact } from '@/lib/cms'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact HME | Customer Support & Inquiries',
  description: 'Contact Hasani Munawarah Exchange by phone, WhatsApp or a secure online enquiry form, or visit an HME branch.',
}

const fallbackContact: PublishedContact = {
  headline: "We're here to help",
  lead: 'Questions about rates, a transaction, booking or partnership? Choose the channel that works best for you.',
  phone: site.phone,
  whatsappUrl: site.whatsapp,
  email: site.email,
  addressLine1: site.hqAddress1,
  addressLine2: site.hqAddress2,
  supportHeading: 'Talk directly to the right team',
  supportNote: 'Tell us what you need and include any relevant transaction reference. Never send passwords, PINs or full card details.',
  services: ['Latest rates and availability', 'Money transfer support', 'Currency booking', 'Business or agent inquiry'],
}

export default async function ContactPage() {
  const contact = await getPublishedContact() ?? fallbackContact
  const address = `${contact.addressLine1}, ${contact.addressLine2}`
  const mapsUrl = contact.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const phoneHref = `tel:${contact.phone.replace(/[\s()-]/g, '')}`
  const actions = [
    { icon: Phone, title: 'Call us', value: contact.phone, href: phoneHref },
    { icon: MessageCircle, title: 'WhatsApp', value: 'Chat with our team', href: contact.whatsappUrl, external: true },
    { icon: MessageSquareText, title: 'Online enquiry', value: 'Send details through our secure form', href: '/enquiry' },
    { icon: Building2, title: 'Head Office', value: address, href: mapsUrl, external: true },
  ]

  return (
    <>
      <PageHero pageKey="contact" eyebrow="Contact Us" title={contact.headline} lead={contact.lead} />
      <section className="py-14 md:py-20">
        <div className="wrap grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            {actions.map(({ icon: Icon, title, value, href, external }) => <a key={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="group flex items-center gap-4 rounded-tile border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-soft"><span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-bluesoft"><Icon className="h-5 w-5 text-brand-blue" /></span><span className="min-w-0"><b className="block font-display text-[15px] text-navy">{title}</b><span className="block break-words text-sm leading-relaxed text-slate2">{value}</span></span></a>)}
            <Link href="/locate-us" className="btn-outline mt-2">Browse All Branches</Link>
          </div>

          <div className="rounded-card bg-gradient-to-br from-navy to-navy-deep p-7 text-white shadow-deep sm:p-9">
            <p className="eyebrow !text-[#FF9AAA]">How can we help?</p>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{contact.supportHeading}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#D4E0F2]">{contact.supportNote}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{contact.services.map((item) => <span key={item} className="flex items-center gap-2 rounded-xl bg-white/8 p-3 text-sm text-white/90"><CheckCircle2 className="h-4 w-4 flex-none text-[#7FB2F5]" />{item}</span>)}</div>
            <div className="mt-8 flex flex-wrap gap-3"><a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="btn-red"><MessageCircle className="h-4 w-4" /> Start on WhatsApp</a><Link href="/enquiry" className="btn-ghost"><MessageSquareText className="h-4 w-4" /> Send an Enquiry</Link></div>
          </div>
        </div>
      </section>
    </>
  )
}
