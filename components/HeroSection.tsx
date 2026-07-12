import CurrencyConverterCard from "./CurrencyConverterCard";

const stats = [
  ["40+", "Years combined experience"],
  ["50+", "Locations nationwide"],
  ["150K+", "Payout locations worldwide"],
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(1100px_600px_at_78%_-10%,#164C9E_0%,#0B2E63_45%,#071E44_100%)] text-white">
      <div className="wrap relative grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="mb-4 text-[clamp(34px,4.6vw,54px)] font-extrabold leading-[1.1]">
            All your money service<br />
            needs in <span className="text-[#7FB2F5]">one place.</span>
          </h1>
          <p className="mb-9 max-w-lg text-[17px] text-[#B9C8E0]">
            Exchange foreign currency, send money overseas, book your
            currency and find your nearest HME branch &mdash; one trusted Malaysian MSB network.
          </p>
          <div className="grid grid-cols-3 gap-4 sm:max-w-md">
            {stats.map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="mx-auto mb-2.5 grid h-[76px] w-[76px] place-items-center rounded-full border-2 border-[#7FB2F5]/40">
                  <b className="font-display text-lg font-extrabold leading-none sm:text-xl">{n}</b>
                </div>
                <span className="text-[11.5px] leading-tight text-mist">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[420px]">
          <CurrencyConverterCard />
        </div>
      </div>
    </section>
  );
}
