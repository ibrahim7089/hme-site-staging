import StepsCard from "./StepsCard";

export default function RemittanceSteps() {
  return (
    <StepsCard dark ctaRed heading="Send money in 4 simple steps"
      tag="International money transfer through HME"
      ctaLabel="View Money Transfer Rates" ctaHref="/money-transfer-rates"
      steps={[
        { title: "Check the money transfer rate", note: "View today's rate for your destination country." },
        { title: "Visit a branch or submit an inquiry", note: "Bring your ID and beneficiary details." },
        { title: "Complete verification", note: "Quick, secure customer verification at the counter." },
        { title: "Send and receive confirmation", note: "Get your receipt and transaction reference." },
      ]} />
  );
}
