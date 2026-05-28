import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtro) params.estado = filtro;
    api.get('/citas/', { params }).then((r) => setCitas(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtro]);

  if (loading) return <LoadingSpinner text="Cargando citas..." />;

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await api.delete(`/citas/${id}/`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar permanentemente esta cita? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/citas/${id}/eliminar/`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const getBadgeClass = (estado) => {
    const map = { pendiente: 'badge-pending', realizada: 'badge-success', cancelada: 'badge-danger', no_asistio: 'badge-warning' };
    return `badge ${map[estado] || 'badge-pending'}`;
  };

  return (
    <div className="page-container">
      <h1>Mis Citas</h1>
      <div className="filters">
        <label>Filtrar por estado: </label>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="realizada">Realizadas</option>
          <option value="cancelada">Canceladas</option>
          <option value="no_asistio">No asistió</option>
        </select>
      </div>
      {citas.length === 0 ? (
        <p className="empty">No hay citas {filtro ? `en estado "${filtro}"` : ''}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Hora</th><th>Médico</th><th>Especialidad</th>
              <th>Estado</th><th>Motivo</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((c) => (
              <tr key={c.id_cita}>
                <td>{c.fecha}</td>
                <td>{c.hora_inicio}</td>
                <td>{c.medico_nombre}</td>
                <td>{c.especialidad}</td>
                <td><span className={getBadgeClass(c.estado)}>{c.estado}</span></td>
                <td>{c.motivo}</td>
                <td>
                  {c.estado === 'pendiente' && (
                    <button onClick={() => cancelar(c.id_cita)} className="btn btn-danger btn-sm">
                      Cancelar
                    </button>
                  )}
                  {c.estado !== 'pendiente' && (
                    <button onClick={() => eliminar(c.id_cita)} className="btn btn-secondary btn-sm">
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
