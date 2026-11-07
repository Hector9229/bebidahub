import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cloud,
  Database,
  GlassWater,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const FALLBACK_CATEGORIES = [
  { id: 1, name: "Cócteles", slug: "cocteles", icon: "🍸", description: "Mezclas para cualquier ocasión." },
  { id: 2, name: "Cervezas", slug: "cervezas", icon: "🍺", description: "Lager, IPA y ediciones de la casa." },
  { id: 3, name: "Vinos", slug: "vinos", icon: "🍷", description: "Tintos, blancos y espumosos." },
  { id: 4, name: "Cafés", slug: "cafes", icon: "☕", description: "Espresso, latte y cold brew." },
  { id: 5, name: "Tés", slug: "tes", icon: "🍵", description: "Infusiones calientes y heladas." },
  { id: 6, name: "Jugos", slug: "jugos", icon: "🧃", description: "Frutas y verduras recién exprimidas." },
  { id: 7, name: "Refrescos", slug: "refrescos", icon: "🥤", description: "Sodas y bebidas gasificadas." },
  { id: 8, name: "Aguas frescas", slug: "aguas-frescas", icon: "🍹", description: "Limonadas y mocktails." },
];

const HERO_IMAGE =
  "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg";
const INSPIRATION = [
  {
    name: "Mojito",
    label: "Fresco y herbal",
    image: "https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg",
  },
  {
    name: "Negroni",
    label: "Amargo y elegante",
    image: "https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg",
  },
  {
    name: "Piña colada",
    label: "Tropical y cremoso",
    image: "https://www.thecocktaildb.com/images/media/drink/upusyu1472667977.jpg",
  },
];

const features = [
  {
    icon: Database,
    kicker: "01 · Organiza",
    title: "Tu bar, perfectamente ordenado",
    copy: "Agrupa bebidas por categoría, guarda precios, porciones y tu calificación personal. Todo en un solo lugar.",
  },
  {
    icon: Sparkles,
    kicker: "02 · Descubre",
    title: "Inspiración que nunca se acaba",
    copy: "Explora cientos de cócteles del mundo con ingredientes e instrucciones, servidos en vivo desde TheCocktailDB.",
  },
  {
    icon: ShieldCheck,
    kicker: "03 · Confía",
    title: "Tu colección es sólo tuya",
    copy: "Autenticación JWT, contraseñas protegidas y aislamiento por usuario. Nadie más puede ver ni tocar tu bar.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    let active = true;
    api
      .get("/categories/")
      .then(({ data }) => {
        if (active && Array.isArray(data) && data.length) setCategories(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const primaryTarget = user ? "/mi-bar" : "/register";
  const primaryLabel = user ? "Ir a mi bar" : "Empezar mi bar";

  return (
    <div className="home">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__blob hero__blob--one" aria-hidden="true" />
        <div className="hero__blob hero__blob--two" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow eyebrow--pill">
              <Sparkles size={14} /> Tu colección de bebidas, en un solo lugar
            </span>
            <h1>
              Cada sorbo cuenta
              <br />
              <em>una historia.</em>
            </h1>
            <p className="hero__lead">
              Guarda las bebidas que amas, descubre recetas nuevas y convierte tu bar personal
              en una colección que vale la pena presumir.
            </p>
            <div className="hero__actions">
              <Link to={primaryTarget} className="button button--primary button--lg">
                {primaryLabel}
                <ArrowRight size={18} />
              </Link>
              <Link to="/explorar" className="button button--outline button--lg">
                <GlassWater size={18} />
                Explorar cócteles
              </Link>
            </div>
            <div className="hero__meta">
              <div className="hero__avatars" aria-hidden="true">
                <span>🍸</span>
                <span>🍷</span>
                <span>☕</span>
              </div>
              <p>
                <strong>8 categorías</strong> y cientos de recetas para tu próximo brindis.
              </p>
            </div>
          </div>

          <div className="hero__visual" aria-label="Vista previa de una bebida guardada">
            <div className="hero__frame" aria-hidden="true" />
            <figure className="hero-card">
              <img src={HERO_IMAGE} alt="Margarita clásica con sal en el borde" />
              <figcaption>
                <div>
                  <span>Receta destacada</span>
                  <strong>Margarita clásica</strong>
                </div>
                <span className="hero-card__rating">
                  <Star size={13} fill="currentColor" /> 5.0
                </span>
              </figcaption>
            </figure>

            <div className="floating floating--stat">
              <span className="floating__icon">
                <GlassWater size={19} />
              </span>
              <div>
                <strong>12 bebidas</strong>
                <small>guardadas en tu bar</small>
              </div>
            </div>

            <div className="floating floating--category">
              <span>🍸</span> Cócteles
            </div>

            <div className="floating floating--quote">
              <Heart size={15} fill="currentColor" />
              <span>“Mi lugar feliz.”</span>
            </div>

            <div className="hero__stamp" aria-hidden="true">
              <span>BEBIDA</span>
              <GlassWater size={19} />
              <span>HUB</span>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="trust-strip">
            <span>
              <ShieldCheck size={17} /> Sesiones protegidas con JWT
            </span>
            <span>
              <Cloud size={17} /> Recetas en vivo de TheCocktailDB
            </span>
            <span>
              <Database size={17} /> Tu bar privado y aislado
            </span>
            <span>
              <Sparkles size={17} /> Diseñado para disfrutar
            </span>
          </div>
        </div>
      </section>

      {/* ── Categorías ───────────────────────────────────────── */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Para cada antojo</span>
              <h2>¿Qué se te antoja hoy?</h2>
            </div>
            <p>
              Ocho familias de bebidas para empezar. Tú decides qué entra a tu colección y cómo
              la cuentas.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={user ? `/mi-bar?category=${category.slug}` : "/register"}
                className="category-card"
              >
                <span className="category-card__icon" aria-hidden="true">
                  {category.icon}
                </span>
                <span className="category-card__text">
                  <strong>{category.name}</strong>
                  <small>{category.description}</small>
                </span>
                <span className="category-card__count">
                  {category.beverage_count ?? 0}
                  <small>bebidas</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="section features-section">
        <div className="container">
          <div className="section-heading section-heading--center">
            <span className="eyebrow">Hecho para tu manera de beber</span>
            <h2>Mucho más que una lista.</h2>
            <p>
              Un espacio personal para guardar lo que te gusta, aprender algo nuevo y no volver
              a olvidar esa receta que tanto te gustó.
            </p>
          </div>

          <div className="feature-grid">
            {features.map(({ icon: Icon, kicker, title, copy }) => (
              <article key={title} className="feature-card">
                <span className="feature-card__icon">
                  <Icon size={23} />
                </span>
                <span className="feature-card__kicker">{kicker}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inspiración externa ──────────────────────────────── */}
      <section className="section inspiration-section">
        <div className="container inspiration">
          <div className="inspiration__gallery">
            <figure className="inspiration__main">
              <img src={INSPIRATION[0].image} alt="Mojito con hierbabuena" loading="lazy" />
              <figcaption>{INSPIRATION[0].name}</figcaption>
            </figure>
            <figure>
              <img src={INSPIRATION[1].image} alt="Negroni en vaso corto" loading="lazy" />
              <figcaption>{INSPIRATION[1].name}</figcaption>
            </figure>
            <figure>
              <img src={INSPIRATION[2].image} alt="Piña colada tropical" loading="lazy" />
              <figcaption>{INSPIRATION[2].name}</figcaption>
            </figure>
            <span className="inspiration__badge">
              <Cloud size={15} /> En vivo
            </span>
          </div>

          <div className="inspiration__copy">
            <span className="eyebrow">Inspiración sin fronteras</span>
            <h2>
              Cuando no sepas qué pedir, <em>explora.</em>
            </h2>
            <p>
              Busca por nombre y recibe al instante ingredientes, instrucciones, cristalería y
              nivel alcohólico. Nuestro backend consulta <strong>TheCocktailDB</strong>, valida la
              respuesta y la cachea para que todo fluya rápido.
            </p>
            <ul className="check-list">
              <li>Más de 600 recetas internacionales</li>
              <li>Resultados normalizados y listos para leer</li>
              <li>Sin exponer claves ni llamadas directas desde el navegador</li>
            </ul>
            <div className="code-chip">
              <span>GET</span> /api/external/cocktails/?q=margarita
            </div>
            <Link to="/explorar" className="button button--cream button--lg">
              Abrir explorador <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────── */}
      <section className="section steps-section">
        <div className="container">
          <div className="section-heading section-heading--center">
            <span className="eyebrow">Así de simple</span>
            <h2>Tu bar listo en tres pasos.</h2>
          </div>
          <div className="steps">
            <article>
              <span className="step-number">01</span>
              <h3>Crea tu cuenta</h3>
              <p>Regístrate en segundos. Tu sesión viaja protegida con tokens JWT.</p>
            </article>
            <article>
              <span className="step-number">02</span>
              <h3>Agrega tus bebidas</h3>
              <p>Nombre, categoría, precio, graduación y esa foto que lo dice todo.</p>
            </article>
            <article>
              <span className="step-number">03</span>
              <h3>Disfruta y descubre</h3>
              <p>Ordena, marca favoritas y explora recetas nuevas cuando quieras.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-card__glow" aria-hidden="true" />
            <div>
              <span className="eyebrow eyebrow--light">La barra está abierta</span>
              <h2>¿Empezamos con tu primera bebida?</h2>
              <p>Gratis, personal y sin complicaciones. Tu próxima favorita te está esperando.</p>
            </div>
            <div className="cta-card__actions">
              <Link to={primaryTarget} className="button button--primary button--lg">
                {primaryLabel} <ArrowRight size={18} />
              </Link>
              {!user && (
                <Link to="/login" className="button button--ghost-light button--lg">
                  Ya tengo cuenta
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
