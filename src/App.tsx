import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { isDemoMode, hasToken, onTokenChange, getCurrentToken } from './utils/auth';
import { ApiKeyLogin } from './components/ApiKeyLogin';
import { AppLayout } from './components/layout/AppLayout';
import { SidebarDashboard } from '@/samples/SidebarDashboard';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { MessageExplorerPage } from './pages/MessageExplorerPage';
import { EventsPage } from './pages/EventsPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { DocsPage } from './pages/DocsPage';
import { Toaster } from '@/components/ui/sonner';
import { useMessageEventHandler } from './hooks/useMessageEventHandler';

// Component that mounts the message event handler at top level
// This handles messageStorage updates even when not on playground page
function MessageEventHandler() {
  useMessageEventHandler();
  return null;
}

function App() {
  const [showLogin, setShowLogin] = useState(false);

  // Check auth state
  useEffect(() => {
    const checkAuth = () => {
      const demo = isDemoMode();
      const token = getCurrentToken();
      
      // If we have a token but it's invalid format, clear it
      if (token && !token.startsWith('ekko_')) {
        console.warn('Invalid token format detected. Clearing and showing login.');
        if (!demo) {
          localStorage.removeItem('ekkoApiKey');
          localStorage.removeItem('ekkoIdentityLabel');
        }
        setShowLogin(true);
        return;
      }
      
      const hasAuth = hasToken();
      setShowLogin(!demo && !hasAuth);
    };

    checkAuth();

    // Listen for token changes
    const unsubscribe = onTokenChange(() => {
      checkAuth();
    });

    return unsubscribe;
  }, []);

  if (showLogin) {
    return <ApiKeyLogin />;
  }

  return (
    <>
      {/* Mount message event handler once at top level */}
      <MessageEventHandler />
      <Routes>
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/messages/:messageId" element={<MessageExplorerPage />} />
        <Route path="/messages" element={<MessageExplorerPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/channels" element={<ChannelsPage />} />
        <Route path="/api-keys" element={<ApiKeysPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="*" element={
          <AppLayout>
            <SidebarDashboard />
          </AppLayout>
        } />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
