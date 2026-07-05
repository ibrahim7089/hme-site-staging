/* eslint-disable @next/next/no-img-element */
export default function PageHero({
  eyebrow, title, lead, image,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  image?: string;
}) {
  if (image) {
    return (
      <section className="relative h-[420px] overflow-hidden text-white md:h-[500px]">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/95 via-navy-deep/65 to-navy-deep/35" />
        <div className="wrap relative flex h-full flex-col justify-end pb-12 pt-[88px]">
          <span className="eyebrow !text-[#FF8A9A]">{eyebrow}</span>
          <h1 className="mt-3 max-w-3xl text-[clamp(30px,4.2vw,46px)] font-extrabold leading-tight">{title}</h1>
          <p className="mt-4 max-w-2xl text-[16.5px] text-[#B9C8E0]">{lead}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[radial-gradient(900px_420px_at_80%_-20%,#164C9E_0%,#0B2E63_45%,#071E44_100%)] text-white">
      <div className="wrap pb-16 pt-[88px] md:pb-20 md:pt-24">
        <span className="eyebrow !text-[#FF8A9A]">{eyebrow}</span>
        <h1 className="mt-3 max-w-3xl text-[clamp(30px,4.2vw,46px)] font-extrabold leading-tight">{title}</h1>
        <p className="mt-4 max-w-2xl text-[16.5px] text-[#B9C8E0]">{lead}</p>
      </div>
    </section>
  );
}
