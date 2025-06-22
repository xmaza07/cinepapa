
import { CastMember } from '@/utils/types';

interface TVShowCastProps {
  cast: CastMember[];
}

export const TVShowCast = ({ cast }: TVShowCastProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">Cast</h2>
      {cast.length > 0 ? (
        <div
          className="flex flex-wrap gap-6 sm:gap-4 sm:flex-nowrap sm:overflow-x-auto sm:-mx-4 px-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {cast.map((member) => (
            <div
              key={member.id}
              className="w-32 min-w-[7.5rem] text-center flex-shrink-0 sm:w-28 sm:min-w-[6.5rem]"
            >
              {member.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                  alt={member.name}
                  className="rounded-lg w-24 h-32 object-cover mx-auto mb-2 sm:w-20 sm:h-28"
                />
              ) : (
                <div className="rounded-lg w-24 h-32 bg-white/10 flex items-center justify-center mx-auto mb-2 text-white/60 text-xs sm:w-20 sm:h-28">
                  No Image
                </div>
              )}
              <p className="text-white/90 text-sm font-medium truncate max-w-full sm:text-xs">
                {member.name}
              </p>
              <p className="text-white/60 text-xs truncate max-w-full">
                {member.character}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-white/70">No cast information available.</div>
      )}
    </div>
  );
};

export default TVShowCast;
