import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/password-reset/', { correo });
      setEnviado(true);
    } catch {
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-icon-wrap">
            <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3">
              <path d="M8 32 L24 48 L56 16" />
            </svg>
          </div>
          <h2>Revisa tu correo</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
            Si el correo existe, recibiras un enlace para restablecer tu contrasena.
          </p>
          <Link to="/login" className="btn btn-primary">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-shape" />
      <div className="auth-card">
        <div className="auth-icon-wrap">
          <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3">
            <rect x="14" y="22" width="36" height="32" rx="4" />
            <path d="M22 22V16a10 10 0 0120 0v6" />
            <circle cx="32" cy="40" r="4" fill="white" />
            <path d="M32 44v4" />
          </svg>
        </div>
        <h2>Recuperar Contrasena</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.2rem', fontSize: '0.9rem', textAlign: 'center' }}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electronico</label>
            <input
              type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com" required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Volver al inicio de sesion</Link>
        </p>
      </div>
    </div>
  );
}
