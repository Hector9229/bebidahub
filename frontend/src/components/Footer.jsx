import { ArrowUpRight, Github, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

const REPOSITORY_URL =
  import.meta.env.VITE_REPOSITORY_URL || "https://github.com/Hector9229/bebidahub";

export default function Footer() {
  const { user, logout } = useAuth();
  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>
            Tu colección de bebidas, recetas y descubrimientos. Organizada, segura y siempre a
            mano.
          </p>
          <div className="footer__badges">
            <span>Django REST</span>
            <span>React</span>
            <span>JWT</span>
          </div>
        </div>

        <div className="footer__column">
          <h4>Explorar</h4>
          <Link to="/">Inicio</Link>
          <Link to="/explorar">Cócteles del mundo</Link>
          <Link to="/mi-bar">Mi bar</Link>
        </div>

        <div className="footer__column">
          <h4>Cuenta</h4>
          {user ? (
            <>
              <Link to="/mi-bar">Mi bar</Link>
              <button type="button" className="footer__link-button" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Crear cuenta</Link>
            </>
          )}
          <a href="https://www.thecocktaildb.com" target="_blank" rel="noreferrer">
            TheCocktailDB <ArrowUpRight size={13} />
          </a>
        </div>

        <div className="footer__column">
          <h4>Proyecto</h4>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="footer__repo"
          >
            <Github size={15} /> Repositorio
          </a>
          <span className="footer__muted">Desarrollo Web Integral</span>
          <span className="footer__muted">Demo académica · 2026</span>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>
          © 2026 BebidaHub. Hecho con <Heart size={13} fill="currentColor" /> y buenas mezclas.
        </p>
        <p>Consume responsablemente. +18 para bebidas alcohólicas.</p>
      </div>
    </footer>
  );
}
