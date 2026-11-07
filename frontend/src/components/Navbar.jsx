import { useEffect, useState } from "react";
import { LogOut, Menu, Sparkles, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

const navLinks = [
  { to: "/", label: "Inicio", end: true },
  { to: "/explorar", label: "Explorar" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase()
    : "";

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__inner">
        <Logo />

        <nav className="navbar__links" aria-label="Navegación principal">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
          {user && (
            <NavLink
              to="/mi-bar"
              className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
            >
              Mi bar
            </NavLink>
          )}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              <Link to="/mi-bar" className="user-chip" title="Ir a mi bar">
                <span className="avatar">{initials}</span>
                <span className="user-chip__text">
                  <small>Mi bar</small>
                  <strong>{user.first_name || "BebidaHub"}</strong>
                </span>
              </Link>
              <button
                type="button"
                className="icon-button icon-button--ghost"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="button button--ghost button--sm">
                Entrar
              </Link>
              <Link to="/register" className="button button--primary button--sm">
                <Sparkles size={16} />
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="menu-toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`mobile-nav ${open ? "is-open" : ""}`}
        aria-hidden={!open}
      >
        <NavLink to="/" end className="mobile-nav__link" onClick={() => setOpen(false)}>
          Inicio
        </NavLink>
        <NavLink to="/explorar" className="mobile-nav__link" onClick={() => setOpen(false)}>
          Explorar cócteles
        </NavLink>
        {user && (
          <NavLink to="/mi-bar" className="mobile-nav__link" onClick={() => setOpen(false)}>
            Mi bar
          </NavLink>
        )}
        <div className="mobile-nav__actions">
          {user ? (
            <button type="button" className="button button--dark" onClick={handleLogout}>
              <LogOut size={17} /> Cerrar sesión
            </button>
          ) : (
            <>
              <Link to="/login" className="button button--ghost">
                Entrar
              </Link>
              <Link to="/register" className="button button--primary">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
