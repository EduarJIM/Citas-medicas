import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

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
        setMessage(err.response?.data?.error || 'Error al verificar el correo. El token puede ser inválido o haber expirado.');
      });
  }, [token, verifyEmail]);

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
        <h2>Verificación de Correo</h2>
        {status === 'loading' && <p style={{ textAlign: 'center' }}>Verificando tu correo...</p>}
        {status === 'success' && (
          <>
            <div className="alert alert-success">{message}</div>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login">Iniciar sesión</Link>
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="alert alert-error">{message}</div>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}