import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const exportarCSV = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const resp = await fetch('http://127.0.0.1:8000/api/reportes/exportar/csv/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_citas.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error al exportar');
  }
};

export default function AdminPanel() {
  const [tab, setTab] = useState('medicos');
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [reporteEsp, setReporteEsp] = useState([]);
  const [reporteNoAsistencia, setReporteNoAsistencia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/medicos/'),
      api.get('/especialidades/')
    ]).then(([m, e]) => {
      setMedicos(m.data.results);
      setEspecialidades(e.data.results);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando panel..." />;

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
          <button onClick={exportarCSV} className="btn btn-primary btn-sm" style={{marginBottom:'1rem'}}>
            Exportar CSV
          </button>
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
