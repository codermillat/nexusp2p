import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage, ConnectionStatus } from '../types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  status: ConnectionStatus;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, status }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const isConnected = status === ConnectionStatus.CONNECTED;

  return (
    <div className="flex flex-col h-full bg-slate-800/50 backdrop-blur-md border-l border-white/10 w-full md:w-80 lg:w-96 absolute md:relative z-20 md:z-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-white">Chat</h3>
        {isConnected && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                Live
            </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm italic">
            <p>No messages yet.</p>
            {isConnected && <p>Say hello!</p>}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'me' ? 'items-end' : msg.sender === 'system' ? 'items-center' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender === 'me'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : msg.sender === 'system'
                    ? 'bg-transparent text-slate-400 text-xs py-1'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-slate-900/50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected}
            placeholder={isConnected ? "Type a message..." : "Connect to chat"}
            className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-0 transition-all focus:outline-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;