import { useState, useEffect } from 'react';
import { Copy, X, Clock, Send, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getMessageById, getMessageContentById } from '@/utils/apiClient';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageDetailDialogProps {
  messageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageDetailDialog({
  messageId,
  open,
  onOpenChange,
}: MessageDetailDialogProps) {
  const [statusData, setStatusData] = useState<any>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && messageId) {
      setIsLoading(true);
      setError(null);
      setStatusData(null);
      setContentData(null);

      Promise.all([
        getMessageById(messageId).catch((err) => {
          console.error('Failed to fetch message status:', err);
          return null;
        }),
        getMessageContentById(messageId).catch((err) => {
          console.error('Failed to fetch message content:', err);
          return null;
        }),
      ])
        .then(([status, content]) => {
          setStatusData(status);
          setContentData(content);
          if (!status && !content) {
            setError('Failed to retrieve message data');
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch message');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, messageId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2">
                <span className="truncate font-mono text-sm">{messageId}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(messageId)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                {statusData && (() => {
                  const config = getStatusConfig(statusData.status);
                  const Icon = config.icon;
                  return (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        <span className={`text-xs ${config.color}`}>{config.label}</span>
                      </div>
                      {contentData?.direction && (
                        <>
                          <span>•</span>
                          <span className="text-xs">{contentData.direction}</span>
                        </>
                      )}
                      {statusData.chosenChannel && (
                        <>
                          <span>•</span>
                          <span className="text-xs">{statusData.chosenChannel}</span>
                        </>
                      )}
                    </>
                  );
                })()}
              </DialogDescription>
            </div>
          </div>
          {statusData && (
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              {contentData?.sentAt && (
                <div>
                  <span className="font-medium">Sent:</span> {formatDate(contentData.sentAt)}
                </div>
              )}
              {contentData?.deliveredAt && (
                <div>
                  <span className="font-medium">Delivered:</span>{' '}
                  {formatDate(contentData.deliveredAt)}
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        <Separator />

        {isLoading && (
          <div className="flex-1 overflow-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full">
              <CardContent className="pt-6">
                <p className="text-destructive text-center">{error}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !error && contentData && (
          <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="flex-1 overflow-auto mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {contentData.subject || '(No subject)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contentData.textBody && (
                    <div>
                      <h4 className="font-medium mb-2">Text Body</h4>
                      <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                        {contentData.textBody}
                      </div>
                    </div>
                  )}
                  {contentData.htmlBody && (
                    <div>
                      <h4 className="font-medium mb-2">HTML Body</h4>
                      <div
                        className="text-sm bg-muted p-4 rounded-lg prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: contentData.htmlBody }}
                      />
                    </div>
                  )}
                  {!contentData.textBody && !contentData.htmlBody && (
                    <p className="text-muted-foreground text-sm">No content available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients" className="flex-1 overflow-auto mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recipients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contentData.from && (
                    <div>
                      <h4 className="font-medium mb-2">From</h4>
                      <p className="text-sm">{contentData.from}</p>
                    </div>
                  )}
                  {contentData.to && Array.isArray(contentData.to) && contentData.to.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">To</h4>
                      <ul className="space-y-1">
                        {contentData.to.map((recipient: any, index: number) => (
                          <li key={index} className="text-sm">
                            {recipient.email}
                            {recipient.type && (
                              <Badge variant="outline" className="ml-2">
                                {recipient.type}
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {contentData.attachments &&
                    Array.isArray(contentData.attachments) &&
                    contentData.attachments.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Attachments</h4>
                        <ul className="space-y-1">
                          {contentData.attachments.map((attachment: any, index: number) => (
                            <li key={index} className="text-sm">
                              {attachment.filename}
                              {attachment.size && (
                                <span className="text-muted-foreground ml-2">
                                  ({(attachment.size / 1024).toFixed(2)} KB)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="flex-1 overflow-auto mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raw Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] w-full">
                    <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(
                        {
                          status: statusData,
                          content: contentData,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

