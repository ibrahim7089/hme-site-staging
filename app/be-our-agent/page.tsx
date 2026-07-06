/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import {
  DollarSign, ShieldCheck, GraduationCap, TrendingUp,
  Users, Zap, CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Be Our Agent | Partner with HME Money Services",
  description:
    "Become an HME agent and offer licensed currency exchange and money transfer services at your location — with training, compliance and operational support.",
};

const benefits = [
  {
    icon: DollarSign,
    title: "Multiple revenue streams",
    desc: "Earn commission on every currency exchange and international money transfer transaction processed at your location.",
  },
  {
    icon: ShieldCheck,
    title: "Fully licensed & regulated",
    desc: "Operate under HME's MSB licence — no separate licensing required. We handle the regulatory obligations so you can focus on serving customers.",
  },
  {
    icon: GraduationCap,
    title: "Training & onboarding support",
    desc: "Full AML/CFT training, system onboarding and compliance guidance provided before you go live — and ongoing throughout the partnership.",
  },
  {
    icon: TrendingUp,
    title: "Established rate infrastructure",
    desc: "Access HME's live rate feeds and pricing systems. Competitive buy/sell spreads that attract customers and drive repeat business.",
  },
  {
    icon: Users,
    title: "Dedicated agent support",
    desc: "A dedicated point of contact for day-to-day operational queries, escalations and compliance questions.",
  },
  {
    icon: Zap,
    title: "Fast onboarding",
    desc: "Streamlined onboarding process. From application to first transaction, our team works to get you operational quickly.",
  },
];

const steps = [
  {
    num: "01",
    title: "Submit your application",
    desc: "Fill out the form below with your business details. Our team reviews every application within 3 business days.",
  },
  {
    num: "02",
    title: "Due diligence & approval",
    desc: "We conduct standard KYB checks and a site assessment. Successful applicants receive an agent agreement.",
  },
  {
    num: "03",
    title: "Onboard & start earning",
    desc: "Complete training, get system access and go live. Your dedicated support contact is available from day one.",
  },
];

const eligibility = [
  "Registered business in Malaysia (SSM-registered sole proprietor, partnership or Sdn Bhd)",
  "Physical business premises with public access",
  "Willing to complete AML/CFT training and comply with MSB regulatory requirements",
  "Reliable internet access and ability to operate HME's systems",
  "Good standing — no prior financial crime convictions or regulatory sanctions",
];

const states = [
  "Johor","Kedah","Kelantan","Kuala Lumpur","Labuan","Malacca",
  "Negeri Sembilan","Pahang","Penang","Perak","Perlis","Putrajaya",
  "Sabah","Sarawak","Selangor","Terengganu",
];

export default function AgentPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-deep pt-[72px] min-h-[480px] md:min-h-[520px] flex items-center">
        {/* Radial glow */}
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(74,144,217,0.15)_0%,_transparent_70%)]" />
        {/* HME logo — decorative left fill */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[55%] max-h-[260px] w-auto object-contain opacity-[0.12] hidden lg:block"
        />
        {/* Handshake image */}
        <img
          src="/images/agent-handshake.png"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-[90%] max-h-[480px] w-auto object-contain object-bottom md:right-4 lg:right-16"
        />
        <div className="wrap relative py-16 text-white">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-blue">Be Our Agent</p>
          <h1 className="max-w-xl text-[clamp(30px,4.5vw,54px)] font-extrabold leading-[1.1]">
            Partner with Malaysia&rsquo;s growing MSB network
          </h1>
          <p className="mt-5 max-w-md text-[16px] text-white/70 leading-relaxed">
            Expand your business and earn additional revenue by offering licensed currency exchange and money transfer services at your location.
          </p>
          <a href="#apply" className="btn-red mt-8 inline-flex">Apply Now</a>
        </div>
      </section>

      {/* Stats band */}
      <div className="border-b border-line bg-white py-10">
        <div className="wrap grid grid-cols-3 gap-6 text-center">
          {[
            ["54+", "Active locations nationwide"],
            ["Licensed", "Under MSB Act 2011"],
            ["150K+", "Global payout network"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="text-[clamp(22px,3vw,34px)] font-extrabold text-brand-blue">{n}</p>
              <p className="mt-1 text-[13px] text-slate2">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <section className="py-20">
        <div className="wrap">
          <SectionHeading center eyebrow="Why partner with HME"
            title="Everything you need to grow"
            lead="Join a licensed network with the systems, training and support to run a compliant and profitable money services business." />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-card border border-line bg-white p-6 shadow-soft">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-bluesoft">
                  <Icon className="h-5 w-5 text-brand-blue" strokeWidth={1.75} />
                </span>
                <h3 className="mb-2 font-display text-[15px] font-bold text-navy">{title}</h3>
                <p className="text-[13.5px] leading-relaxed text-slate2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cloud py-20">
        <div className="wrap">
          <SectionHeading center eyebrow="The Process" title="How it works" />
          <div className="relative mt-14 grid gap-10 md:grid-cols-3">
            {/* connecting line */}
            <div className="absolute left-[16.67%] right-[16.67%] top-7 hidden h-px bg-line md:block" />
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-5 grid h-14 w-14 place-items-center rounded-full bg-brand-blue text-lg font-extrabold text-white shadow-md">
                  {num}
                </div>
                <h3 className="mb-2 font-display text-[16px] font-bold text-navy">{title}</h3>
                <p className="max-w-xs text-[13.5px] text-slate2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility + Form */}
      <section className="py-20" id="apply">
        <div className="wrap grid gap-14 lg:grid-cols-[1fr_1.1fr]">

          {/* Eligibility */}
          <div>
            <SectionHeading eyebrow="Eligibility" title="Who can apply?" />
            <p className="mt-4 text-[15px] text-slate2">
              We welcome applications from businesses of all types across Malaysia.
              If your premises have public access and you can meet our compliance
              requirements, we&rsquo;d love to hear from you.
            </p>
            <ul className="mt-6 space-y-3.5">
              {eligibility.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-slate2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand-blue" strokeWidth={1.75} />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[12px] text-mist">
              Agent appointments are subject to due diligence, site assessment and
              applicable BNM / MSB regulatory requirements.
            </p>
          </div>

          {/* Application form */}
          <div className="rounded-card border border-line bg-white p-7 shadow-soft">
            <h3 className="text-xl font-bold text-navy">Apply as Agent</h3>
            <p className="mt-1 text-[13.5px] text-slate2">
              Our team will review your application and be in touch within 3 business days.
            </p>
            <form className="mt-6 grid gap-4">
              {([
                ["Full Name", "text", true],
                ["Company Name", "text", true],
                ["Company Registration No. (SSM)", "text", false],
                ["Business Type / Nature of Business", "text", false],
                ["Phone Number", "tel", true],
                ["Email Address", "email", true],
              ] as const).map(([label, type, required]) => (
                <label key={label} className="grid gap-1.5 text-sm font-medium text-navy">
                  {label}{required && <span className="text-brand-red"> *</span>}
                  <input type={type} required={required}
                    className="rounded-xl border border-line px-4 py-3 text-sm font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" />
                </label>
              ))}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-navy">
                  Proposed State
                  <select defaultValue="" className="rounded-xl border border-line px-4 py-3 text-sm font-normal text-slate2 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15">
                    <option value="" disabled>Select state</option>
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-navy">
                  Proposed Location / Address
                  <input type="text" className="rounded-xl border border-line px-4 py-3 text-sm font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-medium text-navy">
                Tell us about your business<span className="text-brand-red"> *</span>
                <textarea required rows={4}
                  placeholder="Describe your business, customer base and why you'd like to become an HME agent…"
                  className="rounded-xl border border-line px-4 py-3 text-sm font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" />
              </label>

              <button type="button" className="btn-red mt-1 w-full justify-center">
                Submit Application
              </button>
              <p className="text-center text-[11.5px] text-mist">
                By submitting you agree to our{" "}
                <a href="/compliance/privacy-policy" className="underline hover:text-navy">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
