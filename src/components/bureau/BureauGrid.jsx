/**
 * BureauGrid - The structural grid container
 * Establishes the outer boundary with top and left borders.
 * Children should use BureauCard which provides right and bottom borders.
 */
export function BureauGrid({
  children,
  columns = 3,
  className = ""
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`
        grid ${gridCols[columns] || gridCols[3]}
        border-t border-l border-white/15
        backdrop-blur-sm bg-[#050A14]/30
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default BureauGrid;
