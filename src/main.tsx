import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthCallback } from './AuthCallback.tsx';
import './index.css';

// Intercept OAuth callback if running inside a popup
if (window.opener && (window.location.hash.includes('access_token=') || window.location.search.includes('code='))) {
  window.opener.postMessage({
    type: 'SUPABASE_OAUTH_SUCCESS',
    hash: window.location.hash,
    search: window.location.search
  }, window.location.origin);
  // Optional: keep this fallback just in case
}

const isAuthCallback = window.location.pathname === '/auth-callback';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAuthCallback ? <AuthCallback /> : <App />}
  </StrictMode>,
);
