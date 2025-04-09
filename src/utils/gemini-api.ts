
import { GoogleGenAI } from '@google/genai';

// Initialize the Google GenAI with API key
const API_KEY = 'AIzaSyBpTyVYegzYlwFPM_K_9tOkUgS2qGgLOz0';
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Define movie recommendation system prompt
const MOVIE_RECOMMENDATION_PROMPT = `
You are a friendly and knowledgeable movie and TV show recommendation assistant. 
Your goal is to suggest movies and TV shows based on user preferences.
Always provide thoughtful, personalized responses with 2-3 specific recommendations.
For each recommendation, include:
- Title
- Brief description (1-2 sentences)
- Why you think they might enjoy it
- Rating out of 10

Be conversational and friendly in your responses.
`;

/**
 * Send a message to the Gemini model and get a response
 * @param message The user's message
 * @param chatHistory Previous messages for context
 * @returns The AI response
 */
export const sendMessageToGemini = async (
  message: string,
  chatHistory: string[] = []
): Promise<string> => {
  try {
    // Create a chat session
    const chat = genAI.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    // Add system prompt if chat history is empty
    if (chatHistory.length === 0) {
      await chat.sendMessage({
        message: MOVIE_RECOMMENDATION_PROMPT
      });
    }
    
    // Send the user message
    const result = await chat.sendMessage({
      message: message
    });
    
    return result.text || 'Sorry, I couldn\'t generate a response.';
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    return 'Sorry, I encountered an error while processing your request. Please try again later.';
  }
};

/**
 * Function to search for movies or TV shows
 * @param query The search query
 * @returns Movie/TV show search results
 */
export const searchMedia = async (query: string): Promise<string> => {
  try {
    // Use the models API for one-off content generation
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          parts: [
            {
              text: `Please search for movies or TV shows that match: "${query}".
              Provide up to 3 results with title, year, brief description, and genre.
              Format as a concise list.`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });
    
    return result.text || 'No results found.';
  } catch (error) {
    console.error('Error searching media:', error);
    return 'Sorry, I encountered an error while searching. Please try again later.';
  }
};
