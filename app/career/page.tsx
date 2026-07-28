import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/PageHero'
import { getPublishedCareers, type PublishedCareers } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'Careers at HME | Join a Growing Malaysian MSB',
  description: 'Build your career in financial services with HME - branch, compliance, IT and operations roles across a growing licensed Malaysian MSB network.',
}

const fallbackCareers: PublishedCareers = {
  intro: 'Join a team where compliance, technology and customer service come together - with real responsibility from day one.',
  generalApplicationsEmail: 'careers@hmeremit.com.my',
  jobs: [
    { slug: 'branch-customer-service-officer', title: 'Branch Customer Service Officer', location: 'Multiple locations', employmentType: 'Full-time', summary: 'Front-line exchange and money transfer service.', description: 'Support customers with currency exchange and money transfer transactions while following HME service and compliance procedures.', applyEmail: 'careers@hmeremit.com.my' },
    { slug: 'compliance-officer', title: 'Compliance Officer (AML/CFT)', location: 'Head Office', employmentType: 'Full-time', summary: 'Transaction monitoring, screening and reporting.', description: 'Support customer due diligence, transaction monitoring, sanctions screening and regulatory reporting activities.', applyEmail: 'careers@hmeremit.com.my' },
    { slug: 'it-executive', title: 'IT Executive', location: 'Head Office', employmentType: 'Full-time', summary: 'Internal systems, digital platform and branch support.', description: 'Maintain business systems, support branches and contribute to secure digital service improvements.', applyEmail: 'careers@hmeremit.com.my' },
  ],
}

export default async function CareerPage() {
  const careers = await getPublishedCareers() ?? fallbackCareers

  return (
    <>
      <PageHero eyebrow="Career" title="Grow your career in regulated financial services" lead={careers.intro} image={careers.heroImage} imageAlt={careers.heroImageAlt} />
      <section className="py-20">
        <div className="wrap">
          {careers.jobs.length > 0 ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {careers.jobs.map((job) => {
              const applyHref = job.applyUrl || `/enquiry?type=career&subject=${encodeURIComponent(`Application: ${job.title}`)}`
              const external = applyHref.startsWith('https://')
              return <article key={job.slug} className="flex flex-col rounded-card border border-line bg-white p-6 transition hover:shadow-soft">
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-mist"><span>{job.location}</span><span aria-hidden="true">/</span><span>{job.employmentType}</span></div>
                <h2 className="mt-2 text-lg font-bold text-navy">{job.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate2">{job.summary}</p>
                <details className="group mt-4 flex-1 border-t border-line pt-4"><summary className="cursor-pointer list-none text-sm font-bold text-brand-blue"><span className="group-open:hidden">View role details &rarr;</span><span className="hidden group-open:inline">Hide details &uarr;</span></summary><div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate2">{job.description}</div></details>
                {job.closingDate && <p className="mt-4 text-xs font-semibold text-slate2">Applications close: {job.closingDate}</p>}
                {external
                  ? <a href={applyHref} target="_blank" rel="noreferrer" className="btn-primary mt-5 self-start">Apply now</a>
                  : <Link href={applyHref} className="btn-primary mt-5 self-start">Enquire about role</Link>}
              </article>
            })}
          </div> : <div className="rounded-card border border-line bg-cloud p-8 text-center"><h2 className="text-xl font-bold text-navy">No current vacancies</h2><p className="mt-2 text-sm text-slate2">You can still send us a general application.</p></div>}
          <p className="mt-8 text-sm text-slate2">Don&apos;t see your role? <Link className="font-bold text-brand-blue hover:underline" href="/enquiry?type=career&subject=General%20career%20enquiry">Send a general career enquiry</Link> and tell us where you fit.</p>
        </div>
      </section>
    </>
  )
}
