import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * NoirZineCard - Base card component with the Noir Zine aesthetic
 * 
 * Features:
 * - Thick white border
 * - Slight rotation on hover
 * - Corner mark
 * - Data strip section
 */
const NoirZineCard = forwardRef(({ 
  children, 
  className,
  cornerMark,
  onClick,
  rotation = -0.2, // Default slight rotation
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        // Base styles
        "relative bg-black border-2 border-white overflow-hidden transition-all duration-200",
        // Hover effects
        "hover:shadow-[4px_4px_0_rgba(255,255,255,0.1),8px_8px_0_rgba(255,255,255,0.05)]",
        // Cursor
        onClick && "cursor-pointer",
        className
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) scale(1.01)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${rotation}deg)`;
      }}
      {...props}
    >
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)'
        }}
      />
      
      {/* Corner mark */}
      {cornerMark && (
        <span 
          className="absolute top-4 right-4 font-display text-[56px] leading-none text-white/[0.06] select-none"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {cornerMark}
        </span>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

NoirZineCard.displayName = 'NoirZineCard';

/**
 * NoirZineCardContent - Inner padding wrapper
 */
const NoirZineCardContent = forwardRef(({ children, className, ...props }, ref) => (
  <div ref={ref} className={cn("p-8", className)} {...props}>
    {children}
  </div>
));

NoirZineCardContent.displayName = 'NoirZineCardContent';

/**
 * NoirZineBadge - Type badge with diamond icon
 */
const NoirZineBadge = forwardRef(({ children, className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-white text-black',
    outline: 'bg-transparent text-white border border-white/30',
    urgent: 'bg-transparent text-[#FF4136] border border-[#FF4136]/50',
    success: 'bg-transparent text-[#2ECC40] border border-[#2ECC40]/50',
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5",
        "font-mono text-[10px] font-bold uppercase tracking-[0.1em]",
        variants[variant],
        className
      )}
      style={{ fontFamily: "'Archivo Black', sans-serif" }}
      {...props}
    >
      <span className="text-[6px]">◆</span>
      {children}
    </span>
  );
});

NoirZineBadge.displayName = 'NoirZineBadge';

/**
 * NoirZineTitle - Playfair Display serif title
 */
const NoirZineTitle = forwardRef(({ children, className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "font-serif text-[28px] font-bold leading-[1.15] text-white",
      className
    )}
    style={{ fontFamily: "'Playfair Display', serif" }}
    {...props}
  >
    {children}
  </Component>
));

NoirZineTitle.displayName = 'NoirZineTitle';

/**
 * NoirZineTagline - Italic serif tagline/hook
 */
const NoirZineTagline = forwardRef(({ children, className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "font-serif text-[15px] italic text-white/45 leading-[1.5] max-w-[90%]",
      className
    )}
    style={{ fontFamily: "'Playfair Display', serif" }}
    {...props}
  >
    {children}
  </p>
));

NoirZineTagline.displayName = 'NoirZineTagline';

/**
 * NoirZineDataStrip - Full-width data row with cells
 */
const NoirZineDataStrip = forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex border-t border-b border-white/15 -mx-8 px-8",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

NoirZineDataStrip.displayName = 'NoirZineDataStrip';

/**
 * NoirZineDataCell - Individual cell in the data strip
 */
const NoirZineDataCell = forwardRef(({ label, value, className, urgent = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-1 py-4 border-r border-white/10 last:border-r-0",
      className
    )}
    {...props}
  >
    <div 
      className="text-[8px] uppercase tracking-[0.2em] text-white/30 mb-1"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {label}
    </div>
    <div 
      className={cn(
        "text-[15px] font-semibold",
        urgent ? "text-[#FF4136]" : "text-white"
      )}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {value}
    </div>
  </div>
));

NoirZineDataCell.displayName = 'NoirZineDataCell';

/**
 * NoirZineFooter - Card footer with actions
 */
const NoirZineFooter = forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-5 flex items-center justify-between",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

NoirZineFooter.displayName = 'NoirZineFooter';

/**
 * NoirZineButton - CTA button
 */
const NoirZineButton = forwardRef(({ children, className, variant = 'outline', ...props }, ref) => {
  const variants = {
    outline: 'border border-white/30 bg-transparent text-white hover:bg-white hover:text-black',
    solid: 'border-2 border-white bg-white text-black hover:bg-transparent hover:text-white',
  };

  return (
    <button
      ref={ref}
      className={cn(
        "px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] transition-all duration-150",
        "flex items-center gap-2",
        variants[variant],
        className
      )}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      {...props}
    >
      {children}
    </button>
  );
});

NoirZineButton.displayName = 'NoirZineButton';

/**
 * NoirZineRef - Reference number display
 */
const NoirZineRef = forwardRef(({ children, className, highlight = false, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "text-[9px] tracking-[0.1em]",
      highlight ? "text-[#FFDC00]" : "text-white/20",
      className
    )}
    style={{ fontFamily: "'JetBrains Mono', monospace" }}
    {...props}
  >
    {children}
  </span>
));

NoirZineRef.displayName = 'NoirZineRef';

export {
  NoirZineCard,
  NoirZineCardContent,
  NoirZineBadge,
  NoirZineTitle,
  NoirZineTagline,
  NoirZineDataStrip,
  NoirZineDataCell,
  NoirZineFooter,
  NoirZineButton,
  NoirZineRef,
};
