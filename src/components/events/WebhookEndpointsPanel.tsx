import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Empty } from '@/components/ui/empty';
import { getWebhookEndpoints } from '@/utils/apiClient';
import { CreateEndpointDialog } from './CreateEndpointDialog';
import { DeleteEndpointDialog } from './DeleteEndpointDialog';
import { TestEventDialog } from './TestEventDialog';
import type { WebhookEndpoint } from '@/types/api';
import { Plus, Send, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ALL_MESSAGE_EVENTS = [
  'message.queued',
  'message.sent',
  'message.delivered',
  'message.failed',
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatus(endpoint: WebhookEndpoint): 'active' | 'disabled' {
  const expiresAt = new Date(endpoint.expiresAt);
  return expiresAt > new Date() ? 'active' : 'disabled';
}

function getEventsDisplayText(eventTypes: string[]): { text: string; tooltip?: string } {
  const hasAllEvents = ALL_MESSAGE_EVENTS.every((event) => eventTypes.includes(event));
  
  if (hasAllEvents && eventTypes.length === ALL_MESSAGE_EVENTS.length) {
    return { text: 'All message events (message.*)' };
  }
  
  return {
    text: `${eventTypes.length} event${eventTypes.length !== 1 ? 's' : ''}`,
    tooltip: eventTypes.join(', '),
  };
}

function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

interface WebhookEndpointsPanelProps {
  onTestEventSent?: (eventType: string) => void;
}

export function WebhookEndpointsPanel({ onTestEventSent }: WebhookEndpointsPanelProps = {}) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);

  const fetchEndpoints = async () => {
    try {
      setIsLoading(true);
      const data = await getWebhookEndpoints();
      setEndpoints(data);
    } catch (error: any) {
      console.error('Failed to fetch webhook endpoints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const handleCreateSuccess = () => {
    fetchEndpoints();
  };

  const handleDeleteSuccess = () => {
    fetchEndpoints();
    setSelectedEndpoint(null);
  };

  const handleTestClick = (endpoint: WebhookEndpoint) => {
    setSelectedEndpoint(endpoint);
    setTestDialogOpen(true);
  };

  const handleDeleteClick = (endpoint: WebhookEndpoint) => {
    setSelectedEndpoint(endpoint);
    setDeleteDialogOpen(true);
  };

  const handleTestFromHeader = () => {
    setSelectedEndpoint(null);
    setTestDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>Manage webhook destinations for Ekko events</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestFromHeader}
                disabled={endpoints.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Send test event
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add endpoint
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : endpoints.length === 0 ? (
            <Empty
              title="No webhook endpoints configured"
              description="Add an endpoint to start receiving Ekko events via HTTP."
              action={{
                label: 'Add endpoint',
                onClick: () => setCreateDialogOpen(true),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => {
                  const status = getStatus(endpoint);
                  const eventsDisplay = getEventsDisplayText(endpoint.eventTypes);
                  
                  return (
                    <TableRow key={endpoint.id}>
                      <TableCell>
                        <a
                          href={endpoint.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm hover:underline"
                        >
                          {truncateUrl(endpoint.url)}
                        </a>
                      </TableCell>
                      <TableCell>
                        {eventsDisplay.tooltip ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm cursor-help">
                                  {eventsDisplay.text}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{eventsDisplay.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-sm">{eventsDisplay.text}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status === 'active' ? 'default' : 'secondary'}
                          className={
                            status === 'active'
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                              : ''
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(endpoint.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestClick(endpoint)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(endpoint)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateEndpointDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <DeleteEndpointDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        endpoint={selectedEndpoint}
        onSuccess={handleDeleteSuccess}
      />

      <TestEventDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        endpoint={selectedEndpoint}
        endpoints={endpoints}
        onTestEventSent={onTestEventSent}
      />
    </>
  );
}

