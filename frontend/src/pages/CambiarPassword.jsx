import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function CambiarPassword() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const esPaciente = user?.rol === 'paciente';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== password2) { setError('Las contrasenas no coinciden'); return; }
    if (password.length < 8) { setError('La contrasena debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/cambiar-password/', { password, password2 });
      setSuccess('Contrasena actualizada correctamente');
      setPassword('');
      setPassword2('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contrasena');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={esPaciente ? 'pp-container' : 'page-container'}>
      {esPaciente ? (
        <>
          <div className="pp-header">
            <div className="pp-header-content">
              <div className="pp-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="28" height="28">
                  <rect x="14" y="22" width="36" height="32" rx="4" />
                  <path d="M22 22V16a10 10 0 0120 0v6" />
                  <circle cx="32" cy="40" r="4" fill="white" />
                  <path d="M32 44v4" />
                </svg>
              </div>
              <div className="pp-header-text">
                <h1>Cambiar Contrasena</h1>
                <p>Actualiza tu contrasena de acceso</p>
              </div>
            </div>
          </div>
          <div className="pp-section">
            <div className="pp-section-header">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Seguridad
              </h2>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit} className="pp-form">
              <div className="pp-form-row">
                <div className="pp-form-group">
                  <label>Nueva contrasena</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 caracteres" required />
                </div>
                <div className="pp-form-group">
                  <label>Confirmar contrasena</label>
                  <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Repite la contrasena" required />
                </div>
              </div>
              <button type="submit" className="pp-btn pp-btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Cambiar contrasena'}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div>
          <h1>Cambiar Contrasena</h1>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nueva contrasena</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 caracteres" required />
              </div>
              <div className="form-group">
                <label>Confirmar contrasena</label>
                <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Repite la contrasena" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Cambiar contrasena'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
