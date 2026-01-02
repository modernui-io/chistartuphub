import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ExternalLink } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import LoadingScreen from "@/components/LoadingScreen";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/auth/LoginModal";
import SignupModal from "@/components/auth/SignupModal";
import AIAssistant from "@/components/AIAssistant";

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(!window.hasShownLoader);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { user, signOut } = useAuth();

  const handleLoadComplete = () => {
    setIsLoading(false);
    window.hasShownLoader = true;
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const footerSections = [
    {
      title: "Startup Resources",
      links: [
        { name: "Capital", url: createPageUrl("Funding") },
        { name: "Startup Toolkit", url: createPageUrl("Resources") },
        { name: "Community", url: createPageUrl("Community") },
        { name: "Co-Working", url: createPageUrl("Workspaces") },
        { name: "Hubs & Events", url: createPageUrl("Events") }
      ]
    },
    {
      title: "Connect",
      links: [
        { name: "World Business Chicago", url: "https://worldbusinesschicago.com", external: true },
        { name: "Illinois Business Portal", url: "https://www.illinois.gov/business.html", external: true },
        { name: "Chicago BACP", url: "https://www.chicago.gov/city/en/depts/bacp.html", external: true },
        { name: "SBA Chicago", url: "https://www.sba.gov/district/illinois", external: true },
        { name: "About Me", url: "https://www.linkedin.com/in/billyndizeye/", external: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen relative">
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onComplete={handleLoadComplete} />}
      </AnimatePresence>
      <GoogleAnalytics />
      
      <style>{`
        * {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          letter-spacing: 0.04em;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background: #000000;
          min-height: 100vh;
        }

        .glass-card {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          box-shadow: 0 15px 50px 0 rgba(0, 0, 0, 0.6);
          transform: translateY(-2px);
        }

        .glass-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-weight: 600;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px 0 rgba(255, 255, 255, 0.15);
        }

        .accent-badge {
          background: linear-gradient(90deg, #60A5FA, #3B82F6);
          color: white;
          border: none;
          font-weight: 600;
        }

        .accent-button {
          background: #3B82F6;
          color: #f5f5f5;
          border: 2px solid #3B82F6;
          border-radius: 0;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          box-shadow: none;
          transition: all 0.15s ease;
        }

        .accent-button:hover {
          background: #f5f5f5;
          color: #0b0b0b;
          border-color: #f5f5f5;
          transform: none;
        }

        .nav-link {
          position: relative;
          color: rgba(245, 245, 245, 0.68);
          transition: all 0.15s ease;
          padding: 10px 12px;
          font-weight: 500;
          font-size: 0.875rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid transparent;
          border-radius: 0;
        }

        .nav-link:hover {
          background: #f5f5f5;
          color: #0b0b0b;
          border-color: #f5f5f5;
        }

        .nav-link.active {
          color: #f5f5f5;
          border-color: rgba(245, 245, 245, 0.45);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 10px;
          right: 10px;
          height: 2px;
          background: #3B82F6;
        }

        .nav-link.active:hover {
          background: #f5f5f5;
          color: #0b0b0b;
          border-color: #f5f5f5;
        }

        .nav-link.active:hover::after {
          background: #0b0b0b;
        }

        /* Dropdown Menu Styling */
        [data-radix-popper-content-wrapper] {
          z-index: 9999 !important;
        }

        .nav-trigger {
          padding: 10px 12px;
          border-radius: 0;
          position: relative;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .nav-trigger[data-state="open"] {
          background: #f5f5f5;
          color: #0b0b0b;
          border: 1px solid #f5f5f5;
          border-bottom-color: #f5f5f5;
        }

        .nav-dropdown {
          background: #0b0b0b;
          border: 2px solid #f5f5f5;
          border-top: 0;
          border-radius: 0;
          box-shadow: none;
          overflow: hidden;
          margin-top: -2px;
        }

        .dropdown-link {
          color: rgba(245, 245, 245, 0.68);
          transition: all 0.15s ease;
          border-top: 1px solid rgba(245, 245, 245, 0.22);
        }

        .dropdown-link:hover {
          color: #0b0b0b;
          background: #f5f5f5;
        }

        .dropdown-link.active {
          color: #f5f5f5;
          background: transparent;
        }

        /* Dropdown positioning */
        [data-radix-dropdown-menu-content] {
          margin-top: 0 !important;
          transform-origin: top center;
        }

        /* Professional navbar styles */
        .professional-nav {
          transition: all 0.15s ease;
          background: #0b0b0b;
          border-bottom: 2px solid rgba(245, 245, 245, 0.45);
        }

        /* Mobile menu animation */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-menu-item {
          animation: slideIn 0.3s ease-out forwards;
        }

        /* Dropdown animation */
        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        h1, h2, h3, h4, h5, h6 {
          letter-spacing: 0.02em;
          font-weight: 900;
          text-transform: uppercase;
        }

        p {
          line-height: 1.7;
          font-weight: 400;
        }
      `}</style>

      {/* Simplified Background */}
      <div 
        className="fixed inset-0 z-[-2]" 
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(26, 26, 26, 0.95) 50%, rgba(15, 15, 15, 0.95) 100%), url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header
          user={user}
          onSignInClick={() => setShowLogin(true)}
          onGetStartedClick={() => setShowSignup(true)}
          onSignOut={signOut}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </div>

      {/* Main Content with ScrollSmoother */}
      <SmoothScrollProvider>
        <main>
          {children}
        </main>

        {/* Footer */}
      <footer className="bg-[#111111] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3 mb-6 group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
                  <span className="text-white font-bold text-xl">CS</span>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">ChiStartup Hub</span>
              </Link>
              <p className="text-white/60 text-base leading-relaxed mb-4 max-w-md">
                The Operating System for Chicago Founders. Build faster with unified access to capital, community, and clarity.
              </p>
            </div>

            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="text-white font-semibold text-base mb-5">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      {link.external ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                        >
                          {link.name}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <Link
                          to={link.url}
                          className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">© 2025 ChiStartup Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />

      {/* AI Assistant - only visible for logged-in users */}
      <AIAssistant />
      </SmoothScrollProvider>
    </div>
  );
}