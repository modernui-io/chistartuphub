import React from "react";
import { Link, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { entities } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Play, Loader2, TrendingUp, Award, Shield, Zap, Users, Lock, Star, Target, Cog, BookOpen, ExternalLink, ArrowUpRight } from "lucide-react";
import SEO from "@/components/SEO";
import { generateSlug } from "@/lib/utils";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import OptimizedImage from "@/components/OptimizedImage";

export default function StoryDetail() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');

  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ['stories'],
    queryFn: () => entities.Story.list('-created_date'),
    staleTime: 1000 * 60 * 5,
  });

  const story = React.useMemo(() => {
    if (slug) {
      const slugMatch = stories.find(s => generateSlug(s.company_name) === slug);
      if (slugMatch) return slugMatch;
      const nameMatch = stories.find(s =>
        s.company_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase()
      );
      if (nameMatch) return nameMatch;
    }
    if (storyId) {
      return stories.find(s => s.id === storyId);
    }
    return null;
  }, [stories, slug, storyId]);

  // Helper functions
  const getFounderName = (s) => {
    if (s.founders && Array.isArray(s.founders)) return s.founders.join(', ');
    return s.founder_name || 'Unknown Founder';
  };
  const getJourneySummary = (s) => s.description || s.journey_summary || s.tagline || '';
  const getCategory = (s) => s.sector || s.category || 'Technology';
  const getFounded = (s) => s.founded_year || s.founded || '';
  const getExitValue = (s) => s.funding_raised || s.valuation || s.exit_value || '';
  const getPrimaryPower = (s) => s.competitive_moat || s.primary_power || '';
  const getSecondaryPower = (s) => s.moat_description || s.secondary_power || '';

  const powerIcons = {
    "Scale Economies": Zap,
    "Network Effects": Users,
    "Switching Costs": Lock,
    "Branding": Star,
    "Counter-Positioning": Target,
    "Cornered Resource": Shield,
    "Process Power": Cog
  };

  const getRatingLevel = (rating) => {
    switch(rating) {
      case "Very High": return "text-white bg-white/10";
      case "High": return "text-white/80 bg-white/5";
      case "Medium": return "text-white/60 bg-white/[0.02]";
      case "Low": return "text-white/40 bg-transparent";
      default: return "text-white/30 bg-transparent";
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen relative" data-page="story-detail">
        <BureauAtmosphere />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin mx-auto mb-4" strokeWidth={1.5} />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Loading blueprint...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !story) {
    return (
      <div className="min-h-screen relative" data-page="story-detail">
        <BureauAtmosphere />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center border border-white/10 p-12 max-w-md">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-6">
              [ERROR: NOT_FOUND]
            </span>
            <h1 className="font-serif text-3xl text-white mb-4">Blueprint Not Found</h1>
            <p className="text-white/50 text-sm mb-8">
              The story you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to={createPageUrl("Stories")}
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
            >
              <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
              Back to Blueprints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const powerMetrics = [
    { name: "Scale Economies", value: story.scale_economies, icon: Zap },
    { name: "Network Effects", value: story.network_effects, icon: Users },
    { name: "Switching Costs", value: story.switching_costs, icon: Lock },
    { name: "Branding", value: story.branding, icon: Star },
    { name: "Counter-Positioning", value: story.counter_positioning, icon: Target },
    { name: "Cornered Resource", value: story.cornered_resource, icon: Shield },
    { name: "Process Power", value: story.process_power, icon: Cog }
  ].filter(metric => metric.value);

  return (
    <div className="min-h-screen relative" data-page="story-detail">
      <SEO
        title={`${story.company_name} - ${getFounderName(story)} | Chicago Blueprints`}
        description={getJourneySummary(story)?.substring(0, 160) + "..."}
        image={story.image_url || story.logo_url}
        type="article"
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
              to={createPageUrl("Stories")}
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors mb-8 cursor-crosshair"
            >
              <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
              Back to Blueprints
            </Link>

            {/* Label */}
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4">
              [BLUEPRINT: {story.company_name?.toUpperCase().replace(/\s+/g, '_')}]
            </span>

            {/* Company Name */}
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4">
              {story.company_name}
            </h1>

            {/* Founder */}
            <p className="font-mono text-sm uppercase tracking-[0.1em] text-white/50 mb-8">
              {getFounderName(story)}
            </p>

            {/* Meta Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border border-white/20 text-white/60">
                {getCategory(story)}
              </span>
              {getFounded(story) && (
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border border-white/10 text-white/40">
                  Founded {getFounded(story)}
                </span>
              )}
              {story.exit_status && (
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border border-white/20 text-white/60">
                  {story.exit_status}
                </span>
              )}
              {getExitValue(story) && (
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 bg-white/10 border border-white/20 text-white">
                  {getExitValue(story)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {story.website && (
                <a
                  href={story.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair"
                >
                  Visit Website
                  <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                </a>
              )}
              {story.read_time && (
                <div className="flex items-center gap-2 text-white/40">
                  <Clock className="w-4 h-4" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em]">{story.read_time}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Image Section */}
        {story.image_url && (
          <section className="px-6 pb-12">
            <div className="max-w-4xl mx-auto">
              <div className="border border-white/10 overflow-hidden">
                <OptimizedImage
                  src={story.image_url}
                  alt={story.company_name}
                  className="w-full aspect-video object-cover opacity-80"
                  width={1200}
                />
              </div>
            </div>
          </section>
        )}

        {/* Journey Section */}
        <section className="px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                  [THE_JOURNEY]
                </span>
              </div>

              {getJourneySummary(story) ? (
                <div className="text-white/70 leading-relaxed whitespace-pre-line">
                  {getJourneySummary(story)}
                </div>
              ) : (
                <p className="text-white/40 italic">
                  Story details coming soon. Check back for the full journey of {story.company_name}.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Competitive Moats Section */}
        {(getPrimaryPower(story) || getSecondaryPower(story)) && (
          <section className="px-6 pb-12">
            <div className="max-w-4xl mx-auto">
              <div className="border border-white/10 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <Shield className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                    [COMPETITIVE_MOATS]
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {getPrimaryPower(story) && (
                    <div className="border border-white/20 p-6">
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] block mb-3">
                        Primary Moat
                      </span>
                      <p className="font-serif text-2xl text-white">{getPrimaryPower(story)}</p>
                    </div>
                  )}
                  {getSecondaryPower(story) && (
                    <div className="border border-white/10 p-6">
                      <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] block mb-3">
                        Moat Description
                      </span>
                      <p className="text-white/60 text-sm leading-relaxed">{getSecondaryPower(story)}</p>
                    </div>
                  )}
                </div>

                {/* Power Metrics Grid */}
                {powerMetrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
                    {powerMetrics.map((metric, index) => {
                      const Icon = metric.icon;
                      return (
                        <div key={index} className={`p-4 ${getRatingLevel(metric.value)} border-r border-b border-white/10 last:border-r-0`}>
                          <Icon className="w-4 h-4 mb-2 opacity-60" strokeWidth={1.5} />
                          <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1 opacity-60">{metric.name}</p>
                          <p className="font-mono text-xs font-medium">{metric.value}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Power Analysis Section */}
        {story.power_analysis && (
          <section className="px-6 pb-12">
            <div className="max-w-4xl mx-auto">
              <div className="border border-white/10 p-8 md:p-12">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-6">
                  [POWER_ANALYSIS]
                </span>
                <p className="text-white/60 leading-relaxed">{story.power_analysis}</p>
              </div>
            </div>
          </section>
        )}

        {/* Resources Section */}
        {(story.podcast_links?.length > 0 || story.article_links?.length > 0 || story.resource_links?.length > 0) && (
          <section className="px-6 pb-12">
            <div className="max-w-4xl mx-auto">
              <div className="border border-white/10 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <BookOpen className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                    [RESOURCES]
                  </span>
                </div>

                {/* Podcasts */}
                {story.podcast_links?.length > 0 && (
                  <div className="mb-8">
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] block mb-4">
                      Podcasts
                    </span>
                    <div className="space-y-2">
                      {story.podcast_links.map((podcast, index) => (
                        <a
                          key={index}
                          href={podcast.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-colors group cursor-crosshair"
                        >
                          <span className="text-white/70 text-sm group-hover:text-white transition-colors">{podcast.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" strokeWidth={1.5} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Articles */}
                {story.article_links?.length > 0 && (
                  <div className="mb-8">
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] block mb-4">
                      Articles & Interviews
                    </span>
                    <div className="space-y-2">
                      {story.article_links.map((article, index) => (
                        <a
                          key={index}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-colors group cursor-crosshair"
                        >
                          <span className="text-white/70 text-sm group-hover:text-white transition-colors">{article.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" strokeWidth={1.5} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Resources */}
                {story.resource_links?.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em] block mb-4">
                      Additional Resources
                    </span>
                    <div className="space-y-2">
                      {story.resource_links.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-colors group cursor-crosshair"
                        >
                          <span className="text-white/70 text-sm group-hover:text-white transition-colors">{resource.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" strokeWidth={1.5} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Video Section */}
        {story.video_url && (
          <section className="px-6 pb-12">
            <div className="max-w-4xl mx-auto">
              <div className="border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Play className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
                    [VIDEO]
                  </span>
                </div>
                <div className="aspect-video border border-white/10 overflow-hidden">
                  <iframe
                    src={story.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="border border-white/10 p-8 md:p-12 text-center">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block mb-4">
                [NEXT_STEPS]
              </span>
              <h3 className="font-serif text-2xl text-white mb-4">
                Inspired by {getFounderName(story)}'s Journey?
              </h3>
              <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">
                Explore more founder blueprints and discover the patterns behind Chicago's most successful startups.
              </p>
              <Link
                to={createPageUrl("Stories")}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] px-8 py-4 bg-white text-black hover:bg-white/90 transition-colors cursor-crosshair"
              >
                Explore More Blueprints
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </section>

        <BureauFooter />
      </div>
    </div>
  );
}
