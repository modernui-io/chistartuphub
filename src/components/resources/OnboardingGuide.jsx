import React, { useState, useEffect } from "react";
import { X, Compass, Users, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const STARTER_ACTIONS = [
  {
    id: "assessment",
    icon: Compass,
    title: "Take the Assessment",
    description: "Answer 12 questions to discover your strengths, gaps, and where to focus next",
    action: "Start Quiz",
    link: "/assessment",
  },
  {
    id: "community",
    icon: Users,
    title: "Post an Ask",
    description: "Get help from Chicago's founder community — intros, advice, or resources",
    action: "Browse Asks",
    link: "/opportunities",
  },
  {
    id: "resources",
    icon: FileText,
    title: "Explore Funding",
    description: "150+ accelerators, investors, and grant programs in the Chicago ecosystem",
    action: "View Funding",
    link: "/funding",
  },
];

export default function OnboardingGuide() {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the guide
    const dismissed = localStorage.getItem("chistartuphub_onboarding_dismissed");
    if (!dismissed) {
      // Small delay for animation
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("chistartuphub_onboarding_dismissed", "true");
    setTimeout(() => setIsDismissed(true), 300);
  };

  if (isDismissed) return null;

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div
      className={`border border-white/20 bg-gradient-to-r from-white/[0.03] to-transparent transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white/60" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-white">
              {firstName ? `Welcome, ${firstName}` : "Welcome to the Toolkit"}
            </h3>
            <p className="text-white/40 text-sm mt-0.5">
              Here's where to start based on what most founders need first
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Dismiss guide"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Actions Grid */}
      <div className="grid md:grid-cols-3 gap-0">
        {STARTER_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          const content = (
            <div
              className={`p-4 md:p-6 group hover:bg-white/[0.02] transition-colors cursor-crosshair ${
                index < 2 ? "border-r border-white/10" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] text-white/20">0{index + 1}</span>
                <Icon className="w-4 h-4 text-white/40" strokeWidth={1.5} />
              </div>
              <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-white mb-1">
                {action.title}
              </h4>
              <p className="text-white/40 text-xs leading-relaxed mb-4">
                {action.description}
              </p>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 group-hover:text-white transition-colors">
                {action.action}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
              </span>
            </div>
          );

          return (
            <Link key={action.id} to={action.link}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Dismiss Hint */}
      <div className="px-4 md:px-6 py-3 border-t border-white/10 flex items-center justify-between">
        <p className="font-mono text-[9px] text-white/20 uppercase tracking-[0.15em]">
          This guide won't show again once dismissed
        </p>
        <button
          onClick={handleDismiss}
          className="font-mono text-[10px] text-white/40 hover:text-white uppercase tracking-[0.15em] transition-colors"
        >
          Got it, dismiss
        </button>
      </div>
    </div>
  );
}
