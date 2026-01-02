import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * BureauButton - The Bureau Call-to-Action
 * A sharp, commanding button with:
 * - No rounded corners (0px radius)
 * - Instant hover invert (white bg → black text)
 * - Monospace uppercase typography
 * - Optional arrow icon
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
    inline-flex items-center justify-center
    font-mono text-sm uppercase tracking-widest
    transition-none duration-0
    cursor-crosshair
    border
  `;

  const variants = {
    primary: `
      bg-white text-black border-white
      hover:bg-transparent hover:text-white
    `,
    secondary: `
      bg-transparent text-white border-white/30
      hover:bg-white hover:text-black hover:border-white
    `,
    ghost: `
      bg-transparent text-white/60 border-transparent
      hover:bg-white hover:text-black
    `,
  };

  const sizes = {
    small: "px-4 py-2 text-xs",
    default: "px-8 py-4 text-sm",
    large: "px-12 py-5 text-base",
  };

  const combinedClassName = `
    ${baseStyles}
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.default}
    ${className}
  `.trim();

  const content = (
    <>
      <span>{children}</span>
      {showArrow && (
        <ArrowRight
          className="w-4 h-4 ml-3"
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
