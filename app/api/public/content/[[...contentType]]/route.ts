import { CmsNotConfiguredError } from '@/lib/cms-db'
import { cmsJson } from '@/lib/cms-http'
import { getCmsPublishedSnapshot } from '@/lib/cms-service'
import { normalizeContentType } from '@/lib/cms-validation'

export const runtime = 'nodejs'

type Context = { params: Promise<{ contentType?: string[] }> }

export async function GET(_request: Request, context: Context) {
  try {
    const { contentType: segments } = await context.params
    const type = segments?.[0] ? normalizeContentType(segments[0]) : null
    const snapshot = await getCmsPublishedSnapshot()
    const headers = {
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400',
    }

    if (segments?.[0]) {
      if (!type) return cmsJson({ error: 'Published content type not found', code: 'NOT_FOUND' }, 404)
      if (!snapshot.content[type]) {
        return cmsJson({ error: 'No approved content has been published', code: 'NOT_PUBLISHED' }, 404)
      }
      return Response.json({
        content: snapshot.content[type],
        meta: snapshot.meta.versions[type] || {},
      }, { headers })
    }

    return Response.json(snapshot, { headers })
  } catch (error) {
    if (error instanceof CmsNotConfiguredError) {
      return cmsJson({ error: 'Published content is not configured', code: 'CMS_NOT_CONFIGURED' }, 503)
    }
    console.error('[public-content]', error)
    return cmsJson({ error: 'Published content is temporarily unavailable', code: 'CONTENT_UNAVAILABLE' }, 503)
  }
}
