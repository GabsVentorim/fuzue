const base = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true };

export const Paw = (p) => (
  <svg {...base} {...p} fill="currentColor">
    <ellipse cx="12" cy="16" rx="5" ry="4.2" />
    <circle cx="5.5" cy="10.5" r="2.3" />
    <circle cx="18.5" cy="10.5" r="2.3" />
    <circle cx="9" cy="6" r="2.3" />
    <circle cx="15" cy="6" r="2.3" />
  </svg>
);

export const Bag = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" />
  </svg>
);

export const Heart = (p) => (
  <svg {...base} {...p} fill="currentColor">
    <path d="M12 21s-8-4.8-8-10.2A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 8 2.8C20 16.2 12 21 12 21z" />
  </svg>
);

export const Truck = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="17.5" r="1.8" fill="currentColor" />
    <circle cx="17" cy="17.5" r="1.8" fill="currentColor" />
  </svg>
);

export const Sparkle = (p) => (
  <svg {...base} {...p} fill="currentColor">
    <path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z" />
  </svg>
);

export const Shield = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </svg>
);

export const Menu = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Close = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const User = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" />
  </svg>
);

export const Trash = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
