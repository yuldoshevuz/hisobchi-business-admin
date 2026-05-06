import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './error-boundary';
import { RootLayout } from './root-layout';
import { RequireAuth } from '@/lib/role/require-role';
import { AdminsListPage } from '@/features/admins/pages/admins-list.page';
import { LoginPage } from '@/features/auth/pages/login.page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard.page';
import { FeaturesListPage } from '@/features/features/pages/features-list.page';
import { OrgsListPage } from '@/features/organizations/pages/orgs-list.page';
import { OrgDetailPage } from '@/features/organizations/pages/org-detail.page';
import { PlanDetailPage } from '@/features/plans/pages/plan-detail.page';
import { PlansListPage } from '@/features/plans/pages/plans-list.page';
import { RawMessageDetailPage } from '@/features/raw-messages/pages/raw-message-detail.page';
import { RawMessagesListPage } from '@/features/raw-messages/pages/raw-messages-list.page';
import { SystemCategoriesListPage } from '@/features/system-categories/pages/system-categories-list.page';
import { SystemCategoryDetailPage } from '@/features/system-categories/pages/system-category-detail.page';

function NotImplementedPage({ title }: { title: string }): React.ReactElement {
  return (
    <div className="flex h-[60vh] items-center justify-center text-center">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu modul hali ishlanmoqda. Keyingi turda qo&apos;shiladi.
        </p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorBoundary /> },
  {
    element: <RequireAuth />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },

          // Plans
          { path: 'plans', element: <PlansListPage /> },
          { path: 'plans/:id', element: <PlanDetailPage /> },

          // Features
          { path: 'features', element: <FeaturesListPage /> },

          // Organizations
          { path: 'organizations', element: <OrgsListPage /> },
          { path: 'organizations/:id', element: <OrgDetailPage /> },

          // System categories
          { path: 'system-categories', element: <SystemCategoriesListPage /> },
          { path: 'system-categories/:id', element: <SystemCategoryDetailPage /> },

          // AI raw messages (cross-tenant audit)
          { path: 'raw-messages', element: <RawMessagesListPage /> },
          { path: 'raw-messages/:id', element: <RawMessageDetailPage /> },

          // Admins
          { path: 'admins', element: <AdminsListPage /> },

          // Stubs for post-MVP modules
          {
            path: 'audit-log',
            element: <NotImplementedPage title="Audit log" />,
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
