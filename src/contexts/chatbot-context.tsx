
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { sendMessageToGemini, searchMedia } from '@/utils/gemini-api';

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
      
      // Send message to Gemini
      const response = await sendMessageToGemini(message, chatHistory);
      
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
      // Search using Gemini
      const results = await searchMedia(query);
      
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
      sendMessage(`I rated the recommendation "${ratedMessage.text.substring(0, 50)}..." as ${rating}/5. Please remember this for future recommendations.`);
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
