import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import { generateBranchSummaries, getBranchStandings } from '@/lib/google-reviews-service'

export const runtime = 'nodejs'
// Summarising a batch of branches is several model calls back to back.
export const maxDuration = 60

export async function GET(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    await requireCmsPermission('reviews.manage')
    const branches = await getBranchStandings()
    return cmsJson({ branches }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}

/** Writes AI summaries for branches that need one. `force` rewrites them all. */
export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    await requireCmsPermission('reviews.manage')
    const body = await request.json().catch(() => ({})) as { force?: boolean }
    const result = await generateBranchSummaries({ force: Boolean(body.force) })
    const branches = await getBranchStandings()
    return cmsJson({ ...result, branches }, 200, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
