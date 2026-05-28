import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('tabla');
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtro) params.estado = filtro;
    api.get('/citas/', { params }).then((r) => setCitas(r.data.results)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtro]);

  const citasByDate = useMemo(() => {
    const map = {};
    citas.forEach((c) => {
      if (!map[c.fecha]) map[c.fecha] = [];
      map[c.fecha].push(c);
    });
    return map;
  }, [citas]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

  const calDays = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calDays.push({ day: prevMonthDays - i, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calDays.push({ day: d, date: dateStr, other: false });
  }
  while (calDays.length % 7 !== 0) {
    calDays.push({ day: (calDays.length - daysInMonth - firstDayOfWeek) % 7 + 1, other: true });
  }

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const selectedCitas = selectedDay ? (citasByDate[selectedDay] || []) : [];

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

      {citas.length > 0 && (
        <div className="vista-toggle">
          <button className={`vista-btn ${vista === 'tabla' ? 'active' : ''}`} onClick={() => setVista('tabla')}>Vista Tabla</button>
          <button className={`vista-btn ${vista === 'calendario' ? 'active' : ''}`} onClick={() => setVista('calendario')}>Vista Calendario</button>
        </div>
      )}

      {citas.length === 0 ? (
        <p className="empty">No hay citas {filtro ? `en estado "${filtro}"` : ''}</p>
      ) : vista === 'tabla' ? (
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
      ) : (
        <div>
          <div className="calendar-header">
            <button className="calendar-nav" onClick={handlePrevMonth}>&larr;</button>
            <h3>{MONTHS[calMonth]} {calYear}</h3>
            <button className="calendar-nav" onClick={handleNextMonth}>&rarr;</button>
          </div>

          <div className="calendar-grid">
            {DAYS.map((d) => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            {calDays.map((cd, i) => {
              const hasCitas = cd.date && citasByDate[cd.date];
              const isToday = cd.date === todayStr;
              const isSelected = cd.date === selectedDay;
              let cls = 'calendar-day';
              if (cd.other) cls += ' other-month';
              if (isToday) cls += ' today';
              if (hasCitas) cls += ' has-citas';
              if (isSelected) cls += ' selected';
              return (
                <div
                  key={i}
                  className={cls}
                  onClick={() => cd.date && setSelectedDay(cd.date === selectedDay ? null : cd.date)}
                >
                  {cd.day}
                  {hasCitas && <div className="calendar-day-dot" />}
                </div>
              );
            })}
          </div>

          {selectedDay && (
            <div className="calendar-day-citas">
              <h4>Citas del {selectedDay}</h4>
              {selectedCitas.length === 0 ? (
                <p className="empty" style={{padding:'1rem'}}>No hay citas este día</p>
              ) : (
                selectedCitas.map((c) => (
                  <div key={c.id_cita} className="calendar-cita-card">
                    <p><strong>{c.hora_inicio}</strong> - {c.medico_nombre}</p>
                    <p><span className="label">Especialidad:</span> {c.especialidad}</p>
                    <p><span className="label">Estado:</span> <span className={getBadgeClass(c.estado)}>{c.estado}</span></p>
                    <p><span className="label">Motivo:</span> {c.motivo}</p>
                    <div style={{marginTop:'0.5rem'}}>
                      {c.estado === 'pendiente' && (
                        <button onClick={() => cancelar(c.id_cita)} className="btn btn-danger btn-sm" style={{marginRight:4}}>
                          Cancelar
                        </button>
                      )}
                      {c.estado !== 'pendiente' && (
                        <button onClick={() => eliminar(c.id_cita)} className="btn btn-secondary btn-sm">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
