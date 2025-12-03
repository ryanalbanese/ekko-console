/**
 * Sample App Sidebar Component
 * 
 * This is part of the shadcn/ui sidebar-08 block sample.
 * It demonstrates a full-featured sidebar with:
 * - Header with logo/branding
 * - Main navigation with collapsible items
 * - Projects section
 * - Secondary navigation
 * - User menu in footer
 */

import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  BookOpen,
  KeyRound,
  LifeBuoy,
  MessageSquare,
  Share2,
  SquareTerminal,
  Webhook,
  type LucideIcon,
} from "lucide-react"
import { getBootstrapData } from "@/utils/auth"

import { NavUser } from "./NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  soon?: boolean
  external?: boolean
}

type NavSection = {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: "Platform",
    items: [
      {
        title: "Playground",
        url: "/playground",
        icon: SquareTerminal,
      },
      {
        title: "Message Explorer",
        url: "/messages",
        icon: MessageSquare,
      },
      {
        title: "Events & Webhooks",
        url: "/events",
        icon: Webhook,
      },
      {
        title: "Channels",
        url: "/channels",
        icon: Share2,
      },
    ],
  },
  {
    label: "Developers",
    items: [
      {
        title: "API Keys",
        url: "/api-keys",
        icon: KeyRound,
      },
      {
        title: "Docs",
        url: "/docs",
        icon: BookOpen,
      },
    ],
  },
]

const bottomLinks: NavItem[] = [
  
]

function renderLabel(item: NavItem) {
  if (!item.soon) {
    return <span className="truncate">{item.title}</span>
  }

  const baseLabel = item.title.replace(/\s*\(Soon\)/i, "").trim()

  return (
    <span className="flex flex-1 items-center gap-2">
      <span className="truncate">{baseLabel}</span>
      <span className="rounded-full border border-sidebar-border/60 bg-sidebar-accent/5 px-1.5 text-[0.625rem] font-medium uppercase tracking-wide text-sidebar-foreground/70">
        Soon
      </span>
    </span>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const pathname = location.pathname

  // Get user info from bootstrap data
  const [userName, setUserName] = React.useState<string>("User")
  const [userEmail, setUserEmail] = React.useState<string>("demo@getekko.io")
  
  React.useEffect(() => {
    const bootstrap = getBootstrapData()
    if (bootstrap) {
      // Use defaultFrom identity, or first identity as fallback
      const identity = bootstrap.defaultFrom || bootstrap.identities.from[0]
      if (identity) {
        if (identity.address) {
          setUserEmail(identity.address)
        }
        // Use identity name if available, otherwise derive from email
        if (identity.name) {
          setUserName(identity.name)
        } else if (identity.address) {
          // Fallback: use email username (part before @) as name
          const emailUsername = identity.address.split('@')[0]
          setUserName(emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1))
        }
      }
    }
  }, [])

  const user = {
    name: userName,
    email: userEmail,
    avatar: "/avatars/shadcn.jpg",
  }

  const isPathActive = React.useCallback(
    (url: string) => {
      if (!url || url.startsWith("http")) {
        return false
      }

      if (url === "/") {
        return pathname === "/"
      }

      return pathname === url || pathname.startsWith(`${url}/`)
    },
    [pathname]
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img
                    src="/logo-dark.svg"
                    alt="Ekko Console logo"
                    className="size-4"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ekko Console</span>
                  <span className="truncate text-xs">Messaging Control Plane</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isPathActive(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link
                          to={item.url}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon />
                          {renderLabel(item)}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomLinks.map((item) => {
                const active = isPathActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={active}
                      tooltip={item.title}
                    >
                      {item.external ? (
                        <a
                          href={item.url}
                          aria-current={active ? "page" : undefined}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <item.icon />
                          <span className="truncate">{item.title}</span>
                        </a>
                      ) : (
                        <Link
                          to={item.url}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

