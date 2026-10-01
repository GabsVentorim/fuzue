import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets';

const AUTOPLAY_MS = 5000;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Internal links use the router; external ones open normally.
function SlideLink({ to, className, children, ...rest }) {
  if (!to) return <div className={className} {...rest}>{children}</div>;
  if (to.startsWith('/')) return <Link to={to} className={className} {...rest}>{children}</Link>;
  return <a href={to} className={className} target="_blank" rel="noreferrer" {...rest}>{children}</a>;
}

// Home carousel — banners come from Admin → Carrossel.
export default function HeroCarousel({ banners }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const drag = useRef(null);
  const n = banners.length;

  const go = useCallback((i) => setIndex(((i % n) + n) % n), [n]);

  // autoplay (stops while hovered/focused, when the tab is hidden, or with reduced motion)
  useEffect(() => {
    if (n < 2 || paused || reducedMotion()) return;
    const t = setInterval(() => !document.hidden && setIndex((i) => (i + 1) % n), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [n, paused]);

  useEffect(() => {
    if (index >= n) setIndex(0);
  }, [n, index]);

  // swipe on touch screens
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse') return;
    drag.current = { x: e.clientX, moved: false };
  };
  const onPointerUp = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    drag.current = null;
  };

  return (
    <section
      className="carousel"
      aria-roledescription="carrossel"
      aria-label="Novidades e coleções"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <div className="carousel__viewport" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div className="carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {banners.map((b, i) => {
            const hasText = b.title || b.subtitle || b.buttonLabel;
            return (
              <div
                key={b.id}
                className="carousel__slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${n}${b.title ? `: ${b.title}` : ''}`}
                aria-hidden={i !== index}
              >
                <SlideLink to={b.linkUrl} className="carousel__link" tabIndex={i === index ? 0 : -1} draggable={false}>
                  <picture>
                    {b.imageMobile && <source media="(max-width: 760px)" srcSet={imageUrl(b.imageMobile)} />}
                    <img src={imageUrl(b.image)} alt={b.title || 'Banner'} className="carousel__img" draggable={false}
                      loading={i === 0 ? 'eager' : 'lazy'} />
                  </picture>
                  {hasText && (
                    <div className="carousel__text">
                      {b.title && <h2>{b.title}</h2>}
                      {b.subtitle && <p>{b.subtitle}</p>}
                      {b.buttonLabel && <span className="btn btn--primary btn--sm">{b.buttonLabel}</span>}
                    </div>
                  )}
                </SlideLink>
              </div>
            );
          })}
        </div>

        {n > 1 && (
          <>
            <button type="button" className="carousel__arrow carousel__arrow--prev" onClick={() => go(index - 1)} aria-label="Banner anterior">‹</button>
            <button type="button" className="carousel__arrow carousel__arrow--next" onClick={() => go(index + 1)} aria-label="Próximo banner">›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="carousel__dots" role="tablist" aria-label="Escolher banner">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Banner ${i + 1}${b.title ? `: ${b.title}` : ''}`}
              className={`carousel__dot ${i === index ? 'carousel__dot--on' : ''}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
