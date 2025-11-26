import { useState, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (recipientAddress: string, label?: string) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreate,
}: NewConversationDialogProps) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedRecipient = recipientAddress.trim();
    if (!trimmedRecipient) {
      setError('Recipient address is required');
      return;
    }

    onCreate(trimmedRecipient, label.trim() || undefined);
    setRecipientAddress('');
    setLabel('');
    setError(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setRecipientAddress('');
    setLabel('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Create a new conversation with a recipient.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="recipient">Who are you sending to? *</Label>
              <Input
                id="recipient"
                type="text"
                value={recipientAddress}
                onChange={(e) => {
                  setRecipientAddress(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., user@example.com, +1234567890, user@domain.com/resource"
                required
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Customer Support, John Doe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Create conversation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



