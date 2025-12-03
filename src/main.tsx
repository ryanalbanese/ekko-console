import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { EkkoSocketProvider } from './contexts/EkkoSocketContext';
import './index.css';

// Force light mode
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <EkkoSocketProvider>
        <App />
      </EkkoSocketProvider>
    </BrowserRouter>
  </React.StrictMode>
);


