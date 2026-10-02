import { useEffect, useRef, useState } from 'react';
import brand from '../brand';
import { imageUrl } from '../assets';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// A swinging stretch of trail down one gutter: it sways between the gutter's two edges.
const sway = (x, y0, y1, amp, wave) => {
  let d = '';
  const n = Math.max(1, Math.round((y1 - y0) / wave));
  const h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const y = y0 + i * h;
    const a = i % 2 ? -amp : amp;
    d += ` C ${x + a * 1.6} ${y + h * 0.25}, ${x + a * 1.6} ${y + h * 0.75}, ${x} ${y + h}`;
  }
  return d;
};

// The trail: it sways down the page's side gutters and only crosses over in the open space between
// two stops (so it never runs through headings or prices), then drops into the footer and ends
// beside the lying dog of the logo, where the ball comes to rest.
function trailPath(w, gaps, end) {
  const narrow = w < 700;
  const gutter = narrow ? 16 : Math.max(40, (w - 1180) / 2);
  const mid = gutter / 2; // centre line of each gutter
  const L = mid;
  const R = w - mid;
  const amp = narrow ? 4 : Math.min(30, gutter / 2 - 10);
  const wave = narrow ? 110 : 230;
  const band = narrow ? 34 : 56; // half-height of the crossing, kept inside the stops' padding
  let x = R;
  let y = 130;
  let d = `M ${w / 2} 22 C ${w / 2} 90, ${R} 40, ${R} ${y}`;
  for (const g of gaps) {
    if (g - band <= y + 60) continue;
    d += sway(x, y, g - band, amp, wave);
    const nx = x === R ? L : R;
    // an S across the open space: leave the gutter heading down, arrive in the other one heading down
    d += ` C ${x} ${g + band * 0.4}, ${nx} ${g - band * 0.4}, ${nx} ${g + band}`;
    x = nx;
    y = g + band;
  }
  // last stretch: down to the footer's hills, along behind them (hidden), then out beside the dog
  const behind = end.top + 6; // just under the hills, where the footer begins
  if (behind - 70 > y + 60) d += sway(x, y, behind - 70, amp, wave);
  const toward = end.x + 46;
  const dir = toward < x ? -1 : 1;
  d += ` C ${x} ${behind}, ${x} ${behind}, ${x + dir * 50} ${behind}`;
  d += ` L ${toward - dir * 20} ${behind}`;
  d += ` C ${end.x + 10} ${behind}, ${end.x} ${end.y - 50}, ${end.x} ${end.y}`;
  return d;
}

// The logo's blue ball rolls along the trail as you scroll (rotating by the distance it travels)
// and comes to rest at the end of the walk.
export default function ParkTrail({ children }) {
  const wrap = useRef(null);
  const path = useRef(null);
  const ball = useRef(null);
  const [geo, setGeo] = useState(null); // { w, h, d }
  const ballSrc = brand.assets?.logoAnimated?.ball;

  useEffect(() => {
    const el = wrap.current;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const stops = [...el.querySelectorAll(':scope > .park__stop')];
      const gaps = stops.slice(1).map((s) => s.offsetTop); // where one stop ends and the next begins
      // the walk ends just right of the footer logo's dog (the logo picture itself is untouched)
      const box = el.getBoundingClientRect();
      const logo = document.querySelector('.footer .logo-img, .footer .logo')?.getBoundingClientRect();
      const footer = document.querySelector('.footer')?.getBoundingClientRect();
      const top = footer ? footer.top - box.top : h; // where the footer (and its hills' base) starts
      const end = logo
        ? { x: Math.min(w - 24, logo.right - box.left + 26), y: logo.top - box.top + logo.height * 0.72, top }
        : { x: w / 2, y: h - 16, top: h };
      setGeo((g) => {
        const d = trailPath(w, gaps, end);
        return g && g.d === d ? g : { w, h, d, endY: end.y };
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const p = path.current;
    const b = ball.current;
    if (!p || !b || !geo) return;
    const len = p.getTotalLength();
    const r = 14; // ball radius in px — rotation follows the distance rolled
    let frame = 0;
    const place = () => {
      frame = 0;
      const top = wrap.current.getBoundingClientRect().top;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      // the ball reaches the end of the walk when you reach the end of the page
      const progress = atBottom ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.62 - top) / geo.endY));
      const at = progress * len;
      const pt = p.getPointAtLength(at);
      b.style.transform = `translate(${pt.x - r}px, ${pt.y - r}px) rotate(${(at / r) * (180 / Math.PI)}deg)`;
      wrap.current.style.setProperty('--trail-done', `${len - at}`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(place); };
    wrap.current.style.setProperty('--trail-len', `${len}`);
    place();
    if (reducedMotion()) return;
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [geo]);

  return (
    <div className="park" ref={wrap}>
      {geo && (
        <svg className="park__trail" width={geo.w} height={geo.endY + 30} viewBox={`0 0 ${geo.w} ${geo.endY + 30}`} aria-hidden>
          <defs>
            {/* the walked part of the trail turns blue: a solid stroke growing along the path masks the blue dots */}
            <mask id="park-walked" maskUnits="userSpaceOnUse" x="0" y="0" width={geo.w} height={geo.endY + 30}>
              <path d={geo.d} className="park__mask" />
            </mask>
          </defs>
          <path ref={path} d={geo.d} className="park__path" />
          <path d={geo.d} className="park__path park__path--walked" mask="url(#park-walked)" />
        </svg>
      )}
      {ballSrc && geo && <img ref={ball} src={imageUrl(ballSrc)} alt="" className="park__ball" aria-hidden />}
      {children}
    </div>
  );
}
