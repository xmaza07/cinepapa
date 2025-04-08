
import { Media } from '@/utils/types';
import { transformApiMediaToMedia } from '@/utils/media-utils';

const GEMINI_API_KEY = 'AIzaSyBpTyVYegzYlwFPM_K_9tOkUgS2qGgLOz0';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
    // Format chat history for Gemini API
    const formattedHistory = chatHistory
      .slice(-10) // Only include last 10 messages
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Prepare the request payload
    const payload = {
      contents: [
        ...formattedHistory,
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      }
    };

    // Make the API request
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
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
