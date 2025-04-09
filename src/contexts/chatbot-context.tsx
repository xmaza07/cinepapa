
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { sendMessageToGemini, searchMedia } from '@/utils/gemini-api';
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
    
    // Add user message
    addMessage(message, true);
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Get chat history for context (last 5 messages)
      const chatHistory = messages
        .slice(-5)
        .map(msg => msg.text);
      
      // Provide formatting guidance to Gemini to make parsing easier
      const formattedMessage = `
${message}

When responding with movie or TV show recommendations, please format them as follows:
1. **Title** (Year) - Brief description about the content.
Genre: genre1, genre2
Type: movie or tv
Rating: X/10
TMDB_ID: ID number if available

Follow this format to make recommendations easier to understand.
      `;
      
      // Send message to Gemini
      const response = await sendMessageToGemini(formattedMessage, chatHistory);
      
      // Check if the response contains media items
      const mediaItems = extractMediaItems(response);
      console.log('Extracted media items:', mediaItems);
      
      // Add AI response
      addMessage(response, false);
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
      const mediaItems = extractMediaItems(results);
      console.log('Extracted search results:', mediaItems);
      
      // Add search results
      addMessage(results, false);
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
      
      // Silently send rating to Gemini without adding to visible chat
      sendMessageToGemini(ratingMessage, messages.map(msg => msg.text));
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
