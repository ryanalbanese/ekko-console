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
import { deleteWebhookEndpoint } from '@/utils/apiClient';
import { toast } from 'sonner';
import type { WebhookEndpoint } from '@/types/api';

interface DeleteEndpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: WebhookEndpoint | null;
  onSuccess: () => void;
}

export function DeleteEndpointDialog({
  open,
  onOpenChange,
  endpoint,
  onSuccess,
}: DeleteEndpointDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!endpoint) return;

    try {
      setIsDeleting(true);
      await deleteWebhookEndpoint(endpoint.id);
      toast.success('Webhook endpoint deleted successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to delete webhook endpoint:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete webhook endpoint');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!endpoint) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Webhook Endpoint</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this webhook endpoint? This will stop Ekko from sending events to{' '}
            <span className="font-mono text-sm">{endpoint.url}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

