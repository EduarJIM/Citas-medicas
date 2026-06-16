import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ correo: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [emailNoVerificado, setEmailNoVerificado] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [mensajeReenvio, setMensajeReenvio] = useState('');
  const [touched, setTouched] = useState({});
  const [bloqueado, setBloqueado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const timerRef = useRef(null);
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const iniciarCuentaRegresiva = (segundos) => {
    setSegundosRestantes(segundos);
    setBloqueado(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); setBloqueado(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const validations = {
    correo: (v) => {
      if (!v.trim()) return 'El correo electrónico es obligatorio';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresa un correo electrónico válido';
      return '';
    },
    password: (v) => {
      if (!v) return 'La contraseña es obligatoria';
      return '';
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validations[name](value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validations[name](value) }));
  };

  const validateAll = () => {
    const newErrors = {};
    for (const key of Object.keys(validations)) newErrors[key] = validations[key](form[key]);
    setErrors(newErrors);
    setTouched({ correo: true, password: true });
    return Object.values(newErrors).every((v) => !v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setEmailNoVerificado('');
    setMensajeReenvio('');
    if (!validateAll()) return;
    try {
      await login(form.correo, form.password);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.codigo === 'email_no_verificado') {
        setEmailNoVerificado(form.correo);
        setServerError(data.error);
      } else if (data?.bloqueado && data?.segundos_restantes) {
        iniciarCuentaRegresiva(data.segundos_restantes);
        setServerError(data.error);
      } else if (data?.bloqueado) {
        setBloqueado(true);
        setServerError(data.error);
      } else {
        setServerError(data?.error || data?.detail || 'Credenciales invalidas');
      }
    }
  };

  const handleResend = async () => {
    setReenviando(true);
    setMensajeReenvio('');
    try {
      const res = await resendVerification(emailNoVerificado);
      setMensajeReenvio(res.mensaje || 'Enlace reenviado. Revisa tu correo.');
    } catch {
      setMensajeReenvio('Error al reenviar. Intenta de nuevo mas tarde.');
    } finally { setReenviando(false); }
  };

  const formatearTiempo = (s) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-shape" />
      <div className="auth-shape-2" />
      <div className="auth-card">
        <div className="auth-icon-wrap">
          <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3">
            <rect x="22" y="8" width="20" height="48" rx="4"/>
            <rect x="8" y="22" width="48" height="20" rx="4"/>
          </svg>
        </div>
        <h2>Iniciar Sesion</h2>

        {serverError && (
          <div className={`alert ${bloqueado ? 'alert-error' : 'alert-error'}`}>
            {serverError}
            {bloqueado && segundosRestantes > 0 && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{formatearTiempo(segundosRestantes)}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tiempo restante</div>
              </div>
            )}
          </div>
        )}

        {emailNoVerificado && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button className="btn btn-secondary btn-block" onClick={handleResend} disabled={reenviando}>
              {reenviando ? 'Reenviando...' : 'Reenviar enlace de verificacion'}
            </button>
            <Link to={`/verify-email?correo=${encodeURIComponent(emailNoVerificado)}`} style={{ display: 'block', marginTop: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              Ir a pagina de verificacion
            </Link>
            {mensajeReenvio && (
              <p className={mensajeReenvio.includes('Error') ? 'alert alert-error' : 'alert alert-success'} style={{ marginTop: '0.5rem' }}>
                {mensajeReenvio}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group${errors.correo && touched.correo ? ' has-error' : ''}`}>
            <label htmlFor="login-correo">Correo electronico</label>
            <input id="login-correo" name="correo" type="email" value={form.correo} onChange={handleChange} onBlur={handleBlur} placeholder="Correo electronico" autoComplete="email" disabled={bloqueado} />
            {errors.correo && touched.correo && <span className="field-error">{errors.correo}</span>}
          </div>
          <div className={`form-group${errors.password && touched.password ? ' has-error' : ''}`}>
            <label htmlFor="login-password">Contrasena</label>
            <input id="login-password" name="password" type="password" value={form.password} onChange={handleChange} onBlur={handleBlur} placeholder="Contrasena" autoComplete="current-password" disabled={bloqueado} />
            {errors.password && touched.password && <span className="field-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={bloqueado}>Ingresar</button>
          <div style={{ textAlign: 'center', marginTop: '0.6rem' }}>
            <Link to="/forgot-password" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              Olvidaste tu contrasena?
            </Link>
          </div>
        </form>
        <p className="auth-footer">
          No tienes cuenta? <Link to="/register">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
