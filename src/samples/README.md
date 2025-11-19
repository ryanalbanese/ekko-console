# Sample Components

This directory contains sample/reference components from shadcn/ui that you can use as starting points for building your own UI.

## SidebarDashboard

The `SidebarDashboard` component is the shadcn/ui **sidebar-08** block. It demonstrates a complete dashboard layout with:

- **AppSidebar**: Full-featured sidebar with:
  - Header with logo/branding
  - Main navigation with collapsible menu items
  - Projects section with dropdown menus
  - Secondary navigation items
  - User menu in footer with dropdown

- **Main Content Area**: 
  - Header with breadcrumbs
  - Responsive grid layout
  - Placeholder content areas

## Usage

To use the dashboard sample in your app:

```tsx
import { SidebarDashboard } from '@/samples/SidebarDashboard';

function MyDashboardPage() {
  return <SidebarDashboard />;
}
```

## Components Included

- `SidebarDashboard.tsx` - Main dashboard component
- `AppSidebar.tsx` - Sidebar component with navigation
- `NavMain.tsx` - Main navigation with collapsible items
- `NavProjects.tsx` - Projects section with dropdown menus
- `NavSecondary.tsx` - Secondary navigation items
- `NavUser.tsx` - User menu component

## Customization

You can customize these components by:

1. Updating the `data` object in `AppSidebar.tsx` to change navigation items
2. Modifying the layout in `SidebarDashboard.tsx` to match your needs
3. Styling with Tailwind classes to match your design system
4. Adding your own content in place of the placeholder divs

## Notes

- These components use shadcn/ui components from `@/components/ui/*`
- All components are fully responsive and work on mobile/desktop
- The sidebar automatically collapses on mobile using Sheet component
- Dark mode is supported through Tailwind's dark mode classes

