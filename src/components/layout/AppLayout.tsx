import { ReactNode } from 'react';
import { AppSidebar } from '@/samples/AppSidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface AppLayoutProps {
  children: ReactNode;
  headerContent?: ReactNode;
  headerActions?: ReactNode;
}

export function AppLayout({ children, headerContent, headerActions }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          {headerActions}
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          {headerContent}
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}



