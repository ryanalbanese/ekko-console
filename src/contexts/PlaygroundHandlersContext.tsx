import { createContext, useContext, ReactNode } from 'react';
import type { PlaygroundHandlers } from '@/hooks/useMessageEventHandler';

const PlaygroundHandlersContext = createContext<PlaygroundHandlers | null>(null);

export function PlaygroundHandlersProvider({ 
  handlers, 
  children 
}: { 
  handlers: PlaygroundHandlers | null; 
  children: ReactNode;
}) {
  return (
    <PlaygroundHandlersContext.Provider value={handlers}>
      {children}
    </PlaygroundHandlersContext.Provider>
  );
}

export function usePlaygroundHandlersContext(): PlaygroundHandlers | null {
  return useContext(PlaygroundHandlersContext);
}

