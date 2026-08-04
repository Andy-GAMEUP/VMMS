import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { Toast } from './components/ui/Toast';
import './index.css';

// FOUC prevention — apply saved theme before first paint
const saved = localStorage.getItem('vmms-theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2분
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toast />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
