'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from 'lucide-react'
import { enquiryTypeLabels, enquiryTypes, type EnquiryType } from '@/lib/enquiry'

type EnquiryFormProps = {
  defaultType?: EnquiryType
  defaultSubject?: string
}

type FormStatus =
  | { state: 'idle' }
  | { state: 'submitting' }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string }

const inputClass = 'mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-mist focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10'
const labelClass = 'block text-sm font-bold text-navy'

export default function EnquiryForm({
  defaultType = 'general',
  defaultSubject = '',
}: EnquiryFormProps) {
  const [status, setStatus] = useState<FormStatus>({ state: 'idle' })
  const [startedAt] = useState(() => Date.now())

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus({ state: 'submitting' })

    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      type: data.get('type'),
      subject: data.get('subject'),
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      location: data.get('location'),
      message: data.get('message'),
      preferredContact: data.get('preferredContact'),
      consent: data.get('consent') === 'on',
      website: data.get('website'),
      startedAt,
    }

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null) as { message?: string } | null
      if (!response.ok) {
        throw new Error(result?.message || 'We could not send your enquiry. Please try again.')
      }

      form.reset()
      setStatus({
        state: 'success',
        message: result?.message || 'Thank you. Your enquiry has been received by HME.',
      })
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'We could not send your enquiry. Please try again.',
      })
    }
  }

  if (status.state === 'success') {
    return (
      <div className="rounded-card border border-emerald-200 bg-emerald-50 p-7 sm:p-9" role="status">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-navy">Enquiry received</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate2">{status.message}</p>
        <button type="button" className="btn-primary mt-6" onClick={() => setStatus({ state: 'idle' })}>
          Send another enquiry
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Enquiry about
          <select name="type" defaultValue={defaultType} className={inputClass} required>
            {enquiryTypes.map((type) => (
              <option key={type} value={type}>{enquiryTypeLabels[type]}</option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Subject <span className="font-normal text-slate2">(optional)</span>
          <input
            name="subject"
            defaultValue={defaultSubject}
            maxLength={160}
            className={inputClass}
            placeholder="A short title for your enquiry"
          />
        </label>

        <label className={labelClass}>
          Full name
          <input name="name" autoComplete="name" minLength={2} maxLength={120} className={inputClass} required />
        </label>

        <label className={labelClass}>
          Phone number
          <input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={30} className={inputClass} required />
        </label>

        <label className={labelClass}>
          Email address
          <input name="email" type="email" autoComplete="email" maxLength={254} className={inputClass} required />
        </label>

        <label className={labelClass}>
          City or preferred branch <span className="font-normal text-slate2">(optional)</span>
          <input name="location" autoComplete="address-level2" maxLength={160} className={inputClass} />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          How should we contact you?
          <select name="preferredContact" defaultValue="email" className={inputClass} required>
            <option value="email">Email</option>
            <option value="phone">Phone call</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Enquiry details
          <textarea
            name="message"
            rows={7}
            minLength={20}
            maxLength={4000}
            className={`${inputClass} resize-y leading-relaxed`}
            placeholder="Tell us what you need. For career enquiries, include the job title. Do not enter passwords, PINs, full card details or identity document numbers."
            required
          />
        </label>
      </div>

      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Leave this field empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-[13px] leading-relaxed text-slate2">
        <input name="consent" type="checkbox" className="mt-1 h-4 w-4 flex-none accent-brand-blue" required />
        <span>
          I agree that HME may use these details to respond to my enquiry, in accordance with its{' '}
          <Link href="/compliance/privacy-policy" className="font-bold text-brand-blue hover:underline">Privacy Policy</Link>.
        </span>
      </label>

      {status.state === 'error' && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
          <span>{status.message}</span>
        </div>
      )}

      <button type="submit" className="btn-red mt-6 min-w-[190px]" disabled={status.state === 'submitting'}>
        {status.state === 'submitting'
          ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Sending enquiry</>
          : <><Send className="h-4 w-4" /> Send enquiry</>}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-slate2">
        HME will reply using your preferred contact method. Please do not submit passwords, PINs, full card details or identity document numbers.
      </p>
    </form>
  )
}
