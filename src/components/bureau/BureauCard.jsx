import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * BureauCard - The Data Cell component
 * A card that follows the Bureau design system:
 * - No rounded corners
 * - Border-right and border-bottom for collapsed grid
 * - Instant hover invert (white bg, black text)
 * - Crosshair cursor
 */
export function BureauCard({
  index,
  icon: Icon,
  title,
  subtitle,
  description,
  cta,
  onClick,
  className = "",
  isLast = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative text-left p-8 md:p-10
        bg-transparent hover:bg-white
        text-white hover:text-black
        transition-none duration-0
        cursor-crosshair
        backdrop-blur-sm
        border-r border-b border-white/15
        ${isLast ? 'md:border-r-0' : ''}
        ${className}
      `}
    >
      {/* Index Number - Top Right */}
      {index && (
        <span className="absolute top-6 right-6 font-mono text-sm text-white/50 group-hover:text-black/50">
          {index}
        </span>
      )}

      {/* Icon */}
      {Icon && (
        <div className="mb-6">
          <Icon
            className="w-8 h-8 text-white/60 group-hover:text-black/60"
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* Title - Monospace, Uppercase, Bold */}
      <h2 className="font-mono text-base font-bold uppercase tracking-wider mb-3">
        {title}
      </h2>

      {/* Subtitle - Serif, readable */}
      {subtitle && (
        <p className="font-serif text-lg mb-4 opacity-80">
          {subtitle}
        </p>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm leading-relaxed opacity-50 group-hover:opacity-70 mb-8">
          {description}
        </p>
      )}

      {/* CTA */}
      {cta && (
        <div className="flex items-center font-mono text-xs uppercase tracking-widest opacity-50 group-hover:opacity-100">
          <span>{cta}</span>
          <ArrowRight
            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
            strokeWidth={1.5}
          />
        </div>
      )}
    </button>
  );
}

export default BureauCard;
