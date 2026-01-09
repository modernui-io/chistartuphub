import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";

const aiToolsByWorkflow = [
  {
    workflow: "Research & Knowledge",
    icon: "🔍",
    tools: [
      { name: "Perplexity", desc: "AI-powered research and answer engine with citations", link: "https://www.perplexity.ai" },
      { name: "NotebookLM", desc: "Google's AI research assistant that sources from your documents", link: "https://notebooklm.google.com" },
      { name: "ChatGPT Search", desc: "Real-time web search integrated with ChatGPT", link: "https://chat.openai.com" },
      { name: "Elicit", desc: "AI research assistant for finding and analyzing papers", link: "https://elicit.org" },
      { name: "Consensus", desc: "Search engine that uses AI to find answers in research papers", link: "https://consensus.app" },
    ],
  },
  {
    workflow: "Writing & Content",
    icon: "✍️",
    tools: [
      { name: "ChatGPT", desc: "AI assistant for writing, coding, analysis, and brainstorming", link: "https://chat.openai.com" },
      { name: "Claude", desc: "AI assistant by Anthropic with long context window", link: "https://claude.ai" },
      { name: "Gemini", desc: "Google's multimodal AI for text, images, and code", link: "https://gemini.google.com" },
      { name: "Copy.ai", desc: "AI copywriting for marketing content and ads", link: "https://www.copy.ai" },
      { name: "Jasper", desc: "AI content platform for marketing teams", link: "https://www.jasper.ai" },
    ],
  },
  {
    workflow: "Design & Visual",
    icon: "🎨",
    tools: [
      { name: "Midjourney", desc: "AI image generation for creative visuals", link: "https://www.midjourney.com" },
      { name: "DALL-E 3", desc: "OpenAI's latest image generation from text descriptions", link: "https://openai.com/dall-e" },
      { name: "V0 by Vercel", desc: "AI-powered UI generation and web development", link: "https://v0.dev" },
      { name: "Canva Magic Studio", desc: "AI-powered design tools within Canva", link: "https://www.canva.com" },
      { name: "Looka", desc: "AI logo and brand identity designer", link: "https://looka.com" },
    ],
  },
  {
    workflow: "Video & Audio",
    icon: "🎬",
    tools: [
      { name: "Runway", desc: "AI video editing and generation tools", link: "https://runwayml.com" },
      { name: "Synthesia", desc: "AI video creation with avatars and voices", link: "https://www.synthesia.io" },
      { name: "ElevenLabs", desc: "AI voice cloning and text-to-speech", link: "https://elevenlabs.io" },
      { name: "Descript", desc: "AI-powered video and podcast editing", link: "https://www.descript.com" },
      { name: "OpusClip", desc: "AI-powered video clip creation for social media", link: "https://www.opus.pro" },
    ],
  },
  {
    workflow: "Code & Development",
    icon: "💻",
    tools: [
      { name: "Cursor", desc: "AI-first code editor built on VSCode", link: "https://cursor.sh" },
      { name: "GitHub Copilot", desc: "AI pair programmer from GitHub and OpenAI", link: "https://github.com/features/copilot" },
      { name: "Lovable", desc: "AI that builds full-stack web apps from descriptions", link: "https://lovable.dev" },
      { name: "Bolt.new", desc: "AI that builds and deploys full-stack apps", link: "https://bolt.new" },
      { name: "Replit AI", desc: "AI coding assistant in browser-based IDE", link: "https://replit.com" },
    ],
  },
  {
    workflow: "Productivity",
    icon: "⚡",
    tools: [
      { name: "Notion AI", desc: "AI assistant built into Notion workspace", link: "https://www.notion.so/product/ai" },
      { name: "Otter.ai", desc: "AI meeting transcription and notes", link: "https://otter.ai" },
      { name: "Gamma", desc: "AI-powered presentation creation", link: "https://gamma.app" },
      { name: "Zapier AI", desc: "Automate workflows with AI-powered integrations", link: "https://zapier.com" },
      { name: "Reclaim.ai", desc: "AI calendar assistant and time management", link: "https://reclaim.ai" },
    ],
  },
];

export default function AIToolsSection({ searchQuery = "" }) {
  const [expandedWorkflows, setExpandedWorkflows] = useState([]);

  const toggleWorkflow = (workflow) => {
    setExpandedWorkflows(prev => 
      prev.includes(workflow) 
        ? prev.filter(w => w !== workflow)
        : [...prev, workflow]
    );
  };

  // Filter tools based on search query
  const filteredTools = searchQuery.trim() === ""
    ? aiToolsByWorkflow
    : aiToolsByWorkflow
        .map((workflow) => ({
          ...workflow,
          tools: workflow.tools.filter((tool) => {
            const query = searchQuery.toLowerCase();
            return (
              tool.name.toLowerCase().includes(query) ||
              tool.desc.toLowerCase().includes(query)
            );
          }),
        }))
        .filter((workflow) => workflow.tools.length > 0);

  if (searchQuery.trim() !== "" && filteredTools.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Caveat Notice */}
      <div className="border border-white/10 bg-white/[0.02] p-4 mb-6 flex gap-4">
        <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <p className="text-xs text-white/50 leading-relaxed">
            <span className="text-white/70 font-medium">Note:</span> The AI landscape evolves rapidly. This list is a starting point, not a comprehensive directory. For the latest tools, visit{" "}
            <a 
              href="https://www.futuretools.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 underline hover:text-white transition-colors"
            >
              FutureTools
            </a>{" "}or{" "}
            <a 
              href="https://theresanaiforthat.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 underline hover:text-white transition-colors"
            >
              There's An AI For That
            </a>.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4">
        <p className="text-white/50 text-sm">
          Production AI tools organized by workflow and use case
        </p>
      </div>

      {/* Workflow Categories */}
      <div className="border border-white/10">
        {filteredTools.map((workflow, index) => {
          const isExpanded = expandedWorkflows.includes(workflow.workflow) || searchQuery.trim() !== "";
          
          return (
            <div 
              key={workflow.workflow}
              className={`${index < filteredTools.length - 1 ? 'border-b border-white/10' : ''}`}
            >
              {/* Workflow Header */}
              <button
                onClick={() => toggleWorkflow(workflow.workflow)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors cursor-crosshair"
              >
                <span className="font-mono text-[10px] text-white/30">0{index + 1}</span>
                <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-lg">
                  {workflow.icon}
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white flex-1">
                  {workflow.workflow}
                </span>
                <span className="font-mono text-[10px] text-white/30 mr-2">
                  {workflow.tools.length} TOOLS
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/30" strokeWidth={1.5} />
                )}
              </button>

              {/* Workflow Tools */}
              {isExpanded && (
                <div className="border-t border-white/10">
                  {workflow.tools.map((tool, toolIndex) => (
                    <a
                      key={tool.name}
                      href={tool.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-start gap-4 p-4 pl-16 hover:bg-white hover:text-black transition-colors group cursor-crosshair ${toolIndex < workflow.tools.length - 1 ? 'border-b border-white/10' : ''}`}
                    >
                      <span className="font-mono text-[10px] text-white/20 group-hover:text-black/40 pt-0.5">
                        {String(toolIndex + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono text-xs uppercase tracking-[0.05em] text-white group-hover:text-black mb-1">
                          {tool.name}
                        </h4>
                        <p className="text-xs text-white/40 group-hover:text-black/60">{tool.desc}</p>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-white/20 group-hover:text-black/50 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
