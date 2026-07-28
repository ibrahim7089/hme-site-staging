import { z } from 'zod'

export const enquiryTypes = [
  'general',
  'rates',
  'transfer',
  'booking',
  'business',
  'agent',
  'career',
  'complaint',
  'privacy',
] as const

export type EnquiryType = (typeof enquiryTypes)[number]

export const enquiryTypeLabels: Record<EnquiryType, string> = {
  general: 'General enquiry',
  rates: 'Rates and availability',
  transfer: 'Money transfer',
  booking: 'Currency booking',
  business: 'Business services',
  agent: 'Become an HME agent',
  career: 'Career enquiry',
  complaint: 'Feedback or complaint',
  privacy: 'Privacy request',
}

export const enquirySchema = z.object({
  type: z.enum(enquiryTypes),
  subject: z.string().trim().max(160).optional().default(''),
  name: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().email('Enter a valid email address').max(254),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(30),
  location: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(20, 'Please provide at least 20 characters').max(4000),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']),
  consent: z.literal(true, { error: 'Please confirm that HME may use these details to respond' }),
  website: z.string().max(200).optional().default(''),
  startedAt: z.number().int().positive(),
}).strict()

export type EnquiryPayload = z.infer<typeof enquirySchema>

export function normaliseEnquiryType(value: string | string[] | undefined): EnquiryType {
  const candidate = Array.isArray(value) ? value[0] : value
  return enquiryTypes.includes(candidate as EnquiryType) ? candidate as EnquiryType : 'general'
}
