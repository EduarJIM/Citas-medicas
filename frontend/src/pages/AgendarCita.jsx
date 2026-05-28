import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

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
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/especialidades/').then((r) => setEspecialidades(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedEsp) {
      api.get('/medicos/', { params: { especialidad: selectedEsp } })
        .then((r) => setMedicos(r.data))
        .catch(() => {});
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
      api.get(`/medicos/${selectedMedico}/disponibilidad/`)
        .then((r) => setHorarios(r.data))
        .catch(() => {})
        .finally(() => setLoadingHorarios(false));
    } else {
      setHorarios([]);
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
        <h2>Agendar Cita</h2>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit}>
          <div className="agendar-row">
            <div className="agendar-field">
              <label>Especialidad</label>
              <select value={selectedEsp} onChange={(e) => setSelectedEsp(e.target.value)} required>
                <option value="">Seleccione</option>
                {especialidades.map((e) => (
                  <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div className="agendar-field">
              <label>Médico</label>
              <select value={selectedMedico} onChange={(e) => setSelectedMedico(e.target.value)} required disabled={!selectedEsp}>
                <option value="">Seleccione</option>
                {medicos.map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>{m.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedMedico && !loadingHorarios && horarios.length > 0 && (
            <>
              <div className="agendar-dias">
                {grupos.map(([fecha]) => (
                  <button
                    key={fecha}
                    type="button"
                    className={`agendar-dia${selectedFecha === fecha ? ' active' : ''}`}
                    onClick={() => { setSelectedFecha(fecha); setSelectedHorario(''); }}
                  >
                    <span className="agendar-dia-num">
                      {new Date(fecha + 'T12:00:00').getDate()}
                    </span>
                    <span className="agendar-dia-nombre">
                      {new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).replace('.','')}
                    </span>
                  </button>
                ))}
              </div>

              {selectedFecha && (
                <div className="agendar-horarios">
                  {slotsFecha.map((h) => (
                    <button
                      type="button"
                      key={h.id_horario}
                      className={`agendar-horario${selectedHorario === h.id_horario ? ' selected' : ''}`}
                      onClick={() => setSelectedHorario(h.id_horario)}
                    >
                      {h.hora_inicio.slice(0, 5)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedMedico && loadingHorarios && (
            <div className="agendar-loading">Cargando horarios<span className="spinner-inline" /></div>
          )}

          {selectedMedico && !loadingHorarios && horarios.length === 0 && (
            <div className="agendar-loading">No hay horarios disponibles</div>
          )}

          <div className="agendar-footer">
            <input
              className="agendar-motivo"
              placeholder="Motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <button type="submit" className="btn btn-primary agendar-btn" disabled={!selectedHorario}>
              Confirmar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
