import React, { useState, useEffect } from "react";
import { Building2, Users, DollarSign, Heart, TrendingUp, Award, Globe, Zap, ArrowDown, X, ExternalLink } from "lucide-react";
import SEO from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import BureauFooter from "@/components/bureau/BureauFooter";

export default function WhyChicago() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const videoRef = React.useRef(null);

  // Handle ESC key to close Easter egg
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showEasterEgg) {
        setShowEasterEgg(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEasterEgg]);

  // Reset video state when modal closes
  useEffect(() => {
    if (!showEasterEgg) {
      setVideoLoaded(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [showEasterEgg]);

  // Play video when modal opens and scroll to top
  useEffect(() => {
    if (showEasterEgg) {
      // Scroll to top immediately so the fixed modal is visible
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      if (videoRef.current) {
        const timer = setTimeout(() => {
          if (videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.log("Video autoplay prevented or error:", err);
              });
            }
          }
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [showEasterEgg]);

  const sections = [
    {
      id: 1,
      icon: Building2,
      title: "World-Class Infrastructure",
      description: "Chicago boasts advanced coworking spaces, innovation hubs, and technology centers. Entrepreneurs have access to premier facilities like 1871, mHUB, and MATTER, with more than 270 coworking spaces available citywide.",
      stats: "270+",
      statsLabel: "Coworking Spaces",
      source: "CoworkingCafe, 2025"
    },
    {
      id: 2,
      icon: Users,
      title: "Thriving Innovation Ecosystem",
      description: "Chicago's collaborative and supportive startup culture connects thousands of founders, mentors, and experts. With over 1,600+ active tech startups and a rapidly growing pool of founders.",
      stats: "1,600+",
      statsLabel: "Tech Startups",
      source: "StartupBlink, 2025"
    },
    {
      id: 3,
      icon: DollarSign,
      title: "High-Value Ecosystem",
      description: "Chicago's ecosystem is a proven high-value generator. Between mid-2022 and 2024, the ecosystem's value was estimated at $54.9 billion, fueled by strong recent investment.",
      stats: "$54.9B",
      statsLabel: "Ecosystem Value",
      source: "Startup Genome, 2024"
    },
    {
      id: 4,
      icon: Heart,
      title: "Diverse & Inclusive Community",
      description: "Programs dedicated to supporting women, minorities, and underrepresented founders continue to expand. About 24% of startups have at least one founder of color, and over 36% have at least one woman founder.",
      stats: "36%",
      statsLabel: "Woman Founders",
      source: "Chicago:Blend, 2024"
    },
    {
      id: 5,
      icon: TrendingUp,
      title: "Growing Tech Hub",
      description: "Global tech leaders like Google, Salesforce, and Microsoft continually expand their Chicago footprint. The city's tech sector saw an 18% growth rate in recent years.",
      stats: "18%",
      statsLabel: "Tech Growth Rate",
      source: "Chicagoland Chamber, 2024"
    },
    {
      id: 6,
      icon: Award,
      title: "Top Talent Pool",
      description: "Chicago is home to elite research universities including Northwestern and UChicago, with 40+ colleges and universities in the metropolitan area.",
      stats: "40+",
      statsLabel: "Universities Nearby",
      source: "Cause IQ, 2025"
    },
    {
      id: 7,
      icon: Globe,
      title: "Strategic Location",
      description: "As America's most connected airport hub, Chicago offers unparalleled domestic and international access. O'Hare International is ranked the #1 most connected U.S. airport in 2025.",
      stats: "#1",
      statsLabel: "Most Connected Airport",
      source: "City of Chicago, 2025"
    },
    {
      id: 8,
      icon: Zap,
      title: "Lower Cost of Living",
      description: "Chicago's cost of living is 30–40% lower than Silicon Valley or New York City, allowing founders to stretch resources further while enjoying urban amenities.",
      stats: "30-40%",
      statsLabel: "Less Than SF/NYC",
      source: "Salary.com, 2025"
    }
  ];

  return (
    <>
      <SEO 
        title="Why Build in Chicago?" 
        description="Discover the advantages of the Chicago ecosystem: top talent, affordability, market access, and a supportive community."
        keywords="Chicago tech ecosystem, business advantages, cost of living, tech talent, startup hub"
      />

      <div className="min-h-screen bg-[#050A14] text-white" data-page="why-chicago">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col justify-center px-6">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1600&q=80')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050A14] via-transparent to-[#050A14]" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10 pt-32">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                [LOCATION: CHICAGO_IL]
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 tracking-tight"
            >
              WHY START IN<br />CHICAGO?
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-lg md:text-xl max-w-2xl mb-12"
            >
              The perfect combination of resources, talent, and opportunity for startups to thrive. Here's what makes the Windy City special.
            </motion.p>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]"
            >
              <span>Scroll to Explore</span>
              <ArrowDown className="w-4 h-4 animate-bounce" strokeWidth={1.5} />
            </motion.div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-white/10 py-6 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <span className="font-serif text-3xl md:text-4xl text-white">$54.9B</span>
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block mt-1">Ecosystem Value</span>
            </div>
            <div className="text-center">
              <span className="font-serif text-3xl md:text-4xl text-white">1,600+</span>
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block mt-1">Tech Startups</span>
            </div>
            <div className="text-center">
              <span className="font-serif text-3xl md:text-4xl text-white">270+</span>
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block mt-1">Coworking Spaces</span>
            </div>
            <div className="text-center">
              <span className="font-serif text-3xl md:text-4xl text-white">40+</span>
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block mt-1">Universities</span>
            </div>
          </div>
        </section>

        {/* Advantages Grid */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-8">
              [ADVANTAGES: 8_REASONS]
            </span>

            {/* Grid */}
            <div className="grid md:grid-cols-2 border-l border-t border-white/10">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="border-r border-b border-white/10 p-6 md:p-8 hover:bg-white/[0.02] transition-colors group cursor-crosshair"
                    onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-white/20">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="w-8 h-8 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                          <Icon className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-serif text-2xl text-white">{section.stats}</span>
                        <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] block">{section.statsLabel}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-xl text-white mb-3 group-hover:text-white/80 transition-colors">
                      {section.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                      {section.description}
                    </p>

                    {/* Source */}
                    <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.1em]">
                      Source: {section.source}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section with Secret Easter Egg */}
        <section className="py-24 px-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-6">
              [CTA: JOIN_ECOSYSTEM]
            </span>

            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              Ready to Join Chicago's<br />Startup Community?
            </h2>

            <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12">
              Discover the resources, connections, and support you need to build your dream company in the heart of the Midwest.
            </p>

            {/* Secret Easter Egg Button */}
            <motion.button
              onClick={() => setShowEasterEgg(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block px-8 py-4 border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all cursor-crosshair group"
            >
              <span className="font-serif text-xl text-white group-hover:text-white/80 transition-colors">
                Chicago: Where Innovation Meets Opportunity
              </span>
            </motion.button>

            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.1em] mt-4">
              Click to discover something special
            </p>
          </div>
        </section>

        {/* Footer */}
        <BureauFooter />

        {/* Easter Egg Modal - Chicago Bulls Animation */}
        <AnimatePresence>
          {showEasterEgg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEasterEgg(false)}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-full max-w-4xl aspect-video bg-black border border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowEasterEgg(false)}
                  className="absolute top-4 right-4 z-10 p-2 border border-white/20 hover:bg-white hover:text-black transition-colors text-white cursor-crosshair"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>

                {/* Video */}
                <video
                  ref={videoRef}
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover bg-black"
                  onCanPlayThrough={() => setVideoLoaded(true)}
                  onError={(e) => console.error("Video load error:", e)}
                >
                  <source src="/chicago-bulls-easter-egg.webm" type="video/webm" />
                  <p className="text-white text-center p-4">Your browser does not support the video tag.</p>
                </video>

                {/* Loading state */}
                {!videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                      [LOADING: VIDEO]
                    </div>
                  </div>
                )}

                {/* Close Instruction */}
                <div className="absolute bottom-4 right-4">
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em]">
                    Click or press ESC to close
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
