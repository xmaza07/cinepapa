
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage } from '@/utils/gemini-api';
import { Media } from '@/utils/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useChatbot } from '@/contexts/chatbot-context';
import { Star } from 'lucide-react';

interface ChatbotMessageProps {
  message: ChatMessage;
}

const ChatbotMessage: React.FC<ChatbotMessageProps> = ({ message }) => {
  const navigate = useNavigate();
  const { userRatings, rateRecommendation } = useChatbot();
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const toggleDetails = (mediaId: number) => {
    setShowDetails(prev => ({
      ...prev,
      [mediaId]: !prev[mediaId]
    }));
  };

  const navigateToMedia = (media: Media) => {
    navigate(`/${media.media_type}/${media.id}`);
  };

  const formatMessage = (content: string) => {
    // Split message by newlines to handle paragraphs
    return content.split('\n').map((line, i) => (
      <p key={i} className={i > 0 ? 'mt-2' : ''}>
        {line}
      </p>
    ));
  };

  const handleRating = (mediaId: number, rating: number) => {
    rateRecommendation(mediaId, rating);
  };

  return (
    <div className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-accent text-accent-foreground' : 'bg-muted'} rounded-lg p-3 shadow`}>
        <div className="text-sm">{formatMessage(message.content)}</div>
        
        {message.role === 'bot' && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-3">
            <p className="text-sm font-semibold">Recommended for you:</p>
            {message.suggestions.map(media => (
              <Card key={media.id} className="p-2 bg-background/50 hover:bg-background/80 transition-colors">
                <div className="flex gap-3">
                  {media.poster_path && (
                    <img 
                      src={`https://image.tmdb.org/t/p/w92${media.poster_path}`} 
                      alt={media.title || media.name || 'Media poster'} 
                      className="h-20 w-14 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{media.title || media.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {media.media_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star} 
                            onClick={() => handleRating(media.id, star)}
                            className="focus:outline-none"
                          >
                            <Star 
                              className={`h-4 w-4 ${userRatings[media.id] >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      {showDetails[media.id] ? (
                        <p className="text-xs mt-1">{media.overview.substring(0, 100)}{media.overview.length > 100 ? '...' : ''}</p>
                      ) : null}
                      
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 px-2"
                          onClick={() => toggleDetails(media.id)}
                        >
                          {showDetails[media.id] ? 'Hide Details' : 'Show Details'}
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => navigateToMedia(media)}
                        >
                          View Full Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-[10px] text-muted-foreground/60 mt-1 text-right">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatbotMessage;
