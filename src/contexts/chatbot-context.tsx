import React, { createContext, useState, useContext, ReactNode } from 'react';
import { sendMessageToGemini, searchMedia, type GeminiResponse } from '@/utils/gemini-api';
import { extractMediaFromResponse } from '@/utils/chatbot-utils';
import { ChatbotMedia } from '@/utils/types/chatbot-types';
import { EntityExtraction } from '@/utils/services/nlp-service';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  mediaItems?: ChatbotMedia[];
  nlpAnalysis?: EntityExtraction;
}

interface MessageContext {
  nlpAnalysis?: EntityExtraction;
  recommendations?: ChatbotMedia[];
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
  sendMessage: (message: string, context?: MessageContext) => Promise<void>;
  searchForMedia: (query: string) => Promise<ChatbotMedia[]>;
  clearMessages: () => void;
  rateRecommendation: (messageId: string, rating: number) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const openChatbot = () => setIsOpen(true);
  const closeChatbot = () => setIsOpen(false);

  const addMessage = (text: string, isUser: boolean, mediaItems?: ChatbotMedia[]): string => {
    const id = Date.now().toString();
    const newMessage: ChatMessage = {
      id,
      text,
      isUser,
      timestamp: new Date(),
      mediaItems,
    };
    setMessages((prev) => [...prev, newMessage]);
    return id;
  };

  const sendMessage = async (message: string, context?: MessageContext) => {
    if (!message.trim()) return;

    // Rephrase single words/short phrases as recommendation requests
    let userMessage = message.trim();
    if (/^([\w\s-]+)$/.test(userMessage) && 
        userMessage.length < 40 && 
        !userMessage.toLowerCase().includes('recommend') && 
        !userMessage.toLowerCase().includes('suggest') && 
        !userMessage.toLowerCase().includes('show me')) {
      userMessage = `Recommend some ${userMessage} movies or TV shows.`;
    }

    addMessage(message, true);
    setIsLoading(true);
    try {
      const chatHistory = messages.slice(-5).map(msg => msg.text);
      const formattedMessage = `
        ${userMessage}

        When responding with movie or TV show recommendations, please format them as follows:
        1. **Title** (Year) - Brief description about the content.
        Genre: genre1, genre2
        Type: movie or tv
        Rating: X/10
        TMDB_ID: ID number if available
        For TV shows, also include:
        Season: number
        Episode: number
      `;
      
      const response = await sendMessageToGemini(formattedMessage, chatHistory);
      const mediaItems = extractMediaFromResponse(response.text);
      console.log('Extracted media items:', mediaItems);
      addMessage(response.text, false, mediaItems);

      if (context?.nlpAnalysis || context?.recommendations) {
        const enhancedPrompt = `
          Based on the user's message analysis:
          - Sentiment: ${context.nlpAnalysis?.sentiment || 'neutral'}
          - Extracted genres: ${context.nlpAnalysis?.genres.join(', ') || 'none'}
          - Keywords: ${context.nlpAnalysis?.keywords.join(', ') || 'none'}
          
          And considering these recommended items:
          ${context.recommendations?.map(item => `- ${item.title} (${item.media_type})`).join('\n') || 'No specific recommendations'}
          
          Please provide more targeted recommendations that align with these preferences.
        `;
        await sendMessageToGemini(enhancedPrompt, [response.text]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const searchForMedia = async (query: string): Promise<ChatbotMedia[]> => {
    if (!query.trim()) return [];
    
    addMessage(`Searching for: ${query}`, true);
    setIsLoading(true);
    
    try {
      const formattedQuery = `
        Search for: ${query}

        When responding with search results, please format them as follows:
        1. **Title** (Year) - Brief description about the content.
        Genre: genre1, genre2
        Type: movie or tv
        Rating: X/10
        TMDB_ID: ID number if available
        For TV shows, also include:
        Season: number (start with 1 if not specified)
        Episode: number (start with 1 if not specified)

        Format each result in a clear, structured way that can be easily parsed.
      `;
      
      const results = await searchMedia(formattedQuery);
      const mediaItems = extractMediaFromResponse(results.text);
      console.log('Extracted search results:', mediaItems);
      addMessage(results.text, false, mediaItems);
      return mediaItems;
    } catch (error) {
      console.error('Error searching media:', error);
      addMessage('Sorry, I encountered an error while searching. Please try again.', false);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setRatings({});
  };

  const rateRecommendation = (messageId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [messageId]: rating }));
    
    const ratedMessage = messages.find(msg => msg.id === messageId);
    if (ratedMessage) {
      const ratingMessage = `I rated the recommendation "${ratedMessage.text.substring(0, 50)}..." as ${rating}/5. Please remember this for future recommendations.`;
      console.log(ratingMessage);
      
      const messageTexts = messages.map(msg => msg.text);
      
      sendMessageToGemini(ratingMessage, messageTexts).catch(error => {
        console.error('Error sending rating to Gemini:', error);
      });
    }
  };

  const value: ChatbotContextType = {
    isOpen,
    messages,
    isLoading,
    openChatbot,
    closeChatbot,
    sendMessage,
    searchForMedia,
    clearMessages,
    rateRecommendation,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};
