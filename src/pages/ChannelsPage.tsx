import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { getMessageChannels } from '@/utils/apiClient';
import { formatDateTime } from '@/utils/time';
import type { EkkoChannelsResponse } from '@/types/api';
import { RefreshCw } from 'lucide-react';

// Helper function to sanitize channel names by removing brand references
function sanitizeChannelName(name: string): string {
  return name
    .replace(/\bMaxMD\s*/gi, '')
    .replace(/\bTwilio\s*/gi, '')
    .trim();
}

export function ChannelsPage() {
  const [data, setData] = useState<EkkoChannelsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMessageChannels();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const headerContent = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/channels">Channels</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>View channel capabilities</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AppLayout headerContent={headerContent}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Title and Subtitle */}
            <div>
              <h1 className="text-2xl font-bold">Channels</h1>
              <p className="text-muted-foreground text-sm mt-1">
                See which channels Ekko can use to deliver your messages.
              </p>
              {data && (
                <p className="text-muted-foreground text-xs mt-2">
                  Capabilities version {data.capabilities_version} · Generated at{' '}
                  {formatDateTime(data.generated_at)}
                </p>
              )}
            </div>

            {/* Loading State */}
            {isLoading && !data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md w-full">
                  <CardHeader>
                    <CardTitle>Couldn't load channels</CardTitle>
                    <CardDescription>Check your API key or try again.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={fetchChannels} variant="default" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && data && data.capabilities.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No channels available</CardTitle>
                  <CardDescription>
                    Configure channels in your Ekko project to start sending messages.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Main Content */}
            {!isLoading && !error && data && data.capabilities.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Channels ({data.capabilities.length})</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Data from GET /v1/message/channels
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.capabilities.map((capability) => (
                      <Card key={capability.channel}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {sanitizeChannelName(capability.name)}
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-xs">
                              {capability.channel}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Threading:</span>
                            <Badge
                              variant={capability.supportsThreading ? 'default' : 'secondary'}
                            >
                              {capability.supportsThreading
                                ? 'Supports threading'
                                : 'No threading'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Attachments:</span>
                            <Badge
                              variant={capability.supportsAttachments ? 'default' : 'secondary'}
                            >
                              {capability.supportsAttachments
                                ? 'Supports attachments'
                                : 'No attachments'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Max recipients:</span>
                            <span className="font-medium">
                              {capability.maxRecipients === 1
                                ? 'Single recipient'
                                : `Up to ${capability.maxRecipients} recipients`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Rate limit:</span>
                            <span className="font-medium">
                              Up to {capability.rateLimit.perMinute} messages/minute
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

