import SectionHeading from "./SectionHeading";

export const faqs = [
  { q: "Are the rates on the website final?",
    a: "Rates shown online are indicative and updated throughout the day. The final rate is confirmed at the branch at the time of your transaction." },
  { q: "What do I need to bring to exchange currency or send money?",
    a: "Please bring a valid identification document (MyKad, passport or other accepted ID). For a money transfer, you will also need your beneficiary's details. Larger transactions may require additional verification in line with regulatory requirements." },
  { q: "How does currency booking work?",
    a: "Choose your currency and amount, submit a booking, and collect at your selected branch within the stated collection window. Payment is completed at the counter." },
  { q: "Is HME licensed?",
    a: "Yes. Hasani Munawarah Exchange Sdn Bhd is a licensed Money Services Business regulated in Malaysia, operating currency exchange and money transfer services." },
  { q: "Can businesses use HME services?",
    a: "Yes. HME supports SMEs and corporates with foreign currency and money transfer requirements. Visit our Corporate Services page or contact us to discuss your needs." },
  { q: "How do I make a complaint or give feedback?",
    a: "You can raise any issue through our Contact Us page, by phone, or at any branch. Details of our complaint handling channel are on the Compliance & Customer Protection page." },
];

export default function FAQSection({ limit }: { limit?: number }) {
  const items = limit ? faqs.slice(0, limit) : faqs;
  return (
    <section className="bg-cloud py-20">
      <div className="wrap">
        <SectionHeading center eyebrow="FAQ" title="Common questions" />
        <div className="mx-auto mt-9 max-w-3xl">
          {items.map((f, i) => (
            <details key={f.q} open={i === 0}
              className="group mb-2.5 overflow-hidden rounded-tile border border-line bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-display text-[15px] font-bold text-navy [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-xl font-semibold text-brand-blue transition group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-slate2">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
