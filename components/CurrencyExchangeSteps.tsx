import StepsCard from "./StepsCard";

export default function CurrencyExchangeSteps() {
  return (
    <StepsCard heading="Exchange currency with confidence"
      tag="Foreign currency at HME branches"
      ctaLabel="Book Your Currency" ctaHref="/currency-booking"
      steps={[
        { title: "Select your currency", note: "Over 30 currencies handled across the network." },
        { title: "Check today's rate", note: "Buy and sell rates published daily online." },
        { title: "Book online or visit a branch", note: "Reserve your amount for guaranteed availability." },
        { title: "Pay and collect", note: "Fast counter service with a proper receipt." },
      ]} />
  );
}
