import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  const scrollTo = (id) => {
    closeMenu();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <svg className="nav-brand-icon" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="8" y="3" width="8" height="18" rx="2"/>
            <rect x="3" y="8" width="18" height="8" rx="2"/>
          </svg>
          Citas Medicas
        </Link>
        <button className={`nav-hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          <span /><span /><span />
        </button>
        <div className={`nav-links${menuOpen ? ' nav-links-open' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" onClick={closeMenu}>Inicio</Link>
              <Link to="/agendar" onClick={closeMenu}>Agendar Cita</Link>
              <Link to="/mis-citas" onClick={closeMenu}>Mis Citas</Link>
              {user.rol === 'medico' && <Link to="/mis-pacientes" onClick={closeMenu}>Mi Panel</Link>}
              {user.rol === 'admin' && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
              <Link to="/perfil" onClick={closeMenu}>Mi Perfil</Link>
              <ThemeToggle />
              <span className="nav-user">{user.nombre_completo || user.correo}</span>
              <button onClick={handleLogout} className="btn-link">Cerrar sesión</button>
            </>
          ) : (
            <>
              <a href="#quienes-somos" onClick={(e) => { e.preventDefault(); scrollTo('quienes-somos'); }}>Quiénes Somos</a>
              <a href="#aqui-estamos" onClick={(e) => { e.preventDefault(); scrollTo('aqui-estamos'); }}>Aquí Estamos</a>
              <a href="#redes" onClick={(e) => { e.preventDefault(); scrollTo('redes'); }}>Redes</a>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
