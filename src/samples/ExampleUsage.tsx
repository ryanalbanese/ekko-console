/**
 * Example: How to use the SidebarDashboard sample
 * 
 * This file shows how you can integrate the dashboard sample into your app.
 * You can uncomment the code below and use it in your App.tsx or create a new route.
 */

import { SidebarDashboard } from './SidebarDashboard';

/**
 * Example 1: Use as a standalone page
 */
export function DashboardExamplePage() {
  return <SidebarDashboard />;
}

/**
 * Example 2: Use with conditional rendering
 * 
 * In your App.tsx, you could do:
 * 
 * ```tsx
 * import { SidebarDashboard } from '@/samples/SidebarDashboard';
 * 
 * function App() {
 *   const [showDashboard, setShowDashboard] = useState(false);
 *   
 *   if (showDashboard) {
 *     return <SidebarDashboard />;
 *   }
 *   
 *   // ... rest of your app
 * }
 * ```
 */

/**
 * Example 3: Use with routing (if you add React Router)
 * 
 * ```tsx
 * import { Routes, Route } from 'react-router-dom';
 * import { SidebarDashboard } from '@/samples/SidebarDashboard';
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/dashboard" element={<SidebarDashboard />} />
 *       <Route path="/chat" element={<ChatInterface />} />
 *     </Routes>
 *   );
 * }
 * ```
 */

