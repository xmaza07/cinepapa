
import { posterSizes } from '@/utils/api';
import { TVDetails } from '@/utils/types';

interface TVShowAboutProps {
  tvShow: TVDetails;
}

export const TVShowAbout = ({ tvShow }: TVShowAboutProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6">About the Show</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-3">Status</h3>
          <p className="text-white/80">{tvShow.status}</p>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-3">Episodes</h3>
          <p className="text-white/80">{tvShow.number_of_episodes}</p>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-3">Seasons</h3>
          <p className="text-white/80">{tvShow.number_of_seasons}</p>
        </div>
      </div>
      
      {tvShow.production_companies.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Production Companies</h3>
          <div className="flex flex-wrap gap-6">
            {tvShow.production_companies.map((company) => (
              <div key={company.id} className="text-center">
                {company.logo_path ? (
                  <div className="bg-white/10 p-3 rounded-lg w-24 h-16 flex items-center justify-center mb-2">
                    <img 
                      src={`${posterSizes.small}${company.logo_path}`} 
                      alt={company.name} 
                      className="max-w-full max-h-full"
                    />
                  </div>
                ) : (
                  <div className="bg-white/10 p-3 rounded-lg w-24 h-16 flex items-center justify-center mb-2">
                    <span className="text-white/70 text-xs text-center">{company.name}</span>
                  </div>
                )}
                <p className="text-white/70 text-sm">{company.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TVShowAbout;
