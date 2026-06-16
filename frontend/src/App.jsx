import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PacientePortal = lazy(() => import('./pages/PacientePortal'));
const AgendarCita = lazy(() => import('./pages/AgendarCita'));
const MisCitas = lazy(() => import('./pages/MisCitas'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const MiPerfil = lazy(() => import('./pages/MiPerfil'));
const HistorialPaciente = lazy(() => import('./pages/HistorialPaciente'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const CambiarPassword = lazy(() => import('./pages/CambiarPassword'));

function LazyPage({ children }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/" />;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.rol === 'paciente') return <div className="pp-main-wrap"><PacientePortal /></div>;
  if (user?.rol === 'medico') return <div className="main-content"><DoctorDashboard /></div>;
  return <div className="main-content"><Dashboard /></div>;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
        <Route path="/register" element={<LazyPage><Register /></LazyPage>} />
        <Route path="/verify-email" element={<LazyPage><VerifyEmail /></LazyPage>} />
        <Route path="/verify-email/:token" element={<LazyPage><VerifyEmail /></LazyPage>} />
        <Route path="/forgot-password" element={<LazyPage><ForgotPassword /></LazyPage>} />
        <Route path="/reset-password/:token" element={<LazyPage><ResetPassword /></LazyPage>} />
        <Route path="/" element={<LazyPage><Landing /></LazyPage>} />
        <Route path="/dashboard" element={<ProtectedRoute><LazyPage><DashboardRouter /></LazyPage></ProtectedRoute>} />
        <Route path="/cambiar-password" element={<ProtectedRoute><div className="main-content"><LazyPage><CambiarPassword /></LazyPage></div></ProtectedRoute>} />
        <Route path="/agendar" element={<ProtectedRoute><div className="main-content"><LazyPage><AgendarCita /></LazyPage></div></ProtectedRoute>} />
        <Route path="/mis-citas" element={<ProtectedRoute><div className="main-content"><LazyPage><MisCitas /></LazyPage></div></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><div className="main-content"><LazyPage><AdminPanel /></LazyPage></div></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><div className="main-content"><LazyPage><MiPerfil /></LazyPage></div></ProtectedRoute>} />
        <Route path="/mis-pacientes" element={<ProtectedRoute><div className="main-content"><LazyPage><DoctorDashboard /></LazyPage></div></ProtectedRoute>} />
        <Route path="/historial-paciente/:pk" element={<ProtectedRoute><div className="main-content"><LazyPage><HistorialPaciente /></LazyPage></div></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
