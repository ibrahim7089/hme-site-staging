import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import sharp from 'sharp'
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
const slotRequirements = {
  'page-hero': { width: 1920, height: 1080, ratio: 16 / 9 },
  'home-hero': { width: 1200, height: 1500, ratio: 4 / 5 },
  'page-section': { width: 1200, height: 800, ratio: 3 / 2 },
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
    const slot = String(form.get('slot') || '') as keyof typeof slotRequirements
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

    const image = sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate()
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height) {
      return cmsJson({ error: 'The image dimensions could not be read', code: 'INVALID_IMAGE' }, 415, requestId)
    }
    if (slot && slot in slotRequirements) {
      const requirement = slotRequirements[slot]
      const actualRatio = metadata.width / metadata.height
      if (metadata.width < requirement.width * 0.7 || metadata.height < requirement.height * 0.7) {
        return cmsJson({
          error: `Image is too small for this position. Use at least ${requirement.width} × ${requirement.height} px`,
          code: 'IMAGE_DIMENSIONS_TOO_SMALL',
        }, 422, requestId)
      }
      if (Math.abs(actualRatio - requirement.ratio) / requirement.ratio > 0.18) {
        return cmsJson({
          error: `Image shape is unsuitable for this position. Crop it to approximately ${requirement.width} × ${requirement.height} px`,
          code: 'IMAGE_RATIO_MISMATCH',
        }, 422, requestId)
      }
    }
    const optimized = await image
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4, smartSubsample: true })
      .toBuffer()

    const year = new Date().getUTCFullYear()
    const pathname = `cms/${year}/${randomUUID()}.webp`
    const uploaded = await put(pathname, optimized, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
    })

    return cmsJson({
      url: uploaded.url,
      pathname: uploaded.pathname,
      originalSize: file.size,
      size: optimized.byteLength,
      width: metadata.width,
      height: metadata.height,
      type: 'image/webp',
    }, 201, requestId)
  } catch (error) {
    return cmsError(error, requestId)
  }
}
