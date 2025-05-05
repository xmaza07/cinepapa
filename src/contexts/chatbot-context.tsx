
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { sendMessageToGemini, searchMedia, type GeminiResponse, type ChatMessage as GeminiChatMessage } from '@/utils/gemini-api';
import { extractMediaItems } from '@/utils/chatbot-utils';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
  sendMessage: (message: string) => Promise<void>;
  searchForMedia: (query: string) => Promise<void>;
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

  const addMessage = (text: string, isUser: boolean): string => {
    const id = Date.now().toString();
    const newMessage: ChatMessage = {
      id,
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return id;
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Heuristic: If the message is a single word or short phrase (likely a genre or keyword), rephrase it as a recommendation request
    let userMessage = message.trim();
    if (/^([\w\s-]+)$/.test(userMessage) && userMessage.length < 40 && !userMessage.toLowerCase().includes('recommend') && !userMessage.toLowerCase().includes('suggest') && !userMessage.toLowerCase().includes('show me')) {
      userMessage = `Recommend some ${userMessage} movies or TV shows.`;
    }

    addMessage(message, true);
    setIsLoading(true);
    try {
      // Convert ChatMessage[] to string[] for the API
      const chatHistory = messages.slice(-5).map(msg => msg.text);
      const formattedMessage = `\n${userMessage}\n\nWhen responding with movie or TV show recommendations, please format them as follows:\n1. **Title** (Year) - Brief description about the content.\nGenre: genre1, genre2\nType: movie or tv\nRating: X/10\nTMDB_ID: ID number if available\n\nFollow this format to make recommendations easier to understand.\n      `;
      const response = await sendMessageToGemini(formattedMessage, chatHistory);
      const mediaItems = extractMediaItems(response.text);
      console.log('Extracted media items:', mediaItems);
      addMessage(response.text, false);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const searchForMedia = async (query: string) => {
    if (!query.trim()) return;
    
    // Add search message
    addMessage(`Searching for: ${query}`, true);
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Provide formatting guidance for search results
      const formattedQuery = `
Search for: ${query}

When responding with search results, please format them as follows:
1. **Title** (Year) - Brief description about the content.
Genre: genre1, genre2
Type: movie or tv
Rating: X/10
TMDB_ID: ID number if available

Follow this format to make the results easier to understand.
      `;
      
      // Search using Gemini
      const results = await searchMedia(formattedQuery);
      
      // Check if the results contain media items
      const mediaItems = extractMediaItems(results.text);
      console.log('Extracted search results:', mediaItems);
      
      // Add search results
      addMessage(results.text, false);
    } catch (error) {
      console.error('Error searching media:', error);
      addMessage('Sorry, I encountered an error while searching. Please try again.', false);
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
    
    // Add feedback to Gemini for better recommendations in the future
    const ratedMessage = messages.find(msg => msg.id === messageId);
    if (ratedMessage) {
      const ratingMessage = `I rated the recommendation "${ratedMessage.text.substring(0, 50)}..." as ${rating}/5. Please remember this for future recommendations.`;
      console.log(ratingMessage);
      
      // Convert ChatMessage[] to string[] for the API
      const messageTexts = messages.map(msg => msg.text);
      
      // Silently send rating to Gemini without adding to visible chat
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
