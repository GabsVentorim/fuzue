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

export const Heart = (p) => (
  <svg {...base} {...p} fill="currentColor">
    <path d="M12 21s-8-4.8-8-10.2A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 8 2.8C20 16.2 12 21 12 21z" />
  </svg>
);

export const Sparkle = (p) => (
  <svg {...base} {...p} fill="currentColor">
    <path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z" />
  </svg>
);

export const Shield = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v5.5c0 4.3-2.9 8-7 9.5-4.1-1.5-7-5.2-7-9.5V6z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
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
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" />
  </svg>
);

export const Trash = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const Arrow = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Lock = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const Phone = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z" />
  </svg>
);

export const Chat = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12a7.5 7.5 0 0 1-11 6.6L4.5 20l1.4-4.3A7.5 7.5 0 1 1 20 12z" />
  </svg>
);

export const Pin = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const Alert = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const QrCode = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <path d="M14 14h2.5M20.5 14v2.5M14 20.5h2.5M20.5 18.5v2M18 17v0" strokeLinecap="round" />
  </svg>
);

// Contactless / NFC: o ponto de contato à esquerda e as ondas abrindo para a direita.
export const Nfc = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
    <circle cx="5.6" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <path d="M9.2 8.5a5 5 0 0 1 0 7" />
    <path d="M12.8 6a8 8 0 0 1 0 12" />
    <path d="M16.4 3.5a11 11 0 0 1 0 17" />
  </svg>
);

export const Copy = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </svg>
);

export const Check = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

export const Download = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v10M7.5 10l4.5 4.5L16.5 10" />
    <path d="M5 19h14" />
  </svg>
);

export const Search = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="6" />
    <path d="M15.5 15.5L20 20" />
  </svg>
);

export const Plus = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Phone2 = (p) => (
  <svg {...base} {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
    <path d="M10.5 18.5h3" />
  </svg>
);
