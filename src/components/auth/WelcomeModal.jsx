import React, { useState } from "react";
import { X, Sparkles, BookOpen, MessageSquarePlus, ArrowRight, Heart, HandHelping } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * WelcomeModal - Post-signup onboarding experience
 * Works for both Founders and Helpers
 * 
 * Founders: Activation = Post an Ask
 * Helpers: Activation = Help a Founder
 */
export default function WelcomeModal({ isOpen, onClose, userName, userRole }) {
  const [step, setStep] = useState(1);
  const isFounder = userRole === 'founder';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0A0F1A] border border-white/10 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors z-10"
          aria-label="Close welcome modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                Welcome to ChiStartup Hub
              </span>
            </div>

            {/* Welcome Message */}
            <h2 className="font-serif text-2xl md:text-3xl text-white mb-4">
              Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! 🎉
            </h2>
            
            <p className="font-serif text-lg text-white/60 leading-relaxed mb-6">
              We're glad to have you be a part of this community. Chicago's startup ecosystem is stronger with you in it.
            </p>

            <div className="p-4 border border-white/10 bg-white/5 mb-6">
              <p className="text-sm text-white/60 leading-relaxed">
                Feel free to explore the resources and save the ones that are helpful for you. This is your launchpad.
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-white text-black font-mono text-sm uppercase tracking-[0.1em] hover:bg-white/90 transition-colors flex items-center justify-center gap-3 cursor-crosshair"
            >
              <span>Let's Get You Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Role-specific guidance */}
        {step === 2 && (
          <div className="p-8 md:p-10">
            {/* Header */}
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-6">
              {isFounder ? 'For Founders' : 'For Community Helpers'}
            </span>

            {isFounder ? (
              <>
                {/* Founder Flow */}
                <h2 className="font-serif text-xl md:text-2xl text-white mb-4">
                  Need help with your startup?
                </h2>
                
                <p className="text-white/60 leading-relaxed mb-4">
                  Post an <strong className="text-white/80">Ask</strong> and let the community help you. Our community members are here to support founders like you.
                </p>

                <div className="p-4 border border-white/10 bg-white/5 mb-6">
                  <p className="text-sm text-white/50 mb-3">
                    <strong className="text-white/70">How it works:</strong>
                  </p>
                  <ul className="text-sm text-white/50 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-white/30">•</span>
                      <span>Post <strong className="text-white/70">1 ask every 14 days</strong> to ensure quality responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/30">•</span>
                      <span>Choose from 3 categories: <strong className="text-white/70">Capital</strong>, <strong className="text-white/70">Cofounder</strong>, or <strong className="text-white/70">General Advice</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/30">•</span>
                      <span>Helpers reach out, you have <strong className="text-white/70">48 hours to respond</strong></span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Helper Flow */}
                <h2 className="font-serif text-xl md:text-2xl text-white mb-4">
                  Want to help a founder?
                </h2>
                
                <p className="text-white/60 leading-relaxed mb-4">
                  Browse <strong className="text-white/80">Founder Asks</strong> and offer your expertise. Whether it's introductions, advice, or connections - your help matters.
                </p>

                <div className="p-4 border border-white/10 bg-white/5 mb-6">
                  <p className="text-sm text-white/50 mb-3">
                    <strong className="text-white/70">How it works:</strong>
                  </p>
                  <ul className="text-sm text-white/50 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-white/30">•</span>
                      <span>Browse asks from Chicago founders seeking help</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/30">•</span>
                      <span>Click <strong className="text-white/70">"I Can Help"</strong> and share how you can assist</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white/30">•</span>
                      <span>If accepted, you'll receive the founder's LinkedIn to connect</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* Continue Button */}
            <button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-white text-black font-mono text-sm uppercase tracking-[0.1em] hover:bg-white/90 transition-colors flex items-center justify-center gap-3 cursor-crosshair"
            >
              <span>Got It</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Choose Your Path */}
        {step === 3 && (
          <div className="p-8 md:p-10">
            {/* Header */}
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-6">
              Quick Start
            </span>

            <h2 className="font-serif text-xl md:text-2xl text-white mb-6">
              What would you like to do first?
            </h2>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Action - Role Specific */}
              <Link
                to={createPageUrl("Opportunities")}
                onClick={onClose}
                className="w-full py-4 px-6 bg-white text-black font-mono text-sm uppercase tracking-[0.1em] hover:bg-white/90 transition-colors flex items-center justify-between cursor-crosshair"
              >
                <div className="flex items-center gap-3">
                  {isFounder ? (
                    <>
                      <MessageSquarePlus className="w-5 h-5" />
                      <span>Post an Ask</span>
                    </>
                  ) : (
                    <>
                      <HandHelping className="w-5 h-5" />
                      <span>Help a Founder</span>
                    </>
                  )}
                </div>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Secondary Action - Explore Resources */}
              <Link
                to={createPageUrl("Resources")}
                onClick={onClose}
                className="w-full py-4 px-6 border border-white/20 text-white font-mono text-sm uppercase tracking-[0.1em] hover:bg-white hover:text-black transition-colors flex items-center justify-between cursor-crosshair"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  <span>Explore Resources</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Skip for now */}
              <button
                onClick={onClose}
                className="w-full py-3 text-white/40 font-mono text-xs uppercase tracking-[0.1em] hover:text-white/60 transition-colors"
              >
                I'll explore on my own
              </button>
            </div>
          </div>
        )}

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 pb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 transition-colors ${
                s === step ? 'bg-white' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
