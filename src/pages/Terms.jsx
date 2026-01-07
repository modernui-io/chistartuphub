import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import BureauFooter from '@/components/bureau/BureauFooter';
import { AlertCircle } from 'lucide-react';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service | ChiStartupHub"
        description="Terms of Service for ChiStartupHub, including fundraising and investment disclaimers"
      />

      <div className="min-h-screen bg-[#050A14] text-white">
        {/* Hero */}
        <section className="relative pt-32 pb-16 px-6 border-b border-white/10">
          <div className="max-w-4xl mx-auto">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4"
            >
              [LEGAL: TERMS]
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl text-white mb-4"
            >
              Terms of Service
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-sm"
            >
              Last Updated: January 7, 2026
            </motion.p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">

            {/* Section 7: The Critical Compliance Section */}
            <div id="section-7" className="mb-12 p-6 border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3 mb-6">
                <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <h2 className="font-mono text-lg uppercase tracking-[0.05em] text-amber-400">
                  7. Fundraising & Investment Disclaimers
                </h2>
              </div>

              <div className="space-y-8 text-white/70 leading-relaxed">

                {/* 7.1 */}
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-3">
                    7.1 Not an Investment Platform
                  </h3>
                  <p className="mb-3">
                    ChiStartupHub is a community platform for founders to seek <strong className="text-white">ADVICE</strong>, <strong className="text-white">GUIDANCE</strong>, and <strong className="text-white">INTRODUCTIONS</strong>. We are NOT:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>A registered broker-dealer or funding portal</li>
                    <li>An investment advisor</li>
                    <li>A platform for securities offerings</li>
                    <li>A crowdfunding platform</li>
                  </ul>
                </div>

                {/* 7.2 */}
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-3">
                    7.2 No Investment Solicitation
                  </h3>
                  <p className="mb-3">
                    Posting a "Fundraising Guidance" request does NOT constitute:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>An offer or solicitation to sell securities</li>
                    <li>General solicitation under SEC Regulation D Rule 506(b)</li>
                    <li>An investment recommendation or endorsement</li>
                  </ul>
                  <p className="mt-3 text-sm">
                    Users must comply with all federal and state securities laws, including SEC Regulation D (Rule 506(b) and Rule 506(c)), state blue sky laws, and pre-existing relationship requirements for private offerings.
                  </p>
                </div>

                {/* 7.3 */}
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-3">
                    7.3 User Responsibilities
                  </h3>
                  <p className="mb-3">
                    If you are fundraising, <strong className="text-white">YOU</strong> are solely responsible for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Compliance with all securities laws and regulations</li>
                    <li>Determining if your fundraising qualifies for an exemption</li>
                    <li>Verifying accredited investor status when required</li>
                    <li>Consulting with qualified legal counsel</li>
                    <li>NOT using our platform for general solicitation under Rule 506(b)</li>
                  </ul>
                </div>

                {/* 7.4 */}
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-3">
                    7.4 Platform Liability and Disclaimers
                  </h3>
                  <p className="mb-3">
                    ChiStartupHub:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Does NOT verify user claims, credentials, or documents</li>
                    <li>Does NOT provide investment, legal, or tax advice</li>
                    <li>Does NOT endorse any fundraising efforts or opportunities</li>
                    <li>Does NOT facilitate investment transactions</li>
                    <li>Is NOT responsible for introductions or connections made on the platform</li>
                  </ul>
                  <p className="mt-3 text-sm">
                    All introductions, connections, and discussions happen between users. We are merely a technology infrastructure provider and community bulletin board.
                  </p>
                </div>

                {/* 7.5 */}
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-3">
                    7.5 Prohibited Activities
                  </h3>
                  <p className="mb-3">
                    Users may NOT:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Use the platform to publicly solicit investments in violation of SEC Rule 506(b)</li>
                    <li>Solicit non-accredited investors without proper exemptions</li>
                    <li>Post detailed investment terms, valuations, or offering documents publicly</li>
                    <li>Use the platform to bypass securities regulations</li>
                    <li>Misrepresent their compliance status or accreditation</li>
                  </ul>
                </div>

                {/* 7.6 */}
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-3">
                    7.6 Enforcement
                  </h3>
                  <p className="mb-3">
                    ChiStartupHub reserves the right to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Monitor content for compliance violations</li>
                    <li>Remove posts that violate securities laws or these terms</li>
                    <li>Suspend or terminate accounts</li>
                    <li>Report suspected violations to regulatory authorities</li>
                    <li>Cooperate with SEC and state securities regulators</li>
                  </ul>
                </div>

                {/* 7.7 */}
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-[0.05em] text-white mb-3">
                    7.7 Indemnification
                  </h3>
                  <p className="text-sm">
                    Users agree to indemnify and hold harmless ChiStartupHub, its officers, directors, and employees from any claims, damages, or liabilities arising from: (a) User's securities law violations; (b) Misrepresentations about compliance or accreditation status; (c) Investment losses or disputes; (d) Use of the platform for prohibited activities.
                  </p>
                </div>
              </div>
            </div>

            {/* Other sections placeholder */}
            <div className="text-white/40 text-sm space-y-6 border-t border-white/10 pt-12">
              <p className="font-mono uppercase tracking-[0.1em] text-white/50">
                Additional Sections
              </p>
              <p>
                Sections 1-6 (Acceptance of Terms, User Accounts, Privacy, Intellectual Property, Limitation of Liability, Dispute Resolution) and Sections 8+ are being finalized and will be published shortly.
              </p>
              <p>
                For questions about these terms, contact us at{' '}
                <a href="mailto:hello@chistartuphub.com" className="text-white hover:underline">
                  hello@chistartuphub.com
                </a>
              </p>
            </div>

          </div>
        </section>

        <BureauFooter />
      </div>
    </>
  );
}
