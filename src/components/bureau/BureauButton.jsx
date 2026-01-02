import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * BureauButton - The Bureau Call-to-Action
 * Version 2.0 - Premium refinements
 * 
 * A sharp, commanding button with:
 * - No rounded corners (0px radius)
 * - Instant hover invert (white bg → black text)
 * - Monospace uppercase typography
 * - Optional arrow icon with hover animation
 * - Enhanced visual weight
 */
export function BureauButton({
  children,
  onClick,
  href,
  variant = "primary",
  size = "default",
  showArrow = false,
  className = "",
  ...props
}) {
  const baseStyles = `
    group
    inline-flex items-center justify-center
    font-mono uppercase tracking-[0.15em]
    transition-none duration-0
    cursor-crosshair
    border
    relative
    overflow-hidden
  `;

  const variants = {
    primary: `
      bg-white text-black border-white
      hover:bg-transparent hover:text-white
    `,
    secondary: `
      bg-transparent text-white/70 border-white/20
      hover:bg-white hover:text-black hover:border-white
    `,
    ghost: `
      bg-transparent text-white/50 border-transparent
      hover:bg-white hover:text-black
    `,
    outline: `
      bg-transparent text-white border-white/30
      hover:bg-white hover:text-black hover:border-white
    `,
  };

  const sizes = {
    small: "px-5 py-2.5 text-[10px]",
    default: "px-8 py-4 text-xs",
    large: "px-10 py-5 text-sm",
  };

  const combinedClassName = `
    ${baseStyles}
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.default}
    ${className}
  `.trim();

  const content = (
    <>
      {/* Button Text */}
      <span className="relative z-10">{children}</span>
      
      {/* Arrow Icon with hover animation */}
      {showArrow && (
        <ArrowRight
          className="w-4 h-4 ml-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200"
          strokeWidth={1.5}
        />
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={combinedClassName} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={combinedClassName} {...props}>
      {content}
    </button>
  );
}

export default BureauButton;
