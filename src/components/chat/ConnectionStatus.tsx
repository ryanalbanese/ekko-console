import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <Badge
      variant={isConnected ? 'default' : 'destructive'}
      className="gap-1.5"
    >
      <Circle
        className={`h-2 w-2 fill-current ${
          isConnected ? 'text-green-500' : 'text-red-500'
        }`}
      />
      {isConnected ? 'Connected' : 'Disconnected'}
    </Badge>
  );
}

