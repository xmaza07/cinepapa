
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { STREAMING_PLATFORMS } from '../constants/streamingPlatforms';

interface PlatformBarProps {
  platformFilters: string[];
  setPlatformFilters: (platforms: string[]) => void;
}

const PlatformBar = ({ platformFilters, setPlatformFilters }: PlatformBarProps) => {
  return (
    <div className="mb-6 bg-black/30 rounded-lg p-3 overflow-x-auto">
      <ToggleGroup 
        type="multiple" 
        value={platformFilters}
        onValueChange={setPlatformFilters}
        className="flex space-x-2 w-full justify-start"
      >
        {STREAMING_PLATFORMS.map(platform => (
          <ToggleGroupItem 
            key={platform.id} 
            value={platform.id}
            variant="outline"
            className="flex items-center gap-1.5 border-white/10 data-[state=on]:bg-accent/20 data-[state=on]:border-accent"
          >
            {platform.icon && (
              <platform.icon className={`h-4 w-4 ${platform.color}`} />
            )}
            {!platform.icon && (
              <div className={`h-3 w-3 rounded-full ${platform.color}`} />
            )}
            <span className="hidden sm:inline">{platform.name}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default PlatformBar;
