"use client";

export default function NewsletterBand() {
  return (
    <section className="bg-[radial-gradient(900px_400px_at_50%_-20%,#E8F0FC_0%,#F4F7FB_60%)] py-16">
      <div className="wrap text-center">
        <h2 className="mb-6 font-display text-[22px] font-extrabold text-navy sm:text-2xl">
          Share your email for rate alerts and updates
        </h2>
        <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            required
            placeholder="Type your email address"
            className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus-visible:border-brand-blue"
          />
          <button type="submit" className="btn-primary">Submit</button>
        </form>
      </div>
    </section>
  );
}
