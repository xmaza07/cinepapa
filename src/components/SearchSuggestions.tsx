
import { Search } from 'lucide-react';

interface SearchSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SearchSuggestions = ({ suggestions, onSuggestionClick }: SearchSuggestionsProps) => {
  if (!suggestions.length) return null;
  
  return (
    <div className="absolute z-50 w-full mt-1 bg-background border border-white/10 rounded-md shadow-lg overflow-hidden animate-fade-in">
      <ul className="py-1">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 text-left"
              onClick={() => onSuggestionClick(suggestion)}
              type="button"
            >
              <Search className="h-4 w-4 mr-2 text-white/50" />
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchSuggestions;
