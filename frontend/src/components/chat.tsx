import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Copy, Check, BookOpen, ExternalLink, Terminal, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import type { Message, SourceChunk } from '../types/chat';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
}

function SourceCitation({ source }: { source: SourceChunk }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sourceLabel = source.source
    .replace(/\.(md|txt|pdf)$/i, '')
    .split(/[\\/]/)
    .pop()
    ?.replace(/[-_]/g, ' ');

  return (
    <div className="bg-[#16171d] border border-[#252730] rounded-lg overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#1f2028]/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-[#f1f4fb] truncate">
              {sourceLabel}
            </div>
            <div className="text-[10px] text-[#646876] font-mono mt-0.5">
              Chunk #{source.chunkIndex}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {(source.score * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#646876]">{isExpanded ? '−' : '+'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 py-2.5 bg-[#0d0e13] border-t border-[#252730]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider font-mono text-[#646876]">
              Vector Retrieval Info
            </span>
            <div className="flex items-center gap-1.5">
              <Copy
                size={11}
                className="text-[#646876] hover:text-purple-400 cursor-pointer transition-colors"
                onClick={() => navigator.clipboard.writeText(`${sourceLabel} (chunk ${source.chunkIndex})`)}
              />
            </div>
          </div>
          <p className="text-[12px] leading-relaxed text-[#a0a4b0] font-mono">
            Retrieved from <span className="text-purple-300">{source.source}</span> at index <span className="text-purple-300">{source.chunkIndex}</span> with cosine similarity <span className="text-emerald-300">{source.score.toFixed(4)}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
function MessageItem({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm border ${
        isUser
          ? 'bg-[#1f2028] border-[#252730] text-[#a0a4b0]'
          : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[85%] min-w-[120px] rounded-2xl px-4 py-3.5 border ${
        isUser
          ? 'bg-[#1f2028] border-[#252730] text-[#f1f4fb] rounded-tr-sm'
          : msg.error
          ? 'bg-red-500/5 border-red-500/30 text-red-200 rounded-tl-sm'
          : 'bg-[#16171d] border-[#252730] text-[#f1f4fb] rounded-tl-sm'
      }`}>
        <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#252730] space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-[#646876] mb-2">
              <ExternalLink className="w-3 h-3" />
              <span>RAG Sources ({msg.sources.length})</span>
            </div>
            {msg.sources.map((src, i) => (
              <SourceCitation key={i} source={src} />
            ))}
          </div>
        )}

        <div className={`flex items-center justify-between mt-2.5 pt-2 border-t border-[#252730]/60 text-[10px] font-mono text-[#646876] ${isUser ? 'justify-end' : ''}`}>
          <span>{msg.timestamp}</span>
          <button
            onClick={handleCopy}
            className="p-1 -m-1 text-[#646876] hover:text-purple-400 transition-colors"
            title="Copy message"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyChat({ onQuickAction }: { onQuickAction: (text: string) => void }) {
  const suggestions = [
    { icon: '📚', label: 'Study Notes', prompt: 'What are my key study notes on system design?' },
    { icon: '📄', label: 'Resume Review', prompt: 'Summarize my professional experience from my resume.' },
    { icon: '💡', label: 'Career Advice', prompt: 'What career advice do I have on preparing for job interviews?' },
    { icon: '🔍', label: 'Project Insights', prompt: 'Explain the architecture decisions in my recent notes.' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center flex flex-col justify-center min-h-[420px]">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-purple-500/20 mx-auto mb-6">
        C
      </div>
      <h2 className="text-[24px] font-bold text-[#f1f4fb] tracking-tight mb-3">
        Your AI Career Copilot
      </h2>
      <p className="text-[13.5px] text-[#a0a4b0] leading-relaxed max-w-md mx-auto mb-8">
        Ask any question about your study notes, resume, and career preparation. 
        Powered by Retrieval-Augmented Generation (RAG) with real-time vector search.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onQuickAction(s.prompt)}
            className="p-4 rounded-xl bg-[#16171d] border border-[#252730] hover:border-purple-500/40 hover:bg-[#1f2028] transition-all duration-200 group"
          >
            <div className="text-xl mb-2 group-hover:scale-110 transition-transform inline-block">
              {s.icon}
            </div>
            <div className="text-[13px] font-medium text-[#f1f4fb] mb-1">
              {s.label}
            </div>
            <div className="text-[11px] text-[#646876] line-clamp-1">
              {s.prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatWindow({ messages, isLoading, onSend, onClear }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0e13] overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 border-b border-[#252730] px-4 md:px-6 flex items-center justify-between flex-shrink-0 bg-[#0d0e13]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-[12px] font-mono text-[#a0a4b0] font-medium">
            Chat Session <span className="text-[#646876]">/</span> RAG Query Interface
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#16171d] border border-[#252730] hover:border-red-500/30 hover:text-red-400 text-[#646876] transition-colors text-[11px] font-mono"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        {messages.length === 0 && !isLoading ? (
          <EmptyChat onQuickAction={onSend} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <MessageItem key={msg.id} msg={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm border bg-purple-500/10 border-purple-500/30 text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#16171d] border border-[#252730] rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-5 text-purple-400 animate-spin" />
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 typing-dot" />
                  </div>
                  <span className="text-[12px] text-[#a0a4b0] ml-1.5">Searching notes & thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-[#252730] p-4 bg-[#0d0e13]">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSend}
            className="relative flex items-center gap-3 bg-[#16171d] border border-[#252730] hover:border-[#3c404d] focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 rounded-xl px-4 py-3 transition-all shadow-lg"
          >
            <Terminal className="w-4 h-4 text-[#646876] flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your notes, resume, or study prep..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-[#f1f4fb] placeholder-[#646876] font-sans disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-[#252730] disabled:text-[#646876] text-white transition-colors flex-shrink-0"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between mt-2.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-[#646876]">
                Qdrant Connected <span className="mx-1 text-[#252730]">•</span> Gemini RAG Active
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#646876]">
              Enter ↵ to send
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}