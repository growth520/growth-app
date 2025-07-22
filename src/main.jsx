
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';
import { DataProvider } from '@/contexts/DataContext.jsx';
import { Toaster } from '@/components/ui/toaster';
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <DataProvider>
          <App />
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
