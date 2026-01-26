import { forwardRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * NoirZineModal - Base modal component with Noir Zine aesthetic
 * 
 * Simplified version that works with available data.
 * Features:
 * - Thick white border
 * - Blurred backdrop
 * - Smooth scale animation
 * - Escape key to close
 */
const NoirZineModal = forwardRef(({ 
  isOpen, 
  onClose, 
  children, 
  className,
  ...props 
}, ref) => {
  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/85 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={ref}
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[90%] max-w-[720px] max-h-[90vh]",
          "bg-black border-[3px] border-white",
          "overflow-hidden",
          "transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95",
          className
        )}
        {...props}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `linear-gradient(
              180deg,
              rgba(255,255,255,0.03) 0%,
              transparent 30%,
              transparent 70%,
              rgba(0,0,0,0.3) 100%
            )`
          }}
        />

        {/* Content wrapper with scroll */}
        <div className="relative z-10 max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
});

NoirZineModal.displayName = 'NoirZineModal';

/**
 * NoirZineModalHeader - Modal header with close button
 */
const NoirZineModalHeader = forwardRef(({ children, onClose, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "sticky top-0 bg-black border-b border-white/10 p-8 z-20",
      className
    )}
    {...props}
  >
    {/* Close button */}
    <button
      onClick={onClose}
      className={cn(
        "absolute top-6 right-6",
        "w-11 h-11 flex items-center justify-center",
        "border-2 border-white/30 bg-transparent text-white",
        "hover:bg-white hover:text-black hover:border-white",
        "transition-all duration-150"
      )}
    >
      <X size={24} />
    </button>

    {children}
  </div>
));

NoirZineModalHeader.displayName = 'NoirZineModalHeader';

/**
 * NoirZineModalBody - Modal body content
 */
const NoirZineModalBody = forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-8 pt-6", className)}
    {...props}
  >
    {children}
  </div>
));

NoirZineModalBody.displayName = 'NoirZineModalBody';

/**
 * NoirZineModalFooter - Modal footer with actions
 */
const NoirZineModalFooter = forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "sticky bottom-0 bg-black/95 border-t border-white/10",
      "p-6 flex items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

NoirZineModalFooter.displayName = 'NoirZineModalFooter';

/**
 * NoirZineModalSection - Content section with label
 */
const NoirZineModalSection = forwardRef(({ label, children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-6", className)}
    {...props}
  >
    {label && (
      <div 
        className="text-[9px] uppercase tracking-[0.25em] text-white/30 mb-3 pb-2 border-b border-white/[0.08]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </div>
    )}
    {children}
  </div>
));

NoirZineModalSection.displayName = 'NoirZineModalSection';

/**
 * NoirZineStatsGrid - 2x2 stats grid for modal
 */
const NoirZineStatsGrid = forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-2 gap-[1px] bg-white/10 border border-white/10 mb-6",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

NoirZineStatsGrid.displayName = 'NoirZineStatsGrid';

/**
 * NoirZineStatCell - Individual stat cell
 */
const NoirZineStatCell = forwardRef(({ 
  icon: Icon, 
  label, 
  value, 
  urgent = false,
  className, 
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn("bg-black p-6", className)}
    {...props}
  >
    <div 
      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {Icon && <Icon size={14} className="opacity-50" />}
      {label}
    </div>
    <div 
      className={cn(
        "text-[28px] tracking-[0.02em]",
        urgent ? "text-[#FF4136]" : "text-white"
      )}
      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
    >
      {value}
    </div>
  </div>
));

NoirZineStatCell.displayName = 'NoirZineStatCell';

/**
 * NoirZineTagList - Tag/chip list
 */
const NoirZineTagList = forwardRef(({ tags = [], className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap gap-2", className)}
    {...props}
  >
    {tags.map((tag, index) => (
      <span
        key={index}
        className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-white/70 border border-white/15 bg-white/[0.02]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {tag}
      </span>
    ))}
  </div>
));

NoirZineTagList.displayName = 'NoirZineTagList';

/**
 * NoirZineModalTitle - Large modal title
 */
const NoirZineModalTitle = forwardRef(({ children, className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-[42px] font-bold leading-[1.1] text-white pr-16",
      className
    )}
    style={{ fontFamily: "'Playfair Display', serif" }}
    {...props}
  >
    {children}
  </h2>
));

NoirZineModalTitle.displayName = 'NoirZineModalTitle';

/**
 * NoirZineModalTagline - Italic tagline with left border
 */
const NoirZineModalTagline = forwardRef(({ children, className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-[18px] italic text-white/50 leading-[1.5] pl-6 border-l-[3px] border-white/20",
      className
    )}
    style={{ fontFamily: "'Playfair Display', serif" }}
    {...props}
  >
    {children}
  </p>
));

NoirZineModalTagline.displayName = 'NoirZineModalTagline';

export {
  NoirZineModal,
  NoirZineModalHeader,
  NoirZineModalBody,
  NoirZineModalFooter,
  NoirZineModalSection,
  NoirZineStatsGrid,
  NoirZineStatCell,
  NoirZineTagList,
  NoirZineModalTitle,
  NoirZineModalTagline,
};
