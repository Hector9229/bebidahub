import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

export default function AuthShell({ image, eyebrow, quote, author, bullets, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside" style={{ "--auth-image": `url(${image})` }}>
        <div className="auth-aside__overlay" aria-hidden="true" />
        <div className="auth-aside__top">
          <Logo light />
          <span className="aside-badge">Mi bar personal</span>
        </div>

        <div className="auth-aside__content">
          <span className="eyebrow eyebrow--light">{eyebrow}</span>
          <blockquote>“{quote}”</blockquote>
          <cite>— {author}</cite>
          <ul className="auth-bullets">
            {bullets.map((bullet) => (
              <li key={bullet}>
                <span>
                  <Check size={13} strokeWidth={3} />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-aside__footer">
          <span>Django REST · React · JWT</span>
          <span>© 2026 BebidaHub</span>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-panel__top">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
          <span className="auth-panel__logo">
            <Logo />
          </span>
        </div>
        <div className="auth-panel__content">{children}</div>
        <p className="auth-legal">
          Al continuar aceptas nuestra política de privacidad y el consumo responsable de bebidas
          alcohólicas. Sólo mayores de 18 años.
        </p>
      </section>
    </div>
  );
}
