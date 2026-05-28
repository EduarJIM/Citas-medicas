import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AgendarCita() {
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [selectedEsp, setSelectedEsp] = useState('');
  const [selectedMedico, setSelectedMedico] = useState('');
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
  }, [selectedEsp]);

  useEffect(() => {
    if (selectedMedico) {
      api.get(`/medicos/${selectedMedico}/disponibilidad/`)
        .then((r) => setHorarios(r.data))
        .catch(() => {});
    } else {
      setHorarios([]);
    }
    setSelectedHorario('');
  }, [selectedMedico]);

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
    <div className="page-container">
      <h1>Agendar Cita</h1>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Especialidad</label>
          <select value={selectedEsp} onChange={(e) => setSelectedEsp(e.target.value)} required>
            <option value="">Seleccione especialidad</option>
            {especialidades.map((e) => (
              <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Médico</label>
          <select value={selectedMedico} onChange={(e) => setSelectedMedico(e.target.value)} required disabled={!selectedEsp}>
            <option value="">Seleccione médico</option>
            {medicos.map((m) => (
              <option key={m.id_medico} value={m.id_medico}>{m.nombre_completo}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Horario disponible</label>
          <select value={selectedHorario} onChange={(e) => setSelectedHorario(e.target.value)} required disabled={!selectedMedico}>
            <option value="">Seleccione horario</option>
            {horarios.map((h) => (
              <option key={h.id_horario} value={h.id_horario}>
                {h.fecha} - {h.hora_inicio} a {h.hora_fin}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Motivo (opcional)</label>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows="3" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!selectedHorario}>
          Confirmar Cita
        </button>
      </form>
    </div>
  );
}
