import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AgendarCita from './pages/AgendarCita';
import MisCitas from './pages/MisCitas';
import AdminPanel from './pages/AdminPanel';
import DoctorDashboard from './pages/DoctorDashboard';
import MiPerfil from './pages/MiPerfil';
import MisRecetas from './pages/MisRecetas';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/agendar" element={<ProtectedRoute><AgendarCita /></ProtectedRoute>} />
          <Route path="/mis-citas" element={<ProtectedRoute><MisCitas /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><MiPerfil /></ProtectedRoute>} />
          <Route path="/mis-recetas" element={<ProtectedRoute><MisRecetas /></ProtectedRoute>} />
          <Route path="/mis-pacientes" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}
