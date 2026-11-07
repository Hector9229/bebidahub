import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { getErrorMessage } from "../api/client.js";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const DEMO = { email: "demo@bebidahub.com", password: "MangoPicante#42" };

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const destination = location.state?.from || "/mi-bar";

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError("");
    setDemoLoading(true);
    try {
      await login(DEMO.email, DEMO.password);
      navigate("/mi-bar", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuthShell
      image="https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg"
      eyebrow="Bienvenido de vuelta"
      quote="Un buen bar no se mide en botellas, sino en las historias que guarda."
      author="BebidaHub"
      bullets={[
        "Accede a tu colección desde cualquier lugar",
        "Sesión segura con tokens JWT",
        "Recetas y favoritas siempre a mano",
      ]}
    >
      <div className="auth-heading">
        <span className="eyebrow">Iniciar sesión</span>
        <h1>Qué bueno verte de nuevo.</h1>
        <p>Entra a tu bar y sigue donde lo dejaste.</p>
      </div>

      {error && (
        <div className="form-alert" role="alert">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <div className="input-with-action">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="button button--primary button--full button--lg"
          disabled={loading || demoLoading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spin" /> Entrando…
            </>
          ) : (
            <>
              Entrar a mi bar <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>o prueba sin registrarte</span>
      </div>

      <button
        type="button"
        className="button button--outline button--full"
        onClick={handleDemo}
        disabled={loading || demoLoading}
      >
        {demoLoading ? (
          <>
            <Loader2 size={17} className="spin" /> Abriendo bar demo…
          </>
        ) : (
          <>
            <Sparkles size={17} /> Entrar con la cuenta demo
          </>
        )}
      </button>
      <p className="demo-hint">
        <strong>Demo:</strong> demo@bebidahub.com · MangoPicante#42
      </p>

      <p className="auth-switch">
        ¿Aún no tienes cuenta? <Link to="/register">Crea la tuya gratis</Link>
      </p>
    </AuthShell>
  );
}
