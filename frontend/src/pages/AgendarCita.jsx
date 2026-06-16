import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, Globe, CalendarDays, Clock, FileText, CheckCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function AgendarCita() {
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [selectedEsp, setSelectedEsp] = useState('');
  const [selectedMedico, setSelectedMedico] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');
  const [selectedHorario, setSelectedHorario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [fetchError, setFetchError] = useState('');
  const [zonaHoraria, setZonaHoraria] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setFetchError('');
    api.get('/especialidades/').then((r) => setEspecialidades(r.data)).catch(() => setFetchError('Error al cargar especialidades'));
  }, []);

  useEffect(() => {
    if (selectedEsp) {
      api.get('/medicos/', { params: { especialidad: selectedEsp } })
        .then((r) => setMedicos(r.data))
        .catch(() => setFetchError('Error al cargar médicos'));
    } else {
      setMedicos([]);
    }
    setSelectedMedico('');
    setHorarios([]);
    setSelectedFecha('');
  }, [selectedEsp]);

  useEffect(() => {
    if (selectedMedico) {
      setLoadingHorarios(true);
      setFetchError('');
      api.get(`/medicos/${selectedMedico}/disponibilidad/`)
        .then((r) => {
          setHorarios(r.data);
          if (r.data.length > 0 && r.data[0].zona_horaria) {
            setZonaHoraria(r.data[0].zona_horaria);
          }
        })
        .catch(() => setFetchError('Error al cargar horarios disponibles'))
        .finally(() => setLoadingHorarios(false));
    } else {
      setHorarios([]);
      setZonaHoraria('');
    }
    setSelectedHorario('');
    setSelectedFecha('');
  }, [selectedMedico]);

  const grupos = useMemo(() => {
    const map = {};
    horarios.forEach((h) => {
      const dia = h.fecha;
      if (!map[dia]) map[dia] = [];
      map[dia].push(h);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [horarios]);

  const slotsFecha = useMemo(() => {
    if (!selectedFecha) return [];
    const g = grupos.find(([f]) => f === selectedFecha);
    return g ? g[1] : [];
  }, [selectedFecha, grupos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await api.post('/citas/', { id_horario: selectedHorario, motivo });
      setMsg({ type: 'success', text: 'Cita agendada exitosamente' });
      setTimeout(() => navigate('/mis-citas'), 1500);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Error al agendar cita' });
    }
  };

  return (
    <div className="agendar-wrapper">
      <div className="agendar-card">
        <h2><CalendarDays size={20} className="agendar-title-icon" /> Agendar Cita</h2>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        {fetchError && <div className="alert alert-error">{fetchError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="agendar-row">
            <div className="agendar-field">
              <label><Stethoscope size={14} /> Especialidad</label>
              <select value={selectedEsp} onChange={(e) => setSelectedEsp(e.target.value)} required>
                <option value="">Seleccione especialidad</option>
                {especialidades.map((e) => (
                  <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div className="agendar-field">
              <label><User size={14} /> Médico</label>
              <select value={selectedMedico} onChange={(e) => setSelectedMedico(e.target.value)} required disabled={!selectedEsp}>
                <option value="">Seleccione médico</option>
                {medicos.map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>{m.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>

          {zonaHoraria && (
            <div className="agendar-zona-horaria">
              <Globe size={14} /> {zonaHoraria}
            </div>
          )}

          {loadingHorarios && (
            <div className="agendar-loading">
              <Loader2 size={20} className="agendar-spinner" /> Cargando horarios disponibles...
            </div>
          )}

          {selectedMedico && !loadingHorarios && horarios.length > 0 && (
            <>
              <div className="agendar-dias-label"><CalendarDays size={14} /> Selecciona un día</div>
              <div className="agendar-dias">
                {grupos.map(([fecha]) => {
                  const d = new Date(fecha + 'T12:00:00');
                  return (
                    <button
                      key={fecha}
                      type="button"
                      className={`agendar-dia${selectedFecha === fecha ? ' active' : ''}`}
                      onClick={() => { setSelectedFecha(fecha); setSelectedHorario(''); }}
                    >
                      <span className="agendar-dia-nombre">{DIAS_CORTO[d.getDay()]}</span>
                      <span className="agendar-dia-num">{d.getDate()}</span>
                      <span className="agendar-dia-mes">{MESES[d.getMonth()]}</span>
                    </button>
                  );
                })}
              </div>

              {selectedFecha && (
                <>
                  <div className="agendar-horarios-label">
                    <Clock size={14} /> Horarios —{' '}
                    {(() => {
                      const d = new Date(selectedFecha + 'T12:00:00');
                      return `${DIAS_CORTO[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
                    })()}
                  </div>
                  <div className="agendar-horarios">
                    {slotsFecha.map((h) => (
                      <button
                        type="button"
                        key={h.id_horario}
                        className={`agendar-horario${selectedHorario === h.id_horario ? ' selected' : ''}`}
                        onClick={() => setSelectedHorario(h.id_horario)}
                      >
                        <Clock size={12} className="agendar-horario-icon" />
                        {h.hora_inicio.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {selectedMedico && !loadingHorarios && horarios.length === 0 && !fetchError && (
            <div className="agendar-loading agendar-loading-empty">
              <CalendarDays size={24} />
              <span>No hay horarios disponibles</span>
            </div>
          )}

          <div className="agendar-footer">
            <div className="agendar-motivo-wrap">
              <FileText size={16} className="agendar-motivo-icon" />
              <input
                className="agendar-motivo"
                placeholder="Motivo de la consulta (opcional)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary agendar-btn" disabled={!selectedHorario}>
              <CheckCircle size={18} /> Confirmar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
