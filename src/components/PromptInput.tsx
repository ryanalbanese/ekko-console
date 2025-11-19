import { useState } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
  InputGroupButton,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { IconAt, IconPaperclip, IconWorld, IconArrowUp } from '@tabler/icons-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function PromptInput({
  value,
  onChange,
  onSend,
  onAttach,
  placeholder = 'Ask, search, or make anything...',
  disabled = false,
  id = 'notion-prompt',
}: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor={id} className="sr-only">
        Prompt
      </FieldLabel>
      <InputGroup>
        <InputGroupTextarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="field-sizing-content min-h-16 w-full px-3 text-base md:text-sm"
        />
        <InputGroupAddon align="block-start">
          <InputGroupButton
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-transform"
          >
            <IconAt className="size-4" />
            Add context
          </InputGroupButton>
          <div className="no-scrollbar -m-1.5 flex gap-1 overflow-y-auto p-1.5"></div>
        </InputGroupAddon>
        <InputGroupAddon align="block-end">
          {onAttach && (
            <InputGroupButton
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={onAttach}
              className="rounded-full"
              aria-label="Attach file"
            >
              <IconPaperclip className="size-4" />
            </InputGroupButton>
          )}
          <InputGroupButton
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
          >
            Auto
          </InputGroupButton>
          <InputGroupButton
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
          >
            <IconWorld className="size-4" />
            All Sources
          </InputGroupButton>
          <Button
            type="button"
            size="icon"
            variant="default"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="ml-auto size-8 rounded-full p-0"
            aria-label="Send"
          >
            <IconArrowUp className="size-4" />
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

