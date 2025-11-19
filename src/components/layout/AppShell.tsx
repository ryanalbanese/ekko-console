import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarComponent } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <SidebarComponent />
      <SidebarInset className="flex flex-col h-screen">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

