export default function PageHero({
  eyebrow, title, lead,
}: { eyebrow: string; title: string; lead: string }) {
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
