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

/* ───────── light-mode palette ───────── */
const C = {
  bg: "#ffffff",
  surface: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b",
  accent: "#d4af37",
  blue: "#2563eb",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  border: "#e2e8f0",
  gridLine: "rgba(0,0,0,0.04)",
  gridLineMajor: "rgba(0,0,0,0.08)",
  cardBg: "#ffffff",
  cardBorder: "#e2e8f0",
  searchBg: "#ffffff",
  searchBorder: "#cbd5e1",
};

const FONT = "system-ui, -apple-system, sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'Consolas', monospace";

/* ───────── shared components ───────── */

const LightBackground: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ backgroundColor: C.bg }} />
    <AbsoluteFill
      style={{
        backgroundImage: `
          linear-gradient(${C.gridLine} 1px, transparent 1px),
          linear-gradient(90deg, ${C.gridLine} 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: `
          linear-gradient(${C.gridLineMajor} 1px, transparent 1px),
          linear-gradient(90deg, ${C.gridLineMajor} 1px, transparent 1px)
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

function useTypedText(text: string, startFrame: number, charsPerFrame = 0.8) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return text.slice(0, chars);
}

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
        backgroundColor: C.accent,
        marginLeft: 2,
        opacity: blink ? 1 : 0,
        verticalAlign: "text-bottom",
      }}
    />
  );
};

const LightSearchBar: React.FC<{
  text: string;
  showCursor?: boolean;
  mode?: "boolean" | "semantic";
  placeholder?: string;
  children?: React.ReactNode;
}> = ({ text, showCursor = true, mode = "boolean", placeholder, children }) => (
  <div
    style={{
      width: 900,
      border: `1px solid ${C.searchBorder}`,
      backgroundColor: C.searchBg,
      display: "flex",
      alignItems: "center",
      padding: "18px 28px",
      gap: 14,
      borderRadius: 8,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <span
      style={{
        fontFamily: MONO,
        fontSize: 18,
        color: text ? C.text : C.muted,
        flex: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {text || placeholder || "Search..."}
      {showCursor && <Cursor />}
    </span>
    {children}
    <div
      style={{
        padding: "6px 14px",
        fontSize: 12,
        fontFamily: MONO,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: mode === "semantic" ? C.bg : C.accent,
        backgroundColor: mode === "semantic" ? C.accent : "transparent",
        border: `1px solid ${C.accent}`,
        borderRadius: 4,
      }}
    >
      {mode === "semantic" ? "Semantic" : "Boolean"}
    </div>
  </div>
);

const MockButton: React.FC<{
  label: string;
  color?: string;
  icon?: React.ReactNode;
  pressed?: boolean;
}> = ({ label, color = C.blue, icon, pressed = false }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 22px",
      fontSize: 14,
      fontWeight: 600,
      fontFamily: FONT,
      color: "#ffffff",
      backgroundColor: color,
      borderRadius: 6,
      boxShadow: pressed
        ? "0 1px 2px rgba(0,0,0,0.15)"
        : "0 2px 8px rgba(0,0,0,0.12)",
      transform: pressed ? "scale(0.97)" : "scale(1)",
    }}
  >
    {icon}
    {label}
  </div>
);

const MockPopover: React.FC<{
  children: React.ReactNode;
  visible: boolean;
}> = ({ children, visible }) => {
  const frame = useCurrentFrame();
  const opacity = visible
    ? interpolate(frame, [0, 100000], [1, 1], { extrapolateRight: "clamp" })
    : 0;
  if (!visible) return null;
  return (
    <div
      style={{
        backgroundColor: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "16px 20px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        opacity,
      }}
    >
      {children}
    </div>
  );
};

const TagPill: React.FC<{
  label: string;
  color: string;
  active?: boolean;
}> = ({ label, color, active = false }) => (
  <div
    style={{
      display: "inline-flex",
      padding: "6px 16px",
      fontSize: 13,
      fontWeight: 600,
      fontFamily: FONT,
      color: active ? "#ffffff" : color,
      backgroundColor: active ? color : "transparent",
      border: `1.5px solid ${color}`,
      borderRadius: 20,
    }}
  >
    {label}
  </div>
);

const CheckMark: React.FC<{ progress: number }> = ({ progress }) => {
  const dashOffset = interpolate(progress, [0, 1], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" stroke={C.green} strokeWidth="2" opacity={progress} />
      <path
        d="M7 12.5l3 3 7-7"
        stroke={C.green}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="24"
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};

const LightResultCard: React.FC<{
  name: string;
  detail: string;
  tag?: string;
  tier?: "strong" | "exploring" | "broader";
  delay?: number;
}> = ({ name, detail, tag, tier = "strong", delay = 0 }) => {
  const tierColors = { strong: C.green, exploring: C.accent, broader: C.muted };
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
          borderRadius: 6,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.text, fontFamily: FONT }}>{name}</div>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT, marginTop: 4 }}>{detail}</div>
        </div>
        {tag && (
          <div
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontFamily: MONO,
              color: tierColors[tier],
              border: `1px solid ${tierColors[tier]}40`,
              borderRadius: 4,
              letterSpacing: "0.05em",
              fontWeight: 600,
            }}
          >
            {tag}
          </div>
        )}
      </div>
    </FadeSlideIn>
  );
};

const KanbanColumn: React.FC<{
  title: string;
  color: string;
  count: number;
  cards: { name: string; detail: string }[];
  delay?: number;
}> = ({ title, color, count, cards, delay = 0 }) => (
  <FadeSlideIn delay={delay} duration={18} distance={25}>
    <div
      style={{
        width: 260,
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT }}>{title}</div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: color,
            backgroundColor: `${color}18`,
            padding: "2px 10px",
            borderRadius: 10,
            fontFamily: MONO,
          }}
        >
          {count}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 10px 14px" }}>
        {cards.map((card) => (
          <div
            key={card.name}
            style={{
              backgroundColor: C.cardBg,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "12px 14px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>
              {card.name}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 3 }}>
              {card.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  </FadeSlideIn>
);

/* ═══════════════════════════════════════════
   SCENES
   ═══════════════════════════════════════════ */

/* Scene 1: Intro (0–90 = 3s) */
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
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", opacity: titleOpacity, transform: `scale(${titleScale})` }}>
          <div
            style={{
              fontSize: 28,
              color: C.accent,
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
              fontSize: 68,
              fontWeight: 700,
              color: C.text,
              fontFamily: FONT,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Your Funding
            <br />
            Research Toolkit
          </div>
          <div
            style={{
              width: lineWidth,
              height: 3,
              backgroundColor: C.accent,
              margin: "30px auto 0",
              borderRadius: 2,
            }}
          />
          <FadeSlideIn delay={40} duration={20}>
            <div
              style={{
                fontSize: 20,
                color: C.muted,
                fontFamily: FONT,
                marginTop: 24,
                letterSpacing: "0.02em",
              }}
            >
              Search. Save. Organize. Export.
            </div>
          </FadeSlideIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 2: Stats (0–75 = 2.5s) */
const StatsScene: React.FC = () => {
  const stats = [
    { number: "2,000+", label: "Investors" },
    { number: "300+", label: "Opportunities" },
    { number: "4", label: "Categories" },
  ];

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <FadeSlideIn delay={0} duration={18}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: C.text,
              fontFamily: FONT,
              textAlign: "center",
              marginBottom: 50,
              letterSpacing: "-0.01em",
            }}
          >
            All your funding data.{" "}
            <span style={{ color: C.accent }}>One platform.</span>
          </div>
        </FadeSlideIn>

        <div style={{ display: "flex", gap: 60 }}>
          {stats.map((s, i) => (
            <FadeSlideIn key={s.label} delay={15 + i * 12} duration={18}>
              <div
                style={{
                  textAlign: "center",
                  backgroundColor: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "32px 48px",
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 700,
                    color: C.accent,
                    fontFamily: FONT,
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

/* Scene 3: Boolean Search (0–180 = 6s) */
const BooleanSearchScene: React.FC = () => {
  const frame = useCurrentFrame();

  const query = 'fintech AND seed NOT crypto "series a"';
  const typed = useTypedText(query, 20, 0.7);
  const typingDone = typed.length >= query.length;

  const highlightSyntax = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\bAND\b|\bOR\b|\bNOT\b|"[^"]*")/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
      }
      const m = match[0];
      const isOperator = ["AND", "OR", "NOT"].includes(m);
      const isQuoted = m.startsWith('"');
      parts.push(
        <span
          key={key++}
          style={{
            color: isOperator ? C.accent : isQuoted ? C.blue : C.text,
            fontWeight: isOperator ? 700 : 400,
          }}
        >
          {m}
        </span>
      );
      lastIndex = match.index + m.length;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  const labels = [
    { text: "AND = require both", x: 130, delay: 0 },
    { text: "NOT = exclude", x: 420, delay: 8 },
    { text: '"" = exact phrase', x: 620, delay: 16 },
  ];

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {/* Dictionary definition */}
        <FadeSlideIn delay={0} duration={15}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 16,
                color: C.muted,
                fontFamily: MONO,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Boolean Search
            </div>
            <div
              style={{
                fontSize: 14,
                color: C.muted,
                fontFamily: FONT,
                fontStyle: "italic",
                maxWidth: 600,
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontWeight: 600, color: C.text, fontStyle: "normal" }}>/ˈbuːliən/</span>
              {" "}<span style={{ color: C.accent, fontStyle: "normal" }}>noun</span> — A method of search using logical operators (AND, OR, NOT) to combine or exclude keywords for precise results.
            </div>
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
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span style={{ fontFamily: MONO, fontSize: 18, color: C.text, flex: 1, whiteSpace: "nowrap" }}>
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
                color: C.accent,
                border: `1px solid ${C.accent}`,
                borderRadius: 4,
              }}
            >
              Boolean
            </div>
          </div>
        </FadeSlideIn>

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
                    color: C.accent,
                    fontFamily: MONO,
                    opacity: 0.9,
                    whiteSpace: "nowrap",
                  }}
                >
                  {l.text}
                </div>
              </FadeSlideIn>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginTop: 70 }}>
          {[
            { label: "AND", desc: "require both" },
            { label: "OR", desc: "either term" },
            { label: "NOT", desc: "exclude term" },
            { label: '"..."', desc: "exact phrase" },
          ].map((op, i) => (
            <FadeSlideIn key={op.label} delay={80 + i * 10} duration={15} distance={15}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    padding: "12px 28px",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: MONO,
                    color: "#ffffff",
                    backgroundColor: C.accent,
                    borderRadius: 6,
                    letterSpacing: "0.05em",
                  }}
                >
                  {op.label}
                </div>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: FONT }}>{op.desc}</div>
              </div>
            </FadeSlideIn>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 4: Semantic Search (0–180 = 6s) */
const SemanticSearchScene: React.FC = () => {
  const frame = useCurrentFrame();

  const switchAt = 25;
  const mode: "boolean" | "semantic" = frame >= switchAt ? "semantic" : "boolean";

  const query = "climate tech startup looking for seed funding in California";
  const typed = useTypedText(query, 35, 0.6);
  const typingDone = typed.length >= query.length;

  const showProcessing = typingDone && frame < 130;
  const showResults = frame >= 120;

  const dots = ".".repeat((Math.floor(frame / 8) % 3) + 1);

  const results = [
    { name: "Sequoia Capital", detail: "Seed / Series A  ·  CleanTech, SaaS  ·  Menlo Park, CA", tag: "96% match", tier: "strong" as const },
    { name: "Kleiner Perkins", detail: "Seed / Growth  ·  Climate, Deep Tech  ·  Menlo Park, CA", tag: "94% match", tier: "strong" as const },
    { name: "Greylock Partners", detail: "Seed / Series A  ·  Enterprise, SaaS  ·  San Francisco, CA", tag: "88% match", tier: "exploring" as const },
  ];

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {/* Dictionary definition */}
          <FadeSlideIn delay={0} duration={12}>
            <div
              style={{
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  color: C.muted,
                  fontFamily: MONO,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Semantic Search
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: C.muted,
                  fontFamily: FONT,
                  fontStyle: "italic",
                  maxWidth: 600,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 600, color: C.text, fontStyle: "normal" }}>/sɪˈmæntɪk/</span>
                {" "}<span style={{ color: C.accent, fontStyle: "normal" }}>noun</span> — A method of search that understands meaning and context, finding relevant results even when exact keywords don't match.
              </div>
            </div>
          </FadeSlideIn>

          {/* Mode toggle */}
          <FadeSlideIn delay={5} duration={12}>
            <div
              style={{
                display: "flex",
                gap: 0,
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                borderRadius: 6,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  padding: "10px 28px",
                  fontSize: 14,
                  fontFamily: MONO,
                  color: mode === "boolean" ? "#ffffff" : C.muted,
                  backgroundColor: mode === "boolean" ? C.accent : "transparent",
                  letterSpacing: "0.05em",
                }}
              >
                Boolean
              </div>
              <div
                style={{
                  padding: "10px 28px",
                  fontSize: 14,
                  fontFamily: MONO,
                  color: mode === "semantic" ? "#ffffff" : C.muted,
                  backgroundColor: mode === "semantic" ? C.accent : "transparent",
                  letterSpacing: "0.05em",
                }}
              >
                Semantic
              </div>
            </div>
          </FadeSlideIn>

          <FadeSlideIn delay={10} duration={12}>
            <LightSearchBar text={typed} showCursor={!typingDone} mode={mode} />
          </FadeSlideIn>

          {showProcessing && (
            <FadeSlideIn delay={0} duration={8} distance={10}>
              <div
                style={{
                  fontSize: 15,
                  color: C.accent,
                  fontFamily: MONO,
                  letterSpacing: "0.05em",
                  marginTop: 5,
                }}
              >
                Searching by meaning{dots}
              </div>
            </FadeSlideIn>
          )}

          {showResults && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 5 }}>
              <FadeSlideIn delay={0} duration={10} distance={8}>
                <div
                  style={{
                    fontSize: 13,
                    color: C.green,
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
                <LightResultCard
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

/* Scene 5: Save Search (0–105 = 3.5s) */
const SaveSearchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const showPopover = frame >= 35;
  const showCheck = frame >= 70;

  const checkProgress = showCheck
    ? spring({ frame: frame - 70, fps, config: { damping: 12, stiffness: 100 } })
    : 0;

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <FadeSlideIn delay={0} duration={15}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: C.text,
                fontFamily: FONT,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Save your <span style={{ color: C.blue }}>search</span>
            </div>
          </FadeSlideIn>

          <FadeSlideIn delay={5} duration={12}>
            <LightSearchBar
              text='fintech AND seed NOT crypto'
              showCursor={false}
              mode="boolean"
            >
              <div style={{ marginLeft: "auto" }}>
                <MockButton
                  label="Save Search"
                  color={C.blue}
                  pressed={frame >= 25 && frame < 35}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  }
                />
              </div>
            </LightSearchBar>
          </FadeSlideIn>

          {showPopover && (
            <FadeSlideIn delay={0} duration={12} distance={15}>
              <MockPopover visible={true}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 320 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>
                    Name your search
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      fontFamily: FONT,
                      color: C.text,
                      backgroundColor: C.surface,
                    }}
                  >
                    Fintech Seed Deals
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!showCheck ? (
                      <MockButton label="Save" color={C.blue} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckMark progress={checkProgress} />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.green,
                            fontFamily: FONT,
                          }}
                        >
                          Saved!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </MockPopover>
            </FadeSlideIn>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 6: Save List (0–90 = 3s) */
const SaveListScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const showPopover = frame >= 35;
  const showCheck = frame >= 65;

  const checkProgress = showCheck
    ? spring({ frame: frame - 65, fps, config: { damping: 12, stiffness: 100 } })
    : 0;

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <FadeSlideIn delay={0} duration={15}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: C.text,
                fontFamily: FONT,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Save your <span style={{ color: C.accent }}>results</span>
            </div>
          </FadeSlideIn>

          {/* Results header bar */}
          <FadeSlideIn delay={5} duration={12}>
            <div
              style={{
                width: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 24px",
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: FONT }}>
                  127 Results
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    fontFamily: MONO,
                    padding: "3px 10px",
                    backgroundColor: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                  }}
                >
                  fintech AND seed
                </div>
              </div>
              <MockButton
                label="Save List"
                color={C.accent}
                pressed={frame >= 25 && frame < 35}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                }
              />
            </div>
          </FadeSlideIn>

          {showPopover && (
            <FadeSlideIn delay={0} duration={12} distance={15}>
              <MockPopover visible={true}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 320 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>
                    Name your list
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      fontFamily: FONT,
                      color: C.text,
                      backgroundColor: C.surface,
                    }}
                  >
                    My Fintech VCs
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!showCheck ? (
                      <MockButton label="Save" color={C.accent} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckMark progress={checkProgress} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.green, fontFamily: FONT }}>
                          Saved!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </MockPopover>
            </FadeSlideIn>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 7: Export (0–90 = 3s) */
const ExportScene: React.FC = () => {
  const frame = useCurrentFrame();

  const showDropdown = frame >= 25;
  const showDownload = frame >= 60;

  const downloadY = showDownload
    ? interpolate(frame - 60, [0, 20], [0, 15], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;
  const downloadOpacity = showDownload
    ? interpolate(frame - 60, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <FadeSlideIn delay={0} duration={15}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: C.text,
                fontFamily: FONT,
                textAlign: "center",
              }}
            >
              Export your <span style={{ color: C.blue }}>data</span>
            </div>
          </FadeSlideIn>

          <FadeSlideIn delay={8} duration={12}>
            <MockButton
              label="Export"
              color={C.text}
              pressed={frame >= 18 && frame < 25}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              }
            />
          </FadeSlideIn>

          {showDropdown && (
            <FadeSlideIn delay={0} duration={10} distance={12}>
              <div
                style={{
                  backgroundColor: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  width: 260,
                }}
              >
                {[
                  {
                    label: "CSV Spreadsheet",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="16" y2="17" />
                      </svg>
                    ),
                  },
                  {
                    label: "PDF Report",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                    ),
                  },
                ].map((opt, i) => (
                  <FadeSlideIn key={opt.label} delay={i * 6} duration={10} distance={8}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 18px",
                        borderBottom: i === 0 ? `1px solid ${C.border}` : "none",
                        cursor: "pointer",
                      }}
                    >
                      {opt.icon}
                      <span style={{ fontSize: 15, fontWeight: 500, color: C.text, fontFamily: FONT }}>
                        {opt.label}
                      </span>
                    </div>
                  </FadeSlideIn>
                ))}
              </div>
            </FadeSlideIn>
          )}

          {/* Download animation */}
          <div
            style={{
              opacity: downloadOpacity,
              transform: `translateY(${downloadY}px)`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              fontWeight: 600,
              color: C.green,
              fontFamily: FONT,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Downloaded!
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 8: Pipeline / Kanban (0–150 = 5s) */
const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();

  const columns = [
    {
      title: "Research",
      color: C.muted,
      count: 5,
      cards: [
        { name: "Accel Partners", detail: "VC · Series A" },
        { name: "Benchmark", detail: "VC · Seed" },
      ],
    },
    {
      title: "Reach Out",
      color: C.blue,
      count: 3,
      cards: [
        { name: "Sequoia Capital", detail: "VC · Seed" },
      ],
    },
    {
      title: "Feedback",
      color: C.amber,
      count: 2,
      cards: [
        { name: "Greylock Partners", detail: "VC · Growth" },
      ],
    },
    {
      title: "Follow Up",
      color: C.green,
      count: 1,
      cards: [
        { name: "Founders Fund", detail: "VC · Seed" },
      ],
    },
  ];

  // Arrow animation for moving card between columns
  const showArrow = frame >= 90;
  const arrowProgress = showArrow
    ? interpolate(frame - 90, [0, 30], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <FadeSlideIn delay={0} duration={15}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: C.text,
              fontFamily: FONT,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            Track your <span style={{ color: C.accent }}>pipeline</span>
          </div>
        </FadeSlideIn>

        <div style={{ display: "flex", gap: 20, position: "relative" }}>
          {columns.map((col, i) => (
            <KanbanColumn
              key={col.title}
              title={col.title}
              color={col.color}
              count={col.count}
              cards={col.cards}
              delay={15 + i * 12}
            />
          ))}

          {/* Stage change arrow overlay */}
          {showArrow && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 270,
                width: 280 * arrowProgress,
                height: 3,
                backgroundColor: C.accent,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: -5,
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid " + C.accent,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  opacity: arrowProgress > 0.8 ? 1 : 0,
                }}
              />
            </div>
          )}
        </div>

        {showArrow && (
          <FadeSlideIn delay={0} duration={12} distance={10}>
            <div
              style={{
                marginTop: 30,
                fontSize: 15,
                color: C.muted,
                fontFamily: FONT,
                textAlign: "center",
              }}
            >
              Drag investors between stages to track progress
            </div>
          </FadeSlideIn>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 9: Tags & Notes (0–120 = 4s) */
const TagsNotesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const showNotes = frame >= 50;

  const noteText = "Met at TechCrunch Disrupt. Interested in our climate analytics platform. Follow up after Q2.";
  const typedNote = useTypedText(noteText, 55, 0.8);

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <FadeSlideIn delay={0} duration={15}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: C.text,
              fontFamily: FONT,
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            Tag and <span style={{ color: C.accent }}>annotate</span>
          </div>
        </FadeSlideIn>

        {/* Mock investor modal */}
        <FadeSlideIn delay={8} duration={15}>
          <div
            style={{
              width: 700,
              backgroundColor: C.cardBg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              padding: "32px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: C.surface,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.accent,
                  fontFamily: FONT,
                }}
              >
                SC
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: FONT }}>
                  Sequoia Capital
                </div>
                <div style={{ fontSize: 13, color: C.muted, fontFamily: FONT }}>
                  VC  ·  Seed / Series A  ·  Menlo Park, CA
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                Tags
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Hot", color: C.green, active: true },
                  { label: "Warm", color: C.amber, active: false },
                  { label: "Potential", color: C.blue, active: false },
                  { label: "Not a Fit", color: C.muted, active: false },
                ].map((tag, i) => (
                  <FadeSlideIn key={tag.label} delay={20 + i * 6} duration={10} distance={8}>
                    <TagPill label={tag.label} color={tag.color} active={tag.active} />
                  </FadeSlideIn>
                ))}
              </div>
            </div>

            {/* Notes */}
            {showNotes && (
              <FadeSlideIn delay={0} duration={12} distance={10}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    Notes
                  </div>
                  <div
                    style={{
                      minHeight: 80,
                      padding: "14px 16px",
                      backgroundColor: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      color: C.text,
                      fontFamily: FONT,
                      lineHeight: 1.6,
                    }}
                  >
                    {typedNote}
                    <Cursor visible={typedNote.length < noteText.length} />
                  </div>
                </div>
              </FadeSlideIn>
            )}
          </div>
        </FadeSlideIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 10: CTA (0–90 = 3s) */
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });

  const lineWidth = interpolate(frame, [15, 40], [0, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <LightBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
          <div
            style={{
              fontSize: 20,
              color: C.accent,
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
              color: C.text,
              fontFamily: FONT,
              letterSpacing: "-0.02em",
            }}
          >
            Try it now
          </div>
          <div
            style={{
              width: lineWidth,
              height: 3,
              backgroundColor: C.accent,
              margin: "30px auto",
              borderRadius: 2,
            }}
          />
          <FadeSlideIn delay={15} duration={18}>
            <div
              style={{
                fontSize: 26,
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

export const HowTo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Scene 1: Intro 0–90 (3s) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: Stats 90–165 (2.5s) */}
      <Sequence from={90} durationInFrames={75}>
        <StatsScene />
      </Sequence>

      {/* Scene 3: Boolean Search 165–345 (6s) */}
      <Sequence from={165} durationInFrames={180}>
        <BooleanSearchScene />
      </Sequence>

      {/* Scene 4: Semantic Search 345–525 (6s) */}
      <Sequence from={345} durationInFrames={180}>
        <SemanticSearchScene />
      </Sequence>

      {/* Scene 5: Save Search 525–630 (3.5s) */}
      <Sequence from={525} durationInFrames={105}>
        <SaveSearchScene />
      </Sequence>

      {/* Scene 6: Save List 630–720 (3s) */}
      <Sequence from={630} durationInFrames={90}>
        <SaveListScene />
      </Sequence>

      {/* Scene 7: Export 720–810 (3s) */}
      <Sequence from={720} durationInFrames={90}>
        <ExportScene />
      </Sequence>

      {/* Scene 8: Pipeline 810–960 (5s) */}
      <Sequence from={810} durationInFrames={150}>
        <PipelineScene />
      </Sequence>

      {/* Scene 9: Tags & Notes 960–1080 (4s) */}
      <Sequence from={960} durationInFrames={120}>
        <TagsNotesScene />
      </Sequence>

      {/* Scene 10: CTA 1080–1170 (3s) */}
      <Sequence from={1080} durationInFrames={90}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
