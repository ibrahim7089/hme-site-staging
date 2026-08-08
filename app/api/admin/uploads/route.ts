import { randomUUID } from 'node:crypto'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { assertCmsOrigin, requireCmsPermission } from '@/lib/cms-auth'
import { cmsError, cmsJson, cmsRequestId } from '@/lib/cms-http'
import {
  heroImageSpec,
  homeHeroImageSpec,
  homeHeroSlideImageSpec,
  sectionImageSpec,
  type CmsImageSpec,
} from '@/lib/page-content'

export const runtime = 'nodejs'

// Fallback cap for uploads with no recognized slot; real limits come from
// each spec's maxBytes below so the client-shown limit always matches what
// the server actually enforces.
const DEFAULT_MAX_IMAGE_BYTES = 4 * 1024 * 1024
const allowedTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const
const slotRequirements: Record<CmsImageSpec['key'], { width: number; height: number; ratio: number; maxBytes: number }> = {
  'page-hero': { width: heroImageSpec.width, height: heroImageSpec.height, ratio: heroImageSpec.width / heroImageSpec.height, maxBytes: heroImageSpec.maxBytes },
  'home-hero': { width: homeHeroImageSpec.width, height: homeHeroImageSpec.height, ratio: homeHeroImageSpec.width / homeHeroImageSpec.height, maxBytes: homeHeroImageSpec.maxBytes },
  'page-section': { width: sectionImageSpec.width, height: sectionImageSpec.height, ratio: sectionImageSpec.width / sectionImageSpec.height, maxBytes: sectionImageSpec.maxBytes },
  'home-hero-slide': { width: homeHeroSlideImageSpec.width, height: homeHeroSlideImageSpec.height, ratio: homeHeroSlideImageSpec.width / homeHeroSlideImageSpec.height, maxBytes: homeHeroSlideImageSpec.maxBytes },
}

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
    const maxBytes = (slot && slot in slotRequirements) ? slotRequirements[slot].maxBytes : DEFAULT_MAX_IMAGE_BYTES
    if (file.size <= 0 || file.size > maxBytes) {
      return cmsJson({
        error: `Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB`,
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

    // sharp's output buffer can be backed by memory the runtime's fetch()
    // refuses to send ("SharedArrayBuffer is not allowed"). Copying into a
    // fresh Uint8Array guarantees a plain, non-shared ArrayBuffer, then we
    // wrap that same memory as a Buffer since put() requires one.
    const freshBytes = new Uint8Array(optimized)
    const uploadBuffer = Buffer.from(freshBytes.buffer, freshBytes.byteOffset, freshBytes.byteLength)

    const year = new Date().getUTCFullYear()
    const pathname = `cms/${year}/${randomUUID()}.webp`
    const uploaded = await put(pathname, uploadBuffer, {
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
