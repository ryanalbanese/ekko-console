import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { testWebhook } from '@/utils/apiClient';
import { toast } from 'sonner';
import type { WebhookEndpoint } from '@/types/api';

interface TestEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: WebhookEndpoint | null;
  endpoints: WebhookEndpoint[];
  onTestEventSent?: (eventType: string) => void;
}

const EVENT_TYPES = [
  { value: 'message.queued', label: 'message.queued' },
  { value: 'message.sent', label: 'message.sent' },
  { value: 'message.delivered', label: 'message.delivered' },
  { value: 'message.failed', label: 'message.failed' },
];

export function TestEventDialog({
  open,
  onOpenChange,
  endpoint: preselectedEndpoint,
  endpoints,
  onTestEventSent,
}: TestEventDialogProps) {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(
    preselectedEndpoint?.id || ''
  );

  // Update selectedEndpointId when preselectedEndpoint changes
  useEffect(() => {
    if (preselectedEndpoint) {
      setSelectedEndpointId(preselectedEndpoint.id);
    }
  }, [preselectedEndpoint]);
  const [eventType, setEventType] = useState<string>('message.sent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEndpointId) {
      toast.error('Please select an endpoint');
      return;
    }

    try {
      setIsSubmitting(true);
      await testWebhook(selectedEndpointId, eventType);
      toast.success('Test event sent successfully');
      onTestEventSent?.(eventType);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to send test event:', error);
      toast.error(error?.response?.data?.message || 'Failed to send test event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send Test Event</DialogTitle>
            <DialogDescription>
              Send a test webhook event to verify your endpoint configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!preselectedEndpoint && (
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Select
                  value={selectedEndpointId}
                  onValueChange={setSelectedEndpointId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="endpoint">
                    <SelectValue placeholder="Select an endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map((endpoint) => (
                      <SelectItem key={endpoint.id} value={endpoint.id}>
                        {endpoint.url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {preselectedEndpoint && (
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <div className="p-2 rounded-md bg-muted text-sm font-mono">
                  {preselectedEndpoint.url}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select
                value={eventType}
                onValueChange={setEventType}
                disabled={isSubmitting}
              >
                <SelectTrigger id="event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={isSubmitting || !selectedEndpointId}>
              {isSubmitting ? 'Sending...' : 'Send Test Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

