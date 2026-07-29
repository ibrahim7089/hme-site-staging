import { requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import type { EnquiryType } from '@/lib/enquiry'
import { listEnquiries, type EnquiryStatus } from '@/lib/enquiry-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const statuses = new Set<EnquiryStatus>(['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'])
const typePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('enquiries.view')
    const url = new URL(request.url)
    const rawStatus = url.searchParams.get('status')?.toUpperCase() || null
    const rawType = url.searchParams.get('type') || null
    if ((rawStatus && !statuses.has(rawStatus as EnquiryStatus)) ||
      (rawType && (!typePattern.test(rawType) || rawType.length > 48))) {
      return cmsJson({ error: 'Invalid enquiry filter', code: 'VALIDATION_ERROR' }, 400, requestId)
    }
    const result = await listEnquiries({
      status: rawStatus as EnquiryStatus | null,
      type: rawType as EnquiryType | null,
      search: url.searchParams.get('q') || '',
      limit: Number(url.searchParams.get('limit') || 200),
    })
    return cmsJson(result, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
