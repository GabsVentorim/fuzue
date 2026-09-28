import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import brand from './brand';
import { asset } from './assets';
import './styles.css';

document.title = `${brand.name} · ${brand.subtitle.toLowerCase()}`;

// Favicon and social-share image come from brand.config.json → assets.
if (asset('favicon')) document.getElementById('favicon').href = asset('favicon');
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
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
