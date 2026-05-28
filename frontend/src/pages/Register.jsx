import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    nombre_completo: '', documento: '', correo: '', telefono: '', password: '', password2: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      const msgs = [];
      if (typeof data === 'object') {
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) msgs.push(data[key].join(' '));
          else msgs.push(data[key]);
        }
      }
      setError(msgs.join(' ') || 'Error al registrarse');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Crear Cuenta</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input name="nombre_completo" value={form.nombre_completo} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Documento</label>
            <input name="documento" value={form.documento} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input type="email" name="correo" value={form.correo} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Contraseña (mín. 8 carácteres, 1 mayúscula, 1 número, 1 especial)</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input type="password" name="password2" value={form.password2} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Registrarse</button>
        </form>
        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
