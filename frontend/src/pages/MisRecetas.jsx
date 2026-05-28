import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MisRecetas() {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recetas/').then((r) => setRecetas(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Cargando recetas..." />;

  return (
    <div className="page-container">
      <h1>Mis Recetas</h1>
      {recetas.length === 0 ? (
        <p className="empty">No hay recetas registradas</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Medicamento</th><th>Dosis</th><th>Frecuencia</th>
              <th>Duración</th><th>Indicaciones</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recetas.map((r) => (
              <tr key={r.id_receta}>
                <td>{r.medicamento}</td>
                <td>{r.dosis}</td>
                <td>{r.frecuencia}</td>
                <td>{r.duracion || '—'}</td>
                <td>{r.indicaciones || '—'}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
