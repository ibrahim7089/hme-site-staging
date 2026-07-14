import Image from "next/image";

export default function PageHero({
  eyebrow, title, lead, image, imageAlt = "", noOverlay, objectPosition = "center",
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
  image?: string;
  imageAlt?: string;
  noOverlay?: boolean;
  objectPosition?: string;
}) {
  const trustedImage = image && (
    image.startsWith("/") ||
    /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(image)
  ) ? image : null;

  return (
    <section className="relative min-h-[360px] overflow-hidden bg-[radial-gradient(900px_460px_at_82%_-20%,#1A5EB7_0%,#0B2E63_48%,#071E44_100%)] text-white md:min-h-[440px]">
      {trustedImage && (
        <>
          <Image
            src={trustedImage}
            alt={imageAlt}
            aria-hidden={imageAlt ? undefined : true}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition }}
          />
          {!noOverlay && <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/90 via-navy-deep/65 to-navy-deep/20" />}
        </>
      )}

      {!trustedImage && (
        <>
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute right-12 top-10 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute bottom-0 right-[18%] h-28 w-28 rounded-full bg-brand-blue/20 blur-2xl" />
          <svg aria-hidden="true" className="absolute right-[6%] top-1/2 hidden h-56 w-56 -translate-y-1/2 opacity-25 md:block" viewBox="0 0 240 240" fill="none">
            <circle cx="120" cy="120" r="116" stroke="white" />
            <ellipse cx="120" cy="120" rx="116" ry="45" stroke="white" />
            <ellipse cx="120" cy="120" rx="48" ry="116" stroke="white" />
            <path d="M4 120h232M120 4v232" stroke="white" />
          </svg>
        </>
      )}

      {(eyebrow || title || lead) && (
        <div className="wrap relative flex min-h-[360px] flex-col justify-end pb-12 pt-28 md:min-h-[440px] md:pb-16">
          {eyebrow && <span className="eyebrow !text-[#FF9AAA]">{eyebrow}</span>}
          {title && <h1 className="mt-3 max-w-3xl text-[clamp(32px,4.5vw,52px)] font-extrabold leading-[1.1]">{title}</h1>}
          {lead && <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#D4E0F2] md:text-[17px]">{lead}</p>}
        </div>
      )}
    </section>
  );
}
