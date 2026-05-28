import { useState, useEffect } from 'react';

export default function LoadingSpinner({ text = 'Cargando...', minDisplay = 800 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="loading-medical">
      <div className="loading-cross">
        <div className="loading-cross-bar loading-cross-v" />
        <div className="loading-cross-bar loading-cross-h" />
      </div>
      <p>{text}</p>
    </div>
  );
}
