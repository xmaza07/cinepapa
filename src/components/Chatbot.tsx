
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Search, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useChatbot } from '@/contexts/chatbot-context';
import ChatbotMessage from '@/components/ChatbotMessage';

const Chatbot = () => {
  const { 
    isOpen, 
    messages, 
    isLoading, 
    sendMessage, 
    toggleChatbot, 
    searchMediaItems 
  } = useChatbot();
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when search mode is toggled
  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await sendMessage(input);
    setInput('');
    setIsSearchMode(false);
  };

  const handleSearchModeToggle = () => {
    setIsSearchMode(prev => !prev);
    if (!isSearchMode) {
      setInput('search: ');
    } else {
      setInput('');
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  if (isMobile) {
    // Mobile version uses Sheet component
    return (
      <Sheet open={isOpen} onOpenChange={toggleChatbot}>
        <SheetTrigger asChild>
          <Button
            className="rounded-full fixed bottom-4 right-4 size-12 shadow-lg z-50"
            size="icon"
          >
            <MessageCircle className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] px-0 pt-0 pb-0 border-t rounded-t-xl">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">Movie Recommendations</h3>
              <Button variant="ghost" size="sm" onClick={toggleChatbot}>
                <X className="size-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <ChatbotMessage key={index} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="border-t p-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSearchModeToggle}
                  className={isSearchMode ? 'bg-accent text-accent-foreground' : ''}
                >
                  <Search className="size-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isSearchMode ? "Search for a movie or show..." : "Type a message..."}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" /> : <Send className="size-4" />}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version
  return (
    <>
      {!isOpen && (
        <Button
          onClick={toggleChatbot}
          className="rounded-full fixed bottom-4 right-4 size-12 shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="size-6" />
        </Button>
      )}

      {isOpen && (
        <div className={`fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg transition-all duration-300 ${isMinimized ? 'w-64 h-14' : 'w-80 sm:w-96 h-[500px]'}`}>
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Movie Recommendations</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={toggleMinimize} className="h-8 w-8">
                {isMinimized ? <Maximize2 className="size-4" /> : <Minimize2 className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleChatbot} className="h-8 w-8">
                <X className="size-4" />
              </Button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              <div className="h-[calc(500px-110px)] overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <ChatbotMessage key={index} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={handleSubmit} className="border-t p-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSearchModeToggle}
                    className={isSearchMode ? 'bg-accent text-accent-foreground' : ''}
                  >
                    <Search className="size-4" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isSearchMode ? "Search for a movie or show..." : "Type a message..."}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" /> : <Send className="size-4" />}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
