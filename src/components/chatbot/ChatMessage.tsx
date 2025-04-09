
import React from 'react';
import { Star } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/contexts/chatbot-context';
import { Button } from '@/components/ui/button';
import { useChatbot } from '@/contexts/chatbot-context';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { rateRecommendation } = useChatbot();
  const [showRating, setShowRating] = React.useState(false);
  
  // Show rating UI only for AI messages (recommendations)
  const toggleRating = () => {
    if (!message.isUser) {
      setShowRating(!showRating);
    }
  };

  const handleRate = (rating: number) => {
    rateRecommendation(message.id, rating);
    setShowRating(false);
  };

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
              >
                Rate this
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
