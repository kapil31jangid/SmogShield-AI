'use client';

import { useTranslations } from 'next-intl';
import { Send, Bot, Loader2, Sparkles, MessageSquare, AlertCircle, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import { useState, useRef, useEffect } from 'react';
import { generateAIResponse } from '@/lib/ai/orchestrator';
import type { AIMessage } from '@/types';

const SUGGESTIONS = [
  "What's the current AQI?",
  "How to choose an air purifier?",
  "When should I ventilate my home?",
  "Best travel options for today?",
  "Generate today's action plan",
  "Explain PM2.5 vs PM10",
];

export default function AssistantPage() {
  const t = useTranslations('assistant');
  const common = useTranslations('common');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Mock context - in production would come from dashboard state
      const mockLocation = { id: 'delhi-in', name: 'Delhi, India', lat: 28.6139, lon: 77.2090, timezone: 'Asia/Kolkata' };
      const mockAQI = { aqi: 156, pm25: 85, location: mockLocation, dataFreshness: 'live' as const, source: 'OpenAQ', timestamp: new Date().toISOString() };
      const mockProfiles = [
        { id: '1', userId: 'demo', name: 'Priya', category: 'adult' as const, conditions: ['asthma'], outdoorFrequency: 'medium' as const, commutePattern: 'public_transport' as const, hasAirPurifier: true, purifierCADR: 400, roomSizeSqFt: 150, preferredLanguage: 'en' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', userId: 'demo', name: 'Arjun', category: 'child' as const, conditions: [], outdoorFrequency: 'high' as const, commutePattern: 'walk' as const, hasAirPurifier: false, preferredLanguage: 'en' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];

      const result = await generateAIResponse(currentInput, { aqi: mockAQI, profiles: mockProfiles, language: 'en' });

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        citations: result.citations,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('error'),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="page-title">{t('title')}</h1>
        <p className="page-subtitle">{t('subtitle')}</p>
      </div>

      {showDisclaimer && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-300 text-sm">{t('disclaimer')}</p>
            <Button variant="ghost" size="sm" onClick={() => setShowDisclaimer(false)} className="mt-2">
              {common('done')}
            </Button>
          </div>
        </div>
      )}

      <Card className="flex flex-col h-[calc(100vh-300px)] min-h-[500px]">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              {t('title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="info" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI Powered
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          {/* Messages */}
          <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 py-12">
                <Bot className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Start a conversation</h3>
                <p className="text-sm max-w-xs">Ask me about air quality, indoor protection, travel options, or get your daily action plan.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestion(suggestion)}
                      className="whitespace-nowrap"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-in slide-up',
                  message.role === 'user' && 'flex-row-reverse'
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-xl flex items-center justify-center shrink-0',
                    message.role === 'user'
                      ? 'bg-brand-primary text-white'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  )}
                >
                  {message.role === 'user' ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-brand-primary text-white rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md'
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Sources
                      </summary>
                      <ul className="mt-1 ml-4 list-disc text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        {message.citations.map((citation, i) => (
                          <li key={i}>{citation}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.content)} aria-label="Copy message">
                      <Copy className="h-3 w-3" />
                    </Button>
                    {message.role === 'assistant' && (
                      <>
                        <Button variant="ghost" size="sm" aria-label="Helpful">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label="Not helpful">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 animate-in slide-up">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                ref={(el) => el?.focus()}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('placeholder')}
                disabled={isLoading}
                className="flex-1"
                aria-label="Message"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                isLoading={isLoading}
                aria-label="Send message"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">{t('disclaimer')}</p>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}