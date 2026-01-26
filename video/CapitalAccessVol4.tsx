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
  staticFile,
} from "remotion";

const COLORS = {
  bg: "#0a0a0f",
  primary: "#ffffff",
  accent: "#d4af37",
  muted: "#94a3b8",
  blue: "#1e3a5f",
};

// Chicago skyline from Unsplash (royalty-free)
const CHICAGO_IMAGE =
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1920&q=80";

// Background with Chicago image, blue overlay, and graph paper
const Background: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Chicago skyline image */}
      <Img
        src={CHICAGO_IMAGE}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "grayscale(100%) brightness(0.3)",
        }}
      />

      {/* Blue overlay */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 30, 60, 0.92) 0%, rgba(10, 20, 40, 0.95) 100%)",
        }}
      />

      {/* Graph paper pattern */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(100, 150, 200, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 150, 200, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Subtle grid accent lines */}
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

const HookScene: React.FC = () => {
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
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
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
              fontSize: 180,
              fontWeight: 800,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.03em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            $119M
          </div>
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
            This Week in Chicago
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CongratsScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 100,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FadeIn delay={0}>
            <div
              style={{
                fontSize: 48,
                color: COLORS.primary,
                fontFamily: "system-ui, sans-serif",
                marginBottom: 60,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              Two startups. Two Series A's.
            </div>
          </FadeIn>

          <div
            style={{
              display: "flex",
              gap: 100,
              justifyContent: "center",
              marginTop: 40,
            }}
          >
            <FadeIn delay={30}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 700,
                    color: COLORS.accent,
                    fontFamily: "system-ui, sans-serif",
                    textShadow: "0 2px 20px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  $110M
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: COLORS.primary,
                    marginTop: 10,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Zarminali Pediatrics
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: COLORS.muted,
                    marginTop: 5,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  28 clinics across 8 states
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={50}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 700,
                    color: COLORS.accent,
                    fontFamily: "system-ui, sans-serif",
                    textShadow: "0 2px 20px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  $9M
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: COLORS.primary,
                    marginTop: 10,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Renterra
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: COLORS.muted,
                    marginTop: 5,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Equipment rental software
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={80}>
            <div
              style={{
                fontSize: 28,
                color: COLORS.primary,
                marginTop: 80,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Congratulations to those founders.
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const DeadlinesScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 100,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FadeIn delay={0}>
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
              Closing This Week
            </div>
          </FadeIn>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 40,
              marginTop: 40,
            }}
          >
            <FadeIn delay={20}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 30,
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 700,
                    color: COLORS.accent,
                    fontFamily: "system-ui, sans-serif",
                    textShadow: "0 2px 20px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  $500K
                </span>
                <span
                  style={{
                    fontSize: 32,
                    color: COLORS.primary,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Free Electrons
                </span>
                <span
                  style={{
                    fontSize: 20,
                    color: COLORS.muted,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  equity-free · Jan 31
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={40}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 30,
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 700,
                    color: COLORS.accent,
                    fontFamily: "system-ui, sans-serif",
                    textShadow: "0 2px 20px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  $100K
                </span>
                <span
                  style={{
                    fontSize: 32,
                    color: COLORS.primary,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  SE Ventures
                </span>
                <span
                  style={{
                    fontSize: 20,
                    color: COLORS.muted,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  SAFE · Jan 30
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={60}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 30,
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 700,
                    color: COLORS.accent,
                    fontFamily: "system-ui, sans-serif",
                    textShadow: "0 2px 20px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  $20K
                </span>
                <span
                  style={{
                    fontSize: 32,
                    color: COLORS.primary,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Capital One Mobility
                </span>
                <span
                  style={{
                    fontSize: 20,
                    color: COLORS.muted,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  no equity · Jan 31
                </span>
              </div>
            </FadeIn>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BlueprintScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 100,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FadeIn delay={0}>
            <div
              style={{
                fontSize: 20,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 30,
              }}
            >
              The Blueprint
            </div>
          </FadeIn>

          <FadeIn delay={15}>
            <div
              style={{
                fontSize: 80,
                fontWeight: 700,
                color: COLORS.primary,
                fontFamily: "system-ui, sans-serif",
                marginBottom: 40,
                textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              }}
            >
              Braintree
            </div>
          </FadeIn>

          <FadeIn delay={35}>
            <div
              style={{
                fontSize: 36,
                color: COLORS.muted,
                fontFamily: "system-ui, sans-serif",
                textAlign: "center",
              }}
            >
              How <span style={{ color: COLORS.accent, fontWeight: 600 }}>$25K</span> turned into a{" "}
              <span
                style={{
                  color: COLORS.accent,
                  fontWeight: 600,
                  textShadow: "0 2px 20px rgba(212, 175, 55, 0.3)",
                }}
              >
                nine-figure exit
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={55}>
            <div
              style={{
                fontSize: 24,
                color: COLORS.muted,
                marginTop: 50,
                fontFamily: "system-ui, sans-serif",
                fontStyle: "italic",
              }}
            >
              The ecosystem compounds. That's the point.
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

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
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
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
            Capital Access Vol. 4
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            chistartuphub.substack.com
          </div>
          <div
            style={{
              fontSize: 24,
              color: COLORS.muted,
              fontFamily: "system-ui, sans-serif",
              marginTop: 15,
            }}
          >
            /p/capital-access-vol-4
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CapitalAccessVol4: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Hook: 0-60 frames (0-2s) */}
      <Sequence from={0} durationInFrames={60}>
        <HookScene />
      </Sequence>

      {/* Congrats: 60-180 frames (2-6s) */}
      <Sequence from={60} durationInFrames={120}>
        <CongratsScene />
      </Sequence>

      {/* Deadlines: 180-300 frames (6-10s) */}
      <Sequence from={180} durationInFrames={120}>
        <DeadlinesScene />
      </Sequence>

      {/* Blueprint: 300-390 frames (10-13s) */}
      <Sequence from={300} durationInFrames={90}>
        <BlueprintScene />
      </Sequence>

      {/* CTA: 390-450 frames (13-15s) */}
      <Sequence from={390} durationInFrames={60}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
