import { useEffect } from 'react';
import brand from '../brand';
import { imageUrl } from '../assets';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
