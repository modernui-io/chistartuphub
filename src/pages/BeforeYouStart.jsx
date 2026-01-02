import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";

export default function BeforeYouStart() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-900 font-sans text-slate-900 selection:bg-blue-100 selection:text-slate-900">
      <SEO
        title="Before You Start"
        description="Understanding ChiStartupHub's approach to founder resources - honest, contextual, and built for Chicago."
        keywords="startup resources, founder toolkit, Chicago startups, honest guidance"
      />

      {/* Background (Chicago Night) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 grayscale blur-[2px]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80')`
        }}
      />
      {/* Heavy Overlay for text pop */}
      <div className="fixed inset-0 z-0 bg-slate-950/90 mix-blend-multiply" />

      {/* Main Stage */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-32 md:py-40">

        {/* THE "WHITE PAPER" ARTIFACT */}
        <motion.article
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="group relative w-full max-w-2xl bg-[#fafafa] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] rounded-[1px] md:max-w-3xl"
        >
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />

          <div className="px-8 py-16 md:px-20 md:py-24">

            {/* A. THE HEADER (Editorial Style) */}
            <header className="mb-16 text-center">
              <span className="mb-6 inline-block border-b border-slate-300 pb-1 font-sans text-xs font-bold tracking-[0.3em] text-slate-400 uppercase">
                01 — Introduction
              </span>

              <h1 className="font-serif text-5xl font-medium tracking-tight text-slate-900 md:text-6xl">
                Before You Start
              </h1>
            </header>

            {/* B. THE LEDE (The Hook) */}
            <blockquote className="mb-16 border-l-4 border-slate-900 pl-6 md:pl-8">
              <p className="font-serif text-2xl italic leading-relaxed text-slate-800 md:text-3xl">
                "Information asymmetry is a capital access barrier. ChiStartupHub exists to reduce that barrier by making the ecosystem easier to navigate."
              </p>
            </blockquote>

            {/* C. THE CONTENT (Left Aligned & Structured) */}
            <div className="space-y-16">

              {/* Section 1: The Reality */}
              <section>
                <h3 className="mb-6 font-sans text-sm font-bold tracking-widest text-slate-400 uppercase">
                  The Reality
                </h3>
                <div className="max-w-none font-sans text-slate-600 text-lg leading-8">
                  <p className="mb-6">
                    This hub is built by a real human, not an institution. I'm doing my best to stay accurate, but the ecosystem moves faster than any one person can track.{" "}
                    <span className="text-slate-900 font-medium">Treat this as a map, not the territory.</span>
                  </p>
                  <p className="mb-6">
                    Your context is unique. No framework can fully capture the nuance of your journey. And more resources don't automatically mean more clarity. Sometimes they create overwhelm instead of momentum.
                  </p>
                  <p className="font-serif text-xl italic text-slate-800">
                    Use what serves you. Ignore what doesn't.
                  </p>
                </div>
              </section>

              {/* Section 2: Our Commitment */}
              <section>
                <h3 className="mb-6 font-sans text-sm font-bold tracking-widest text-slate-400 uppercase">
                  Our Commitment
                </h3>
                <div className="max-w-none font-sans text-slate-600 text-lg leading-8">
                  <p className="mb-6">
                    In return for your attention, we promise honest context. We will not gatekeep information or hide resources behind unnecessary barriers.
                  </p>
                  <p className="mb-6">
                    We prioritize Chicago-specific insights over generic startup advice. The ecosystem here has its own rhythm, its own players, and its own pathways. We will help you understand how it works.
                  </p>
                  <p>
                    And we will continuously update these resources based on feedback from founders like you. If something is wrong or missing,{" "}
                    <a
                      href="mailto:hello@chistartuphub.com"
                      className="text-slate-900 underline underline-offset-2 hover:text-slate-600 transition-colors"
                    >
                      tell us
                    </a>
                    . We will fix it.
                  </p>
                </div>
              </section>
            </div>

            {/* D. SIGNATURE & ACTION */}
            <footer className="mt-20 flex flex-col items-center justify-between gap-12 border-t border-slate-200 pt-12 md:flex-row">

              {/* Signature */}
              <div className="flex flex-col text-center md:text-left">
                <span className="font-serif text-2xl italic text-slate-800">— Billy</span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">
                  ChiStartupHub Founder
                </span>
              </div>

              {/* High-End Button (Minimalist) */}
              <button
                onClick={() => navigate('/navigate-toolkit')}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-slate-900 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-black hover:shadow-xl"
              >
                <span>Explore the Ecosystem</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

            </footer>

          </div>
        </motion.article>

      </div>
    </div>
  );
}
