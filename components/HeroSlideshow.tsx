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
      className="absolute inset-0 z-[3] overflow-hidden bg-navy-deep"
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
            sizes="100vw"
            className="object-contain"
          />
        </div>
      ))}

      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 z-[1] flex -translate-x-1/2 gap-2" role="tablist" aria-label="Choose a banner">
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
