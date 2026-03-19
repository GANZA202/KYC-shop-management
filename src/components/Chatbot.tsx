import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const SYSTEM_INSTRUCTION = `
You are a KYC (Know Your Customer) Assistant for the KYC SHOP management system.
Your goal is to explain how KYC works in this specific application.

Key Information about KYC in this app:
1. Purpose: To verify the identity of workers before they can be assigned to sectors, mark attendance, or receive credit/loans.
2. Registration: Workers must be registered with their Full Name, 16-digit National ID, and Phone Number.
3. Roles:
   - Supervisors: Register and manage their assigned workers. They mark daily attendance.
   - Team Leaders: Oversee a specific Sector. They verify attendance and payroll for their sector.
   - Admins/Accountants: Manage the entire system, products, and approve large credit requests.
4. Credit System: Workers can request credit for shop items. The system checks their KYC status and attendance history before approval.
5. Payroll: KYC ensures that payments are made to the correct verified individuals.

Always be helpful, professional, and concise. If asked about things outside of KYC or this shop system, politely redirect the user.
You can speak English, French, and Kinyarwanda.
`;

export function Chatbot() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: t('Chatbot Description') }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        },
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
      });

      const result = await chat.sendMessage({ message: userMessage });
      const text = result.text;

      setMessages(prev => [...prev, { role: 'bot', text }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95"
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 flex h-[500px] max-h-[calc(100vh-120px)] w-[calc(100vw-32px)] sm:w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-stone-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-emerald-600 p-4 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">{t('KYC Chatbot')}</h3>
                  <span className="text-[10px] text-emerald-100">Online Assistant</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm shadow-sm",
                      m.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-white text-stone-800 border border-stone-200 rounded-tl-none"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex mr-auto items-start">
                  <div className="bg-white text-stone-400 border border-stone-200 rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-stone-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('Type a message')}
                  className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
