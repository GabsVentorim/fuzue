import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import brand from './brand';
import { asset } from './assets';
import './styles.css';

document.title = `${brand.name} · ${brand.subtitle.toLowerCase()}`;

// Favicon e ícone de tela inicial vêm de brand.config.json → assets.
if (asset('favicon')) document.getElementById('favicon').href = asset('favicon');
if (asset('appleTouchIcon')) document.getElementById('apple-touch-icon').href = asset('appleTouchIcon');
if (asset('ogImage')) {
  const og = document.createElement('meta');
  og.setAttribute('property', 'og:image');
  og.content = new URL(asset('ogImage'), location.origin).href;
  document.head.appendChild(og);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
