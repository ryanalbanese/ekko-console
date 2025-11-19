import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AppLayout } from '@/components/layout/AppLayout';
import { LiveEventsPanel, type LiveEventsPanelRef } from '@/components/events/LiveEventsPanel';
import { WebhookEndpointsPanel } from '@/components/events/WebhookEndpointsPanel';

export function EventsPage() {
  const liveEventsPanelRef = useRef<LiveEventsPanelRef>(null);
  const headerContent = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/events">Events & Webhooks</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>Monitor real-time events and manage webhook endpoints</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <AppLayout headerContent={headerContent}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Events & Webhooks</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Monitor real-time events and manage webhook endpoints
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <LiveEventsPanel ref={liveEventsPanelRef} />
              </div>
              <div className="md:col-span-1">
                <WebhookEndpointsPanel 
                  onTestEventSent={(eventType) => {
                    liveEventsPanelRef.current?.addTestEvent(eventType);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

