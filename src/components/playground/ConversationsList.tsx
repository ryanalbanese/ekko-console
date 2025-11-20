import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty } from '@/components/ui/empty';
import { NewConversationDialog } from './NewConversationDialog';
import { formatTimestamp } from '@/utils/time';
import type { PlaygroundConversation } from '@/hooks/usePlaygroundConversations';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConversationsListProps {
  conversations: PlaygroundConversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onCreate: (recipientAddress: string, label?: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationsList({
  conversations,
  activeConversationId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  const handleCreate = (recipientAddress: string, label?: string) => {
    onCreate(recipientAddress, label);
    setDialogOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation when clicking delete
    setDeleteDialogOpen(id);
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeleteDialogOpen(null);
  };

  return (
    <div className="flex h-full w-[280px] flex-col border-r bg-muted/30">

      {conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Empty
            title="No conversations yet"
            description="Start a new conversation to send your first message through Ekko."
            action={{
              label: 'New conversation',
              onClick: () => setDialogOpen(true),
            }}
          />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'cursor-pointer transition-colors rounded-lg group relative',
                  activeConversationId === conversation.id 
                    ? 'bg-accent/70 border-l-2 border-l-primary' 
                    : 'hover:bg-accent/50'
                )}
                onClick={() => onSelect(conversation.id)}
              >
                <div className="p-3 pr-10">
                  <div className="font-medium text-sm truncate">
                    {conversation.label || conversation.recipientAddress}
                  </div>
                  {conversation.lastMessagePreview && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {conversation.lastMessagePreview}
                    </div>
                  )}
                  {conversation.lastUpdatedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(conversation.lastUpdatedAt)}
                    </div>
                  )}
                </div>
                <AlertDialog open={deleteDialogOpen === conversation.id} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(conversation.id, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this conversation and all its messages. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => confirmDelete(conversation.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}



