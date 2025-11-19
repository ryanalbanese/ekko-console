import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ConnectionStatus } from './ConnectionStatus';
import { getIdentityLabel, isDemoMode, setIdentityLabel } from '@/utils/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  isConnected: boolean;
}

export function ChatHeader({ isConnected }: ChatHeaderProps) {
  const [identityLabel, setIdentityLabelState] = useState(getIdentityLabel());
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );
  const demoMode = isDemoMode();

  useEffect(() => {
    // Update identity label if it changes
    const interval = setInterval(() => {
      setIdentityLabelState(getIdentityLabel());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleIdentityChange = (label: string) => {
    if (!demoMode) {
      setIdentityLabel(label);
      setIdentityLabelState(label);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Ekko Router Demo</h1>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionStatus isConnected={isConnected} />
          {demoMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {identityLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleIdentityChange('Ryan')}>
                  Ryan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleIdentityChange('Mike')}>
                  Mike
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

