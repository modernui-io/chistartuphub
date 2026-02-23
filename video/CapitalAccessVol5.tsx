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

const BHMScene: React.FC = () => {
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
              fontSize: 72,
              fontWeight: 700,
              color: COLORS.primary,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
              marginBottom: 20,
            }}
          >
            Happy Black History Month
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
              Capital Access Vol. 5
            </div>
          </FadeIn>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
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
            $22.2M
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

const DeadlinesScene: React.FC = () => {
  const deadlines = [
    { amount: "$500K", name: "Y Combinator", detail: "Feb 9" },
    { amount: "Cash+", name: "Startup Grind", detail: "Feb 9" },
    { amount: "$25K+", name: "Lenovo Evolve Small", detail: "Feb 17" },
    { amount: "$1M", name: "Snowflake Challenge", detail: "Feb 18" },
    { amount: "$75K", name: "Arch Grants", detail: "equity-free · Feb 18" },
    { amount: "IoT", name: "RIoT Accelerator", detail: "Feb 20" },
    { amount: "CHF 1M", name: "MassChallenge", detail: "equity-free · Feb 28" },
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
              February Deadlines
            </div>
          </FadeIn>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              marginTop: 20,
            }}
          >
            {deadlines.map((d, i) => (
              <FadeIn key={d.name} delay={10 + i * 12}>
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
                      fontSize: 42,
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
                      minWidth: 280,
                      textAlign: "left",
                    }}
                  >
                    {d.name}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      color: COLORS.muted,
                      fontFamily: "system-ui, sans-serif",
                      minWidth: 180,
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
            Capital Access Vol. 5
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
            /p/capital-access-vol-5
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CapitalAccessVol5: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* BHM Intro: 0-75 frames (0-2.5s) */}
      <Sequence from={0} durationInFrames={75}>
        <BHMScene />
      </Sequence>

      {/* Hook: 75-135 frames (2.5-4.5s) */}
      <Sequence from={75} durationInFrames={60}>
        <HookScene />
      </Sequence>

      {/* Deadlines: 135-285 frames (4.5-9.5s) */}
      <Sequence from={135} durationInFrames={150}>
        <DeadlinesScene />
      </Sequence>

      {/* CTA: 285-345 frames (9.5-11.5s) */}
      <Sequence from={285} durationInFrames={60}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
