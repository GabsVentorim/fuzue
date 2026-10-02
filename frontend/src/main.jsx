import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import brand from './brand';
import { asset } from './assets';
import './styles.css';

// Tab title: the emoji cycles through the pets below, one per second (🐶 between each of the others).
const baseTitle = `${brand.name} · ${brand.subtitle.toLowerCase()}`;
const pets = ['🐕', '🐶', '🐩', '🐶', '🦮', '🐶', '🐕‍🦺', '🐶', '🐾', '🐶'];
let pet = 0;
document.title = `${pets[pet]} ${baseTitle}`;
setInterval(() => {
  pet = (pet + 1) % pets.length;
  document.title = `${pets[pet]} ${baseTitle}`;
}, 1000);

// Favicon, home-screen icon and social-share image come from brand.config.json → assets.
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
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Entrance animations only hide content under this class, so without JS or with reduced motion
// everything is simply visible.
if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('motion-ok');
