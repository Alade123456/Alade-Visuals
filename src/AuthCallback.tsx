import React, { useEffect } from 'react';

export const AuthCallback: React.FC = () => {
  useEffect(() => {
    // Check if we are inside a popup window
    if (window.opener && window.opener !== window) {
      // Send the hash/search to the opener
      window.opener.postMessage(
        {
          type: 'OAUTH_SUCCESS',
          hash: window.location.hash,
          search: window.location.search,
        },
        window.location.origin
      );
      // Close the popup
      window.close();
    } else {
      // If someone navigates here directly, just go to the main page
      window.location.replace('/');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-300 font-medium">Completing authentication...</p>
        <p className="text-sm text-slate-400 mt-2">This window should close automatically.</p>
      </div>
    </div>
  );
};
