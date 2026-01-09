import { useState } from "react";
import { entities } from "@/api/supabaseClient";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import BureauFooter from "@/components/bureau/BureauFooter";

/**
 * SubmitResource - Bureau Design System
 * Systematic Modernism | Precision over Decoration
 */
export default function SubmitResource() {
  const [formData, setFormData] = useState({
    resource_name: "",
    resource_url: "",
    description: "",
    category: "",
    submitter_name: "",
    submitter_email: ""
  });

  const categories = [
    { value: "Funding", label: "FUNDING" },
    { value: "Co-Working", label: "CO-WORKING" },
    { value: "Events", label: "EVENTS" },
    { value: "Community", label: "COMMUNITY" },
    { value: "Learning Resource", label: "LEARNING" },
    { value: "Tool", label: "TOOL" },
    { value: "Other", label: "OTHER" }
  ];

  const submitMutation = useMutation({
    mutationFn: (data) => entities.ResourceSubmission.create(data),
    onSuccess: () => {
      toast.success("Thank you! Your resource has been submitted for review.");
      setFormData({
        resource_name: "",
        resource_url: "",
        description: "",
        category: "",
        submitter_name: "",
        submitter_email: ""
      });
    },
    onError: (error) => {
      toast.error("Failed to submit resource. Please try again.");
      console.error("Submission error:", error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.resource_name || !formData.resource_url || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    submitMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <SEO 
        title="Submit a Resource | ChiStartup Hub" 
        description="Help improve Chicago's startup ecosystem by submitting valuable resources, tools, or opportunities for founders."
        keywords="submit resource, contribute, Chicago startups, founder tools"
      />

      <div className="min-h-screen bg-[#050A14] text-white" data-page="submit-resource">
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
                [CONTRIBUTE: SUBMIT_RESOURCE]
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight"
            >
              SUBMIT A RESOURCE
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 text-lg max-w-2xl mb-8"
            >
              Know a valuable resource, tool, or opportunity that should be on ChiStartup Hub? 
              Help us improve the ecosystem map.
            </motion.p>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="border border-white/10"
            >
              {/* Form Header */}
              <div className="border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
                    New Resource Submission
                  </span>
                </div>
                <span className="font-mono text-[10px] text-white/30 uppercase">
                  * Required
                </span>
              </div>

              {/* Form Fields */}
              <div className="p-6 space-y-6">
                {/* Resource Name */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    value={formData.resource_name}
                    onChange={(e) => handleChange("resource_name", e.target.value)}
                    placeholder="E.G., CHICAGO_STARTUP_SLACK"
                    className="w-full bg-transparent border border-white/10 py-4 px-4 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>

                {/* Resource URL */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                    Resource URL *
                  </label>
                  <input
                    type="url"
                    value={formData.resource_url}
                    onChange={(e) => handleChange("resource_url", e.target.value)}
                    placeholder="HTTPS://..."
                    className="w-full bg-transparent border border-white/10 py-4 px-4 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                    Category *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleChange("category", cat.value)}
                        className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2 border transition-colors cursor-crosshair ${
                          formData.category === cat.value
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white/70'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Tell us why this resource is valuable and what founders should know about it..."
                    rows={4}
                    className="w-full bg-transparent border border-white/10 py-4 px-4 font-mono text-[11px] tracking-[0.02em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none normal-case"
                    required
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 pt-6">
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em]">
                    Optional: Help us give you credit
                  </span>
                </div>

                {/* Optional Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.submitter_name}
                      onChange={(e) => handleChange("submitter_name", e.target.value)}
                      placeholder="JANE_DOE"
                      className="w-full bg-transparent border border-white/10 py-4 px-4 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-3">
                      Your Email
                    </label>
                    <input
                      type="email"
                      value={formData.submitter_email}
                      onChange={(e) => handleChange("submitter_email", e.target.value)}
                      placeholder="JANE@EXAMPLE.COM"
                      className="w-full bg-transparent border border-white/10 py-4 px-4 font-mono text-[11px] uppercase tracking-[0.05em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="border-t border-white/10 p-6">
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-4 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitMutation.isPending ? (
                    "SUBMITTING..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" strokeWidth={1.5} />
                      Submit Resource
                    </>
                  )}
                </button>
              </div>
            </motion.form>

            {/* Success Message */}
            {submitMutation.isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border border-green-500/30 bg-green-500/5 p-6 flex items-center gap-4"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                <div>
                  <span className="font-mono text-[10px] text-green-400 uppercase tracking-[0.1em] block mb-1">
                    [SUBMISSION: RECEIVED]
                  </span>
                  <p className="text-sm text-white/60">
                    Thank you for contributing! We'll review your submission and add it to the hub.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center"
            >
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em]">
                All submissions are reviewed to ensure quality and relevance to Chicago's startup ecosystem.
              </p>
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
