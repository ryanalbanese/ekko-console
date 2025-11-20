import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { Empty } from '@/components/ui/empty';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Copy, RotateCw, X } from 'lucide-react';

interface ApiKey {
  id: string;
  key: string;
  type: string;
  created: Date;
  lastUsed: string;
  status: 'active';
}

export function ApiKeysPage() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Read API keys from environment variables
  const apiKeys = useMemo<ApiKey[]>(() => {
    const keys: ApiKey[] = [];
    const key1 = import.meta.env.VITE_EKKO_API_KEY_1;
    const key2 = import.meta.env.VITE_EKKO_API_KEY_2;

    if (key1) {
      keys.push({
        id: '1',
        key: key1,
        type: 'Test Key',
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lastUsed: 'Playground',
        status: 'active',
      });
    }

    if (key2) {
      keys.push({
        id: '2',
        key: key2,
        type: 'Test Key',
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        lastUsed: 'WebSocket',
        status: 'active',
      });
    }

    return keys;
  }, []);

  const maskKey = (key: string): string => {
    if (key.length <= 12) return '****' + key.slice(-8);
    // Find the prefix (e.g., "ekko_test_" or "ekko_live_")
    // Look for pattern: "ekko_" followed by word and underscore
    const match = key.match(/^(ekko_\w+_)/);
    if (match) {
      const prefix = match[1];
      const last8 = key.slice(-8);
      return `${prefix}****${last8}`;
    }
    // Fallback: use first 10 chars if pattern doesn't match
    const prefix = key.substring(0, 10);
    const last8 = key.slice(-8);
    return `${prefix}****${last8}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString();
  };

  const headerContent = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/api-keys">API Keys</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>Manage the API keys used to authenticate with the Ekko API</BreadcrumbPage>
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
                <h1 className="text-2xl font-bold">API Keys</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage the API keys used to authenticate with the Ekko API.
                </p>
              </div>
              <div className="text-muted-foreground text-sm">
                Never share your API keys publicly.
              </div>
            </div>

            {apiKeys.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Empty
                    title="No API keys yet"
                    description="API keys authenticate your requests to Ekko."
                    action={{
                      label: 'Generate test key',
                      onClick: () => setShowGenerateDialog(true),
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>API Keys ({apiKeys.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((apiKey) => (
                        <TableRow key={apiKey.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">
                                {maskKey(apiKey.key)}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                      onClick={() => copyToClipboard(apiKey.key)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy full key to clipboard</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell>{apiKey.type}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatTimestamp(apiKey.created)}
                          </TableCell>
                          <TableCell>{apiKey.lastUsed}</TableCell>
                          <TableCell>
                            <Badge variant="outline">active</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="h-8"
                                    >
                                      <RotateCw className="h-3 w-3 mr-1" />
                                      Regenerate
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Coming soon</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="h-8"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Disable
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Coming soon</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="text-muted-foreground text-sm pt-2">
              API keys grant full access to your project. Never embed them in public apps. Rotate immediately if exposed.
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Not available in demo</DialogTitle>
            <DialogDescription>
              API key generation is not available in the demo environment.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

