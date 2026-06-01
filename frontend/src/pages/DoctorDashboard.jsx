import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'agenda', label: 'Agenda de Hoy' },
  { key: 'citas', label: 'Mis Citas' },
  { key: 'disponibilidad', label: 'Disponibilidad' },
  { key: 'pacientes', label: 'Mis Pacientes' },
  { key: 'perfil', label: 'Mi Perfil' },
];

const getBadgeClass = (estado) => {
  const map = { pendiente: 'badge-pending', confirmada: 'badge-pending', realizada: 'badge-success', cancelada: 'badge-danger', no_asistio: 'badge-warning' };
  return `badge ${map[estado] || 'badge-pending'}`;
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [misCitas, setMisCitas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');

  const hoy = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const cargarPerfil = useCallback(async () => {
    try {
      const res = await api.get('/medicos/mi-perfil/');
      setPerfil(res.data);
      return res.data;
    } catch { return null; }
  }, []);

  const cargarCitasHoy = useCallback(() => {
    return api.get('/citas/mis-pacientes/').then(r => setCitasHoy(r.data)).catch(() => {});
  }, []);

  const cargarMisCitas = useCallback(() => {
    const params = {};
    if (filtroEstado) params.estado = filtroEstado;
    return api.get('/citas/mis-citas-medico/', { params }).then(r => setMisCitas(r.data)).catch(() => {});
  }, [filtroEstado]);

  const cargarHorarios = useCallback(async (medicoPk) => {
    try {
      const res = await api.get(`/medicos/${medicoPk}/disponibilidad/`);
      setHorarios(res.data);
    } catch { setHorarios([]); }
  }, []);

  const cargarPacientes = useCallback(() => {
    return api.get('/citas/pacientes-medico/').then(r => setPacientes(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    cargarPerfil().then(medico => {
      const promises = [cargarCitasHoy(), cargarPacientes()];
      if (medico) promises.push(cargarHorarios(medico.id_medico));
      Promise.all(promises).finally(() => setLoading(false));
    });
  }, [cargarPerfil, cargarCitasHoy, cargarPacientes, cargarHorarios]);

  useEffect(() => {
    if (tab === 'citas') cargarMisCitas();
  }, [tab, cargarMisCitas]);

  const atender = async (id, accion) => {
    try {
      await api.patch(`/citas/${id}/atender/`, { accion });
      cargarCitasHoy();
      cargarMisCitas();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar la cita');
    }
  };

  const confirmar = async (id) => {
    try {
      await api.patch(`/citas/${id}/confirmar/`);
      cargarCitasHoy();
      cargarMisCitas();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al confirmar la cita');
    }
  };

  const cancelarCita = async (id) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await api.delete(`/citas/${id}/`);
      cargarCitasHoy();
      cargarMisCitas();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar');
    }
  };

  const eliminarHorario = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/medicos/${perfil.id_medico}/disponibilidad/${id}/`);
      cargarHorarios(perfil.id_medico);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const [showFormHorario, setShowFormHorario] = useState(false);
  const [formHorario, setFormHorario] = useState({
    fecha: '', hora_inicio: '', hora_fin: '', duracion_minutos: 30,
  });
  const [creando, setCreando] = useState(false);

  const crearHorarios = async (e) => {
    e.preventDefault();
    setCreando(true);
    try {
      await api.post(`/medicos/${perfil.id_medico}/disponibilidad/create/`, formHorario);
      setShowFormHorario(false);
      setFormHorario({ fecha: '', hora_inicio: '', hora_fin: '', duracion_minutos: 30 });
      cargarHorarios(perfil.id_medico);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear horarios');
    } finally {
      setCreando(false);
    }
  };

  const verHistorial = (pacienteId) => {
    navigate(`/historial-paciente/${pacienteId}`);
  };

  if (loading) return <LoadingSpinner text="Cargando panel médico..." />;

  const stats = (() => {
    const hoyCount = citasHoy.length;
    const pendientes = misCitas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
    const realizadas = misCitas.filter(c => c.estado === 'realizada').length;
    return { hoyCount, pendientes, realizadas, totalPacientes: pacientes.length };
  })();

  const agruparHorarios = (horarios) => {
    const map = {};
    horarios.forEach(h => {
      const dia = h.fecha;
      if (!map[dia]) map[dia] = [];
      map[dia].push(h);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="page-container">
      <div className="doctor-header">
        <div>
          <h1>Panel del Médico</h1>
          <p className="doctor-subtitle">{perfil?.nombre_completo} — {perfil?.consultorio ? `Consultorio ${perfil.consultorio}` : perfil?.registro_profesional}</p>
        </div>
        <span className="rol-badge">Médico</span>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="fade-in">
          <div className="dashboard-grid">
            <div className="card card-hover">
              <div className="card-icon card-icon-blue" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats.hoyCount}
              </div>
              <h3>Citas Hoy</h3>
              <p>Pacientes programados para hoy</p>
            </div>
            <div className="card card-hover">
              <div className="card-icon card-icon-green" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats.pendientes}
              </div>
              <h3>Pendientes</h3>
              <p>Citas pendientes o por confirmar</p>
            </div>
            <div className="card card-hover">
              <div className="card-icon card-icon-purple" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats.realizadas}
              </div>
              <h3>Atendidas</h3>
              <p>Citas realizadas exitosamente</p>
            </div>
            <div className="card card-hover">
              <div className="card-icon" style={{
                fontSize: '1.5rem', fontWeight: 700, background: '#fff0d9', color: '#b45a00',
                width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {stats.totalPacientes}
              </div>
              <h3>Pacientes</h3>
              <p>Pacientes atendidos en total</p>
            </div>
          </div>

          {citasHoy.length > 0 && (
            <div className="next-citas slide-up">
              <h2>Próximas Citas de Hoy</h2>
              <table className="table">
                <thead>
                  <tr><th>Hora</th><th>Paciente</th><th>Teléfono</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {citasHoy.slice(0, 5).map(c => (
                    <tr key={c.id_cita}>
                      <td>{c.hora_inicio}</td>
                      <td>{c.paciente_nombre}</td>
                      <td>{c.paciente_telefono}</td>
                      <td><span className={getBadgeClass(c.estado)}>{c.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'agenda' && (
        <div className="fade-in">
          <h2>Agenda del Día — {hoy}</h2>
          {citasHoy.length === 0 ? (
            <p className="empty">No tienes citas programadas para hoy</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Hora</th><th>Paciente</th><th>Teléfono</th><th>Estado</th><th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {citasHoy.map(c => (
                  <tr key={c.id_cita}>
                    <td>{c.hora_inicio}</td>
                    <td>{c.paciente_nombre}</td>
                    <td>{c.paciente_telefono}</td>
                    <td><span className={getBadgeClass(c.estado)}>{c.estado}</span></td>
                    <td>
                      {(c.estado === 'pendiente' || c.estado === 'confirmada') && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {c.estado === 'pendiente' && (
                            <button onClick={() => confirmar(c.id_cita)} className="btn btn-primary btn-sm">Confirmar</button>
                          )}
                          <button onClick={() => atender(c.id_cita, 'realizada')} className="btn btn-primary btn-sm">Atender</button>
                          <button onClick={() => atender(c.id_cita, 'no_asistio')} className="btn btn-danger btn-sm">No Asistió</button>
                        </div>
                      )}
                      {c.estado === 'realizada' && <span className="badge badge-success">Completada</span>}
                      {c.estado === 'no_asistio' && <span className="badge badge-warning">No asistió</span>}
                      {c.estado === 'cancelada' && <span className="badge badge-danger">Cancelada</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'citas' && (
        <div className="fade-in">
          <div className="filters">
            <label>Filtrar por estado:</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="realizada">Realizadas</option>
              <option value="cancelada">Canceladas</option>
              <option value="no_asistio">No asistió</option>
            </select>
          </div>
          {misCitas.length === 0 ? (
            <p className="empty">No hay citas {filtroEstado ? `en estado "${filtroEstado}"` : ''}</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th><th>Hora</th><th>Paciente</th><th>Teléfono</th><th>Estado</th><th>Motivo</th><th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {misCitas.map(c => (
                  <tr key={c.id_cita}>
                    <td>{c.fecha}</td>
                    <td>{c.hora_inicio}</td>
                    <td>{c.paciente_nombre}</td>
                    <td>{c.paciente_telefono}</td>
                    <td><span className={getBadgeClass(c.estado)}>{c.estado}</span></td>
                    <td>{c.motivo || '—'}</td>
                    <td>
                      {(c.estado === 'pendiente' || c.estado === 'confirmada') && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {c.estado === 'pendiente' && (
                            <button onClick={() => confirmar(c.id_cita)} className="btn btn-primary btn-sm">Confirmar</button>
                          )}
                          <button onClick={() => atender(c.id_cita, 'realizada')} className="btn btn-primary btn-sm">Atender</button>
                          <button onClick={() => cancelarCita(c.id_cita)} className="btn btn-danger btn-sm">Cancelar</button>
                        </div>
                      )}
                      {c.estado === 'realizada' && <span className="badge badge-success">Atendida</span>}
                      {c.estado === 'no_asistio' && <span className="badge badge-warning">No asistió</span>}
                      {c.estado === 'cancelada' && <span className="badge badge-danger">Cancelada</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'disponibilidad' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Mi Disponibilidad</h2>
            <button onClick={() => setShowFormHorario(!showFormHorario)} className="btn btn-primary btn-sm">
              {showFormHorario ? 'Cancelar' : '+ Agregar Horarios'}
            </button>
          </div>

          {showFormHorario && (
            <div className="card" style={{ marginBottom: '1rem', padding: '1.2rem' }}>
              <h3 style={{ marginBottom: '0.8rem' }}>Crear Bloques de Disponibilidad</h3>
              <form onSubmit={crearHorarios} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: 150, margin: 0 }}>
                    <label>Fecha</label>
                    <input type="date" value={formHorario.fecha} onChange={e => setFormHorario({...formHorario, fecha: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 120, margin: 0 }}>
                    <label>Hora inicio</label>
                    <input type="time" value={formHorario.hora_inicio} onChange={e => setFormHorario({...formHorario, hora_inicio: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 120, margin: 0 }}>
                    <label>Hora fin</label>
                    <input type="time" value={formHorario.hora_fin} onChange={e => setFormHorario({...formHorario, hora_fin: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 100, margin: 0 }}>
                    <label>Duración (min)</label>
                    <select value={formHorario.duracion_minutos} onChange={e => setFormHorario({...formHorario, duracion_minutos: Number(e.target.value)})}>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={creando}>
                  {creando ? 'Creando...' : 'Generar Bloques'}
                </button>
              </form>
            </div>
          )}

          {horarios.length === 0 ? (
            <p className="empty">No has configurado disponibilidad aún</p>
          ) : (
            <div>
              {agruparHorarios(horarios).map(([fecha, slots]) => (
                <div key={fecha} className="card" style={{ marginBottom: '0.75rem', padding: '0.8rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </strong>
                    <span className="badge badge-pending">{slots.length} bloques</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {slots.map(h => (
                      <div key={h.id_horario} className="horario-slot" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.25rem 0.5rem', border: '1px solid var(--border-color)',
                        borderRadius: '6px', fontSize: '0.82rem', background: h.disponible ? 'var(--bg-card)' : '#fce8e6'
                      }}>
                        <span>{h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)}</span>
                        {h.disponible ? (
                          <button onClick={() => eliminarHorario(h.id_horario)} className="btn-link" style={{
                            color: '#d93025', border: 'none', padding: '0.1rem 0.3rem', fontSize: '0.75rem'
                          }}>✕</button>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#c5221f' }}>Ocupado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'pacientes' && (
        <div className="fade-in">
          <h2>Mis Pacientes</h2>
          {pacientes.length === 0 ? (
            <p className="empty">Aún no has atendido pacientes</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th><th>Documento</th><th>Teléfono</th><th>Correo</th><th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map(p => (
                  <tr key={p.id_usuario}>
                    <td>{p.nombre_completo}</td>
                    <td>{p.documento}</td>
                    <td>{p.telefono || '—'}</td>
                    <td>{p.correo}</td>
                    <td>
                      <button onClick={() => verHistorial(p.id_usuario)} className="btn btn-primary btn-sm">
                        Ver Historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'perfil' && perfil && (
        <div className="fade-in">
          <div className="auth-container" style={{ minHeight: 'auto' }}>
            <div className="auth-card" style={{ maxWidth: 500 }}>
              <h2>Mi Perfil Profesional</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input type="text" value={perfil.nombre_completo} disabled />
                </div>
                <div className="form-group">
                  <label>Correo electrónico</label>
                  <input type="email" value={perfil.correo} disabled />
                </div>
                <div className="form-group">
                  <label>Registro Profesional</label>
                  <input type="text" value={perfil.registro_profesional || '—'} disabled />
                </div>
                <div className="form-group">
                  <label>Consultorio</label>
                  <input type="text" value={perfil.consultorio || '—'} disabled />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input type="text" value={perfil.estado} disabled />
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Para actualizar tus datos, ve a <a href="/perfil" onClick={e => { e.preventDefault(); navigate('/perfil'); }} style={{ color: '#1a73e8', cursor: 'pointer' }}>Mi Perfil</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
