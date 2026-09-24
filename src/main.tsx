import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import App from '@/App';
import { SessionProvider } from '@/contexts/SessionContext';
import { ApiProvider } from '@/hooks/useApi';
import '@/locales';

import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiProvider>
      <SessionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SessionProvider>
    </ApiProvider>
  </React.StrictMode>,
);
