import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
  Img,
} from "remotion";

const COLORS = {
  bg: "#0a0a0f",
  primary: "#ffffff",
  accent: "#d4af37",
  muted: "#94a3b8",
  blue: "#1e3a5f",
};

const CHICAGO_IMAGE =
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1920&q=80";

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

// Scene 1: BHM Intro (0–74, 2.5s)
const BHMIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 15,
            }}
          >
            Chi Startup Hub
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: 20,
            }}
          >
            Capital Meets Culture
          </div>
          <FadeIn delay={25}>
            <div
              style={{
                fontSize: 28,
                color: COLORS.accent,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              Capital Access Vol. 6
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 2: Founder Numbers (75–149, 2.5s)
const FounderNumbersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 160,
              fontWeight: 800,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.03em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            $220M+
          </div>
          <FadeIn delay={15}>
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
              raised by Chicago founders in 40 days
            </div>
          </FadeIn>
          <FadeIn delay={30}>
            <div
              style={{
                fontSize: 20,
                color: COLORS.muted,
                marginTop: 12,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.08em",
                opacity: 0.7,
              }}
            >
              announced publicly
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 3: Fund Capital (150–209, 2s)
const FundCapitalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 160,
              fontWeight: 800,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.03em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            $516M+
          </div>
          <FadeIn delay={15}>
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
              in new fund commitments
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 4: Coco5 (210–299, 3s)
const Coco5Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const athletes = [
    "Jalen Hurts",
    "Chris Paul",
    "Darius Slay",
  ];

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 15,
            }}
          >
            Congratulations
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: 10,
            }}
          >
            Coco5
          </div>
          <FadeIn delay={10}>
            <div
              style={{
                fontSize: 100,
                fontWeight: 800,
                color: COLORS.primary,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-0.03em",
                textShadow: "0 4px 30px rgba(0,0,0,0.5)",
                marginBottom: 10,
              }}
            >
              $10M
            </div>
          </FadeIn>
          <FadeIn delay={20}>
            <div
              style={{
                fontSize: 28,
                color: COLORS.accent,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              Black-owned · Athlete-owned
            </div>
          </FadeIn>
          <div
            style={{
              display: "flex",
              gap: 30,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {athletes.map((name, i) => (
              <FadeIn key={name} delay={30 + i * 8}>
                <div
                  style={{
                    fontSize: 24,
                    color: COLORS.muted,
                    fontFamily: "system-ui, sans-serif",
                    letterSpacing: "0.05em",
                  }}
                >
                  {name}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 5: Whale (300–359, 2s)
const WhaleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 15,
            }}
          >
            Congratulations
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: 10,
            }}
          >
            Whale
          </div>
          <FadeIn delay={10}>
            <div
              style={{
                fontSize: 120,
                fontWeight: 800,
                color: COLORS.primary,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-0.03em",
                textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              }}
            >
              $4M Seed
            </div>
          </FadeIn>
          <FadeIn delay={20}>
            <div
              style={{
                fontSize: 30,
                color: COLORS.muted,
                marginTop: 15,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              $60B idle deposits · reimagined
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Scene 6: Fund Closes (360–449, 3s)
const FundClosesScene: React.FC = () => {
  const funds = [
    { amount: "$200M", name: "Shore Capital", detail: "Fund IV" },
    { amount: "$156M", name: "SNAK Ventures", detail: "Fund I" },
    { amount: "$100M", name: "Creation Equity", detail: "Fund II" },
    { amount: "$60M", name: "Angeles Investors", detail: "Fund III" },
  ];

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
        }}
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
                marginBottom: 15,
              }}
            >
              Fund Closes
            </div>
          </FadeIn>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              marginTop: 20,
            }}
          >
            {funds.map((f, i) => (
              <FadeIn key={f.name} delay={10 + i * 12}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 20,
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 48,
                      fontWeight: 700,
                      color: COLORS.accent,
                      fontFamily: "system-ui, sans-serif",
                      textShadow: "0 2px 15px rgba(212, 175, 55, 0.3)",
                      minWidth: 180,
                      textAlign: "right",
                    }}
                  >
                    {f.amount}
                  </span>
                  <span
                    style={{
                      fontSize: 28,
                      color: COLORS.primary,
                      fontFamily: "system-ui, sans-serif",
                      minWidth: 280,
                      textAlign: "left",
                    }}
                  >
                    {f.name}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      color: COLORS.muted,
                      fontFamily: "system-ui, sans-serif",
                      minWidth: 120,
                      textAlign: "left",
                    }}
                  >
                    {f.detail}
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

// Scene 7: Funding Deadlines (450–539, 3s)
const DeadlinesScene: React.FC = () => {
  const deadlines = [
    { amount: "Seed+", name: "BIO 2026 Start-Up Stadium", detail: "Biotech · Feb 16" },
    { amount: "Seed", name: "Alabama Launchpad (Cycle 1)", detail: "Early-stage · Feb 18" },
    { amount: "$10K", name: "Technovation AI Ventures", detail: "Equity-free · Feb 22" },
    { amount: "$100K", name: "MIT–Harvard Nat'l Security", detail: "SAFE · Feb 27" },
    { amount: "$10K", name: "Amber Grant for Women", detail: "Health & Fitness · Feb 28" },
  ];

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
        }}
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
                marginBottom: 15,
              }}
            >
              Funding Deadlines
            </div>
          </FadeIn>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 20,
            }}
          >
            {deadlines.map((d, i) => (
              <FadeIn key={d.name} delay={10 + i * 10}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 20,
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 38,
                      fontWeight: 700,
                      color: COLORS.accent,
                      fontFamily: "system-ui, sans-serif",
                      textShadow: "0 2px 15px rgba(212, 175, 55, 0.3)",
                      minWidth: 140,
                      textAlign: "right",
                    }}
                  >
                    {d.amount}
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
                    {d.name}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      color: COLORS.muted,
                      fontFamily: "system-ui, sans-serif",
                      minWidth: 220,
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

// Scene 8: CTA (540–584, 1.5s)
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
          <div
            style={{
              fontSize: 24,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Capital Access Vol. 6
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: 15,
            }}
          >
            chistartuphub.substack.com
          </div>
          <div
            style={{
              fontSize: 28,
              color: COLORS.accent,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            Read Vol. 6
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CapitalAccessVol6: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Scene 1: BHM Intro — 0-74 (2.5s) */}
      <Sequence from={0} durationInFrames={75}>
        <BHMIntroScene />
      </Sequence>

      {/* Scene 2: Founder Numbers — 75-149 (2.5s) */}
      <Sequence from={75} durationInFrames={75}>
        <FounderNumbersScene />
      </Sequence>

      {/* Scene 3: Fund Capital — 150-209 (2s) */}
      <Sequence from={150} durationInFrames={60}>
        <FundCapitalScene />
      </Sequence>

      {/* Scene 4: Coco5 — 210-299 (3s) */}
      <Sequence from={210} durationInFrames={90}>
        <Coco5Scene />
      </Sequence>

      {/* Scene 5: Whale — 300-359 (2s) */}
      <Sequence from={300} durationInFrames={60}>
        <WhaleScene />
      </Sequence>

      {/* Scene 6: Fund Closes — 360-449 (3s) */}
      <Sequence from={360} durationInFrames={90}>
        <FundClosesScene />
      </Sequence>

      {/* Scene 7: Funding Deadlines — 450-539 (3s) */}
      <Sequence from={450} durationInFrames={90}>
        <DeadlinesScene />
      </Sequence>

      {/* Scene 8: CTA — 540-584 (1.5s) */}
      <Sequence from={540} durationInFrames={45}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
