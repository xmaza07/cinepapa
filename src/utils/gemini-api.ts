
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
    // Initialize the Google Gen AI client with proper options object
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // Get the Gemini model - using the correct API method structure
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      }
    });
    
    // Get the response text using the correct property
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
