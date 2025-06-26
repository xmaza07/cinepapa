import React, { useRef, useEffect, useState } from 'react';
import { Send, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useChatbot } from '@/contexts/chatbot-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { nlpService } from '@/utils/services/nlp-service';
import { streamingPlatformService, type StreamingAvailability } from '@/utils/services/streaming-platform';
import { Media } from '@/utils/types';
import ChatMessage from './ChatMessage';
import RecommendationCard from './RecommendationCard';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface MediaWithAvailability extends Media {
  availability?: StreamingAvailability[];
}

const ChatbotWindow: React.FC = () => {
  const { isOpen, messages, isLoading, sendMessage, searchForMedia, closeChatbot } = useChatbot();
  const { profile, getRecommendations, analyzeUserFeedback, getPersonalizedScore } = useUserProfile();
  const [input, setInput] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<MediaWithAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced message history management
  const enhancedMessages = messages.map((msg, index) => ({ ...msg, contextIndex: index }));

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setIsAnalyzing(true);
    try {
      // Analyze user input for better understanding
      const analysis = await nlpService.analyzeInput(trimmedInput);
      
      if (isSearchMode) {
        // Enhanced search with NLP analysis
        const searchResults = await searchForMedia(trimmedInput);
        
        // Filter results based on streaming availability
        if (profile) {
          const availableResults = await streamingPlatformService.filterAvailableContent(
            searchResults,
            profile.streamingServices
          );
          setRecommendations(availableResults);
        }
      } else {
        // Get personalized recommendations based on the query
        const userRecommendations = await getRecommendations(5);
        setRecommendations(userRecommendations);
        
        // Send message with enhanced context
        await sendMessage(trimmedInput, {
          nlpAnalysis: analysis,
          recommendations: userRecommendations
        });
      }
      
      setInput('');
    } catch (error) {
      console.error('Error processing input:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load streaming availability for recommendations
  useEffect(() => {
    const loadAvailability = async () => {
      if (!recommendations.length || !profile) return;
      
      setLoadingAvailability(true);
      try {
        const updatedRecommendations = await Promise.all(
          recommendations.map(async (media) => {
            const availability = await streamingPlatformService.getStreamingAvailability(media.id);
            return { ...media, availability };
          })
        );
        setRecommendations(updatedRecommendations);
      } catch (error) {
        console.error('Error loading streaming availability:', error);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [recommendations.map(r => r.id).join(','), profile]);

  // Handle rating a recommendation
  const handleRate = async (media: Media, rating: number) => {
    if (!profile) return;
    
    await analyzeUserFeedback(
      `Rating ${rating > 0 ? 'positive' : 'negative'} for ${media.title || media.name}`,
      media.id,
      rating > 0 ? 5 : 1
    );
  };

  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className={cn(
      "fixed bottom-20 right-4 w-[380px] h-[520px] z-50",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "shadow-2xl rounded-xl border border-border/40",
      "transition-all duration-200 ease-in-out",
      "flex flex-col"
    )}>
      <CardHeader className="pb-2 border-b border-border/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            CineMate
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeChatbot}
            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-2">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-primary">Welcome to CineMate! 🎬</p>
              <p className="text-sm text-muted-foreground">I can recommend movies and TV shows tailored to your tastes, or help you discover something new.</p>
            </div>
            
            <div className="w-full space-y-2">
              <p className="text-sm font-medium">What I can help you with:</p>
              <ul className="text-left text-sm list-none space-y-2">
                {[
                  "Get instant recommendations based on your mood",
                  "Search trending, top-rated, or new releases",
                  "Add movies to your watchlist for later",
                  "Track your watch history",
                  "Advanced search by genre, rating, or year"
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Try saying:</p>
              <div className="space-y-1.5">
                {[
                  "Suggest a feel-good comedy for the weekend",
                  "Show me trending sci-fi movies",
                  "Add Inception to my watchlist"
                ].map((text, i) => (
                  <p key={i} className="text-xs italic text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg">
                    "{text}"
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-4">
                <ChatMessage message={message} />
                {message.mediaItems && (
                  <div className="grid gap-4">
                    {message.mediaItems.map((media) => {
                      const recommendation = recommendations.find(r => r.id === media.id);
                      return (
                        <RecommendationCard
                          key={media.id}
                          media={media}
                          availability={recommendation?.availability}
                          onRate={(rating) => handleRate(media, rating)}
                          personalizedScore={getPersonalizedScore(media)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t border-border/10 p-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={toggleSearchMode}
            className={cn(
              "transition-colors duration-200",
              isSearchMode ? "text-primary bg-primary/10" : "hover:bg-primary/10"
            )}
          >
            <Search className="h-4 w-4" />
          </Button>
          
          <Input
            ref={inputRef}
            placeholder={isSearchMode ? "Search for movies or shows..." : "Ask for recommendations..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={cn(
              "flex-1 transition-all duration-200",
              "bg-muted/40 border-muted-foreground/20",
              "focus:ring-1 focus:ring-primary/30 focus:border-primary/30",
              "placeholder:text-muted-foreground/50"
            )}
            disabled={isLoading || isAnalyzing}
          />
          
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading || isAnalyzing || !input.trim()}
            className={cn(
              "bg-primary/90 hover:bg-primary transition-colors",
              "disabled:bg-muted disabled:cursor-not-allowed"
            )}
          >
            {isLoading || isAnalyzing || loadingAvailability ?
              <Spinner size="sm" /> :
              <Send className="h-4 w-4" />
            }
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default ChatbotWindow;
