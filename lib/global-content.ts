import { site } from './site'

export type GlobalContentPayload = {
  facebookUrl: string
  instagramUrl: string
  tiktokUrl: string
  linkedinUrl: string
  footerCopyright: string
}

export const globalContentTemplate: GlobalContentPayload = {
  facebookUrl: site.social.facebook,
  instagramUrl: site.social.instagram,
  tiktokUrl: site.social.tiktok,
  linkedinUrl: site.social.linkedin,
  footerCopyright: `© 2026 ${site.legalName}. All rights reserved.`,
}
