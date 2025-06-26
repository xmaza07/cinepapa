import React from 'react';
import { triggerHapticFeedback, triggerSuccessHaptic } from '@/utils/haptic-feedback';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { extractQualityTags } from '@/utils/quality-tags';
import { fetchDownloadLinks } from '@/api/download';

interface DownloadLink {
  title: string;
  size: string;
  download_url: string;
  file_id: string;
}

interface DownloadSectionProps {
  mediaName: string;
  season?: number;
  episode?: number;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  mediaName,
  season,
  episode
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [downloadLinks, setDownloadLinks] = React.useState<DownloadLink[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLinks = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    triggerHapticFeedback(20);
    try {
      const links = await fetchDownloadLinks(mediaName, season, episode);
      setDownloadLinks(links);
      if (links.length > 0) {
        triggerSuccessHaptic();
      }
    } catch (err) {
      setError('Failed to fetch download links');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [mediaName, season, episode]);

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
      </div>
    );
  }

  if (!downloadLinks.length && !isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Button onClick={fetchLinks} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Show Download Links
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {downloadLinks.map((link) => {
            const qualityTags = extractQualityTags(link.title);
            return (
              <div
                key={link.file_id}
                className="relative group bg-gradient-to-br from-[#181c24] to-[#23272f] border border-white/10 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3 transition-transform hover:scale-[1.025] hover:shadow-2xl min-h-[140px]"
              >
                {/* Cinematic Glow */}
                <div className="absolute -inset-1 bg-accent/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />

                {/* File Title */}
                <div className="relative z-10 font-mono text-xs sm:text-sm text-white/90 break-all mb-1 line-clamp-2">
                  {link.title}
                </div>

                {/* Quality Tags */}
                <div className="relative z-10 flex flex-wrap gap-2 mb-1">
                  {qualityTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-black/40 border-accent text-accent px-2 py-0.5 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* File Size & Download Button */}
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto gap-2 sm:gap-0">
                  <span className="text-xs text-white/70 font-semibold tracking-wide bg-black/30 px-2 py-1 rounded shadow mb-1 sm:mb-0">
                    {link.size}
                  </span>
                  <Button
                  onClick={() => {
                    triggerHapticFeedback(25);
                    window.open(link.download_url, '_blank');
                  }}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-accent/80 text-white border-none shadow-lg hover:from-accent/80 hover:to-accent"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
