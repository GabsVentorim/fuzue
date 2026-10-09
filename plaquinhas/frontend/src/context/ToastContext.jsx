import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

// Avisos curtos no pé da tela. notify('Plaquinha salva!') ou notify('Deu erro', 'bad').
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, tone = 'ok') => {
    clearTimeout(timer.current);
    // a key muda a cada aviso, então a mesma mensagem repetida reanima
    setToast({ message, tone, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return <ToastContext.Provider value={{ toast, notify }}>{children}</ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);
