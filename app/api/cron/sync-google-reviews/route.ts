import { cmsJson } from '@/lib/cms-http'
import { isGoogleAccountConnected } from '@/lib/google-business'
import { syncGoogleReviews } from '@/lib/google-reviews-service'

export const runtime = 'nodejs'
export const maxDuration = 60

// Vercel Cron calls this with `Authorization: Bearer ${CRON_SECRET}`.
// See vercel.json for the schedule. On the Hobby plan, cron jobs can only
// run once per day — upgrade to Pro (or click "Sync now" in /admin) for
// more frequent syncing.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  if (!(await isGoogleAccountConnected())) {
    return cmsJson({ skipped: 'not_connected' }, 200)
  }
  const summary = await syncGoogleReviews()
  return cmsJson(summary, 200)
}
