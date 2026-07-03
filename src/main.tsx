import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept OAuth callback if running inside a popup
if (window.opener && (window.location.hash.includes('access_token=') || window.location.search.includes('code='))) {
  window.opener.postMessage({
    type: 'SUPABASE_OAUTH_SUCCESS',
    hash: window.location.hash,
    search: window.location.search
  }, window.location.origin);
  window.close();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
