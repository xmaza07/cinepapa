import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuickReplySuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  className?: string;
}

const QuickReplySuggestions: React.FC<QuickReplySuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  className
}) => {
  if (!suggestions.length) return null;

  return (
    <div className={cn("flex overflow-x-auto py-2 px-1 scrollbar-hide snap-x gap-2", className)}>
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion}
          className="bg-muted/50 hover:bg-muted text-sm px-3 py-1.5 rounded-full whitespace-nowrap 
                     text-muted-foreground border border-border/20 snap-start flex-shrink-0
                     active:scale-95 transition-all duration-200"
          onClick={() => onSelectSuggestion(suggestion)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          whileTap={{ scale: 0.95 }}
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
};

export default QuickReplySuggestions;
