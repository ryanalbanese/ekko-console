import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createWebhookEndpoint } from '@/utils/apiClient';
import { toast } from 'sonner';

interface CreateEndpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ALL_MESSAGE_EVENTS = [
  'message.queued',
  'message.sent',
  'message.delivered',
  'message.failed',
];

export function CreateEndpointDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateEndpointDialogProps) {
  const [url, setUrl] = useState('');
  const [eventSelection, setEventSelection] = useState<'all' | 'custom'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('URL is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createWebhookEndpoint({
        url: url.trim(),
        eventTypes: eventSelection === 'all' ? ALL_MESSAGE_EVENTS : [],
      });
      
      toast.success('Webhook endpoint created successfully');
      setUrl('');
      setEventSelection('all');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create webhook endpoint:', error);
      toast.error(error?.response?.data?.message || 'Failed to create webhook endpoint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Configure a new webhook endpoint to receive Ekko events via HTTP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/webhooks/ekko"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <RadioGroup
                value={eventSelection}
                onValueChange={(value) => setEventSelection(value as 'all' | 'custom')}
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal cursor-pointer">
                    All message events (message.*)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" disabled />
                  <Label htmlFor="custom" className="font-normal text-muted-foreground cursor-not-allowed">
                    Custom (coming soon)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Endpoint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}






