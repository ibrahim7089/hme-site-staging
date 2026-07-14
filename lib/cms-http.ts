import 'server-only'

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { CmsAuthError } from './cms-auth'
import { CmsNotConfiguredError } from './cms-db'
import { CmsWorkflowError } from './cms-service'

export function cmsRequestId(request: Request) {
  return request.headers.get('x-request-id') || randomUUID()
}

export function cmsJson(data: unknown, status = 200, requestId?: string) {
  return NextResponse.json(data, {
    status,
    headers: requestId ? { 'x-request-id': requestId } : undefined,
  })
}

export function cmsError(error: unknown, requestId?: string) {
  if (error instanceof CmsAuthError || error instanceof CmsWorkflowError) {
    return cmsJson({ error: error.message, code: error.code, request_id: requestId }, error.status, requestId)
  }
  if (error instanceof CmsNotConfiguredError) {
    return cmsJson({
      error: 'CMS database is not configured',
      code: 'CMS_NOT_CONFIGURED',
      request_id: requestId,
    }, 503, requestId)
  }
  if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return cmsJson({ error: 'A record with this value already exists', code: 'CONFLICT' }, 409, requestId)
  }
  console.error('[cms]', { requestId, error })
  return cmsJson({ error: 'CMS request failed', code: 'INTERNAL_ERROR', request_id: requestId }, 500, requestId)
}
