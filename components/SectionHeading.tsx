export default function SectionHeading({
  eyebrow, title, lead, center,
}: { eyebrow: string; title: string; lead?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center [&_.eyebrow]:justify-center [&_.sec-lead]:mx-auto" : ""}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="sec-title">{title}</h2>
      {lead && <p className="sec-lead">{lead}</p>}
    </div>
  );
}
