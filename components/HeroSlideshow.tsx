'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { PageHeroSlide } from '@/lib/page-content'

const AUTO_ADVANCE_MS = 6500

export default function HeroSlideshow({ slides }: { slides: PageHeroSlide[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const touchStartX = useRef<number | null>(null)

  const showPrevious = () => setActive((current) => (current - 1 + count) % count)
  const showNext = () => setActive((current) => (current + 1) % count)

  useEffect(() => {
    if (count <= 1 || paused) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % count)
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [active, count, paused])

  const wrapRef = useRef<HTMLDivElement>(null)

  if (count === 0) return null

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null }}
      onTouchEnd={(event) => {
        const start = touchStartX.current
        const end = event.changedTouches[0]?.clientX
        touchStartX.current = null
        if (start === null || end === undefined || Math.abs(end - start) < 45 || count <= 1) return
        if (end < start) showNext()
        else showPrevious()
      }}
      onKeyDown={(event) => {
        if (count <= 1) return
        if (event.key === 'ArrowLeft') showPrevious()
        if (event.key === 'ArrowRight') showNext()
      }}
      tabIndex={count > 1 ? 0 : undefined}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/25 bg-[#071f46] shadow-[0_24px_70px_rgba(2,17,43,0.36)] ring-1 ring-[#75b8ff]/10 sm:rounded-[22px] md:aspect-[96/41]">
        {slides.map((slide, index) => (
          <div
            key={`${slide.image}-${index}`}
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{ opacity: index === active ? 1 : 0 }}
            aria-hidden={index === active ? undefined : true}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              aria-hidden="true"
              sizes="(max-width: 767px) 94vw, (max-width: 1279px) 59vw, 61vw"
              className="scale-110 object-cover opacity-30 blur-2xl saturate-75"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,28,64,0.58),rgba(9,45,93,0.16)_36%,rgba(9,45,93,0.16)_64%,rgba(5,28,64,0.58))]" aria-hidden="true" />
            <Image
              src={slide.image}
              alt={slide.imageAlt}
              fill
              priority={index === 0}
              sizes="(max-width: 767px) 94vw, (max-width: 1279px) 59vw, 61vw"
              className="object-contain drop-shadow-[0_14px_24px_rgba(0,15,38,0.24)]"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="mt-4 flex min-h-11 items-center justify-center gap-1.5 text-white sm:mt-5 sm:gap-2" aria-label="Banner controls">
          <button type="button" onClick={showPrevious} aria-label="Show previous banner" className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? "Play banner slideshow" : "Pause banner slideshow"}
            aria-pressed={paused}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {paused ? <Play className="ml-0.5 h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
          </button>

          <div className="mx-1 flex items-center gap-2 rounded-full border border-white/15 bg-navy-deep/35 px-3 py-2.5 backdrop-blur-sm sm:mx-2" role="tablist" aria-label="Choose a banner">
            {slides.map((slide, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Show banner ${index + 1}${slide.imageAlt ? `: ${slide.imageAlt}` : ''}`}
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                  index === active ? 'w-8 bg-brand-red' : 'w-2.5 bg-white/45 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          <button type="button" onClick={showNext} aria-label="Show next banner" className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      <p className="sr-only" aria-live="polite">Banner {active + 1} of {count}: {slides[active]?.imageAlt}</p>
    </div>
  )
}
