import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { springTiming, linearTiming } from "@remotion/transitions";

const COLORS = {
  bg: "#0a0a0f",
  primary: "#ffffff",
  accent: "#d4af37",
  muted: "#94a3b8",
  blue: "#1e3a5f",
  green: "#065f46",
  greenText: "#6ee7b7",
};

const CHICAGO_IMAGE =
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1920&q=80";

// ── Shared components ──────────────────────────────────────────────

const Background: React.FC = () => {
  return (
    <AbsoluteFill>
      <Img
        src={CHICAGO_IMAGE}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "grayscale(100%) brightness(0.3)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 30, 60, 0.92) 0%, rgba(10, 20, 40, 0.95) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(100, 150, 200, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 150, 200, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(100, 150, 200, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 150, 200, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "200px 200px",
        }}
      />
    </AbsoluteFill>
  );
};

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}> = ({ children, delay = 0, duration = 20 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame - delay, [0, duration], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
  );
};

/** Slow zoom that makes static scenes feel alive */
const SlowZoom: React.FC<{
  children: React.ReactNode;
  from?: number;
  to?: number;
}> = ({ children, from = 1.0, to = 1.06 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

/** Pulsing glow ring behind icons */
const GlowRing: React.FC<{ color?: string; size?: number }> = ({
  color = "rgba(212, 175, 55, 0.15)",
  size = 160,
}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.9, 1.1]);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        transform: `scale(${pulse})`,
        position: "absolute",
      }}
    />
  );
};

/** Sector icon badge */
const SectorIcon: React.FC<{
  icon: string;
  label: string;
  size?: number;
}> = ({ icon, label, size = 80 }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(30, 58, 95, 0.4))",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: size * 0.5,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 14,
          color: COLORS.muted,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ── Scene 1: Title ──────────────────────────────────────────────────

const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Subtle floating particles effect
  const particle1Y = interpolate(frame, [0, 90], [0, -60]);
  const particle2Y = interpolate(frame, [0, 90], [0, -40]);
  const particleOpacity = interpolate(frame, [0, 20, 70, 90], [0, 0.3, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <SlowZoom from={1.0} to={1.08}>
        <Background />
      </SlowZoom>
      {/* Floating accent dots */}
      <div
        style={{
          position: "absolute",
          left: "20%",
          top: "30%",
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: COLORS.accent,
          opacity: particleOpacity,
          transform: `translateY(${particle1Y}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "25%",
          top: "60%",
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: COLORS.accent,
          opacity: particleOpacity * 0.7,
          transform: `translateY(${particle2Y}px)`,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
          <div
            style={{
              fontSize: 20,
              color: COLORS.accent,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Chi Startup Hub presents
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 40px rgba(212, 175, 55, 0.2), 0 2px 20px rgba(0,0,0,0.5)",
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            Capital Access
          </div>
          <FadeIn delay={25}>
            <div
              style={{
                fontSize: 30,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              Vol. 7 — Week of Feb 15, 2026
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Scene 2: Total Raised ──────────────────────────────────────────

const TotalRaisedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Animated counter effect
  const displayAmount = interpolate(frame, [5, 40], [0, 42.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <SlowZoom from={1.05} to={1.0}>
        <Background />
      </SlowZoom>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <GlowRing color="rgba(212, 175, 55, 0.12)" size={400} />
            <div
              style={{
                fontSize: 160,
                fontWeight: 800,
                color: COLORS.primary,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-0.03em",
                textShadow: "0 4px 40px rgba(212, 175, 55, 0.15), 0 2px 20px rgba(0,0,0,0.5)",
                position: "relative",
              }}
            >
              ${displayAmount.toFixed(1)}M
            </div>
          </div>
          <FadeIn delay={20}>
            <div
              style={{
                fontSize: 32,
                color: COLORS.muted,
                marginTop: 20,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              raised by Chicago founders this week
            </div>
          </FadeIn>
          <FadeIn delay={35}>
            <div
              style={{
                display: "flex",
                gap: 40,
                justifyContent: "center",
                marginTop: 30,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: COLORS.accent, fontFamily: "system-ui, sans-serif" }}>2</div>
                <div style={{ fontSize: 14, color: COLORS.muted, fontFamily: "system-ui, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Verified Deals</div>
              </div>
              <div style={{ width: 1, background: "rgba(148, 163, 184, 0.3)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: COLORS.accent, fontFamily: "system-ui, sans-serif" }}>37</div>
                <div style={{ fontSize: 14, color: COLORS.muted, fontFamily: "system-ui, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Deadlines</div>
              </div>
              <div style={{ width: 1, background: "rgba(148, 163, 184, 0.3)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: COLORS.accent, fontFamily: "system-ui, sans-serif" }}>8</div>
                <div style={{ fontSize: 14, color: COLORS.muted, fontFamily: "system-ui, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>New Opps</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Scene 3: Prenosis ──────────────────────────────────────────────

const PrenosisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <SlowZoom from={1.0} to={1.05}>
        <Background />
      </SlowZoom>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
          <FadeIn delay={0} duration={15}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <SectorIcon icon="🏥" label="HealthTech" size={90} />
            </div>
          </FadeIn>
          <div
            style={{
              fontSize: 22,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Congratulations
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: 10,
            }}
          >
            Prenosis
          </div>
          <FadeIn delay={12}>
            <div
              style={{
                fontSize: 110,
                fontWeight: 800,
                color: COLORS.primary,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-0.03em",
                textShadow: "0 4px 40px rgba(212, 175, 55, 0.2), 0 2px 20px rgba(0,0,0,0.5)",
                marginBottom: 10,
              }}
            >
              $40M
            </div>
          </FadeIn>
          <FadeIn delay={22}>
            <div
              style={{
                fontSize: 28,
                color: COLORS.accent,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Series A
            </div>
          </FadeIn>
          <FadeIn delay={32}>
            <div
              style={{
                fontSize: 22,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.03em",
                maxWidth: 600,
                lineHeight: 1.4,
              }}
            >
              FDA-authorized AI diagnostic tool for sepsis
            </div>
          </FadeIn>
          <FadeIn delay={40}>
            <div
              style={{
                fontSize: 16,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.05em",
                marginTop: 14,
                opacity: 0.6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ color: COLORS.greenText, fontSize: 12 }}>LEAD</span>
              PACE Healthcare Capital
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Scene 4: Rectangle ─────────────────────────────────────────────

const RectangleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <SlowZoom from={1.04} to={1.0}>
        <Background />
      </SlowZoom>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
          <FadeIn delay={0} duration={15}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <SectorIcon icon="📦" label="SaaS · Logistics" size={90} />
            </div>
          </FadeIn>
          <div
            style={{
              fontSize: 22,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Congratulations
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: 10,
            }}
          >
            Rectangle
          </div>
          <FadeIn delay={12}>
            <div
              style={{
                fontSize: 110,
                fontWeight: 800,
                color: COLORS.primary,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-0.03em",
                textShadow: "0 4px 40px rgba(212, 175, 55, 0.2), 0 2px 20px rgba(0,0,0,0.5)",
                marginBottom: 10,
              }}
            >
              $2.5M
            </div>
          </FadeIn>
          <FadeIn delay={22}>
            <div
              style={{
                fontSize: 28,
                color: COLORS.accent,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Pre-Seed
            </div>
          </FadeIn>
          <FadeIn delay={32}>
            <div
              style={{
                fontSize: 22,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.03em",
                maxWidth: 600,
                lineHeight: 1.4,
              }}
            >
              AI-powered platform for logistics email management
            </div>
          </FadeIn>
          <FadeIn delay={40}>
            <div
              style={{
                fontSize: 16,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.05em",
                marginTop: 14,
                opacity: 0.6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ color: COLORS.greenText, fontSize: 12 }}>LEAD</span>
              Autotech Ventures
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Scene 5: New Opportunities ─────────────────────────────────────

const NewOppsScene: React.FC = () => {
  const opps = [
    { icon: "🏛️", name: "SBIF Chicago", amount: "Up to $250K", type: "Grant" },
    { icon: "🎓", name: "Coleman Foundation Open Call", amount: "Up to $25K", type: "Grant" },
    { icon: "🚀", name: "Hivers & Strivers Capital", amount: "$250K–$1M", type: "Grant" },
    { icon: "💡", name: "Shipt LadderUp Accelerator", amount: "Varies", type: "Accelerator" },
  ];

  return (
    <AbsoluteFill>
      <SlowZoom from={1.0} to={1.04}>
        <Background />
      </SlowZoom>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", padding: 60 }}
      >
        <div style={{ textAlign: "center" }}>
          <FadeIn delay={0}>
            <div
              style={{
                fontSize: 22,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              New Opportunities Discovered
            </div>
            <div
              style={{
                fontSize: 16,
                color: COLORS.accent,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.1em",
                marginBottom: 30,
              }}
            >
              8 found this week — highlights below
            </div>
          </FadeIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {opps.map((o, i) => (
              <FadeIn key={o.name} delay={15 + i * 14}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    justifyContent: "center",
                    background: "rgba(15, 26, 46, 0.6)",
                    borderLeft: `3px solid ${COLORS.accent}`,
                    borderRadius: "0 12px 12px 0",
                    padding: "16px 30px",
                  }}
                >
                  <span style={{ fontSize: 36 }}>{o.icon}</span>
                  <span
                    style={{
                      fontSize: 38,
                      fontWeight: 700,
                      color: COLORS.accent,
                      fontFamily: "system-ui, sans-serif",
                      textShadow: "0 2px 15px rgba(212, 175, 55, 0.3)",
                      minWidth: 200,
                      textAlign: "right",
                    }}
                  >
                    {o.amount}
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      color: COLORS.primary,
                      fontFamily: "system-ui, sans-serif",
                      minWidth: 380,
                      textAlign: "left",
                    }}
                  >
                    {o.name}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: COLORS.greenText,
                      fontFamily: "system-ui, sans-serif",
                      background: COLORS.green,
                      padding: "3px 10px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    {o.type}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Scene 6: Deadlines ─────────────────────────────────────────────

const DeadlinesScene: React.FC = () => {
  const deadlines = [
    { icon: "🤝", amount: "$25K–$100K", name: "Visible Hands Fellowship", detail: "VC · Feb 18" },
    { icon: "❄️", amount: "Up to $1M", name: "Snowflake Startup Challenge", detail: "AI/Data · Feb 18" },
    { icon: "🌱", amount: "Up to $50K", name: "Venture For ClimateTech", detail: "Climate · Feb 20" },
    { icon: "⚡", amount: "Up to $150K", name: "Colorado AI Accelerator", detail: "Deep Tech · Feb 26" },
    { icon: "🌾", amount: "$5K–$25K", name: "World Agri-Tech Pitch", detail: "AgTech · Closing" },
  ];

  return (
    <AbsoluteFill>
      <SlowZoom from={1.03} to={1.0}>
        <Background />
      </SlowZoom>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", padding: 60 }}
      >
        <div style={{ textAlign: "center" }}>
          <FadeIn delay={0}>
            <div
              style={{
                fontSize: 22,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Funding Deadlines
            </div>
            <div
              style={{
                fontSize: 16,
                color: COLORS.accent,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.1em",
                marginBottom: 30,
              }}
            >
              37 opportunities closing in 21 days
            </div>
          </FadeIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {deadlines.map((d, i) => (
              <FadeIn key={d.name} delay={12 + i * 11}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{d.icon}</span>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 700,
                      color: COLORS.accent,
                      fontFamily: "system-ui, sans-serif",
                      textShadow: "0 2px 15px rgba(212, 175, 55, 0.3)",
                      minWidth: 180,
                      textAlign: "right",
                    }}
                  >
                    {d.amount}
                  </span>
                  <span
                    style={{
                      fontSize: 22,
                      color: COLORS.primary,
                      fontFamily: "system-ui, sans-serif",
                      minWidth: 380,
                      textAlign: "left",
                    }}
                  >
                    {d.name}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: COLORS.muted,
                      fontFamily: "system-ui, sans-serif",
                      minWidth: 160,
                      textAlign: "left",
                    }}
                  >
                    {d.detail}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Scene 7: CTA ────────────────────────────────────────────────────

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  // Pulsing subscribe glow
  const glowOpacity = interpolate(
    Math.sin(frame * 0.12),
    [-1, 1],
    [0.3, 0.8],
  );

  return (
    <AbsoluteFill>
      <SlowZoom from={1.0} to={1.06}>
        <Background />
      </SlowZoom>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
          <div
            style={{
              fontSize: 22,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 25,
            }}
          >
            Capital Access Vol. 7
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              textShadow: `0 4px 40px rgba(212, 175, 55, ${glowOpacity * 0.3}), 0 2px 20px rgba(0,0,0,0.5)`,
              marginBottom: 20,
            }}
          >
            chistartuphub.substack.com
          </div>
          <div
            style={{
              display: "inline-block",
              fontSize: 24,
              fontWeight: 600,
              color: "#0a0a0f",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: `linear-gradient(135deg, ${COLORS.accent}, #e8c547)`,
              padding: "12px 40px",
              borderRadius: 8,
              boxShadow: `0 4px 30px rgba(212, 175, 55, ${glowOpacity * 0.4})`,
            }}
          >
            Capital Access Vol. 7
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── Main composition with TransitionSeries ──────────────────────────

export const CapitalAccessVol7: React.FC = () => {
  const TRANSITION_DURATION = 15;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <TransitionSeries>
        {/* Scene 1: Title (2.5s) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <TitleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 2: Total Raised (3s) */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <TotalRaisedScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 3: Prenosis (3.5s) */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <PrenosisScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 4: Rectangle (3.5s) */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <RectangleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 5: New Opportunities (3.5s) */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <NewOppsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 6: Deadlines (3.5s) */}
        <TransitionSeries.Sequence durationInFrames={110}>
          <DeadlinesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Scene 7: CTA (2.5s) */}
        <TransitionSeries.Sequence durationInFrames={75}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
