import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-bg-shapes">
          <div className="landing-shape shape-1" />
          <div className="landing-shape shape-2" />
          <div className="landing-shape shape-3" />
        </div>
        <div className="landing-hero-content">
          <div className="landing-hero-icon">
            <svg viewBox="0 0 64 64" fill="none" stroke="white" strokeWidth="3" width="40" height="40">
              <rect x="22" y="8" width="20" height="48" rx="4"/>
              <rect x="8" y="22" width="48" height="20" rx="4"/>
            </svg>
          </div>
          <h1 className="landing-hero-title">
            <span className="landing-hero-title-line">Sistema de Gestión</span>
            <span className="landing-hero-title-line highlight">de Citas Médicas</span>
          </h1>
          <p className="landing-hero-desc">Agenda, gestiona y controla tus citas médicas de forma rápida y sencilla desde cualquier lugar.</p>
          <div className="landing-hero-buttons">
            <Link to="/register" className="landing-btn landing-btn-primary">
              <span>Crear Cuenta</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link to="/login" className="landing-btn landing-btn-secondary">
              <span>Iniciar Sesión</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Quiénes Somos */}
      <section id="quienes-somos" className="landing-section">
        <h2 className="landing-section-title">¿Quiénes Somos?</h2>
        <div className="landing-about">
          <div className="landing-about-card">
            <div className="landing-about-icon-wrap" style={{ background: 'linear-gradient(135deg, #1a73e8, #0d47a1)' }}>🏥</div>
            <h3>Misión</h3>
            <p>Brindar una plataforma digital eficiente que conecte pacientes con profesionales de la salud, facilitando la gestión de citas médicas de manera segura y accesible.</p>
          </div>
          <div className="landing-about-card">
            <div className="landing-about-icon-wrap" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>👁️</div>
            <h3>Visión</h3>
            <p>Ser la plataforma líder en gestión de citas médicas en Latinoamérica, reconocida por su innovación, confiabilidad y compromiso con la salud digital.</p>
          </div>
          <div className="landing-about-card">
            <div className="landing-about-icon-wrap" style={{ background: 'linear-gradient(135deg, #059669, #065f46)' }}>💚</div>
            <h3>Valores</h3>
            <p>Compromiso, innovación, empatía y transparencia en cada interacción, priorizando siempre el bienestar y la satisfacción de nuestros usuarios.</p>
          </div>
        </div>
      </section>

      {/* Aquí Estamos */}
      <div className="landing-map-bg">
        <div className="auth-shape" />
        <div className="auth-shape-2" />
        <div className="auth-shape-3" />
        <div className="auth-shape-4" />
        <section id="aqui-estamos" className="landing-section landing-map-section">
          <h2 className="landing-section-title landing-map-section-title">Aquí Estamos</h2>
          <div className="landing-map-container">
            <div className="landing-map-info">
              <div className="landing-map-marker-pulse">
                <span className="landing-map-pin">📍</span>
              </div>
              <h3>Clínica Central de Especialidades</h3>
              <p className="landing-map-addr">Carrera 7 # 117-15, Bogotá, Colombia</p>
              <p className="landing-map-tel">📞 +57 (601) 123 4567</p>
              <p className="landing-map-mail">✉️ contacto@citasmedicas.com</p>
              <div className="landing-map-hours">
                <strong>Horario de atención</strong>
                <span>Lun - Vie: 7:00 AM - 8:00 PM</span>
                <span>Sáb: 8:00 AM - 2:00 PM</span>
              </div>
            </div>
            <div className="landing-map-embed">
              <iframe
                title="Ubicación Clínica"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.875006983746!2d-74.03194768573602!3d4.681737996601512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9a3e5b5b5b5b%3A0x5b5b5b5b5b5b5b5b!2sCra.%207%20%23117-15%2C%20Bogot%C3%A1!5e0!3m2!1ses!2sco!4v1"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Redes Sociales */}
      <section id="redes" className="landing-section">
        <h2 className="landing-section-title">Síguenos</h2>
        <div className="landing-social">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="landing-social-link" style={{ '--social-bg': '#1877f2' }}>
            <span className="landing-social-bg" />
            <span className="landing-social-icon">f</span>
            <span className="landing-social-label">Facebook</span>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="landing-social-link" style={{ '--social-bg': '#e4405f' }}>
            <span className="landing-social-bg" />
            <span className="landing-social-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
            </span>
            <span className="landing-social-label">Instagram</span>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="landing-social-link" style={{ '--social-bg': '#1da1f2' }}>
            <span className="landing-social-bg" />
            <span className="landing-social-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </span>
            <span className="landing-social-label">X / Twitter</span>
          </a>
          <a href="https://wa.me/571234567" target="_blank" rel="noopener noreferrer" className="landing-social-link" style={{ '--social-bg': '#25d366' }}>
            <span className="landing-social-bg" />
            <span className="landing-social-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </span>
            <span className="landing-social-label">WhatsApp</span>
          </a>
        </div>
      </section>

      {/* Normativas y Certificaciones */}
      <section className="landing-section landing-normativas">
        <h2 className="landing-section-title">Normativas y Certificaciones</h2>
        <div className="landing-normativas-grid">
          <div className="landing-normativa-card">
            <div className="landing-normativa-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="#1a73e8" strokeWidth="2">
                <circle cx="24" cy="24" r="20"/>
                <path d="M16 24l6 6 10-10"/>
              </svg>
            </div>
            <h3>ISO 27001</h3>
            <p>Sistema de Gestión de Seguridad de la Información (SGSI). Protegemos tus datos médicos bajo estándares internacionales.</p>
          </div>
          <div className="landing-normativa-card">
            <div className="landing-normativa-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="#1a73e8" strokeWidth="2">
                <rect x="8" y="6" width="32" height="36" rx="3"/>
                <path d="M16 20h16M16 28h16"/>
              </svg>
            </div>
            <h3>Ley 1581 de 2012</h3>
            <p>Protección de Datos Personales en Colombia. Tus datos están seguros y solo se usan para fines médicos autorizados.</p>
          </div>
          <div className="landing-normativa-card">
            <div className="landing-normativa-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="#1a73e8" strokeWidth="2">
                <path d="M24 4L4 14v20l20 10 20-10V14L24 4z"/>
                <path d="M16 24l6 6 10-10"/>
              </svg>
            </div>
            <h3>Resolución 1995 de 1999</h3>
            <p>Cumplimos con los estándares de habilitación de servicios de salud. Plataforma alineada con la normativa del Ministerio de Salud.</p>
          </div>
          <div className="landing-normativa-card">
            <div className="landing-normativa-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="#1a73e8" strokeWidth="2">
                <circle cx="24" cy="24" r="20"/>
                <path d="M24 14v10l6 6"/>
              </svg>
            </div>
            <h3>ISO 9001</h3>
            <p>Sistema de Gestión de Calidad. Procesos optimizados para brindar una experiencia confiable y eficiente a nuestros usuarios.</p>
          </div>
          <div className="landing-normativa-card">
            <div className="landing-normativa-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="#1a73e8" strokeWidth="2">
                <path d="M12 8h24v8l-6 6v6l-6 6-6-6v-6l-6-6V8z"/>
              </svg>
            </div>
            <h3>Habeas Data</h3>
            <p>Derecho al acceso, actualización, rectificación y supresión de tus datos personales conforme a la Ley Estatutaria 1266 de 2008.</p>
          </div>
          <div className="landing-normativa-card">
            <div className="landing-normativa-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="#1a73e8" strokeWidth="2">
                <rect x="10" y="6" width="28" height="36" rx="4"/>
                <path d="M20 20l4 4 8-8"/>
                <circle cx="18" cy="36" r="3" fill="#1a73e8"/>
                <circle cx="30" cy="36" r="3" fill="#1a73e8"/>
              </svg>
            </div>
            <h3>Historia Clínica Electrónica</h3>
            <p>Resolución 839 de 2017. Implementamos HCE con los más altos estándares de seguridad, interoperabilidad y confidencialidad.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5">
              <rect x="8" y="3" width="8" height="18" rx="2"/>
              <rect x="3" y="8" width="18" height="8" rx="2"/>
            </svg>
            Citas Médicas
          </div>
          <p className="landing-footer-desc">Plataforma segura de gestión de citas médicas. Cumplimos con todas las normativas colombianas de protección de datos y habilitación de servicios de salud.</p>
          <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
          <div className="landing-footer-links">
            <Link to="/login">Iniciar Sesión</Link>
            <span className="landing-footer-dot">·</span>
            <Link to="/register">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}