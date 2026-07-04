import Link from "next/link";

export default function AgentCTA() {
  return (
    <section className="bg-cloud py-20">
      <div className="wrap">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-3xl bg-gradient-to-r from-navy-deep via-navy to-[#123B7C] p-8 text-white md:grid-cols-[1.2fr_1fr] md:p-12
          after:absolute after:-right-24 after:-top-24 after:h-80 after:w-80 after:rounded-full after:bg-[radial-gradient(circle,rgba(225,25,49,.35),transparent_65%)] after:content-['']">
          <div className="relative z-10">
            <span className="eyebrow !text-[#FF8A9A]">Be Our Agent</span>
            <h2 className="my-3 text-[clamp(24px,3.4vw,34px)] font-extrabold">Grow with HME</h2>
            <p className="max-w-md text-[15.5px] text-[#B9C8E0]">
              Partner with a licensed Malaysian MSB network and expand access to
              reliable money services across your location.
            </p>
            <Link href="/be-our-agent" className="btn-red mt-6">Apply as Agent</Link>
          </div>
          <div className="relative z-10 flex flex-col gap-3">
            {[
              "Operate under a licensed, regulated network",
              "Training, compliance and operational support",
              "Exchange and money transfer revenue streams",
              "Established brand and rate infrastructure",
            ].map((t, i) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[13.5px] font-medium">
                <b className="font-mono text-xs text-[#7FB2F5]">{String(i + 1).padStart(2, "0")}</b> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
