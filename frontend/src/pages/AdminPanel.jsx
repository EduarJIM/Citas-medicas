import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminPanel() {
  const [tab, setTab] = useState('medicos');
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [reporteEsp, setReporteEsp] = useState([]);
  const [reporteNoAsistencia, setReporteNoAsistencia] = useState([]);

  useEffect(() => {
    api.get('/medicos/').then((r) => setMedicos(r.data)).catch(() => {});
    api.get('/especialidades/').then((r) => setEspecialidades(r.data)).catch(() => {});
  }, []);

  const cargarReportes = () => {
    api.get('/reportes/citas-por-especialidad/').then((r) => setReporteEsp(r.data)).catch(() => {});
    api.get('/reportes/tasa-no-asistencia/').then((r) => setReporteNoAsistencia(r.data)).catch(() => {});
  };

  return (
    <div className="page-container">
      <h1>Panel de Administración</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'medicos' ? 'active' : ''}`} onClick={() => setTab('medicos')}>Médicos</button>
        <button className={`tab ${tab === 'especialidades' ? 'active' : ''}`} onClick={() => setTab('especialidades')}>Especialidades</button>
        <button className={`tab ${tab === 'reportes' ? 'active' : ''}`} onClick={() => { setTab('reportes'); cargarReportes(); }}>Reportes</button>
      </div>

      {tab === 'medicos' && (
        <div>
          <h2>Médicos Registrados</h2>
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>Registro</th><th>Consultorio</th><th>Estado</th><th>Especialidades</th></tr>
            </thead>
            <tbody>
              {medicos.map((m) => (
                <tr key={m.id_medico}>
                  <td>{m.nombre_completo}</td>
                  <td>{m.registro_profesional}</td>
                  <td>{m.consultorio}</td>
                  <td><span className="badge badge-pending">{m.estado}</span></td>
                  <td>{(m.especialidades || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'especialidades' && (
        <div>
          <h2>Especialidades</h2>
          <table className="table">
            <thead><tr><th>ID</th><th>Nombre</th></tr></thead>
            <tbody>
              {especialidades.map((e) => (
                <tr key={e.id_especialidad}><td>{e.id_especialidad}</td><td>{e.nombre}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reportes' && (
        <div>
          <h2>Citas por Especialidad</h2>
          <table className="table">
            <thead><tr><th>Especialidad</th><th>Total</th><th>Realizadas</th><th>Canceladas</th></tr></thead>
            <tbody>
              {reporteEsp.map((r, i) => (
                <tr key={i}><td>{r.especialidad}</td><td>{r.total}</td><td>{r.realizadas}</td><td>{r.canceladas}</td></tr>
              ))}
            </tbody>
          </table>
          <h2 style={{ marginTop: '2rem' }}>Tasa de No Asistencia por Médico</h2>
          <table className="table">
            <thead><tr><th>Médico</th><th>No Asistieron</th><th>Realizadas</th><th>Tasa</th></tr></thead>
            <tbody>
              {reporteNoAsistencia.map((r, i) => (
                <tr key={i}><td>{r.medico}</td><td>{r.no_asistio}</td><td>{r.realizadas}</td><td>{r.tasa_no_asistencia}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
