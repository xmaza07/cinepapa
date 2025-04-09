
import { GoogleGenAI } from "@google/genai";
import { Media } from '@/utils/types';
import { transformApiMediaToMedia } from '@/utils/media-utils';

const GEMINI_API_KEY = 'AIzaSyBpTyVYegzYlwFPM_K_9tOkUgS2qGgLOz0';

// Interface for chat message
export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: Media[];
}

// Function to get recommendations from Gemini
export const getRecommendations = async (
  prompt: string,
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  try {
    // Initialize the Google Gen AI client
    const genAI = new GoogleGenAI(GEMINI_API_KEY);
    
    // Get the Gemini model
    const model = genAI.models("gemini-1.5-flash");
    
    // Format chat history for Gemini API
    const formattedHistory = chatHistory
      .slice(-10) // Only include last 10 messages
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
    
    // Create a chat session
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      }
    });
    
    // Send the message and get the response
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return 'Sorry, I encountered an error while getting recommendations. Please try again later.';
  }
};

// Function to extract media recommendations from text
export const extractMediaRecommendations = async (
  text: string,
  searchMedia: (query: string) => Promise<Media[]>
): Promise<Media[]> => {
  try {
    // Extract titles using a simple regex pattern
    const titleRegex = /["']([^"']+)["']/g;
    const matches = [...text.matchAll(titleRegex)];
    
    const titles = matches
      .map(match => match[1])
      .filter(Boolean)
      .slice(0, 3); // Limit to top 3 recommendations
    
    if (titles.length === 0) {
      return [];
    }
    
    // Search for each title and get the media
    const searchPromises = titles.map(title => searchMedia(title));
    const searchResults = await Promise.all(searchPromises);
    
    // Get the first result from each search
    return searchResults
      .map(results => results[0])
      .filter(Boolean);
  } catch (error) {
    console.error('Error extracting media recommendations:', error);
    return [];
  }
};
