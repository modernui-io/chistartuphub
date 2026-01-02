import React from "react";

/**
 * BureauAtmosphere - The Ghost City Background Layer
 * Creates an atmospheric Chicago backdrop with:
 * - Fixed positioning (stays in place during scroll)
 * - Heavy overlay for text readability
 * - Optional grid texture overlay
 * - Subtle parallax-like depth effect
 */
export function BureauAtmosphere({
  showGridTexture = true,
  imageUrl = "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1920&q=80",
  overlayOpacity = 0.85,
  className = "",
}) {
  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Base Layer - Deep Navy */}
      <div className="absolute inset-0 bg-[#050A14]" />

      {/* Image Layer - Chicago Skyline */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imageUrl})`,
          filter: "grayscale(100%) contrast(1.1)",
        }}
      />

      {/* Gradient Overlay - Ghost City Effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(5, 10, 20, ${overlayOpacity}) 0%,
            rgba(5, 10, 20, ${overlayOpacity * 0.95}) 50%,
            rgba(5, 10, 20, ${overlayOpacity * 1.05}) 100%
          )`,
        }}
      />

      {/* Grid Texture - Structural Pattern */}
      {showGridTexture && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      )}

      {/* Subtle Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(5, 10, 20, 0.3) 100%
          )`,
        }}
      />
    </div>
  );
}

export default BureauAtmosphere;
