import StepsCard from "./StepsCard";

export default function CurrencyExchangeSteps() {
  return (
    <StepsCard heading="Exchange currency with confidence"
      tag="Foreign currency at HME branches"
      ctaLabel="Book Your Currency" ctaHref="/currency-booking"
      steps={[
        { title: "Select your currency", note: "Over 30 currencies handled across the network." },
        { title: "Check the available rate", note: "Review published rates or contact your chosen branch." },
        { title: "Ask about availability", note: "Send a booking inquiry or visit your preferred branch." },
        { title: "Pay and collect", note: "Fast counter service with a proper receipt." },
      ]} />
  );
}
