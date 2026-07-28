import 'server-only'

import { revalidatePath, revalidateTag } from 'next/cache'
import type { CmsContentType } from './cms-validation'

export const CMS_TAG = 'hme-published-content'

const pathsByType: Record<CmsContentType, string[]> = {
  pages: ['/', '/about', '/currency-exchange', '/money-transfer', '/currency-booking', '/corporate', '/biz-remit', '/be-our-agent', '/rates', '/money-transfer-rates', '/locate-us', '/promotions', '/media/news', '/media/blog', '/career', '/contact', '/enquiry', '/faq', '/compliance'],
  global: ['/', '/about', '/contact'],
  rates: ['/', '/rates', '/currency-exchange'],
  'transfer-rates': ['/money-transfer-rates'],
  promotions: ['/promotions'],
  branches: ['/', '/locate-us', '/currency-exchange'],
  news: ['/media/news'],
  blog: ['/media/blog'],
  careers: ['/career'],
  contact: ['/contact'],
}

export function invalidateCmsContent(contentType: CmsContentType) {
  revalidateTag(CMS_TAG, 'max')
  if (contentType === 'pages' || contentType === 'global') {
    revalidatePath('/', 'layout')
  }
  for (const path of pathsByType[contentType]) {
    revalidatePath(path)
  }
}
