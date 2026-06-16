import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Las contrasenas no coinciden'); return; }
    if (password.length < 8) { setError('La contrasena debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm/', { token, password, password2 });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contrasena');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-icon-wrap">
            <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3">
              <path d="M8 32 L24 48 L56 16" />
            </svg>
          </div>
          <h2>Contrasena actualizada</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
            Tu contrasena se ha restablecido correctamente.
          </p>
          <Link to="/login" className="btn btn-primary">Iniciar sesion</Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2>Enlace invalido</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>El enlace de recuperacion no es valido.</p>
          <Link to="/forgot-password" className="btn btn-primary">Solicitar nuevo enlace</Link>
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
        <h2>Nueva Contrasena</h2>
        {error && (
          <div className="alert alert-error">
            {error}
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <Link to="/forgot-password">Solicitar nuevo enlace</Link>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva contrasena</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 caracteres" required />
          </div>
          <div className="form-group">
            <label>Confirmar contrasena</label>
            <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Repite la contrasena" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Guardando...' : 'Restablecer contrasena'}
          </button>
        </form>
      </div>
    </div>
  );
}
