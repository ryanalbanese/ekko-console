interface TypingIndicatorProps {
  userName?: string;
}

export function TypingIndicator({ userName = 'Someone' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start px-4 py-2">
      <div className="bg-muted rounded-2xl px-4 py-2.5 max-w-[70%]">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{userName} is typing</span>
          <div className="flex gap-1">
            <div
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

