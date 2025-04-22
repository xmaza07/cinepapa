import React, { useRef, useEffect } from 'react';
import { Send, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useChatbot } from '@/contexts/chatbot-context';
import ChatMessage from './ChatMessage';
import Spinner from '@/components/ui/spinner';

const ChatbotWindow: React.FC = () => {
  const { isOpen, messages, isLoading, sendMessage, searchForMedia, closeChatbot } = useChatbot();
  const [input, setInput] = React.useState('');
  const [isSearchMode, setIsSearchMode] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim()) {
      if (isSearchMode) {
        searchForMedia(input);
      } else {
        sendMessage(input);
      }
      setInput('');
    }
  };

  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-20 right-4 w-[350px] h-[500px] z-50 shadow-xl flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">CineMate</CardTitle>
          <Button variant="ghost" size="icon" onClick={closeChatbot}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <p className="mb-2 font-semibold">Welcome to CineMate! 🎬</p>
            <p className="mb-2">I can recommend movies and TV shows tailored to your tastes, or help you discover something new.</p>
            <ul className="mb-2 text-left text-sm list-disc list-inside">
              <li>Get instant recommendations based on your mood or favorite genres.</li>
              <li>Search for trending, top-rated, or newly released titles.</li>
              <li>Add movies and shows to your watchlist for later.</li>
              <li>Track your watch history and resume where you left off.</li>
              <li>Try advanced search to filter by genre, rating, or year.</li>
            </ul>
            <p className="mb-1">Try something like:</p>
            <div className="text-xs italic text-muted-foreground">
              <p>"Suggest a feel-good comedy for the weekend"</p>
              <p>"Show me trending sci-fi movies"</p>
              <p>"Add Inception to my watchlist"</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={toggleSearchMode}
            className={isSearchMode ? 'text-primary' : ''}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Input
            ref={inputRef}
            placeholder={isSearchMode ? "Search for movies or shows..." : "Ask for recommendations..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Spinner size="sm" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default ChatbotWindow;
