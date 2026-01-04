
/**
 * BureauAtmosphere - The Ghost City Background Layer
 * Version 2.0 - Premium refinements
 * 
 * Creates an atmospheric Chicago backdrop with:
 * - Fixed positioning (stays in place during scroll)
 * - Heavy overlay for text readability
 * - Enhanced grid texture overlay
 * - Subtle gradient glows for depth
 * - Refined vignette effect
 */
export function BureauAtmosphere({
  showGridTexture = true,
  imageUrl = "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1920&q=80",
  overlayOpacity = 0.88,
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
          filter: "grayscale(100%) contrast(1.15) brightness(0.9)",
        }}
      />

      {/* Primary Gradient Overlay - Ghost City Effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            rgba(5, 10, 20, ${overlayOpacity}) 0%,
            rgba(5, 10, 20, ${overlayOpacity * 0.95}) 30%,
            rgba(5, 10, 20, ${overlayOpacity * 0.92}) 60%,
            rgba(5, 10, 20, ${overlayOpacity}) 100%
          )`,
        }}
      />

      {/* Subtle Blue Gradient Glow - Top Right */}
      <div
        className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.04) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Subtle Warm Gradient Glow - Bottom Left */}
      <div
        className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(248, 113, 113, 0.02) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Grid Texture - Structural Pattern */}
      {showGridTexture && (
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      )}

      {/* Fine Grid Overlay - Additional Texture */}
      {showGridTexture && (
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
      )}

      {/* Vignette - Enhanced */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 80% 80% at 50% 50%,
            transparent 0%,
            rgba(5, 10, 20, 0.4) 100%
          )`,
        }}
      />

      {/* Noise Texture - Subtle grain */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export default BureauAtmosphere;
