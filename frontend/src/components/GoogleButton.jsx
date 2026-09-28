import { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise;
const loadScript = () =>
  (scriptPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  }));

// "Sign in with Google" button (Google Identity Services).
// Hidden when VITE_GOOGLE_CLIENT_ID isn't set. Calls onCredential with the ID token,
// which the backend verifies.
export default function GoogleButton({ onCredential, text = 'continue_with' }) {
  const ref = useRef(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => cb.current(r.credential),
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: Math.min(ref.current.offsetWidth || 320, 400),
          locale: 'pt-BR',
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) return null;
  if (failed) return <p className="muted small center">Não foi possível carregar o login com Google.</p>;
  return <div ref={ref} className="google-btn" />;
}

export const googleEnabled = !!CLIENT_ID;
