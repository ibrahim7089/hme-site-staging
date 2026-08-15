'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { PageHeroSlide } from '@/lib/page-content'

const AUTO_ADVANCE_MS = 6500

export default function HeroSlideshow({ slides }: { slides: PageHeroSlide[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  useEffect(() => {
    if (count <= 1 || paused) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % count)
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [count, paused])

  const wrapRef = useRef<HTMLDivElement>(null)

  if (count === 0) return null

  return (
    <div
      ref={wrapRef}
      className="relative aspect-[96/41] w-full overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_24px_70px_rgba(4,24,57,0.32)] sm:rounded-[22px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
    >
      {slides.map((slide, index) => (
        <div
          key={`${slide.image}-${index}`}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: index === active ? 1 : 0 }}
          aria-hidden={index === active ? undefined : true}
        >
          <Image
            src={slide.image}
            alt={slide.imageAlt}
            fill
            priority={index === 0}
            sizes="(max-width: 767px) 94vw, (max-width: 1279px) 59vw, 61vw"
            className="object-cover"
          />
        </div>
      ))}

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-[1] flex -translate-x-1/2 gap-2 rounded-full bg-navy-deep/45 px-3 py-2 backdrop-blur-sm" role="tablist" aria-label="Choose a banner">
          {slides.map((slide, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show banner ${index + 1}${slide.imageAlt ? `: ${slide.imageAlt}` : ''}`}
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === active ? 'w-7 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
