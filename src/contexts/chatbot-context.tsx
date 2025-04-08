
import React, { createContext, useContext, useState, useEffect } from 'react';
import { searchMedia } from '@/utils/api';
import { ChatMessage, getRecommendations, extractMediaRecommendations } from '@/utils/gemini-api';
import { Media } from '@/utils/types';
import { useAuth } from '@/hooks';

interface ChatbotContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  userRatings: Record<string, number>;
  sendMessage: (message: string) => Promise<void>;
  toggleChatbot: () => void;
  rateRecommendation: (mediaId: number, rating: number) => void;
  searchMediaItems: (query: string) => Promise<Media[]>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const { user } = useAuth();

  // Load messages from localStorage when component mounts
  useEffect(() => {
    if (user) {
      const savedMessages = localStorage.getItem(`chatbot_messages_${user.uid}`);
      const savedRatings = localStorage.getItem(`chatbot_ratings_${user.uid}`);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert string timestamps back to Date objects
          parsedMessages.forEach((msg: any) => {
            msg.timestamp = new Date(msg.timestamp);
          });
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error parsing saved messages:', error);
        }
      } else {
        // Add a welcome message for new users
        const welcomeMessage: ChatMessage = {
          role: 'bot',
          content: "👋 Hi there! I'm your movie and TV show recommendation assistant. Tell me what you enjoy watching, and I'll suggest some titles you might like. You can also ask me to search for specific movies or shows.",
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
      
      if (savedRatings) {
        try {
          setUserRatings(JSON.parse(savedRatings));
        } catch (error) {
          console.error('Error parsing saved ratings:', error);
        }
      }
    }
  }, [user]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`chatbot_messages_${user.uid}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Save ratings to localStorage whenever they change
  useEffect(() => {
    if (user && Object.keys(userRatings).length > 0) {
      localStorage.setItem(`chatbot_ratings_${user.uid}`, JSON.stringify(userRatings));
    }
  }, [userRatings, user]);

  const toggleChatbot = () => {
    setIsOpen(prev => !prev);
  };

  const searchMediaItems = async (query: string): Promise<Media[]> => {
    try {
      return await searchMedia(query);
    } catch (error) {
      console.error('Error searching media:', error);
      return [];
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Generate context for a better recommendation based on ratings
      let context = message;
      if (Object.keys(userRatings).length > 0) {
        context += " Consider the following ratings (1-5 stars): ";
        Object.entries(userRatings).forEach(([mediaId, rating]) => {
          context += `Media ID ${mediaId}: ${rating} stars. `;
        });
      }

      // Get response from Gemini API
      const response = await getRecommendations(context, messages);
      
      // Extract media recommendations from the response
      const suggestedMedia = await extractMediaRecommendations(response, searchMediaItems);

      // Add bot response
      const botMessage: ChatMessage = {
        role: 'bot',
        content: response,
        timestamp: new Date(),
        suggestions: suggestedMedia
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'bot',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const rateRecommendation = (mediaId: number, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [mediaId]: rating
    }));
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        messages,
        isLoading,
        userRatings,
        sendMessage,
        toggleChatbot,
        rateRecommendation,
        searchMediaItems
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
