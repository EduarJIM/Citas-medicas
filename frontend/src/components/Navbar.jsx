import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">Citas Médicas</Link>
        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/agendar">Agendar Cita</Link>
          <Link to="/mis-citas">Mis Citas</Link>
          {user.rol === 'admin' && <Link to="/admin">Admin</Link>}
          <span className="nav-user">{user.nombre_completo || user.correo}</span>
          <button onClick={handleLogout} className="btn-link">Cerrar sesión</button>
        </div>
      </div>
    </nav>
  );
}
