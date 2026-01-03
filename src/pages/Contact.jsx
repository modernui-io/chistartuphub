import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, MessageSquare, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { entities } from "@/api/supabaseClient";
import SEO from "@/components/SEO";
import BureauFooter from "@/components/bureau/BureauFooter";

/**
 * Contact - Bureau Design System
 * Systematic Modernism | Precision over Decoration
 */
export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Save to database for admin review
      await entities.ContactSubmission.create({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'Contact from ChiStartup Hub',
        message: formData.message,
        status: 'new'
      });

      // Also send email notification
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: formData.subject || 'Contact from ChiStartup Hub',
            message: formData.message
          }),
        });
      } catch (emailError) {
        // Email failed but database save succeeded - still show success
        console.warn('Email notification failed, but message was saved:', emailError);
      }

      setSubmitStatus('success');
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Reset success state after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitStatus('error');
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <SEO
        title="Contact Us | ChiStartup Hub"
        description="Get in touch with ChiStartup Hub for questions, corrections, partnerships, or press inquiries."
        keywords="contact ChiStartup Hub, get in touch, partnerships, press"
      />

      <div className="min-h-screen bg-[#050A14] text-white" data-page="contact">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                [CONNECT: GET_IN_TOUCH]
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight"
            >
              CONTACT US
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-lg max-w-2xl mb-8"
            >
              Questions, corrections, partnerships, or press inquiries - we'd love to hear from you.
            </motion.p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Direct Contact Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="border border-white/10"
              >
                {/* Card Header */}
                <div className="border-b border-white/10 p-6 flex items-center gap-3">
                  <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    Direct Contact
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Email
                    </label>
                    <a
                      href="mailto:hello@chistartuphub.com"
                      className="flex items-center gap-3 text-white hover:text-white/70 transition-none duration-0 font-mono text-[11px] uppercase tracking-[0.05em] cursor-crosshair"
                    >
                      <span>hello@chistartuphub.com</span>
                    </a>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Response Time
                    </label>
                    <p className="text-white/60 font-mono text-[11px] tracking-[0.02em]">
                      We typically respond within 24-48 hours
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Social Media
                    </label>
                    <p className="text-white/40 font-mono text-[11px] tracking-[0.02em] italic">
                      Coming soon
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-4">
                      What to reach out about
                    </label>
                    <ul className="space-y-3">
                      {[
                        "Partnership opportunities",
                        "Press and media inquiries",
                        "Corrections or updates to resources",
                        "General questions or feedback"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-white/60 font-mono text-[11px] tracking-[0.02em]">
                          <div className="w-1 h-1 bg-white/40 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="border border-white/10"
              >
                {/* Card Header */}
                <div className="border-b border-white/10 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                      Send a Message
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/30 uppercase">
                    * Required
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="YOUR NAME"
                      className="w-full bg-transparent border-b border-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 cursor-crosshair"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="YOU@EXAMPLE.COM"
                      className="w-full bg-transparent border-b border-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 cursor-crosshair"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleChange("subject", e.target.value)}
                      placeholder="WHAT'S THIS ABOUT?"
                      className="w-full bg-transparent border-b border-white/10 py-3 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 cursor-crosshair"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Message *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      rows={4}
                      className="w-full bg-transparent border border-white/10 py-3 px-3 font-mono text-[11px] tracking-[0.02em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 resize-none normal-case cursor-crosshair"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-4 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" strokeWidth={1.5} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-6 mb-6 border border-green-500/30 bg-green-500/5 p-4 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] text-green-400 uppercase tracking-[0.1em]">
                      Message sent successfully
                    </span>
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-6 mb-6 border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] text-red-400 uppercase tracking-[0.1em]">
                      Failed to send. Please try again.
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Partnership CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 border border-white/10 p-8 text-center"
            >
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4">
                [PARTNERSHIP]
              </span>
              <h3 className="text-xl font-serif text-white mb-3">
                Building something for founders?
              </h3>
              <p className="text-white/40 font-mono text-[11px] tracking-[0.02em] mb-6 max-w-xl mx-auto">
                If you're creating tools, resources, or programs that help Chicago's startup ecosystem, we want to feature you.
              </p>
              <a href="mailto:hello@chistartuphub.com?subject=Partnership%20Opportunity">
                <button className="font-mono text-[11px] uppercase tracking-[0.1em] px-8 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair">
                  Let's Partner
                </button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-16">
          <BureauFooter />
        </div>
      </div>
    </>
  );
}
