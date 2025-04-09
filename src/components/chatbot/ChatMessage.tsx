
import React, { useState } from 'react';
import { Star, ExternalLink, ThumbsUp, Film, Tv } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/contexts/chatbot-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatbot } from '@/contexts/chatbot-context';
import { useNavigate } from 'react-router-dom';
import { extractMediaItems, createMediaObjects } from '@/utils/chatbot-utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { rateRecommendation } = useChatbot();
  const [showRating, setShowRating] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);
  const navigate = useNavigate();
  
  // Extract media items from the message
  const parsedItems = !message.isUser ? extractMediaItems(message.text) : [];
  const mediaItems = createMediaObjects(parsedItems);
  
  // Show rating UI only for AI messages (recommendations)
  const toggleRating = () => {
    if (!message.isUser) {
      setShowRating(!showRating);
    }
  };

  const handleRate = (rating: number) => {
    rateRecommendation(message.id, rating);
    setShowRating(false);
    setHasReacted(true);
  };
  
  const navigateToMedia = (type: 'movie' | 'tv', id: number) => {
    navigate(`/${type}/${id}`);
  };

  // Extract initial greeting or explanation text
  const getIntroText = (text: string): string => {
    // Find the first numbered item or title pattern
    const numberedItemIndex = text.search(/\d+\.\s+/);
    const titlePatternIndex = text.search(/(?:\*\*)?([^*\n(]+)(?:\*\*)?\s*\((\d{4}(?:-\d{4}|\s*-\s*Present)?)\)/);
    
    let cutoffIndex = text.length;
    if (numberedItemIndex > 0) cutoffIndex = numberedItemIndex;
    if (titlePatternIndex > 0 && titlePatternIndex < cutoffIndex) cutoffIndex = titlePatternIndex;
    
    return text.substring(0, cutoffIndex).trim();
  };

  // If this is an AI message with media items, render them as cards
  if (!message.isUser && mediaItems.length > 0) {
    const introText = getIntroText(message.text);
    
    return (
      <div className="flex flex-col space-y-4 mb-4">
        {introText && (
          <div className="max-w-[90%] p-3 bg-muted text-foreground rounded-lg rounded-bl-none">
            {introText}
          </div>
        )}
        
        {mediaItems.map((media, index) => (
          <Card 
            key={`${media.id}-${index}`} 
            className="max-w-[90%] ml-4 bg-muted/50 border-primary/10 hover:border-primary/30 transition-all duration-300"
          >
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {media.media_type === 'movie' ? (
                      <Film className="h-5 w-5 mr-2 text-primary" />
                    ) : (
                      <Tv className="h-5 w-5 mr-2 text-primary" />
                    )}
                    <h3 className="font-medium">
                      {media.title || media.name} 
                      {media.release_date && <span className="text-muted-foreground ml-2">({media.release_date.substring(0, 4)})</span>}
                      {media.first_air_date && <span className="text-muted-foreground ml-2">({media.first_air_date.substring(0, 4)})</span>}
                    </h3>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {media.media_type === 'movie' ? 'Movie' : 'TV Show'}
                  </Badge>
                </div>
                
                {media.overview && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{media.overview}</p>
                )}
                
                {parsedItems[index]?.genres && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parsedItems[index].genres?.map((genre, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{genre}</Badge>
                    ))}
                  </div>
                )}
                
                {parsedItems[index]?.rating && (
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 mr-1 text-amber-400 fill-amber-400" />
                    <span>{parsedItems[index].rating}</span>
                  </div>
                )}
                
                <Button 
                  onClick={() => navigateToMedia(media.media_type as 'movie' | 'tv', media.id)}
                  className="mt-2 w-full"
                  variant="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View {media.media_type === 'movie' ? 'Movie' : 'Show'} Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="flex justify-end">
          {showRating ? (
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                  onClick={() => handleRate(rating)}
                >
                  <Star className={`h-4 w-4 ${rating <= 3 ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
                </Button>
              ))}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs py-1 px-2 h-auto"
              onClick={toggleRating}
              disabled={hasReacted}
            >
              {hasReacted ? (
                <span className="flex items-center">
                  <ThumbsUp className="h-3 w-3 mr-1" /> 
                  Rated
                </span>
              ) : (
                'Rate this'
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Regular message rendering
  return (
    <div
      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] p-3 rounded-lg ${
          message.isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted text-foreground rounded-bl-none'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.text}</div>
        
        {!message.isUser && (
          <div className="mt-2 flex justify-end">
            {showRating ? (
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto"
                    onClick={() => handleRate(rating)}
                  >
                    <Star className={`h-4 w-4 ${rating <= 3 ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
                  </Button>
                ))}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs py-1 px-2 h-auto"
                onClick={toggleRating}
                disabled={hasReacted}
              >
                {hasReacted ? (
                  <span className="flex items-center">
                    <ThumbsUp className="h-3 w-3 mr-1" /> 
                    Rated
                  </span>
                ) : (
                  'Rate this'
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
