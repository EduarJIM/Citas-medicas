import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { token } = useParams();
  const { verifyEmail, resendVerification } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const query = new URLSearchParams(window.location.search);
  const [correoReenvio, setCorreoReenvio] = useState(query.get('correo') || '');
  const [reenviando, setReenviando] = useState(false);
  const [mensajeReenvio, setMensajeReenvio] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token no proporcionado.');
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.mensaje || 'Correo verificado exitosamente.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'El token es invalido o ha expirado.');
      });
  }, [token, verifyEmail]);

  const handleResend = async () => {
    if (!correoReenvio) return;
    setReenviando(true);
    setMensajeReenvio('');
    try {
      const res = await resendVerification(correoReenvio);
      setMensajeReenvio(res.mensaje || 'Si el correo existe, recibiras un nuevo enlace.');
    } catch {
      setMensajeReenvio('Error al reenviar. Intenta de nuevo mas tarde.');
    } finally { setReenviando(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-shape" />
      <div className="auth-shape-2" />
      <div className="auth-card">
        <div className="auth-icon-wrap">
          <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3">
            <rect x="22" y="8" width="20" height="48" rx="4"/>
            <rect x="8" y="22" width="48" height="20" rx="4"/>
          </svg>
        </div>
        <h2>Verificacion de Correo</h2>
        {status === 'loading' && <p style={{ textAlign: 'center' }}>Verificando tu correo...</p>}
        {status === 'success' && (
          <>
            <div className="alert alert-success">{message}</div>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login">Iniciar sesion</Link>
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="alert alert-error">{message}</div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                Ingresa tu correo para reenviar el enlace:
              </p>
              <div className="form-group">
                <input type="email" value={correoReenvio} onChange={(e) => setCorreoReenvio(e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
              <button className="btn btn-secondary btn-block" onClick={handleResend} disabled={reenviando || !correoReenvio}>
                {reenviando ? 'Enviando...' : 'Reenviar enlace'}
              </button>
              {mensajeReenvio && (
                <p className={mensajeReenvio.includes('Error') ? 'alert alert-error' : 'alert alert-success'} style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  {mensajeReenvio}
                </p>
              )}
            </div>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login">Volver al inicio de sesion</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
