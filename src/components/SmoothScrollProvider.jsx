import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

// Register plugins
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function SmoothScrollProvider({ children }) {
  const smoother = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Disable ScrollSmoother on mobile devices for better performance
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, just use native scrolling - no ScrollSmoother
      return;
    }

    // Create ScrollSmoother instance (desktop only)
    smoother.current = ScrollSmoother.create({
      smooth: 1.2,           // seconds to catch up to native scroll
      effects: true,         // enables data-speed and data-lag attributes
      smoothTouch: false,    // disable on touch devices
      normalizeScroll: false, // let mobile handle its own scrolling
      ignoreMobileResize: true,
    });

    // Make ScrollTrigger aware of the smooth scroller
    ScrollTrigger.defaults({ scroller: smoother.current.wrapper() });
    ScrollTrigger.refresh();

    return () => {
      if (smoother.current) {
        smoother.current.kill();
        smoother.current = null;
      }
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    if (smoother.current) {
      smoother.current.scrollTo(0, false);
    }
  }, [location.pathname]);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">
        {children}
      </div>
    </div>
  );
}