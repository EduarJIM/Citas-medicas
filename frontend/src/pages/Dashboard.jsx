import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [nextCitas, setNextCitas] = useState([]);

  useEffect(() => {
    api.get('/citas/', { params: { estado: 'pendiente' } })
      .then((res) => setNextCitas(res.data.slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <div className="dashboard">
      <h1>Bienvenido, {user?.nombre_completo || user?.correo}</h1>
      <p className="rol-badge">{user?.rol}</p>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Agendar Cita</h3>
          <p>Reserva una cita con un especialista</p>
          <Link to="/agendar" className="btn btn-primary">Agendar</Link>
        </div>
        <div className="card">
          <h3>Mis Citas</h3>
          <p>Consulta tus citas programadas</p>
          <Link to="/mis-citas" className="btn btn-secondary">Ver citas</Link>
        </div>
        {user?.rol === 'admin' && (
          <div className="card">
            <h3>Administración</h3>
            <p>Gestiona usuarios, médicos y reportes</p>
            <Link to="/admin" className="btn btn-secondary">Panel</Link>
          </div>
        )}
      </div>

      {nextCitas.length > 0 && (
        <div className="next-citas">
          <h2>Próximas Citas</h2>
          <table className="table">
            <thead>
              <tr><th>Fecha</th><th>Hora</th><th>Médico</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {nextCitas.map((c) => (
                <tr key={c.id_cita}>
                  <td>{c.fecha}</td>
                  <td>{c.hora_inicio}</td>
                  <td>{c.medico_nombre}</td>
                  <td><span className="badge badge-pending">{c.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
