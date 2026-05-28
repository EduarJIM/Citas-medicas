import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MiPerfil() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    telefono: '',
    documento: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/auth/usuarios/${user.id_usuario}/`);
        const d = res.data;
        setFormData({
          nombre_completo: d.nombre_completo || '',
          correo: d.correo || '',
          telefono: d.telefono || '',
          documento: d.documento || '',
        });
      } catch (err) {
        setError('Error al cargar los datos del perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id_usuario]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.put(`/auth/usuarios/${user.id_usuario}/`, {
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
      });
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Mi Perfil</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input type="email" value={formData.correo} disabled />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Documento</label>
            <input type="text" value={formData.documento} disabled />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
