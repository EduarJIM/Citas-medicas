import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const validations = {
  nombre_completo: (v) => (!v.trim() ? 'El nombre completo es obligatorio' : ''),
  documento: (v) => (!v.trim() ? 'El documento es obligatorio' : ''),
  correo: (v) => {
    if (!v.trim()) return 'El correo electrónico es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresa un correo electrónico válido';
    return '';
  },
  password: (v) => {
    if (!v) return 'La contraseña es obligatoria';
    if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(v)) return 'Debe contener al menos una mayúscula';
    if (!/[0-9]/.test(v)) return 'Debe contener al menos un número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) return 'Debe contener al menos un carácter especial';
    return '';
  },
};

const fieldLabels = {
  nombre_completo: 'Nombre completo',
  documento: 'Documento',
  correo: 'Correo electrónico',
  telefono: 'Teléfono',
  password: 'Contraseña',
  password2: 'Confirmar contraseña',
};

export default function Register() {
  const [form, setForm] = useState({
    nombre_completo: '', documento: '', correo: '', telefono: '', password: '', password2: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (name === 'password2') {
          newErrors.password2 = value !== form.password ? 'Las contraseñas no coinciden' : '';
        } else if (validations[name]) {
          newErrors[name] = validations[name](value);
        }
        if (name === 'password' && touched.password2) {
          newErrors.password2 = form.password2 !== value ? 'Las contraseñas no coinciden' : '';
        }
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (name === 'password2') {
        newErrors.password2 = value !== form.password ? 'Las contraseñas no coinciden' : '';
      } else if (validations[name]) {
        newErrors[name] = validations[name](value);
      }
      if (name === 'password' && form.password2) {
        newErrors.password2 = form.password2 !== value ? 'Las contraseñas no coinciden' : '';
      }
      return newErrors;
    });
  };

  const validateAll = () => {
    const newErrors = {};
    for (const key of Object.keys(validations)) {
      newErrors[key] = validations[key](form[key]);
    }
    if (form.password2 !== form.password) {
      newErrors.password2 = 'Las contraseñas no coinciden';
    } else if (!form.password2) {
      newErrors.password2 = 'Debes confirmar la contraseña';
    }
    setErrors(newErrors);
    setTouched(Object.keys(form).reduce((a, k) => ({ ...a, [k]: true }), {}));
    return Object.values(newErrors).every((v) => !v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess('');
    if (!validateAll()) return;
    try {
      const res = await register(form);
      setSuccess(res.mensaje || 'Revisa tu correo para verificar tu cuenta.');
    } catch (err) {
      const data = err.response?.data;
      const fieldErrors = {};
      let general = '';
      if (typeof data === 'object') {
        for (const key of Object.keys(data)) {
          const val = Array.isArray(data[key]) ? data[key].join(' ') : data[key];
          if (key in validations || key === 'password2') {
            fieldErrors[key] = val;
          } else {
            general += (general ? ' ' : '') + val;
          }
        }
      }
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setServerError(general || 'Error al registrarse');
    }
  };

  const icon = (
    <div className="auth-icon-wrap">
      <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3">
        <rect x="22" y="8" width="20" height="48" rx="4"/>
        <rect x="8" y="22" width="48" height="20" rx="4"/>
      </svg>
    </div>
  );

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-shape" />
      <div className="auth-shape-2" />
        <div className="auth-card">
          {icon}
          <h2>¡Registro exitoso!</h2>
          <div className="alert alert-success">{success}</div>
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login">Ir a iniciar sesión</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-shape" />
      <div className="auth-shape-2" />
      <div className="auth-card">
        {icon}
        <h2>Crear Cuenta</h2>
        {serverError && <div className="alert alert-error">{serverError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          {['nombre_completo', 'documento', 'correo', 'telefono', 'password', 'password2'].map((field) => (
            <div className={`form-group${errors[field] && touched[field] ? ' has-error' : ''}`} key={field}>
              <label htmlFor={field}>{fieldLabels[field]}{field === 'password' ? ' (mín. 8 carácteres, 1 mayúscula, 1 número, 1 especial)' : ''}</label>
              <input
                id={field}
                name={field}
                type={field === 'password' || field === 'password2' ? 'password' : field === 'correo' ? 'email' : 'text'}
                value={form[field]}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={fieldLabels[field]}
                autoComplete={field === 'password' || field === 'password2' ? 'new-password' : 'off'}
              />
              {errors[field] && touched[field] && <span className="field-error">{errors[field]}</span>}
            </div>
          ))}
          <button type="submit" className="btn btn-primary btn-block">Registrarse</button>
        </form>
        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
