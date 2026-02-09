import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";

/* ───────── palette ───────── */
const C = {
  bg: "#0a0a0f",
  white: "#ffffff",
  gold: "#d4af37",
  muted: "#94a3b8",
  dim: "#475569",
  blue: "#1e3a5f",
  green: "#22c55e",
  searchBg: "rgba(255,255,255,0.06)",
  searchBorder: "rgba(255,255,255,0.12)",
  toggleActive: "#d4af37",
  toggleInactive: "rgba(255,255,255,0.15)",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  tierStrong: "#22c55e",
  tierExploring: "#d4af37",
  tierBroader: "#94a3b8",
};

const FONT = "system-ui, -apple-system, sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'Consolas', monospace";

/* ───────── shared components ───────── */

const Background: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(145deg, ${C.bg} 0%, #0f172a 50%, ${C.bg} 100%)` }} />
    <AbsoluteFill
      style={{
        backgroundImage: `
          linear-gradient(rgba(100,150,200,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100,150,200,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: `
          linear-gradient(rgba(100,150,200,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100,150,200,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "200px 200px",
      }}
    />
  </AbsoluteFill>
);

const FadeSlideIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
}> = ({ children, delay = 0, duration = 20, direction = "up", distance = 30 }) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - delay);
  const opacity = interpolate(t, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const offset = interpolate(t, [0, duration], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const transforms: Record<string, string> = {
    up: `translateY(${offset}px)`,
    down: `translateY(${-offset}px)`,
    left: `translateX(${offset}px)`,
    right: `translateX(${-offset}px)`,
  };
  return <div style={{ opacity, transform: transforms[direction] }}>{children}</div>;
};

/* typewriter: returns substring of text based on frame */
function useTypedText(text: string, startFrame: number, charsPerFrame = 0.8) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return text.slice(0, chars);
}

/* blinking cursor */
const Cursor: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0;
  if (!visible) return null;
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "1.1em",
        backgroundColor: C.gold,
        marginLeft: 2,
        opacity: blink ? 1 : 0,
        verticalAlign: "text-bottom",
      }}
    />
  );
};

/* search bar mock UI */
const SearchBar: React.FC<{
  text: string;
  showCursor?: boolean;
  mode?: "boolean" | "semantic";
  placeholder?: string;
}> = ({ text, showCursor = true, mode = "boolean", placeholder }) => (
  <div
    style={{
      width: 900,
      border: `1px solid ${C.searchBorder}`,
      backgroundColor: C.searchBg,
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      padding: "18px 28px",
      gap: 14,
      borderRadius: 2,
    }}
  >
    {/* search icon */}
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <span
      style={{
        fontFamily: MONO,
        fontSize: 18,
        color: text ? C.white : C.dim,
        flex: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {text || placeholder || "Search..."}
      {showCursor && <Cursor />}
    </span>
    {/* mode badge */}
    <div
      style={{
        padding: "6px 14px",
        fontSize: 12,
        fontFamily: MONO,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: mode === "semantic" ? C.bg : C.gold,
        backgroundColor: mode === "semantic" ? C.gold : "transparent",
        border: `1px solid ${C.gold}`,
        borderRadius: 2,
      }}
    >
      {mode === "semantic" ? "Semantic" : "Boolean"}
    </div>
  </div>
);

/* mode toggle component */
const ModeToggle: React.FC<{ active: "boolean" | "semantic"; progress?: number }> = ({
  active,
  progress = 1,
}) => {
  const isSemantic = active === "semantic";
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        border: `1px solid ${C.searchBorder}`,
        overflow: "hidden",
        borderRadius: 2,
        transform: `scale(${progress})`,
      }}
    >
      <div
        style={{
          padding: "10px 22px",
          fontSize: 14,
          fontFamily: MONO,
          color: !isSemantic ? C.bg : C.muted,
          backgroundColor: !isSemantic ? C.gold : "transparent",
          letterSpacing: "0.05em",
        }}
      >
        Boolean
      </div>
      <div
        style={{
          padding: "10px 22px",
          fontSize: 14,
          fontFamily: MONO,
          color: isSemantic ? C.bg : C.muted,
          backgroundColor: isSemantic ? C.gold : "transparent",
          letterSpacing: "0.05em",
        }}
      >
        Semantic
      </div>
    </div>
  );
};

/* result card mock */
const ResultCard: React.FC<{
  name: string;
  detail: string;
  tag?: string;
  tier?: "strong" | "exploring" | "broader";
  delay?: number;
}> = ({ name, detail, tag, tier = "strong", delay = 0 }) => {
  const tierColors = { strong: C.tierStrong, exploring: C.tierExploring, broader: C.tierBroader };
  return (
    <FadeSlideIn delay={delay} duration={15} distance={20}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 24px",
          backgroundColor: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          borderLeft: `3px solid ${tierColors[tier]}`,
          width: 800,
          borderRadius: 2,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.white, fontFamily: FONT }}>{name}</div>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT, marginTop: 4 }}>{detail}</div>
        </div>
        {tag && (
          <div
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontFamily: MONO,
              color: C.gold,
              border: `1px solid rgba(212,175,55,0.3)`,
              borderRadius: 2,
              letterSpacing: "0.05em",
            }}
          >
            {tag}
          </div>
        )}
      </div>
    </FadeSlideIn>
  );
};

/* ═══════════════════════════════════════════
   SCENES
   ═══════════════════════════════════════════ */

/* Scene 1: Intro (0-90 frames = 3s) */
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const lineWidth = interpolate(frame, [20, 50], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", opacity: titleOpacity, transform: `scale(${titleScale})` }}>
          <div
            style={{
              fontSize: 28,
              color: C.gold,
              fontFamily: MONO,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            ChiStartupHub
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: C.white,
              fontFamily: FONT,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 40px rgba(0,0,0,0.6)",
              lineHeight: 1.1,
            }}
          >
            Intelligent Funding
            <br />
            Search
          </div>
          {/* gold accent line */}
          <div
            style={{
              width: lineWidth,
              height: 2,
              backgroundColor: C.gold,
              margin: "30px auto 0",
              boxShadow: "0 0 20px rgba(212,175,55,0.4)",
            }}
          />
          <FadeSlideIn delay={40} duration={20}>
            <div
              style={{
                fontSize: 20,
                color: C.muted,
                fontFamily: FONT,
                marginTop: 24,
                letterSpacing: "0.05em",
              }}
            >
              Boolean Precision + Semantic Understanding
            </div>
          </FadeSlideIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 2: Problem Statement (0-75 frames = 2.5s) */
const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stats = [
    { number: "2,000+", label: "Investors" },
    { number: "300+", label: "Opportunities" },
    { number: "4", label: "Funding Categories" },
  ];

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <FadeSlideIn delay={0} duration={18}>
          <div
            style={{
              fontSize: 42,
              fontWeight: 600,
              color: C.white,
              fontFamily: FONT,
              textAlign: "center",
              marginBottom: 50,
              letterSpacing: "-0.01em",
            }}
          >
            All your funding data.
            <br />
            <span style={{ color: C.gold }}>One search.</span>
          </div>
        </FadeSlideIn>

        <div style={{ display: "flex", gap: 60 }}>
          {stats.map((s, i) => (
            <FadeSlideIn key={s.label} delay={15 + i * 12} duration={18}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 700,
                    color: C.gold,
                    fontFamily: FONT,
                    textShadow: "0 2px 20px rgba(212,175,55,0.3)",
                  }}
                >
                  {s.number}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: C.muted,
                    fontFamily: MONO,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginTop: 8,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </FadeSlideIn>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 3: Boolean Demo (0-150 frames = 5s) */
const BooleanDemoScene: React.FC = () => {
  const frame = useCurrentFrame();

  const query = 'fintech AND seed NOT crypto "series a"';
  const typed = useTypedText(query, 20, 0.7);

  // Highlight AND, OR, NOT, quotes in the typed text
  const highlightSyntax = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\bAND\b|\bOR\b|\bNOT\b|"[^"]*")/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    const str = text;
    regex.lastIndex = 0;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{str.slice(lastIndex, match.index)}</span>);
      }
      const m = match[0];
      const isOperator = ["AND", "OR", "NOT"].includes(m);
      const isQuoted = m.startsWith('"');
      parts.push(
        <span
          key={key++}
          style={{
            color: isOperator ? C.gold : isQuoted ? C.green : C.white,
            fontWeight: isOperator ? 700 : 400,
          }}
        >
          {m}
        </span>
      );
      lastIndex = match.index + m.length;
    }
    if (lastIndex < str.length) {
      parts.push(<span key={key++}>{str.slice(lastIndex)}</span>);
    }
    return parts;
  };

  // Explanation labels that appear after typing
  const typingDone = typed.length >= query.length;
  const labels = [
    { text: "AND = require both terms", x: 130, delay: 0 },
    { text: "NOT = exclude terms", x: 420, delay: 8 },
    { text: '""  = exact phrase match', x: 620, delay: 16 },
  ];

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <FadeSlideIn delay={0} duration={15}>
          <div
            style={{
              fontSize: 16,
              color: C.muted,
              fontFamily: MONO,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 30,
              textAlign: "center",
            }}
          >
            Mode 1: Boolean Search
          </div>
        </FadeSlideIn>

        <FadeSlideIn delay={5} duration={15}>
          <div
            style={{
              width: 900,
              border: `1px solid ${C.searchBorder}`,
              backgroundColor: C.searchBg,
              display: "flex",
              alignItems: "center",
              padding: "18px 28px",
              gap: 14,
              borderRadius: 2,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span style={{ fontFamily: MONO, fontSize: 18, color: C.white, flex: 1, whiteSpace: "nowrap" }}>
              {highlightSyntax(typed)}
              <Cursor visible={!typingDone} />
            </span>
            <div
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontFamily: MONO,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: C.gold,
                border: `1px solid ${C.gold}`,
                borderRadius: 2,
              }}
            >
              Boolean
            </div>
          </div>
        </FadeSlideIn>

        {/* Operator labels appear below */}
        {typingDone && (
          <div style={{ position: "relative", width: 900, marginTop: 20 }}>
            {labels.map((l, i) => (
              <FadeSlideIn key={l.text} delay={i * 8} duration={12} distance={10}>
                <div
                  style={{
                    position: "absolute",
                    left: l.x,
                    top: 0,
                    fontSize: 13,
                    color: C.gold,
                    fontFamily: MONO,
                    opacity: 0.8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {l.text}
                </div>
              </FadeSlideIn>
            ))}
          </div>
        )}

        {/* Operator buttons — shows users they can click these */}
        <FadeSlideIn delay={70} duration={15} distance={15}>
          <div
            style={{
              fontSize: 14,
              color: C.dim,
              fontFamily: MONO,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: 60,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Click to insert operators
          </div>
        </FadeSlideIn>
        <div style={{ display: "flex", gap: 16, marginTop: 0 }}>
          {[
            { label: "AND", desc: "require both" },
            { label: "OR", desc: "either term" },
            { label: "NOT", desc: "exclude term" },
            { label: '"..."', desc: "exact phrase" },
          ].map((op, i) => (
            <FadeSlideIn key={op.label} delay={80 + i * 10} duration={15} distance={15}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    padding: "12px 28px",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: MONO,
                    color: C.bg,
                    backgroundColor: C.gold,
                    borderRadius: 4,
                    letterSpacing: "0.05em",
                    boxShadow: "0 2px 12px rgba(212,175,55,0.3)",
                  }}
                >
                  {op.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    fontFamily: FONT,
                  }}
                >
                  {op.desc}
                </div>
              </div>
            </FadeSlideIn>
          ))}
        </div>
        {/* Works on all tabs note */}
        <FadeSlideIn delay={120} duration={15} distance={10}>
          <div
            style={{
              marginTop: 30,
              fontSize: 14,
              color: C.muted,
              fontFamily: MONO,
              letterSpacing: "0.05em",
              textAlign: "center",
            }}
          >
            Works on ALL tabs — Hot, Grants, Accelerators, VC
          </div>
        </FadeSlideIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 4: Mode Toggle (0-60 frames = 2s) */
const ToggleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Toggle animates from boolean to semantic
  const progress = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const switchAt = 30;
  const mode: "boolean" | "semantic" = frame >= switchAt ? "semantic" : "boolean";

  // Arrow / pointer animation
  const arrowX = interpolate(frame, [20, 35], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${progress})` }}>
          <FadeSlideIn delay={0}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: C.white,
                fontFamily: FONT,
                marginBottom: 50,
              }}
            >
              Switch modes with one click
            </div>
          </FadeSlideIn>

          {/* Large toggle */}
          <div
            style={{
              display: "flex",
              gap: 0,
              border: `1px solid ${C.searchBorder}`,
              overflow: "hidden",
              borderRadius: 2,
              margin: "0 auto",
              width: "fit-content",
            }}
          >
            <div
              style={{
                padding: "20px 50px",
                fontSize: 22,
                fontFamily: MONO,
                color: mode === "boolean" ? C.bg : C.muted,
                backgroundColor: mode === "boolean" ? C.gold : "transparent",
                letterSpacing: "0.05em",
                transition: "none",
              }}
            >
              Boolean
            </div>
            <div
              style={{
                padding: "20px 50px",
                fontSize: 22,
                fontFamily: MONO,
                color: mode === "semantic" ? C.bg : C.muted,
                backgroundColor: mode === "semantic" ? C.gold : "transparent",
                letterSpacing: "0.05em",
                transition: "none",
              }}
            >
              Semantic
            </div>
          </div>

          <FadeSlideIn delay={35} duration={15}>
            <div
              style={{
                fontSize: 18,
                color: C.muted,
                fontFamily: FONT,
                marginTop: 40,
              }}
            >
              {mode === "semantic" ? "Search by meaning, not just keywords" : ""}
            </div>
          </FadeSlideIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 5: Semantic Demo (0-180 frames = 6s) */
const SemanticDemoScene: React.FC = () => {
  const frame = useCurrentFrame();

  const query = "climate tech startup looking for seed funding in Chicago";
  const typed = useTypedText(query, 10, 0.6);
  const typingDone = typed.length >= query.length;

  // After typing, show "processing" then results
  const showProcessing = typingDone && frame < 120;
  const showResults = frame >= 110;

  // Processing dots animation
  const dots = ".".repeat((Math.floor(frame / 8) % 3) + 1);

  const results = [
    { name: "Chicago Ventures", detail: "Seed / Series A  ·  CleanTech, SaaS  ·  Chicago, IL", tag: "96% match", tier: "strong" as const },
    { name: "Clean Energy Trust", detail: "Grant  ·  Up to $250K  ·  Deadline: Apr 1", tag: "94% match", tier: "strong" as const },
    { name: "Lightbank", detail: "Seed / Growth  ·  Climate, PropTech  ·  Chicago, IL", tag: "88% match", tier: "exploring" as const },
    { name: "Greentown Labs Accelerator", detail: "Accelerator  ·  Climate & Energy  ·  Somerville, MA", tag: "Accelerator", tier: "exploring" as const },
  ];

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <FadeSlideIn delay={0} duration={12}>
            <div
              style={{
                fontSize: 16,
                color: C.muted,
                fontFamily: MONO,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Mode 2: Semantic Search
            </div>
          </FadeSlideIn>

          <FadeSlideIn delay={3} duration={12}>
            <SearchBar text={typed} showCursor={!typingDone} mode="semantic" />
          </FadeSlideIn>

          {/* Processing indicator */}
          {showProcessing && (
            <FadeSlideIn delay={0} duration={8} distance={10}>
              <div
                style={{
                  fontSize: 15,
                  color: C.gold,
                  fontFamily: MONO,
                  letterSpacing: "0.05em",
                  marginTop: 10,
                }}
              >
                Searching by meaning{dots}
              </div>
            </FadeSlideIn>
          )}

          {/* Results */}
          {showResults && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              <FadeSlideIn delay={0} duration={10} distance={8}>
                <div
                  style={{
                    fontSize: 13,
                    color: C.tierStrong,
                    fontFamily: MONO,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Strong Matches
                </div>
              </FadeSlideIn>
              {results.map((r, i) => (
                <ResultCard
                  key={r.name}
                  name={r.name}
                  detail={r.detail}
                  tag={r.tag}
                  tier={r.tier}
                  delay={5 + i * 8}
                />
              ))}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 6: Hybrid Power (0-90 frames = 3s) */
const HybridScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Show semantic results, then type NOT crypto to filter
  const booleanAppend = useTypedText(" NOT crypto", 20, 0.6);
  const baseQuery = "climate tech seed funding Chicago";

  const results = [
    { name: "Chicago Ventures", detail: "CleanTech, SaaS  ·  Chicago", visible: true },
    { name: "CryptoClimate Fund", detail: "Crypto, DeFi, Carbon Credits  ·  Remote", visible: false },
    { name: "Clean Energy Trust", detail: "Climate, Energy  ·  Chicago", visible: true },
  ];

  const filterApplied = booleanAppend.includes("crypto");

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <FadeSlideIn delay={0} duration={12}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: C.white,
                fontFamily: FONT,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              The <span style={{ color: C.gold }}>hybrid</span> power move
            </div>
          </FadeSlideIn>

          <FadeSlideIn delay={5} duration={12}>
            <div
              style={{
                fontSize: 16,
                color: C.muted,
                fontFamily: FONT,
                textAlign: "center",
                marginBottom: 15,
              }}
            >
              Layer Boolean operators on top of semantic results
            </div>
          </FadeSlideIn>

          <FadeSlideIn delay={8} duration={12}>
            <SearchBar
              text={baseQuery + booleanAppend}
              showCursor={booleanAppend.length < " NOT crypto".length}
              mode="semantic"
            />
          </FadeSlideIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {results.map((r, i) => {
              const hidden = filterApplied && !r.visible;
              return (
                <FadeSlideIn key={r.name} delay={12 + i * 6} duration={12}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 24px",
                      backgroundColor: C.cardBg,
                      border: `1px solid ${C.cardBorder}`,
                      borderLeft: `3px solid ${hidden ? "#ef4444" : C.tierStrong}`,
                      width: 800,
                      opacity: hidden ? 0.25 : 1,
                      borderRadius: 2,
                      textDecoration: hidden ? "line-through" : "none",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: C.white, fontFamily: FONT }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT, marginTop: 3 }}>
                        {r.detail}
                      </div>
                    </div>
                    {hidden && (
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: MONO,
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.3)",
                          padding: "3px 10px",
                          borderRadius: 2,
                        }}
                      >
                        EXCLUDED
                      </div>
                    )}
                  </div>
                </FadeSlideIn>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 7: Tabs Overview (0-90 frames = 3s) */
const TabsScene: React.FC = () => {
  const tabs = [
    { icon: "\uD83D\uDD25", name: "Hot", desc: "Upcoming deadlines" },
    { icon: "\uD83D\uDCB0", name: "Grants", desc: "Non-dilutive funding" },
    { icon: "\uD83D\uDE80", name: "Accelerators", desc: "Programs & cohorts" },
    { icon: "\uD83C\uDFE6", name: "Venture Capital", desc: "2,000+ investors" },
  ];

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <FadeSlideIn delay={0} duration={15}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: C.white,
              fontFamily: FONT,
              textAlign: "center",
              marginBottom: 50,
            }}
          >
            Search across <span style={{ color: C.gold }}>every</span> funding category
          </div>
        </FadeSlideIn>

        <div style={{ display: "flex", gap: 24 }}>
          {tabs.map((tab, i) => (
            <FadeSlideIn key={tab.name} delay={15 + i * 12} duration={18} distance={25}>
              <div
                style={{
                  width: 200,
                  padding: "30px 24px",
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  textAlign: "center",
                  borderRadius: 2,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 14 }}>{tab.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: C.white, fontFamily: FONT }}>
                  {tab.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.muted,
                    fontFamily: FONT,
                    marginTop: 8,
                  }}
                >
                  {tab.desc}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 11,
                    color: C.gold,
                    fontFamily: MONO,
                    letterSpacing: "0.08em",
                  }}
                >
                  Boolean + Semantic
                </div>
              </div>
            </FadeSlideIn>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 8: CTA (0-75 frames = 2.5s) */
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
          <div
            style={{
              fontSize: 20,
              color: C.gold,
              fontFamily: MONO,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            ChiStartupHub
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: C.white,
              fontFamily: FONT,
              textShadow: "0 4px 40px rgba(0,0,0,0.6)",
              letterSpacing: "-0.02em",
            }}
          >
            Try it now
          </div>
          <div
            style={{
              width: 120,
              height: 2,
              backgroundColor: C.gold,
              margin: "30px auto",
              boxShadow: "0 0 20px rgba(212,175,55,0.4)",
            }}
          />
          <FadeSlideIn delay={15} duration={18}>
            <div
              style={{
                fontSize: 28,
                color: C.muted,
                fontFamily: MONO,
                letterSpacing: "0.02em",
              }}
            >
              chistartuphub.com/funding
            </div>
          </FadeSlideIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   MAIN COMPOSITION
   ═══════════════════════════════════════════ */

export const SearchLaunch: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Intro: 0–90 (3s) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Problem/Stats: 90–165 (2.5s) */}
      <Sequence from={90} durationInFrames={75}>
        <ProblemScene />
      </Sequence>

      {/* Boolean Demo: 165–315 (5s) */}
      <Sequence from={165} durationInFrames={150}>
        <BooleanDemoScene />
      </Sequence>

      {/* Mode Toggle: 315–375 (2s) */}
      <Sequence from={315} durationInFrames={60}>
        <ToggleScene />
      </Sequence>

      {/* Semantic Demo: 375–555 (6s) */}
      <Sequence from={375} durationInFrames={180}>
        <SemanticDemoScene />
      </Sequence>

      {/* Hybrid: 555–645 (3s) */}
      <Sequence from={555} durationInFrames={90}>
        <HybridScene />
      </Sequence>

      {/* Tabs Overview: 645–735 (3s) */}
      <Sequence from={645} durationInFrames={90}>
        <TabsScene />
      </Sequence>

      {/* CTA: 735–810 (2.5s) */}
      <Sequence from={735} durationInFrames={75}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
