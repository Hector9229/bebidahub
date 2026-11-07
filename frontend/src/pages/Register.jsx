import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { getErrorMessage, getFieldErrors } from "../api/client.js";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const INITIAL = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirm: "",
};

function strengthOf(password) {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH_LABELS = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"];

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => strengthOf(form.password), [form.password]);

  if (isAuthenticated) {
    return <Navigate to="/mi-bar" replace />;
  }

  const setValue = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (form.first_name.trim().length < 2) {
      errors.first_name = "Escribe tu nombre (mínimo 2 caracteres).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Escribe un correo electrónico válido.";
    }
    if (form.password.length < 10) {
      errors.password = "La contraseña debe tener al menos 10 caracteres.";
    }
    if (form.password !== form.password_confirm) {
      errors.password_confirm = "Las contraseñas no coinciden.";
    }
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    try {
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
      });
      navigate("/mi-bar", { replace: true });
    } catch (requestError) {
      setFieldErrors(getFieldErrors(requestError));
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg"
      eyebrow="Tu bar empieza aquí"
      quote="La mejor receta es la que se guarda con ganas de repetirla."
      author="BebidaHub"
      bullets={[
        "Guarda bebidas, precios y calificaciones",
        "Explora recetas de todo el mundo",
        "Tus datos, privados y protegidos",
      ]}
    >
      <div className="auth-heading">
        <span className="eyebrow">Crear cuenta</span>
        <h1>Armemos tu bar.</h1>
        <p>Es gratis y toma menos de un minuto.</p>
      </div>

      {error && (
        <div className="form-alert" role="alert">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid form-grid--auth">
          <div className="field">
            <label htmlFor="register-name">Nombre *</label>
            <input
              id="register-name"
              autoComplete="given-name"
              placeholder="Lucía"
              value={form.first_name}
              onChange={(event) => setValue("first_name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.first_name)}
            />
            {fieldErrors.first_name && (
              <small className="field-error">{fieldErrors.first_name}</small>
            )}
          </div>
          <div className="field">
            <label htmlFor="register-lastname">Apellido</label>
            <input
              id="register-lastname"
              autoComplete="family-name"
              placeholder="Mendoza"
              value={form.last_name}
              onChange={(event) => setValue("last_name", event.target.value)}
              aria-invalid={Boolean(fieldErrors.last_name)}
            />
            {fieldErrors.last_name && (
              <small className="field-error">{fieldErrors.last_name}</small>
            )}
          </div>
        </div>

        <div className="field">
          <label htmlFor="register-email">Correo electrónico *</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={(event) => setValue("email", event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
        </div>

        <div className="field">
          <label htmlFor="register-password">Contraseña *</label>
          <div className="input-with-action">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 10 caracteres"
              value={form.password}
              onChange={(event) => setValue("password", event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.password && (
            <div className="strength">
              <div className="strength__bars" aria-hidden="true">
                {[1, 2, 3, 4].map((bar) => (
                  <span key={bar} className={bar <= strength ? `is-on level-${strength}` : ""} />
                ))}
              </div>
              <small>{STRENGTH_LABELS[strength]}</small>
            </div>
          )}
          {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
        </div>

        <div className="field">
          <label htmlFor="register-confirm">Confirmar contraseña *</label>
          <input
            id="register-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            value={form.password_confirm}
            onChange={(event) => setValue("password_confirm", event.target.value)}
            aria-invalid={Boolean(fieldErrors.password_confirm)}
          />
          {fieldErrors.password_confirm && (
            <small className="field-error">{fieldErrors.password_confirm}</small>
          )}
        </div>

        <button
          type="submit"
          className="button button--primary button--full button--lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spin" /> Creando tu cuenta…
            </>
          ) : (
            <>
              Crear mi cuenta <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthShell>
  );
}
