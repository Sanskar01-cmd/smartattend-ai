import React, { useState } from 'react';
import { queryAiAssistantApi } from '../services/api';
import { Badge } from '../components/Badge';
import { BotIcon, SparklesIcon, SendIcon, RefreshIcon } from '../components/Icons';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: "Hello! I am your SmartAttend AI Assistant. I can help answer questions regarding campus event schedules, venue locations, workshop prerequisites, and your QR attendance passes. How may I assist you today?",
    timestamp: "10:30 AM",
  },
];

const SUGGESTED_PROMPTS = [
  "What workshops and events are scheduled this week?",
  "How does QR-only attendance verification work?",
  "Where is APJ Abdul Kalam Auditorium located?",
  "When do I receive my workshop certificate?",
];

export const AIAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const res = await queryAiAssistantApi(text.trim());
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Fallback response if network is degraded
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: "SmartAttend AI enforces a strictly QR-code attendance protocol. Head over to 'Browse Events' to register, and your dynamic QR pass will appear in 'My QR Passes' ready for door scanning.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AI Event Assistant
            </h1>
            <Badge variant="primary" size="sm">LIVE DJANGO AI</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Natural language conversational assistant for campus event FAQs, venue maps, and QR ticketing guidance.
          </p>
        </div>

        <Badge variant="info">
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Context-Aware Intelligence</span>
        </Badge>
      </div>

      {/* Suggested Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
          Suggested Queries
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col h-[480px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <BotIcon className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-brand-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  U
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
                <BotIcon className="w-4 h-4 animate-pulse" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
                <RefreshIcon className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>SmartAttend Assistant is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about workshop schedules, venues, or QR passes..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-glow-sm transition-all flex items-center gap-1.5"
          >
            <SendIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
