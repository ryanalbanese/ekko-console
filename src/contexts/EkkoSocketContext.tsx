import { createContext, useContext, ReactNode } from 'react';
import { useEkkoSocket } from '@/hooks/useEkkoSocket';
import type { UseEkkoSocketReturn } from '@/hooks/useEkkoSocket';

const EkkoSocketContext = createContext<UseEkkoSocketReturn | null>(null);

export function EkkoSocketProvider({ children }: { children: ReactNode }) {
  const socketData = useEkkoSocket();
  
  return (
    <EkkoSocketContext.Provider value={socketData}>
      {children}
    </EkkoSocketContext.Provider>
  );
}

export function useEkkoSocketContext(): UseEkkoSocketReturn {
  const context = useContext(EkkoSocketContext);
  if (!context) {
    throw new Error('useEkkoSocketContext must be used within EkkoSocketProvider');
  }
  return context;
}

