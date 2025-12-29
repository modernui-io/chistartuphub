import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BookmarkButton from '@/components/BookmarkButton';

export default function ShareActions({
  resourceType,
  resourceId,
  resourceName,
  className = '',
  size = 'sm',
  showLabels = false
}) {
  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Generate a shareable URL for the resource
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${resourceType}?id=${resourceId}`;

    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied!', {
        description: resourceName ? `Link to ${resourceName} copied to clipboard` : 'Link copied to clipboard',
      });
    }).catch(() => {
      toast.error('Failed to copy', {
        description: 'Could not copy link to clipboard',
      });
    });
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <BookmarkButton
        resourceType={resourceType}
        resourceId={resourceId}
        resourceName={resourceName}
        variant="ghost"
        size={size}
        showText={showLabels}
        className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10"
      />
      <Button
        onClick={handleCopyLink}
        variant="ghost"
        size={size}
        className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10"
      >
        <Link2 className="w-4 h-4" />
        {showLabels && <span className="ml-2">Share</span>}
      </Button>
    </div>
  );
}
