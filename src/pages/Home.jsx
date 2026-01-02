import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEO from "@/components/SEO";
import { motion, useMotionValue, useSpring, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  BureauAtmosphere,
  BureauButton,
  PathwaysSection,
  EcosystemSection,
  BureauFooter,
} from "@/components/bureau";

/**
 * Home - The Bureau Landing Page
 * Systematic Modernism | Precision over Decoration
 * Version 3.0 - Premium micro-interactions & delightful animations
 * Inspired by Area 17, Beaucoup Studios, Bureau of Visual Affairs
 */

// ============================================
// ANIMATED TEXT COMPONENT
// Staggered letter reveal with premium easing
// ============================================
const AnimatedText = ({ children, className = "", delay = 0, isWord = false }) => {
  const letters = isWord ? children.split(" ") : children.split("");
  
  return (
    <span className={className}>
      {letters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.8,
            delay: delay + (i * 0.03),
            ease: [0.16, 1, 0.3, 1], // Custom spring-like easing
          }}
          className="inline-block"
          style={{ 
            transformOrigin: 'bottom',
            marginRight: isWord ? '0.3em' : (char === ' ' ? '0.3em' : '0'),
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// ============================================
// MAGNETIC BUTTON COMPONENT
// Button that subtly pulls toward cursor
// ============================================
const MagneticButton = ({ children, className = "", ...props }) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 15, stiffness: 150 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center (max 15px movement)
    const deltaX = (e.clientX - centerX) * 0.3;
    const deltaY = (e.clientY - centerY) * 0.3;
    
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ x: xSpring, y: ySpring }}
      className={`inline-block ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// ANIMATED COUNTER COMPONENT
// Numbers that count up when in view
// ============================================
const AnimatedCounter = ({ value, label, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [displayValue, setDisplayValue] = useState(0);
  
  const numericValue = parseInt(value.replace(/\D/g, ''));
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(eased * numericValue));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      const timer = setTimeout(() => {
        requestAnimationFrame(animate);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, numericValue, delay]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-baseline gap-2"
    >
      <span className="font-mono text-lg md:text-xl text-white/60 font-medium tabular-nums">
        {displayValue}{suffix}
      </span>
      <span className="font-mono text-[10px] tracking-[0.2em] text-white/30">
        {label}
      </span>
    </motion.div>
  );
};

// ============================================
// MOUSE SPOTLIGHT COMPONENT
// Subtle glow that follows the cursor
// ============================================
const MouseSpotlight = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleMouseMove = (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setMousePosition({ x: e.clientX, y: e.clientY });
          setIsVisible(true);
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-[2]"
      animate={{
        x: mousePosition.x - 200,
        y: mousePosition.y - 200,
        opacity: isVisible ? 0.15 : 0,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 200,
        opacity: { duration: 0.3 }
      }}
      style={{
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
      }}
    />
  );
};

// ============================================
// SCROLL PROGRESS LINE
// Animated line that shows scroll progress
// ============================================
const ScrollProgressLine = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? scrollTop / docHeight : 0;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 h-[2px] bg-white/30 z-[100]"
      style={{ width: `${scrollProgress * 100}%` }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.1 }}
    />
  );
};

// ============================================
// MAIN HOME COMPONENT
// ============================================
export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative" data-page="home">
      <SEO
        title="Your Launchpad for Chicago"
        description="Build faster with ChiStartup Hub. Access 90+ investors, 18+ workspaces, and curated founder playbooks. Your unified toolkit for Chicago's startup ecosystem."
        keywords="Chicago startups, venture capital, founder resources, startup funding, Chicago entrepreneurs"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ChiStartup Hub",
          "url": typeof window !== "undefined" ? window.location.origin : "",
          "description": "Your Launchpad for Chicago.",
        }}
      />

      {/* Mouse Spotlight Effect */}
      <MouseSpotlight />

      {/* Scroll Progress Line */}
      <ScrollProgressLine />

      {/* Ghost City Background */}
      <BureauAtmosphere />

      {/* Subtle Gradient Glow - Top Right */}
      <motion.div 
        className="fixed top-0 right-0 w-[800px] h-[800px] pointer-events-none z-[1]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2, delay: 0.5 }}
        style={{
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.06) 0%, transparent 60%)',
          filter: 'blur(100px)',
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Main Content Layer */}
      <div className="relative z-10">
        {/* ═══════════════════════════════════════════════════════════════════
            HERO SECTION - The Grand Entrance
            ═══════════════════════════════════════════════════════════════════ */}
        <section 
          ref={heroRef}
          className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden"
        >
          
          {/* System Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <div className="bureau-status">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                [SYSTEM: ONLINE]
              </motion.span>
            </div>
          </motion.div>

          {/* Main Headline - Dramatic Editorial Typography with Letter Animation */}
          <h1 
            className="font-serif text-center text-white tracking-tight leading-[0.85] mb-10 text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[9rem]"
            style={{ letterSpacing: '-0.04em' }}
          >
            <span className="block overflow-hidden">
              <AnimatedText delay={0.3}>BUILD YOUR</AnimatedText>
            </span>
            <span className="block overflow-hidden mt-2">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ duration: 1.2, delay: 0.8 }}
                className="inline-block"
              >
                <AnimatedText delay={0.5} className="text-white/70">VISION</AnimatedText>
              </motion.span>
            </span>
            <span className="block overflow-hidden mt-2">
              <AnimatedText delay={0.7}>IN CHICAGO</AnimatedText>
            </span>
          </h1>

          {/* Subtext - Monospace System Style */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-xs sm:text-sm uppercase tracking-[0.25em] text-white/40 text-center mb-14 max-w-xl"
          >
            Your Launchpad for Chicago
          </motion.p>

          {/* Primary CTA with Magnetic Effect */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <MagneticButton>
              <Link to={createPageUrl("before-you-start")}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <BureauButton variant="primary" size="large" showArrow>
                    GET STARTED
                  </BureauButton>
                </motion.div>
              </Link>
            </MagneticButton>
          </motion.div>

          {/* Micro Stats Row with Animated Counters */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <AnimatedCounter value="90+" label="INVESTORS" delay={1600} />
            <AnimatedCounter value="18+" label="SPACES" delay={1800} />
            <AnimatedCounter value="22+" label="COMMUNITIES" delay={2000} />
          </div>

          {/* Scroll Indicator with Animation - In flow, not absolute */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.2 }}
            className="mt-16 mb-8 flex flex-col items-center gap-3"
          >
            <motion.span 
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="font-mono text-[10px] tracking-[0.3em] text-white/20 uppercase"
            >
              Scroll
            </motion.span>
            <motion.div 
              className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1, delay: 2.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'top' }}
            />
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            PATHWAYS SECTION
            ═══════════════════════════════════════════════════════════════════ */}
        <PathwaysSection />

        {/* ═══════════════════════════════════════════════════════════════════
            ECOSYSTEM SECTION
            ═══════════════════════════════════════════════════════════════════ */}
        <EcosystemSection />

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
        <BureauFooter />
      </div>
    </div>
  );
}

