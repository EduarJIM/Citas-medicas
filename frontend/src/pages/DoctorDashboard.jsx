import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DoctorDashboard() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  const hoy = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const cargar = () => {
    setLoading(true);
    api.get('/citas/mis-pacientes/').then((r) => setCitas(r.data.results)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const atender = async (id, accion) => {
    try {
      await api.patch(`/citas/${id}/atender/`, { accion });
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar la cita');
    }
  };

  const confirmar = async (id) => {
    try {
      await api.patch(`/citas/${id}/confirmar/`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al confirmar la cita');
    }
  };

  if (loading) return <LoadingSpinner text="Cargando agenda..." />;

  return (
    <div className="page-container">
      <h1>Mi Agenda - {hoy}</h1>
      {citas.length === 0 ? (
        <p className="empty">No tienes citas programadas para hoy</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Hora</th><th>Paciente</th><th>Teléfono</th><th>Estado</th><th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((c) => (
              <tr key={c.id_cita}>
                <td>{c.hora_inicio}</td>
                <td>{c.paciente_nombre}</td>
                <td>{c.paciente_telefono}</td>
                <td><span className={`badge ${c.estado === 'realizada' ? 'badge-success' : c.estado === 'no_asistio' ? 'badge-warning' : c.estado === 'cancelada' ? 'badge-danger' : 'badge-pending'}`}>{c.estado}</span></td>
                <td>
                  {(c.estado === 'pendiente' || c.estado === 'confirmada') && (
                    <>
                      {c.estado === 'pendiente' && (
                        <button onClick={() => confirmar(c.id_cita)} className="btn btn-primary btn-sm" style={{marginRight: 4}}>Confirmar</button>
                      )}
                      <button onClick={() => atender(c.id_cita, 'realizada')} className="btn btn-primary btn-sm" style={{marginRight: 4}}>Atender</button>
                      <button onClick={() => atender(c.id_cita, 'no_asistio')} className="btn btn-danger btn-sm">No Asistió</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
