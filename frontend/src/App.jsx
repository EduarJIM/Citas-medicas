import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import AgendarCita from './pages/AgendarCita';
import MisCitas from './pages/MisCitas';
import AdminPanel from './pages/AdminPanel';
import DoctorDashboard from './pages/DoctorDashboard';
import MiPerfil from './pages/MiPerfil';
import HistorialPaciente from './pages/HistorialPaciente';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute><div className="main-content"><Dashboard /></div></ProtectedRoute>} />
        <Route path="/agendar" element={<ProtectedRoute><div className="main-content"><AgendarCita /></div></ProtectedRoute>} />
        <Route path="/mis-citas" element={<ProtectedRoute><div className="main-content"><MisCitas /></div></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><div className="main-content"><AdminPanel /></div></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><div className="main-content"><MiPerfil /></div></ProtectedRoute>} />
        <Route path="/mis-pacientes" element={<ProtectedRoute><div className="main-content"><DoctorDashboard /></div></ProtectedRoute>} />
        <Route path="/historial-paciente/:pk" element={<ProtectedRoute><div className="main-content"><HistorialPaciente /></div></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
