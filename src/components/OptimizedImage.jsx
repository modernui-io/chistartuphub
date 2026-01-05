
export const OptimizedImage = ({
  src,
  alt,
  width = 800,
  className = "",
  priority = false,
  sizes = "(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
}) => {
  const isUnsplash = src?.includes('unsplash.com');

  // Build optimized URL with WebP format
  const buildUrl = (targetWidth) => {
    if (!isUnsplash) return src;
    const baseUrl = src.includes('?') ? src.split('?')[0] : src;
    return `${baseUrl}?w=${targetWidth}&q=80&fm=webp&fit=crop`;
  };

  const optimizedSrc = buildUrl(width);

  // Generate srcSet for responsive images
  const srcSet = isUnsplash
    ? `${buildUrl(400)} 400w, ${buildUrl(800)} 800w, ${buildUrl(1200)} 1200w`
    : undefined;

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={isUnsplash ? sizes : undefined}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
};

export default OptimizedImage;
