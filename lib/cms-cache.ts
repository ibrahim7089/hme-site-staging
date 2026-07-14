import 'server-only'

import { revalidatePath, revalidateTag } from 'next/cache'
import type { CmsContentType } from './cms-validation'

export const CMS_TAG = 'hme-published-content'

const pathsByType: Record<CmsContentType, string[]> = {
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
  for (const path of pathsByType[contentType]) {
    revalidatePath(path)
  }
}
