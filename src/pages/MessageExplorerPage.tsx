import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageDetailDialog } from '@/components/explorer/MessageDetailDialog';
import {
  getStoredMessages,
  clearStoredMessages,
  updateMessageStatus,
} from '@/utils/messageStorage';
import { getMessageById } from '@/utils/apiClient';
import type { StoredMessage } from '@/types/api';
import { RefreshCw, Trash2, Copy, ArrowUpDown, Clock, Send, CheckCircle2, XCircle, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SortField = 'timestamp' | 'status';
type SortDirection = 'asc' | 'desc';

export function MessageExplorerPage() {
  const { messageId: urlMessageId } = useParams<{ messageId?: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  // Listen for custom events when messages are updated
  useEffect(() => {
    const handleMessagesUpdated = () => {
      loadMessages();
    };

    window.addEventListener('ekko:messages-updated', handleMessagesUpdated);
    return () => {
      window.removeEventListener('ekko:messages-updated', handleMessagesUpdated);
    };
  }, []);

  // Handle URL messageId parameter - sync selectedMessageId with URL
  useEffect(() => {
    if (urlMessageId) {
      // URL has a messageId - try to find and select it
      if (messages.length > 0) {
        const message = messages.find((msg) => msg.messageId === urlMessageId);
        if (message) {
          // Message found, select it if not already selected
          if (selectedMessageId !== urlMessageId) {
            setSelectedMessageId(urlMessageId);
          }
        } else {
          // Message not found in current list, clear selection and navigate back
          if (selectedMessageId === urlMessageId) {
            setSelectedMessageId(null);
            navigate('/messages', { replace: true });
          }
        }
      }
      // If messages.length === 0, wait for messages to load (effect will run again)
    } else {
      // URL doesn't have messageId - clear selection if it exists
      if (selectedMessageId) {
        setSelectedMessageId(null);
      }
    }
  }, [urlMessageId, messages, selectedMessageId, navigate]);

  const loadMessages = () => {
    const stored = getStoredMessages();
    setMessages(stored);
  };

  const handleRefreshStatuses = async () => {
    setIsRefreshing(true);
    try {
      const refreshPromises = messages.map(async (msg) => {
        try {
          const statusData = await getMessageById(msg.messageId);
          if (statusData && typeof statusData === 'object' && 'status' in statusData) {
            const status = statusData.status as string;
            if (['queued', 'sent', 'delivered', 'failed'].includes(status)) {
              updateMessageStatus(msg.messageId, status as any);
            }
          }
        } catch (error) {
          console.error(`Failed to refresh status for ${msg.messageId}:`, error);
        }
      });
      await Promise.all(refreshPromises);
      loadMessages();
    } catch (error) {
      console.error('Failed to refresh statuses:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearLog = () => {
    if (confirm('Are you sure you want to clear all stored messages? This cannot be undone.')) {
      clearStoredMessages();
      setMessages([]);
      setSelectedMessageId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedMessages = useMemo(() => {
    const sorted = [...messages];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortField === 'status') {
        const statusA = a.lastKnownStatus || '';
        const statusB = b.lastKnownStatus || '';
        comparison = statusA.localeCompare(statusB);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [messages, sortField, sortDirection]);

  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'queued':
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          label: 'Queued',
        };
      case 'sent':
        return {
          icon: Send,
          color: 'text-foreground',
          bgColor: 'bg-foreground',
          label: 'Sent',
        };
      case 'delivered':
        return {
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-600 dark:bg-green-400',
          label: 'Delivered',
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-600 dark:bg-red-400',
          label: 'Failed',
        };
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          label: 'Unknown',
        };
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const shortenId = (id: string, length: number = 20) => {
    if (id.length <= length) return id;
    return `${id.substring(0, length)}...`;
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const headerContent = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/messages">Message Explorer</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>View message logs and details</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AppLayout headerContent={headerContent}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Message Explorer</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  View and manage messages sent from this console
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshStatuses}
                  disabled={isRefreshing || messages.length === 0}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Statuses
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLog}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Log
                </Button>
              </div>
            </div>

            {messages.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No messages logged yet</CardTitle>
                  <CardDescription>
                    Send a message from the Playground, Postman, or a webhook to see it appear
                    here.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Messages ({messages.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 -ml-2"
                            onClick={() => handleSort('timestamp')}
                          >
                            Timestamp
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Message ID</TableHead>
                        <TableHead>Conversation ID</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 -ml-2"
                            onClick={() => handleSort('status')}
                          >
                            Status
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMessages.map((message) => (
                        <TableRow
                          key={message.messageId}
                          className="cursor-pointer"
                          onClick={() => {
                            navigate(`/messages/${encodeURIComponent(message.messageId)}`);
                          }}
                        >
                          <TableCell className="font-mono text-xs">
                            {formatTimestamp(message.timestamp)}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-xs truncate max-w-[200px]">
                                      {message.messageId}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(message.messageId, message.messageId);
                                      }}
                                    >
                                      {copiedMessageId === message.messageId ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-lg">
                                  <p className="font-mono text-xs break-all whitespace-normal">
                                    {message.messageId}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-mono text-xs truncate block max-w-[200px]">
                                    {message.conversationId}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  <p className="font-mono text-xs break-all whitespace-normal">
                                    {message.conversationId}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const config = getStatusConfig(message.lastKnownStatus);
                              const Icon = config.icon;
                              return (
                                <div className="flex items-center gap-1.5">
                                  <Icon className={`h-3 w-3 ${config.color}`} />
                                  <span className={`text-xs ${config.color}`}>{config.label}</span>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{message.chosenChannel}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{message.source || 'playground'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {selectedMessageId && (
        <MessageDetailDialog
          messageId={selectedMessageId}
          open={!!selectedMessageId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMessageId(null);
              navigate('/messages', { replace: true });
            }
          }}
        />
      )}
    </AppLayout>
  );
}

