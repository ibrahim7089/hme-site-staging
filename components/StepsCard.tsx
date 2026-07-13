import Link from "next/link";

export type Step = { title: string; note: string };

export default function StepsCard({
  dark, heading, tag, steps, ctaLabel, ctaHref, ctaRed,
}: {
  dark?: boolean; heading: string; tag: string; steps: Step[];
  ctaLabel: string; ctaHref: string; ctaRed?: boolean;
}) {
  return (
    <div className={dark
      ? "rounded-card bg-gradient-to-br from-navy to-navy-deep p-7 text-white"
      : "rounded-card border border-line bg-white p-7"}>
      <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-navy"}`}>{heading}</h3>
      <span className={`mb-5 block text-[12.5px] ${dark ? "text-[#B9C8E0]" : "text-mist"}`}>{tag}</span>
      {steps.map((s, i) => (
        <div key={s.title} className={`flex items-start gap-4 py-3 ${i > 0 ? (dark ? "border-t border-white/10" : "border-t border-line") : ""}`}>
          <span className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] font-mono text-[13px] font-semibold
            ${dark ? "bg-white/10 text-[#7FB2F5]" : "bg-brand-bluesoft text-brand-blue"}`}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <b className="block font-display text-[14.5px]">{s.title}</b>
            <small className={`text-[12.5px] ${dark ? "text-[#B9C8E0]" : "text-slate2"}`}>{s.note}</small>
          </span>
        </div>
      ))}
      <Link href={ctaHref} className={`${ctaRed ? "btn-red" : "btn-primary"} mt-5 w-full`}>{ctaLabel}</Link>
    </div>
  );
}
