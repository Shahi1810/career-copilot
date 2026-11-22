import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { ActiveTab } from '../types/chat';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onClearChat: () => void;
  messageCount?: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onClearChat: _onClearChat,
  messageCount: _messageCount,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; subtitle: string }[] = [
    { id: 'chat', label: 'AI Assistant', subtitle: 'RAG-powered Chat' },
    { id: 'applications', label: 'Applications', subtitle: 'Track your journey' },
    { id: 'jobs', label: 'Job Explorer', subtitle: 'Live job search' },
    { id: 'notes', label: 'Study Notes', subtitle: 'Knowledge base' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 pointer-events-auto lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <div className={`w-full max-w-[280px] bg-[#16171d] border-r border-[#252730] h-full flex flex-col p-5 z-50 flex-shrink-0 pointer-events-auto transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand Logo & Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-purple-500/20">
              C
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-[#f1f4fb] leading-tight tracking-tight">
                Career<span className="text-purple-400">Copilot</span>
              </h1>
              <span className="text-[10px] uppercase tracking-widest font-mono text-[#646876] block mt-0.5">
                AI Agent Stack
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-[#a0a4b0] hover:text-white"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Tabs */}
        <div className="space-y-1.5 mb-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 shadow-sm'
                  : 'bg-transparent border-transparent text-[#a0a4b0] hover:bg-[#1f2028] hover:border-[#252730] hover:text-[#f1f4fb]'
              }`}
            >
              <span className="text-[13px] font-medium block leading-none">
                {item.label}
              </span>
              <span className="text-[11px] text-[#646876] block mt-1.5 leading-none">
                {item.subtitle}
              </span>
            </button>
          ))}
        </div>

        {/* System Status Card */}
        <div className="mt-auto bg-[#0d0e13] border border-[#252730] rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#646876] font-medium">
              System Status
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#a0a4b0]">Qdrant Vector DB</span>
              <span className="text-emerald-400 font-mono text-[10px]">ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#a0a4b0]">LLM Gateway (M1)</span>
              <span className="text-emerald-400 font-mono text-[10px]">READY</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#a0a4b0]">MCP Server (M3)</span>
              <span className="text-[#646876] font-mono text-[10px]">PENDING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ onMenuClick, title, subtitle }: { onMenuClick: () => void; title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-[#0d0e13]/80 backdrop-blur-md border-b border-[#252730] flex items-center justify-between px-4 md:px-6 z-30 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 rounded-lg text-[#a0a4b0] hover:text-white hover:bg-[#1f2028] transition-colors"
          title="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-[15px] font-semibold text-[#f1f4fb] leading-tight">
            {title}
          </h2>
          {subtitle && <span className="text-[11px] text-[#646876]">{subtitle}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 px-2.5 py-1 bg-purple-500/5 border border-purple-500/20 rounded-md">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-[10px] font-mono text-purple-300 font-medium">
          RAG Pipeline Active
        </span>
      </div>
    </header>
  );
}