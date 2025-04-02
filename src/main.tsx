
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SettingsProvider } from './hooks/useSettings.tsx';

// Apply dark black background to root element
document.documentElement.style.setProperty('--background', '#000000');
document.documentElement.style.setProperty('--card', '#111111');
document.documentElement.style.setProperty('--muted', '#222222');

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
