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
    <div className="flex h-full w-[280px] flex-col border-r bg-muted/30 overflow-hidden" style={{ width: '280px', maxWidth: '280px', minWidth: '280px' }}>

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
        <div className="flex-1 overflow-hidden" style={{ width: '280px', maxWidth: '280px' }}>
          <ScrollArea className="h-full" style={{ width: '280px', maxWidth: '280px' }}>
            <div className="p-2 space-y-1" style={{ width: '280px', maxWidth: '280px', boxSizing: 'border-box', padding: '8px' }}>
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    'cursor-pointer transition-colors rounded-lg group relative overflow-hidden',
                    activeConversationId === conversation.id 
                      ? 'bg-accent/70 border-l-2 border-l-primary' 
                      : 'hover:bg-accent/50'
                  )}
                  onClick={() => onSelect(conversation.id)}
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                >
                  <div className="relative p-3 pr-10 min-w-0" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <div className="font-medium text-sm truncate">
                    {conversation.label || conversation.recipientAddress}
                  </div>
                  {conversation.lastMessagePreview && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {conversation.lastMessagePreview}
                    </div>
                  )}
                  {conversation.lastUpdatedAt && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {formatTimestamp(conversation.lastUpdatedAt)}
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conversation.id, e);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label="Delete conversation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <AlertDialog open={deleteDialogOpen === conversation.id} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
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
        </div>
      )}

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}



