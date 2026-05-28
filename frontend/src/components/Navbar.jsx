import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

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
        <Link to="/" className="nav-brand">
          <svg className="nav-brand-icon" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="8" y="3" width="8" height="18" rx="2"/>
            <rect x="3" y="8" width="18" height="8" rx="2"/>
          </svg>
          Citas Medicas
        </Link>
        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <Link to="/agendar">Agendar Cita</Link>
          <Link to="/mis-citas">Mis Citas</Link>
          <Link to="/mis-recetas">Mis Recetas</Link>
          {user.rol === 'medico' && <Link to="/mis-pacientes">Mis Pacientes</Link>}
          {user.rol === 'admin' && <Link to="/admin">Admin</Link>}
          <Link to="/perfil">Mi Perfil</Link>
          <ThemeToggle />
          <span className="nav-user">{user.nombre_completo || user.correo}</span>
          <button onClick={handleLogout} className="btn-link">Cerrar sesión</button>
        </div>
      </div>
    </nav>
  );
}
