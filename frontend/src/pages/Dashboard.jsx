import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import logoMedico from '../assets/logo-medical.svg';
import LoadingSpinner from '../components/LoadingSpinner';

const getBadgeClass = (estado) => {
  const map = { pendiente: 'badge-pending', confirmada: 'badge-pending', realizada: 'badge-success', cancelada: 'badge-danger', no_asistio: 'badge-warning' };
  return `badge ${map[estado] || 'badge-pending'}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [accionando, setAccionando] = useState(null);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtro) params.estado = filtro;
    api.get('/citas/', { params }).then((r) => setCitas(r.data.results)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtro]);

  const stats = useMemo(() => {
    const total = citas.length;
    const activas = citas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length;
    const realizadas = citas.filter((c) => c.estado === 'realizada').length;
    const canceladas = citas.filter((c) => c.estado === 'cancelada').length;
    return { total, activas, realizadas, canceladas };
  }, [citas]);

  const vigentes = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return citas.filter((c) => (c.estado === 'pendiente' || c.estado === 'confirmada') && c.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
  }, [citas]);

  const cancelar = async (id) => {
    if (!confirm('Cancelar esta cita?')) return;
    setAccionando(id);
    try {
      await api.delete(`/citas/${id}/`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar');
    } finally {
      setAccionando(null);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('Eliminar permanentemente esta cita? Esta accion no se puede deshacer.')) return;
    setAccionando(id);
    try {
      await api.delete(`/citas/${id}/eliminar/`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setAccionando(null);
    }
  };

  if (loading && citas.length === 0) return <LoadingSpinner text="Cargando portal..." />;

  return (
    <div className="dashboard fade-in">
      <div className="hero-section">
        <img src={logoMedico} alt="Citas Medicas" className="hero-logo pulse" />
        <div className="hero-text">
          <h1>Bienvenido, {user?.nombre_completo || user?.correo}</h1>
          <p className="rol-badge">Paciente</p>
        </div>
      </div>

      <div className="stats-grid slide-up">
        <div className="stat-card stat-card-blue">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Citas Totales</span>
        </div>
        <div className="stat-card stat-card-green">
          <span className="stat-number">{stats.activas}</span>
          <span className="stat-label">Citas Vigentes</span>
        </div>
        <div className="stat-card stat-card-teal">
          <span className="stat-number">{stats.realizadas}</span>
          <span className="stat-label">Realizadas</span>
        </div>
        <div className="stat-card stat-card-red">
          <span className="stat-number">{stats.canceladas}</span>
          <span className="stat-label">Canceladas</span>
        </div>
      </div>

      {vigentes.length > 0 && (
        <div className="next-citas slide-up">
          <h2>Citas Vigentes</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th><th>Hora</th><th>Medico</th><th>Especialidad</th><th>Estado</th><th>Motivo</th><th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {vigentes.map((c) => (
                <tr key={c.id_cita}>
                  <td>{c.fecha}</td>
                  <td>{c.hora_inicio}</td>
                  <td>{c.medico_nombre}</td>
                  <td>{c.especialidad}</td>
                  <td><span className={getBadgeClass(c.estado)}>{c.estado}</span></td>
                  <td>{c.motivo || '-'}</td>
                  <td>
                    <button
                      onClick={() => cancelar(c.id_cita)}
                      className="btn btn-danger btn-sm"
                      disabled={accionando === c.id_cita}
                    >
                      {accionando === c.id_cita ? '...' : 'Cancelar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vigentes.length === 0 && !loading && (
        <div className="next-citas slide-up">
          <h2>Citas Vigentes</h2>
          <p className="empty">No tienes citas vigentes. <Link to="/agendar">Agenda una cita</Link></p>
        </div>
      )}

      <div className="dashboard-grid slide-up" style={{ marginTop: '2rem' }}>
        <div className="card card-hover">
          <div className="card-icon card-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </div>
          <h3>Agendar Cita</h3>
          <p>Reserva una cita con un especialista</p>
          <Link to="/agendar" className="btn btn-primary">Agendar</Link>
        </div>
        <div className="card card-hover">
          <div className="card-icon card-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
          </div>
          <h3>Historial Completo</h3>
          <p>Revisa todas tus citas anteriores</p>
          <Link to="/mis-citas" className="btn btn-secondary">Ver historial</Link>
        </div>
        <div className="card card-hover">
          <div className="card-icon card-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3>Mi Perfil</h3>
          <p>Actualiza tus datos personales</p>
          <Link to="/perfil" className="btn btn-secondary">Editar perfil</Link>
        </div>
      </div>

      <div className="next-citas slide-up" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Todas mis Citas</h2>
          <div className="filters" style={{ marginBottom: 0 }}>
            <label>Filtrar:</label>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="realizada">Realizadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="no_asistio">No asistio</option>
            </select>
          </div>
        </div>
        {loading ? (
          <LoadingSpinner text="Cargando citas..." />
        ) : citas.length === 0 ? (
          <p className="empty">No hay citas {filtro ? `en estado "${filtro}"` : ''}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th><th>Hora</th><th>Medico</th><th>Especialidad</th>
                <th>Estado</th><th>Motivo</th><th>Accion</th>
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
                  <td>{c.motivo || '-'}</td>
                  <td>
                    {c.estado === 'pendiente' && (
                      <button onClick={() => cancelar(c.id_cita)} className="btn btn-danger btn-sm" disabled={accionando === c.id_cita}>
                        {accionando === c.id_cita ? '...' : 'Cancelar'}
                      </button>
                    )}
                    {c.estado === 'confirmada' && (
                      <button onClick={() => cancelar(c.id_cita)} className="btn btn-danger btn-sm" disabled={accionando === c.id_cita}>
                        {accionando === c.id_cita ? '...' : 'Cancelar'}
                      </button>
                    )}
                    {c.estado !== 'pendiente' && c.estado !== 'confirmada' && (
                      <button onClick={() => eliminar(c.id_cita)} className="btn btn-secondary btn-sm" disabled={accionando === c.id_cita}>
                        {accionando === c.id_cita ? '...' : 'Eliminar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
