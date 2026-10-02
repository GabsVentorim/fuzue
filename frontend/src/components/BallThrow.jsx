import { useEffect } from 'react';
import brand from '../brand';
import { imageUrl } from '../assets';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const STAR = 'M12 1.5c1.3 4.6 2.4 5.6 9.3 6.9-5 3.4-5.8 4.7-3.9 10.5-4.4-3.3-6.4-3.3-10.8 0 1.9-5.8 1.1-7.1-3.9-10.5 6.9-1.3 8-2.3 9.3-6.9z';
const POP_COLORS = ['#f7b6d9', '#1e9bea', '#f2b33d', '#ff2a0a', '#9ecfd3', '#5b6cf0'];

// a little burst of sticker stars out of the bag
function popStars(r) {
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < 7; i++) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('class', 'pop-star');
    el.innerHTML = `<path d="${STAR}" fill="${POP_COLORS[i % POP_COLORS.length]}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke"/>`;
    el.style.left = `${cx - 8}px`;
    el.style.top = `${cy - 8}px`;
    document.body.appendChild(el);
    const a = (Math.PI * 2 * i) / 7 + Math.random() * 0.5;
    const d = 38 + Math.random() * 26;
    el.animate(
      [
        { transform: 'translate(0,0) scale(0.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 10}px) scale(1) rotate(${160 + i * 30}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(a) * d * 1.2}px, ${Math.sin(a) * d + 30}px) scale(0.6) rotate(${220 + i * 30}deg)`, opacity: 0 },
      ],
      { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    ).finished.then(() => el.remove());
  }
}

// "Adicionar à sacola" throws the logo's blue ball from where you tapped into the bag in the header,
// and the bag catches it. Listens to the `fuzue:add` event the cart fires.
export default function BallThrow() {
  useEffect(() => {
    let last = null;
    const remember = (e) => { last = { x: e.clientX, y: e.clientY }; };
    const onAdd = () => {
      const bag = document.querySelector('.header .cart-btn');
      if (!bag) return;
      const catchIt = () => {
        bag.classList.remove('cart-btn--catch');
        void bag.offsetWidth; // restart the animation
        bag.classList.add('cart-btn--catch');
        if (!reducedMotion()) popStars(bag.getBoundingClientRect());
      };
      const src = brand.assets?.logoAnimated?.ball;
      if (!src || !last || reducedMotion()) return catchIt();
      const to = bag.getBoundingClientRect();
      const dx = to.left + to.width / 2 - last.x;
      const dy = to.top + to.height / 2 - last.y;
      // apex a bit above the higher of the two points, but never off the top of the screen
      const lift = Math.max(12 - last.y, Math.min(-80, dy - 90));

      // outer element moves sideways at constant speed, inner one goes up then falls: a parabola
      const outer = document.createElement('div');
      outer.className = 'throw';
      outer.style.left = `${last.x - 14}px`;
      outer.style.top = `${last.y - 14}px`;
      const inner = document.createElement('img');
      inner.src = imageUrl(src);
      inner.alt = '';
      outer.appendChild(inner);
      document.body.appendChild(outer);
      const T = 620;
      outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], { duration: T, easing: 'linear', fill: 'forwards' });
      inner.animate(
        [
          { transform: 'translateY(0) rotate(0) scale(1)', easing: 'cubic-bezier(.2,.7,.4,1)' },
          { transform: `translateY(${lift}px) rotate(300deg) scale(1.15)`, offset: 0.45, easing: 'cubic-bezier(.6,0,.9,.4)' },
          { transform: `translateY(${dy}px) rotate(640deg) scale(0.6)` },
        ],
        { duration: T, fill: 'forwards' },
      ).finished.then(() => { outer.remove(); catchIt(); });
    };
    window.addEventListener('pointerdown', remember, { passive: true });
    window.addEventListener('fuzue:add', onAdd);
    return () => {
      window.removeEventListener('pointerdown', remember);
      window.removeEventListener('fuzue:add', onAdd);
    };
  }, []);
  return null;
}
