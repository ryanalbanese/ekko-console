import { useState, useEffect } from 'react';
import { isDemoMode, hasToken, onTokenChange } from './utils/auth';
import { ApiKeyLogin } from './components/ApiKeyLogin';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { MessageInspector } from './components/MessageInspector';
import { useEkkoSocket } from './hooks/useEkkoSocket';
import { useConversation } from './hooks/useConversation';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const { isConnected, events } = useEkkoSocket();
  const { messages, addMessage, conversationId } = useConversation({ events });

  // Check auth state
  useEffect(() => {
    const checkAuth = () => {
      const demo = isDemoMode();
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

  // Handle typing indicators
  useEffect(() => {
    const typingEvents = events.filter(
      (e) => e.type === 'typing.started' || e.type === 'typing.stopped'
    );

    if (typingEvents.length > 0) {
      const lastEvent = typingEvents[typingEvents.length - 1];
      if (lastEvent.type === 'typing.started') {
        // In a real app, you'd identify the user from the event
        // For now, we'll just show "Someone"
        setTypingUser('Someone');
      } else {
        setTypingUser(null);
      }
    }
  }, [events]);

  // Clear typing indicator after timeout
  useEffect(() => {
    if (typingUser) {
      const timeout = setTimeout(() => {
        setTypingUser(null);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [typingUser]);

  if (showLogin) {
    return <ApiKeyLogin />;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <ChatHeader isConnected={isConnected} />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList messages={messages} typingUser={typingUser} />
          <MessageInput addMessage={addMessage} conversationId={conversationId} />
        </div>
        <MessageInspector messages={messages} />
      </div>
    </div>
  );
}

export default App;

