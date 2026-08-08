import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  DollarSign,
  GraduationCap,
  MessageSquareText,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { site } from "@/lib/site";
import agentHandshake from "@/public/images/agent-handshake.webp";
import { getPublishedPageContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Be Our Agent | Partner with HME Money Services",
  description:
    "Talk to HME about becoming an agent for currency exchange and money transfer services, subject to due diligence, regulatory requirements and approval.",
};

const benefits = [
  {
    icon: DollarSign,
    title: "Commercial opportunity",
    desc: "Learn about available service lines and commercial terms for approved HME agent locations.",
  },
  {
    icon: ShieldCheck,
    title: "Regulated network",
    desc: "Agent appointments are assessed under HME's applicable regulatory, compliance and operational requirements.",
  },
  {
    icon: GraduationCap,
    title: "Training and onboarding",
    desc: "Approved agents receive relevant system, operational and AML/CFT guidance before going live.",
  },
  {
    icon: TrendingUp,
    title: "Operational infrastructure",
    desc: "Approved locations can access the systems and processes needed to deliver assigned HME services.",
  },
  {
    icon: Users,
    title: "Agent support",
    desc: "A support contact helps approved agents with operational questions, escalations and compliance matters.",
  },
  {
    icon: Zap,
    title: "Structured onboarding",
    desc: "HME guides suitable applicants through due diligence, assessment, agreement and onboarding stages.",
  },
];

const steps = [
  {
    num: "01",
    title: "Start a conversation",
    desc: "Share your company, premises, proposed location and contact details with the partnerships team.",
  },
  {
    num: "02",
    title: "Due diligence and assessment",
    desc: "HME will explain the required business checks, documents, site assessment and approval process.",
  },
  {
    num: "03",
    title: "Agreement and onboarding",
    desc: "Approved applicants complete the relevant agreement, training and operational setup before launch.",
  },
];

const eligibility = [
  "Registered business in Malaysia (SSM-registered Sdn Bhd or Bhd companies)",
  "Physical business premises with public access",
  "Willing to complete AML/CFT training and comply with applicable regulatory requirements",
  "Reliable internet access and ability to operate HME systems",
  "Good standing with no known financial crime convictions or regulatory sanctions",
];

export default async function AgentPage() {
  const managed = await getPublishedPageContent("be-our-agent");
  const hero = managed?.hero;
  const benefitsSection = managed?.sections.find((section) => section.id === "benefits");
  const processSection = managed?.sections.find((section) => section.id === "process");
  const eligibilitySection = managed?.sections.find((section) => section.id === "eligibility");
  const displayedBenefits = benefitsSection
    ? benefitsSection.items.filter((item) => item.active).map((item, index) => ({
      icon: benefits[index % benefits.length].icon,
      title: item.title,
      desc: item.body,
    }))
    : benefits;
  const displayedSteps = processSection
    ? processSection.items.filter((item) => item.active).map((item, index) => ({
      num: item.meta || String(index + 1).padStart(2, "0"),
      title: item.title,
      desc: item.body,
    }))
    : steps;
  const displayedEligibility = eligibilitySection
    ? eligibilitySection.items.filter((item) => item.active).map((item) => item.title)
    : eligibility;
  const message = encodeURIComponent(
    "Hi HME, I am interested in becoming an agent. Company name: [company], SSM no.: [number], Business type: [type], Proposed location: [location], Contact person: [name].",
  );
  const whatsappUrl = `${site.whatsapp}?text=${message}`;

  return (
    <>
      <section className="relative flex min-h-[620px] items-center overflow-hidden bg-navy-deep pt-[72px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_50%,rgba(74,144,217,0.22)_0%,transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/90 to-navy-deep/20" />
        <Image
          src={hero?.image || agentHandshake}
          alt={hero?.imageAlt || ""}
          aria-hidden={hero?.imageAlt ? undefined : true}
          priority
          {...(hero?.image ? { width: 1122, height: 1402 } : {})}
          sizes="(max-width: 767px) 80vw, 55vw"
          className="absolute bottom-0 right-[-18%] h-[58%] w-auto object-contain object-bottom opacity-55 sm:right-[-8%] md:right-0 md:h-[78%] md:opacity-90 lg:right-[4%]"
        />
        <div className="wrap relative py-20 text-white">
          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7FB2F5]">{hero?.eyebrow || "Be Our Agent"}</p>
            <h1 className="text-[clamp(34px,5vw,58px)] font-extrabold leading-[1.08]">
              {hero?.title || "Grow with a trusted Malaysian MSB network"}
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[#D4E0F2]">
              {hero?.lead || "If you operate an established business in Malaysia, talk to HME about agent opportunities and the requirements for your proposed location."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#apply" className="btn-red">Start an Agent Inquiry</a>
              <Link href="/enquiry?type=agent&subject=Agent%20partnership" className="btn-ghost">Send Partnership Enquiry</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-line bg-white py-9">
        <div className="wrap grid grid-cols-3 gap-4 text-center">
          {[
            ["50+", "Locations nationwide"],
            ["Licensed", "Malaysian MSB network"],
            ["150K+", "Global payout locations"],
          ].map(([number, label]) => (
            <div key={label}>
              <p className="text-[clamp(20px,3vw,32px)] font-extrabold text-brand-blue">{number}</p>
              <p className="mt-1 text-[12px] leading-tight text-slate2 sm:text-[13px]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {benefitsSection?.visible !== false && <section className="py-16 md:py-20">
        <div className="wrap">
          <SectionHeading center eyebrow={benefitsSection?.eyebrow || "Why partner with HME"}
            title={benefitsSection?.heading || "Support for approved agents"}
            lead={benefitsSection?.body || "Explore the systems, training and operational support available to suitable businesses appointed to the HME network."} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedBenefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-card border border-line bg-white p-6 shadow-soft">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-bluesoft">
                  <Icon className="h-5 w-5 text-brand-blue" strokeWidth={1.75} />
                </span>
                <h3 className="mb-2 font-display text-[15px] font-bold text-navy">{title}</h3>
                <p className="text-[13.5px] leading-relaxed text-slate2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {processSection?.visible !== false && <section className="bg-cloud py-16 md:py-20">
        <div className="wrap">
          <SectionHeading center eyebrow={processSection?.eyebrow || "The Process"} title={processSection?.heading || "What happens next"} lead={processSection?.body || undefined} />
          <div className="relative mt-12 grid gap-9 md:grid-cols-3">
            <div className="absolute left-[16.67%] right-[16.67%] top-7 hidden h-px bg-line md:block" />
            {displayedSteps.map(({ num, title, desc }) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-5 grid h-14 w-14 place-items-center rounded-full bg-brand-blue text-lg font-extrabold text-white shadow-md">
                  {num}
                </div>
                <h3 className="mb-2 font-display text-[16px] font-bold text-navy">{title}</h3>
                <p className="max-w-xs text-[13.5px] leading-relaxed text-slate2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {eligibilitySection?.visible !== false && <section className="py-16 md:py-20" id="apply">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div>
            <SectionHeading eyebrow={eligibilitySection?.eyebrow || "Eligibility"} title={eligibilitySection?.heading || "Who can inquire?"} />
            <p className="mt-4 text-[15px] leading-relaxed text-slate2">
              {eligibilitySection?.body || "HME welcomes inquiries from new and established businesses across Malaysia. Appointment remains subject to due diligence, site assessment, regulatory requirements and approval."}
            </p>
            <ul className="mt-6 space-y-3.5">
              {displayedEligibility.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-slate2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand-blue" strokeWidth={1.75} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card border border-line bg-white p-7 shadow-soft sm:p-9">
            <p className="eyebrow mb-3">Agent inquiry</p>
            <h2 className="text-2xl font-bold text-navy">Start with your business details</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate2">
              Include the following information so the partnerships team can understand your proposed location:
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Company and SSM number", "Business type", "Proposed location", "Contact person and phone"].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-xl bg-cloud p-3 text-sm text-slate2">
                  <CheckCircle2 className="h-4 w-4 flex-none text-brand-blue" />{item}
                </span>
              ))}
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-red">
                <MessageCircle className="h-4 w-4" /> WhatsApp HME
              </a>
              <Link href="/enquiry?type=agent&subject=Agent%20partnership" className="btn-primary">
                <MessageSquareText className="h-4 w-4" /> Enquiry Form
              </Link>
            </div>
            <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-slate2">
              An inquiry does not guarantee appointment. HME will advise suitable applicants about documents and next steps.
            </p>
          </div>
        </div>
      </section>}
    </>
  );
}
