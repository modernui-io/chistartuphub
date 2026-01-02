import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Database,
  Compass,
  Users,
  ArrowRight,
  DollarSign,
  Building2,
  GraduationCap,
  Calendar,
  X
} from "lucide-react";
import SEO from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";

// Sample resources data
const resourcesData = [
  { id: 1, name: "1871 Chicago Tech Hub", category: "Incubators", description: "Chicago's tech incubator and co-working space for startups.", tags: ["tech", "incubator", "workspace"] },
  { id: 2, name: "Polsky Center for Entrepreneurship", category: "Incubators", description: "UChicago's innovation and startup support center.", tags: ["university", "incubator", "mentorship"] },
  { id: 3, name: "Chicago Ventures", category: "Funding", description: "Early-stage venture capital firm focused on Chicago startups.", tags: ["vc", "investment", "seed"] },
  { id: 4, name: "Pritzker Group Venture Capital", category: "Funding", description: "Multi-stage venture capital firm based in Chicago.", tags: ["vc", "investment", "growth"] },
  { id: 5, name: "MATTER Health", category: "Incubators", description: "Healthcare technology incubator and innovation hub.", tags: ["healthcare", "biotech", "incubator"] },
  { id: 6, name: "mHub", category: "Workspaces", description: "Innovation center for physical product development.", tags: ["hardware", "manufacturing", "workspace"] },
  { id: 7, name: "Techstars Chicago", category: "Incubators", description: "Global accelerator program with Chicago cohort.", tags: ["accelerator", "mentorship", "funding"] },
  { id: 8, name: "SCORE Chicago", category: "Community", description: "Free mentorship from experienced business professionals.", tags: ["mentorship", "free", "guidance"] },
  { id: 9, name: "Chicago Founder Conference", category: "Events", description: "Annual gathering of Chicago's startup community.", tags: ["conference", "networking", "annual"] },
  { id: 10, name: "WeWork Chicago", category: "Workspaces", description: "Flexible co-working spaces across Chicago.", tags: ["coworking", "office", "flexible"] },
  { id: 11, name: "Hyde Park Angels", category: "Funding", description: "One of the most active angel groups in the US.", tags: ["angel", "investment", "early-stage"] },
  { id: 12, name: "Built In Chicago", category: "Community", description: "Tech community platform for Chicago startups.", tags: ["jobs", "community", "tech"] },
];

export default function NavigatePaths() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const searchRef = useRef(null);
  const filterRef = useRef(null);

  const filters = ["ALL", "FUNDING", "INCUBATORS", "WORKSPACES", "COMMUNITY", "EVENTS"];

  const quickActions = [
    { icon: DollarSign, label: "FIND INVESTORS", query: "investors", filter: "FUNDING" },
    { icon: Building2, label: "CO-WORKING SPACES", query: "coworking", filter: "WORKSPACES" },
    { icon: GraduationCap, label: "MENTORSHIP PROGRAMS", query: "mentorship", filter: "ALL" },
    { icon: Calendar, label: "UPCOMING EVENTS", query: "events", filter: "EVENTS" },
  ];

  // Filter resources
  const filteredResources = resourcesData.filter((resource) => {
    const filterCategory = selectedFilter === "ALL" ? null : selectedFilter.charAt(0) + selectedFilter.slice(1).toLowerCase();
    const matchesFilter = selectedFilter === "ALL" || resource.category === filterCategory;
    const matchesQuery = searchQuery.trim() === "" ||
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const isSearching = searchQuery.trim() !== "";
  const showQuickActions = isFocused && !isSearching;
  const showResults = isSearching;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQuickAction = (action) => {
    setSearchQuery(action.query);
    setSelectedFilter(action.filter);
    setIsFocused(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedFilter("ALL");
  };

  const paths = [
    {
      id: "direct",
      index: "01",
      title: "DIRECT ACCESS",
      question: "Do you want direct access to resources?",
      description: "Skip the noise. Access the full directory of investors, incubators, and tools directly.",
      icon: Database,
      action: () => navigate('/resources'),
      actionText: "BROWSE DIRECTORY"
    },
    {
      id: "assessment",
      index: "02",
      title: "PERSONALIZED ASSESSMENT",
      question: "Do you want to take a quick assessment?",
      description: "Unsure where to start? Take a quick assessment to generate a personalized roadmap.",
      icon: Compass,
      action: () => navigate('/business-type-explorer'),
      actionText: "START ASSESSMENT"
    },
    {
      id: "community",
      index: "03",
      title: "COMMUNITY & PEERS",
      question: "Do you want to connect with the community?",
      description: "Don't build alone. Find peer groups, mentors, and local communities relevant to you.",
      icon: Users,
      action: () => navigate('/community'),
      actionText: "FIND COMMUNITY"
    }
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#050A14' }}
    >
      <SEO
        title="Navigate the Ecosystem"
        description="Three ways to access the Chicago startup ecosystem."
        keywords="startup resources, founder navigation, Chicago ecosystem"
      />

      {/* Chicago Atmospheric Background - The "Ghost" Effect */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1920&q=80')`,
          filter: 'grayscale(100%) contrast(1.2)',
          opacity: 0.15
        }}
      />

      {/* Gradient Overlay - Heavier at top, lighter at bottom */}
      <div
        className="fixed inset-0 z-[1]"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(5, 10, 20, 0.97) 0%,
            rgba(5, 10, 20, 0.92) 30%,
            rgba(5, 10, 20, 0.88) 60%,
            rgba(5, 10, 20, 0.85) 100%
          )`
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="fixed inset-0 z-[2] opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative z-10 pt-32 md:pt-40 pb-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header Section */}
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6 tracking-tight">
              Navigate the Ecosystem
            </h1>
            <p className="font-mono text-sm text-white/50 uppercase tracking-[0.3em]">
              Help us find what you need
            </p>
          </motion.header>

          {/* Terminal Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl mx-auto mb-16"
            ref={searchRef}
          >
            <div className="relative">
              {/* Search Input Row */}
              <div className="flex items-center border-b border-white/30">
                {/* Search Icon */}
                <Search className="w-5 h-5 text-white/40" strokeWidth={1.5} />

                {/* Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  placeholder="SEARCH BY KEYWORD, FIRM NAME, OR CATEGORY..."
                  className="flex-1 bg-transparent px-4 py-5 text-white placeholder-white/30 focus:outline-none font-mono text-sm uppercase tracking-wider"
                />

                {/* Clear Button */}
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                )}

                {/* Divider */}
                <div className="h-6 w-px bg-white/20 mx-4" />

                {/* Filter Dropdown */}
                <div className="relative" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="font-mono text-sm uppercase tracking-wider text-white/60 hover:bg-white hover:text-black px-4 py-2 transition-all duration-0"
                  >
                    [FILTER: {selectedFilter}]
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {filterOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0 }}
                        className="absolute right-0 top-full mt-px bg-[#050A14]/95 backdrop-blur-md border border-white/15 z-50"
                      >
                        {filters.map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => {
                              setSelectedFilter(filter);
                              setFilterOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all duration-0 ${
                              selectedFilter === filter
                                ? 'bg-white text-black'
                                : 'text-white/60 hover:bg-white hover:text-black'
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Quick Actions */}
              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full bg-[#050A14]/95 backdrop-blur-md border border-white/15 border-t-0 z-40"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <span className="font-mono text-xs text-white/40 uppercase tracking-widest">
                        Quick Actions
                      </span>
                    </div>
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action)}
                          className="w-full flex items-center gap-4 px-4 py-4 text-white/60 hover:bg-white hover:text-black transition-all duration-0 cursor-crosshair"
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.5} />
                          <span className="font-mono text-sm uppercase tracking-wider">{action.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Conditional Content */}
          <AnimatePresence mode="wait">
            {showResults ? (
              /* Search Results */
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/15">
                  <p className="font-mono text-sm text-white/50 uppercase tracking-wider">
                    <span className="text-white">{filteredResources.length}</span> RESULTS FOR "{searchQuery.toUpperCase()}"
                    {selectedFilter !== "ALL" && <span> IN <span className="text-white">{selectedFilter}</span></span>}
                  </p>
                  <button
                    onClick={clearSearch}
                    className="font-mono text-xs text-white/40 hover:bg-white hover:text-black px-3 py-1 uppercase tracking-wider transition-all duration-0"
                  >
                    [CLEAR]
                  </button>
                </div>

                {filteredResources.length > 0 ? (
                  <div className="border border-white/15 backdrop-blur-sm bg-[#050A14]/30">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3">
                      {filteredResources.map((resource, index) => (
                        <div
                          key={resource.id}
                          onClick={() => navigate(`/resources/${resource.id}`)}
                          className={`group p-6 bg-transparent hover:bg-white text-white hover:text-black transition-all duration-0 cursor-crosshair backdrop-blur-sm
                            ${index % 3 !== 2 ? 'lg:border-r border-white/15' : ''}
                            ${index % 2 !== 1 ? 'md:border-r md:lg:border-r-0 border-white/15' : ''}
                            ${index < filteredResources.length - 3 ? 'lg:border-b border-white/15' : ''}
                            ${index < filteredResources.length - 2 ? 'md:lg:border-b-0 md:border-b border-white/15' : ''}
                          `}
                        >
                          <span className="font-mono text-xs text-white/40 group-hover:text-black/40 uppercase tracking-widest mb-3 block">
                            {resource.category}
                          </span>
                          <h3 className="font-mono text-sm font-bold uppercase tracking-wide mb-2">
                            {resource.name}
                          </h3>
                          <p className="text-sm leading-relaxed opacity-60 group-hover:opacity-80">
                            {resource.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 border border-white/15 backdrop-blur-sm bg-[#050A14]/30">
                    <Search className="w-8 h-8 text-white/20 mx-auto mb-4" strokeWidth={1.5} />
                    <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">NO RESULTS FOUND</h3>
                    <p className="text-white/40 text-sm mb-6">
                      Try a different keyword or adjust your filter.
                    </p>
                    <button
                      onClick={clearSearch}
                      className="font-mono text-xs text-white/50 hover:bg-white hover:text-black px-4 py-2 uppercase tracking-wider transition-all duration-0"
                    >
                      [CLEAR SEARCH]
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Data Cell Cards Grid */
              <motion.div
                key="paths"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* The Grid Container with Border */}
                <div className="border border-white/15 backdrop-blur-sm bg-[#050A14]/30">
                  <div className="grid md:grid-cols-3">
                    {paths.map((path, index) => {
                      const Icon = path.icon;
                      const isLast = index === paths.length - 1;
                      return (
                        <button
                          key={path.id}
                          onClick={path.action}
                          className={`group relative text-left p-8 md:p-10 bg-transparent hover:bg-white text-white hover:text-black transition-all duration-0 cursor-crosshair backdrop-blur-sm
                            ${!isLast ? 'md:border-r border-white/15' : ''}
                            border-b md:border-b-0 border-white/15 last:border-b-0
                          `}
                        >
                          {/* Index Number */}
                          <span className="absolute top-6 right-6 font-mono text-sm text-white/30 group-hover:text-black/30">
                            {path.index}
                          </span>

                          {/* Icon */}
                          <div className="mb-6">
                            <Icon className="w-8 h-8 text-white/60 group-hover:text-black/60" strokeWidth={1.5} />
                          </div>

                          {/* Title */}
                          <h2 className="font-mono text-base font-bold uppercase tracking-wider mb-3">
                            {path.title}
                          </h2>

                          {/* Question */}
                          <p className="font-serif text-lg mb-4 opacity-80">
                            {path.question}
                          </p>

                          {/* Description */}
                          <p className="text-sm leading-relaxed opacity-50 group-hover:opacity-70 mb-8">
                            {path.description}
                          </p>

                          {/* Action */}
                          <div className="flex items-center font-mono text-xs uppercase tracking-widest opacity-50 group-hover:opacity-100">
                            <span>{path.actionText}</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <motion.footer
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center mt-16"
                >
                  <p className="font-mono text-xs text-white/30 uppercase tracking-[0.3em]">
                    Chicago's Public Operating System
                  </p>
                </motion.footer>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
