import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const getBadgeClass = (estado) => {
  const map = {
    pendiente: 'pp-badge pp-badge-pending',
    confirmada: 'pp-badge pp-badge-confirmed',
    realizada: 'pp-badge pp-badge-success',
    cancelada: 'pp-badge pp-badge-canceled',
    no_asistio: 'pp-badge pp-badge-warning',
  };
  return map[estado] || 'pp-badge pp-badge-pending';
};

const estadoLabel = (estado) => {
  const map = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    realizada: 'Atendida',
    cancelada: 'Cancelada',
    no_asistio: 'No Asistio',
  };
  return map[estado] || estado;
};

export default function PacientePortal() {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('vigentes');
  const [accionando, setAccionando] = useState(null);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtro && filtro !== 'vigentes') params.estado = filtro;
    api.get('/citas/', { params })
      .then((r) => setCitas(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
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
    return citas
      .filter((c) => (c.estado === 'pendiente' || c.estado === 'confirmada') && c.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
  }, [citas]);

  const cancelar = async (id) => {
    if (!confirm('Deseas cancelar esta cita?')) return;
    setAccionando(id);
    try {
      await api.delete(`/citas/${id}/`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar la cita');
    } finally {
      setAccionando(null);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('Eliminar esta cita permanentemente?')) return;
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

  if (loading && citas.length === 0) return <LoadingSpinner text="Abriendo tu portal..." />;

  return (
    <div className="pp-container">
      <div className="pp-header pp-anim-slide">
        <div className="pp-header-content">
          <div className="pp-avatar pp-anim-pop">
            {(user?.nombre_completo || 'P')[0].toUpperCase()}
          </div>
          <div className="pp-header-text">
            <h1>Hola, {user?.nombre_completo || user?.correo}</h1>
            <p>Bienvenido a tu portal de salud</p>
          </div>
          <Link to="/perfil" className="pp-profile-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Mi Perfil
          </Link>
        </div>
      </div>

      <div className="pp-welcome-card pp-anim-slide">
        <div className="pp-welcome-icon pp-anim-pulse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div className="pp-welcome-text">
          <h2>Tu salud es lo mas importante</h2>
          <p>Gestiona tus citas medicas de forma facil y rapida</p>
        </div>
        <Link to="/agendar" className="pp-btn pp-btn-primary pp-btn-lg pp-anim-glide">
          + Nueva Cita
        </Link>
      </div>

      <div className="pp-stats">
        <div className="pp-stat pp-stat-active pp-anim-scale" style={{ animationDelay: '0.1s' }}>
          <span className="pp-stat-number">{stats.activas}</span>
          <span className="pp-stat-label">Activas</span>
        </div>
        <div className="pp-stat pp-stat-done pp-anim-scale" style={{ animationDelay: '0.15s' }}>
          <span className="pp-stat-number">{stats.realizadas}</span>
          <span className="pp-stat-label">Atendidas</span>
        </div>
        <div className="pp-stat pp-stat-cancel pp-anim-scale" style={{ animationDelay: '0.2s' }}>
          <span className="pp-stat-number">{stats.canceladas}</span>
          <span className="pp-stat-label">Canceladas</span>
        </div>
        <div className="pp-stat pp-stat-total pp-anim-scale" style={{ animationDelay: '0.25s' }}>
          <span className="pp-stat-number">{stats.total}</span>
          <span className="pp-stat-label">Total</span>
        </div>
      </div>

      {vigentes.length > 0 && (
        <div className="pp-section pp-anim-slide" style={{ animationDelay: '0.2s' }}>
          <div className="pp-section-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Proximas Citas
            </h2>
            <span className="pp-count">{vigentes.length} {vigentes.length === 1 ? 'cita' : 'citas'}</span>
          </div>
          <div className="pp-citas-list">
            {vigentes.map((c, i) => (
              <div key={c.id_cita} className="pp-cita-card pp-cita-active pp-anim-slide" style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                <div className="pp-cita-date">
                  <span className="pp-cita-day">{new Date(c.fecha + 'T12:00:00').getDate()}</span>
                  <span className="pp-cita-month">
                    {new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>
                <div className="pp-cita-info">
                  <span className="pp-cita-medico">{c.medico_nombre}</span>
                  <span className="pp-cita-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {c.fecha} - {c.hora_inicio}
                  </span>
                  <span className="pp-cita-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    {c.especialidad}
                  </span>
                  <span className={getBadgeClass(c.estado)}>{estadoLabel(c.estado)}</span>
                </div>
                <div className="pp-cita-actions">
                  <button
                    onClick={() => cancelar(c.id_cita)}
                    className="pp-btn pp-btn-cancel"
                    disabled={accionando === c.id_cita}
                  >
                    {accionando === c.id_cita ? '...' : 'Cancelar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vigentes.length === 0 && !loading && (
        <div className="pp-section pp-anim-slide" style={{ animationDelay: '0.2s' }}>
          <div className="pp-section-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Proximas Citas
            </h2>
          </div>
          <div className="pp-empty pp-anim-slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <p>No tienes citas proximas</p>
            <Link to="/agendar" className="pp-btn pp-btn-primary">Agendar una cita</Link>
          </div>
        </div>
      )}

      <div className="pp-section pp-anim-slide" style={{ animationDelay: '0.3s' }}>
        <div className="pp-section-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            Historial de Citas
          </h2>
          <div className="pp-filters">
            <button
              className={`pp-filter-btn ${filtro === 'vigentes' ? 'active' : ''}`}
              onClick={() => setFiltro('vigentes')}
            >
              Todas
            </button>
            <button
              className={`pp-filter-btn ${filtro === 'pendiente' ? 'active' : ''}`}
              onClick={() => setFiltro('pendiente')}
            >
              Pendientes
            </button>
            <button
              className={`pp-filter-btn ${filtro === 'realizada' ? 'active' : ''}`}
              onClick={() => setFiltro('realizada')}
            >
              Atendidas
            </button>
            <button
              className={`pp-filter-btn ${filtro === 'cancelada' ? 'active' : ''}`}
              onClick={() => setFiltro('cancelada')}
            >
              Canceladas
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Cargando..." />
        ) : citas.length === 0 ? (
          <div className="pp-empty">
            <p>No hay citas para mostrar</p>
          </div>
        ) : (
          <div className="pp-table-wrap">
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Medico</th>
                  <th>Especialidad</th>
                  <th>Estado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((c, i) => (
                  <tr key={c.id_cita} className="pp-anim-fade" style={{ animationDelay: `${0.35 + i * 0.04}s` }}>
                    <td>{c.fecha}</td>
                    <td>{c.hora_inicio}</td>
                    <td>{c.medico_nombre}</td>
                    <td>{c.especialidad}</td>
                    <td><span className={getBadgeClass(c.estado)}>{estadoLabel(c.estado)}</span></td>
                    <td>
                      {(c.estado === 'pendiente' || c.estado === 'confirmada') && (
                        <button
                          onClick={() => cancelar(c.id_cita)}
                          className="pp-btn pp-btn-cancel pp-btn-sm"
                          disabled={accionando === c.id_cita}
                        >
                          {accionando === c.id_cita ? '...' : 'Cancelar'}
                        </button>
                      )}
                      {c.estado !== 'pendiente' && c.estado !== 'confirmada' && (
                        <button
                          onClick={() => eliminar(c.id_cita)}
                          className="pp-btn pp-btn-outline pp-btn-sm"
                          disabled={accionando === c.id_cita}
                        >
                          {accionando === c.id_cita ? '...' : 'Eliminar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pp-quick-actions" style={{ animationDelay: '0.4s' }}>
        <Link to="/agendar" className="pp-qa-card pp-qa-agendar pp-anim-scale" style={{ animationDelay: '0.4s' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M12 14v4M10 16h4"/>
          </svg>
          <span>Agendar Cita</span>
        </Link>
        <Link to="/mis-citas" className="pp-qa-card pp-qa-historial pp-anim-scale" style={{ animationDelay: '0.45s' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span>Historial</span>
        </Link>
        <Link to="/perfil" className="pp-qa-card pp-qa-perfil pp-anim-scale" style={{ animationDelay: '0.5s' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Mi Perfil</span>
        </Link>
      </div>
    </div>
  );
}
