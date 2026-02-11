import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Trash2, Search, FolderOpen, Download, StickyNote, X, Check, List } from "lucide-react";
import ExportResourcesModal from "@/components/ExportResourcesModal";
import { BureauAtmosphere, BureauFooter } from "@/components/bureau";
import SEO from "@/components/SEO";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { useInvestorPipeline } from "@/hooks/useInvestorPipeline";
import { useSavedLists } from "@/hooks/useSavedLists";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { InvestorModal } from "@/components/investors-v2/InvestorModal";

export default function SavedResources() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState("");

  // Pipeline data
  const { pipelineItems } = useInvestorPipeline();

  // Saved lists data
  const { savedLists, deleteList } = useSavedLists();
  const [expandedListId, setExpandedListId] = useState(null);
  const [listInvestors, setListInvestors] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  // Saved searches data
  const { savedSearches, deleteSearch } = useSavedSearches();

  const updateNote = async (bookmarkId, notes) => {
    try {
      const { error } = await supabase
        .from("bookmarks")
        .update({ notes })
        .eq("id", bookmarkId);

      if (error) throw error;

      setSavedItems(items =>
        items.map(item =>
          item.id === bookmarkId ? { ...item, notes } : item
        )
      );
      setEditingNoteId(null);
      toast.success("Note saved");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to save note");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchSavedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedItems(data || []);
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId) => {
    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", bookmarkId);

      if (error) throw error;
      setSavedItems(savedItems.filter((item) => item.id !== bookmarkId));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  // Expand a saved list to show its investors
  const handleExpandList = async (list) => {
    if (expandedListId === list.id) {
      setExpandedListId(null);
      setListInvestors([]);
      return;
    }
    setExpandedListId(list.id);
    setLoadingList(true);
    try {
      const ids = list.investor_ids || [];
      if (ids.length === 0) {
        setListInvestors([]);
        return;
      }
      const { data } = await supabase
        .from("public_investors")
        .select("*")
        .in("id", ids);
      setListInvestors(data || []);
    } catch {
      setListInvestors([]);
    } finally {
      setLoadingList(false);
    }
  };

  const resourceTypes = [
    { id: "all", label: "All" },
    { id: "pipeline", label: "Pipeline" },
    { id: "lists", label: "Lists" },
    { id: "searches", label: "Searches" },
    { id: "investor", label: "Investors" },
    { id: "workspace", label: "Workspaces" },
    { id: "event", label: "Events" },
    { id: "funding_opportunity", label: "Funding" },
    { id: "community", label: "Communities" },
  ];

  const filteredItems = savedItems.filter((item) => {
    if (filter !== "all" && filter !== "pipeline" && filter !== "lists" && filter !== "searches" && item.resource_type !== filter) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        item.resource_name?.toLowerCase().includes(searchLower) ||
        item.resource_type?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getTypeLabel = (type) => {
    const labels = {
      investor: "Investor",
      workspace: "Workspace",
      event: "Event",
      funding_opportunity: "Funding",
      community: "Community",
      accelerator: "Accelerator",
    };
    return labels[type] || type;
  };

  const getTabCount = (id) => {
    if (id === "all") return savedItems.length;
    if (id === "pipeline") return pipelineItems.length;
    if (id === "lists") return savedLists.length;
    if (id === "searches") return savedSearches.length;
    return savedItems.filter((i) => i.resource_type === id).length;
  };

  if (!user) return null;

  // Determine if we're showing a special tab
  const isSpecialTab = filter === "pipeline" || filter === "lists" || filter === "searches";

  return (
    <div className="min-h-screen relative" data-page="saved">
      <SEO
        title="Saved Resources | ChiStartup Hub"
        description="Access your saved investors, workspaces, events, and resources from Chicago's startup ecosystem."
      />

      <BureauAtmosphere />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`${isLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <span className="bureau-label block mb-6">[LIBRARY: SAVED_RESOURCES]</span>
            </div>

            <h1
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-6 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '200ms' }}
            >
              Your Saved Resources
            </h1>

            <p
              className={`text-white/50 text-lg max-w-xl mb-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              Quick access to your pipeline, saved lists, searches, and bookmarked resources.
            </p>

            {/* Stats */}
            <div
              className={`flex items-center gap-8 flex-wrap ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{savedItems.length}</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Saved Items</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{pipelineItems.length}</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">In Pipeline</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl text-white">{savedLists.length}</span>
                <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">Lists</span>
              </div>
              {savedItems.length > 0 && filter !== "pipeline" && filter !== "lists" && filter !== "searches" && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair flex items-center gap-2"
                >
                  <Download className="w-3 h-3" strokeWidth={1.5} />
                  Export (up to 10)
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Filters and Content */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            {/* Filter Tabs */}
            <div className="overflow-x-auto -mx-6 px-6 mb-8 scrollbar-hide">
              <div className="flex items-center gap-0 border border-white/20 w-fit bg-black/40 backdrop-blur-sm">
                {resourceTypes.map((type) => {
                  const count = getTabCount(type.id);
                  const isActive = filter === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFilter(type.id)}
                      className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] px-3 sm:px-4 py-3 flex items-center gap-2 transition-colors cursor-crosshair border-r border-white/20 last:border-r-0 whitespace-nowrap ${
                        isActive
                          ? "bg-white text-black"
                          : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      <span>{type.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 ${isActive ? 'bg-black/20' : 'bg-white/10'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pipeline Tab */}
            {filter === "pipeline" ? (
              <PipelineBoard />
            ) : filter === "lists" ? (
              /* Saved Lists Tab */
              <div>
                {savedLists.length === 0 ? (
                  <div className="border border-white/10 p-16 text-center bg-black/40 backdrop-blur-sm">
                    <List className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-4">[NO_SAVED_LISTS]</span>
                    <p className="text-white/40 mb-6">
                      Save search results as lists from the investor directory to keep static snapshots.
                    </p>
                    <button
                      onClick={() => navigate("/investors")}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                    >
                      Browse Investors
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedLists.map((list) => (
                      <div key={list.id} className="border border-white/10 bg-black/40 backdrop-blur-sm">
                        <div className="p-5 flex items-center justify-between">
                          <button
                            onClick={() => handleExpandList(list)}
                            className="flex-1 text-left"
                          >
                            <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-1">
                              {list.name}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[10px] text-white/40">
                                {(list.investor_ids || []).length} investors
                              </span>
                              <span className="font-mono text-[10px] text-white/30">
                                {new Date(list.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={() => deleteList(list.id)}
                            className="p-2 text-white/30 hover:text-red-400 transition-colors"
                            title="Delete list"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>

                        {/* Expanded list content */}
                        {expandedListId === list.id && (
                          <div className="border-t border-white/10 p-5">
                            {loadingList ? (
                              <p className="text-white/40 font-mono text-xs animate-pulse">Loading investors...</p>
                            ) : listInvestors.length === 0 ? (
                              <p className="text-white/40 font-mono text-xs">No investors found</p>
                            ) : (
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {listInvestors.map((inv) => (
                                  <button
                                    key={inv.id}
                                    onClick={() => setSelectedInvestor(inv)}
                                    className="text-left p-3 border border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-colors"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-1.5 py-0.5 border border-white/20 text-[8px] uppercase tracking-[0.08em] text-white/50 font-mono">
                                        {inv.investor_type?.toUpperCase() || "VC"}
                                      </span>
                                      {inv.is_midwest && (
                                        <span className="text-[8px] text-amber-400 font-mono">★</span>
                                      )}
                                    </div>
                                    <h4 className="font-mono text-xs uppercase tracking-[0.05em] text-white truncate">
                                      {inv.canonical_name}
                                    </h4>
                                    <p className="text-[10px] text-white/40 font-mono mt-1 truncate">
                                      {inv.hq_city ? `${inv.hq_city}, ${inv.hq_state || ''}` : 'National'}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : filter === "searches" ? (
              /* Saved Searches Tab */
              <div>
                {savedSearches.length === 0 ? (
                  <div className="border border-white/10 p-16 text-center bg-black/40 backdrop-blur-sm">
                    <Search className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-4">[NO_SAVED_SEARCHES]</span>
                    <p className="text-white/40 mb-6">
                      Save searches from the investor directory to quickly re-run them later.
                    </p>
                    <button
                      onClick={() => navigate("/investors")}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                    >
                      Browse Investors
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedSearches.map((s) => (
                      <div
                        key={s.id}
                        className="border border-white/10 bg-black/40 p-5 flex items-center justify-between hover:border-white/20 transition-colors group"
                      >
                        <button
                          onClick={() => navigate(`/investors?restore=${s.id}`)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-white">{s.name}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] font-mono border ${
                              s.search_mode === "semantic"
                                ? "border-purple-400/40 text-purple-400"
                                : "border-white/20 text-white/50"
                            }`}>
                              {s.search_mode === "semantic" ? "AI" : "BOOL"}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/40 font-mono">
                            "{s.query.substring(0, 60)}{s.query.length > 60 ? '...' : ''}"
                          </span>
                        </button>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-white/30">
                            {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <button
                            onClick={() => deleteSearch(s.id)}
                            className="p-2 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete search"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Standard Bookmarks View */
              <>
                {/* Search */}
                <div className="border border-white/20 mb-8 bg-black/40 backdrop-blur-sm">
                  <div className="p-4 flex items-center gap-4">
                    <Search className="w-4 h-4 text-white/50" strokeWidth={1.5} />
                    <input
                      type="text"
                      placeholder="SEARCH_SAVED..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-white/50 focus:outline-none uppercase tracking-[0.1em]"
                    />
                    <span className="font-mono text-xs text-white/50">
                      {filteredItems.length} RESULTS
                    </span>
                  </div>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="border border-white/10 p-16 text-center bg-black/40 backdrop-blur-sm">
                    <div className="font-mono text-4xl text-white mb-4 animate-pulse">
                      <span className="inline-block">LOADING</span>
                    </div>
                    <p className="font-mono text-xs text-white/40 uppercase tracking-[0.2em]">
                      Fetching saved resources...
                    </p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="border border-white/10 p-16 text-center bg-black/40 backdrop-blur-sm">
                    <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
                    <span className="bureau-label block mb-4">[NO_SAVED_ITEMS]</span>
                    <p className="text-white/40 mb-6">
                      {savedItems.length === 0
                        ? "You haven't saved any resources yet. Browse the ecosystem and click the bookmark icon to save items."
                        : "No items match your current filters."}
                    </p>
                    <button
                      onClick={() => navigate("/funding")}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] px-6 py-3 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors cursor-crosshair"
                    >
                      Explore Resources
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-white/10 bg-black/40 backdrop-blur-sm">
                    {filteredItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-6 border-b border-r border-white/10 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0 bg-black/20 hover:bg-black/40 transition-colors group flex flex-col"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="font-mono text-xs text-white/20">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.15em] px-2 py-1 border border-white/20">
                            {getTypeLabel(item.resource_type)}
                          </span>
                        </div>

                        <h3 className="font-mono text-sm uppercase tracking-[0.1em] text-white mb-2 group-hover:text-white transition-colors line-clamp-2">
                          {item.resource_name}
                        </h3>

                        <p className="text-white/60 text-sm leading-relaxed mb-3 flex-grow line-clamp-2">
                          {item.resource_description || `Saved ${getTypeLabel(item.resource_type).toLowerCase()}`}
                        </p>

                        {/* Notes Section */}
                        <div className="mb-4">
                          {editingNoteId === item.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a personal note..."
                                className="w-full bg-black/40 border border-white/20 p-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 resize-none font-mono"
                                rows={2}
                                maxLength={200}
                                autoFocus
                              />
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-white/30">
                                  {noteText.length}/200
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingNoteId(null)}
                                    className="p-1.5 text-white/40 hover:text-white transition-colors"
                                  >
                                    <X className="w-3 h-3" strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => updateNote(item.id, noteText)}
                                    className="p-1.5 text-green-400 hover:text-green-300 transition-colors"
                                  >
                                    <Check className="w-3 h-3" strokeWidth={2} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setNoteText(item.notes || "");
                              }}
                              className="w-full text-left"
                            >
                              {item.notes ? (
                                <p className="text-xs text-amber-400/70 italic line-clamp-2 hover:text-amber-400 transition-colors">
                                  "{item.notes}"
                                </p>
                              ) : (
                                <p className="text-[10px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-1.5">
                                  <StickyNote className="w-3 h-3" strokeWidth={1.5} />
                                  Add note...
                                </p>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                          <span className="font-mono text-xs text-white/40">
                            {new Date(item.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeBookmark(item.id)}
                              className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 border border-white/20 text-white/40 hover:text-red-400 hover:border-red-400/50 transition-colors cursor-crosshair"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                            </button>
                            {item.resource_url && (
                              <a
                                href={item.resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 border border-white/20 text-white/60 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center gap-1 cursor-crosshair"
                              >
                                View
                                <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <BureauFooter />
      </div>

      {/* Export Modal */}
      <ExportResourcesModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        resources={filteredItems}
        getTypeLabel={getTypeLabel}
      />

      {/* Investor Modal (for saved lists) */}
      <InvestorModal
        investor={selectedInvestor}
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
      />
    </div>
  );
}
