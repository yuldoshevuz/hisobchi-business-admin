import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { router } from '@/app/router';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import './styles/globals.css';

// On token-refresh failure, clear the session and let the route guards
// bounce the user to /login on the next render.
setUnauthorizedHandler(() => {
  useAuthStore.getState().clear();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
