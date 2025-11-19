import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { EkkoSocketProvider } from './contexts/EkkoSocketContext';
import './index.css';

// Initialize theme from localStorage or default to dark
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark');
} else if (savedTheme === 'dark' || !savedTheme) {
  document.documentElement.classList.add('dark');
}

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


