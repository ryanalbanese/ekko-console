import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { getIdentityLabel, isDemoMode } from '@/utils/auth';
import { useConversations } from '@/hooks/useConversations';
import { formatTime } from '@/utils/time';

export function SidebarComponent() {
  const { conversations, activeConversationId, createNew, select } = useConversations();
  const identityLabel = getIdentityLabel();
  const demoMode = isDemoMode();

  const handleNewConversation = () => {
    createNew();
  };

  return (
    <SidebarPrimitive variant="inset" className="border-r">
      <SidebarHeader className="p-4">
        <Button
          onClick={handleNewConversation}
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu>
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No conversations yet. Start a new one!
            </div>
          ) : (
            conversations.map((conv) => (
              <SidebarMenuItem key={conv.id}>
                <SidebarMenuButton
                  onClick={() => select(conv.id)}
                  isActive={conv.id === activeConversationId}
                  className="w-full justify-start gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{conv.title}</div>
                    {conv.lastMessage && (
                      <div className="truncate text-xs text-muted-foreground">
                        {conv.lastMessage}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(conv.timestamp)}
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{identityLabel}</span>
          </div>
          {demoMode && (
            <div className="text-xs text-muted-foreground">
              Using test key
            </div>
          )}
        </div>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}

