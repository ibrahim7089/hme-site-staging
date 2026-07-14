import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const allowedTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length))
}

function signatureMatches(bytes: Uint8Array, type: keyof typeof allowedTypes) {
  if (type === 'image/jpeg') {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (type === 'image/png') {
    return bytes.length > 8 &&
      bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG' &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  }
  if (type === 'image/webp') {
    return bytes.length > 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP'
  }
  return bytes.length > 12 && ascii(bytes, 4, 4) === 'ftyp' &&
    ['avif', 'avis'].includes(ascii(bytes, 8, 4))
}

export async function POST(request: Request) {
  const requestId = cmsRequestId(request)
  try {
    assertCmsOrigin(request)
    await requireCmsPermission('publishing.create')

    const form = await request.formData()
    const file = form.get('image')
    if (!(file instanceof File)) {
      return cmsJson({ error: 'Choose an image to upload', code: 'IMAGE_REQUIRED' }, 400, requestId)
    }

    const type = file.type as keyof typeof allowedTypes
    if (!(type in allowedTypes)) {
      return cmsJson({
        error: 'Use a JPG, PNG, WebP or AVIF image',
        code: 'UNSUPPORTED_IMAGE',
      }, 415, requestId)
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return cmsJson({
        error: 'Image must be smaller than 4 MB',
        code: 'IMAGE_TOO_LARGE',
      }, 413, requestId)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    if (!signatureMatches(bytes, type)) {
      return cmsJson({
        error: 'The selected file is not a valid image',
        code: 'INVALID_IMAGE',
      }, 415, requestId)
    }

    const year = new Date().getUTCFullYear()
    const pathname = `cms/${year}/${randomUUID()}.${allowedTypes[type]}`
    const uploaded = await put(pathname, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: type,
    })

    return cmsJson({
      url: uploaded.url,
      pathname: uploaded.pathname,
      size: file.size,
      type,
    }, 201, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
