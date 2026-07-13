import CurrencyConverterCard from "./CurrencyConverterCard";

const stats = [
  ["40+", "Years combined experience"],
  ["50+", "Locations nationwide"],
  ["150K+", "Payout locations worldwide"],
];

export default function HeroSection() {
  return (
    <section className="relative z-10 bg-cloud pb-16 pt-0 md:pb-20">
      <div className="wrap relative -mt-10 grid items-center gap-8 md:-mt-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="eyebrow mb-3">One trusted network</p>
          <h2 className="mb-4 text-[clamp(28px,4vw,42px)] font-extrabold leading-tight text-navy">
            Your money services, made simpler.
          </h2>
          <p className="max-w-xl text-[16px] leading-relaxed text-slate2">
            Exchange foreign currency, send money overseas, reserve currency and find your nearest HME branch from one place.
          </p>
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-line pt-6">
            {stats.map(([number, label]) => (
              <div key={label}>
                <b className="block font-display text-xl font-extrabold text-brand-blue sm:text-2xl">{number}</b>
                <span className="mt-1 block text-[11px] leading-tight text-slate2 sm:text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[460px] lg:pt-16">
          <CurrencyConverterCard />
        </div>
      </div>
    </section>
  );
}
