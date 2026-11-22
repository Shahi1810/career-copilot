import { useState } from 'react';
import { Sidebar, Header } from './components/layout';
import { ChatWindow } from './components/chat';
import { useChat } from './hooks/useChat';
import type { ActiveTab } from './types/chat';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const { messages, isLoading, sendMessage, clearChat } = useChat();

  const renderPlaceholder = (title: string, description: string, milestone: string) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1f2028] border border-[#252730] flex items-center justify-center text-3xl mb-6">
        🚧
      </div>
      <h2 className="text-[22px] font-bold text-[#f1f4fb] mb-2">{title}</h2>
      <p className="text-[13.5px] text-[#a0a4b0] max-w-md mb-6">{description}</p>
      <span className="px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-mono">
        {milestone}
      </span>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0e13]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClearChat={clearChat}
        messageCount={messages.length}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          onMenuClick={() => {
            const sidebarEl = document.querySelector('.sidebar-container');
            if (sidebarEl) sidebarEl.classList.toggle('-translate-x-full');
          }}
          title={
            activeTab === 'chat'
              ? 'AI Assistant'
              : activeTab === 'applications'
              ? 'Applications'
              : activeTab === 'jobs'
              ? 'Job Explorer'
              : 'Study Notes'
          }
          subtitle={
            activeTab === 'chat'
              ? 'RAG-powered Chat Interface'
              : activeTab === 'applications'
              ? 'Application Tracker'
              : activeTab === 'jobs'
              ? 'Live Job Search'
              : 'Knowledge Base'
          }
        />

        {activeTab === 'chat' ? (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
            onClear={clearChat}
          />
        ) : activeTab === 'applications' ? (
          renderPlaceholder(
            'Application Tracker',
            'Track your job applications and statuses here using the MCP server tool.',
            'Upcoming in Milestone M3'
          )
        ) : activeTab === 'jobs' ? (
          renderPlaceholder(
            'Live Job Explorer',
            'Search live job postings from RemoteOK / Arbeitnow via MCP tools.',
            'Upcoming in Milestone M6'
          )
        ) : (
          renderPlaceholder(
            'Study Notes Knowledge Base',
            'Browse and query your ingested study notes and resume passages.',
            'Connected to Qdrant RAG Pipeline'
          )
        )}
      </main>
    </div>
  );
}

export default App;
