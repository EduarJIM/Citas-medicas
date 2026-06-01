import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HistorialPaciente() {
  const { pk } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/pacientes/${pk}/historial/`)
      .then(r => setData(r.data))
      .catch(() => alert('Error al cargar historial'))
      .finally(() => setLoading(false));
  }, [pk]);

  if (loading) return <LoadingSpinner text="Cargando historial..." />;
  if (!data) return <p className="empty">No se encontró el paciente</p>;

  return (
    <div className="page-container">
      <button onClick={() => navigate('/mis-pacientes')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        &larr; Volver a Mis Pacientes
      </button>
      <h1>Historial de {data.paciente_nombre}</h1>
      {data.citas.length === 0 ? (
        <p className="empty">Este paciente no tiene citas registradas</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th><th>Hora</th><th>Estado</th><th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {data.citas.map(c => (
              <tr key={c.id_cita}>
                <td>{c.fecha}</td>
                <td>{c.hora_inicio}</td>
                <td><span className={`badge ${c.estado === 'realizada' ? 'badge-success' : c.estado === 'cancelada' ? 'badge-danger' : c.estado === 'no_asistio' ? 'badge-warning' : 'badge-pending'}`}>{c.estado}</span></td>
                <td>{c.motivo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
