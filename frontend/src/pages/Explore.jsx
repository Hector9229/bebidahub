import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Cloud,
  Database,
  ExternalLink,
  Loader2,
  Search,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { api, getErrorMessage } from "../api/client.js";

const SUGGESTIONS = ["Margarita", "Mojito", "Negroni", "Daiquiri", "Cosmopolitan", "Moscow Mule"];

function CocktailCard({ cocktail }) {
  const [imageFailed, setImageFailed] = useState(false);
  const visibleIngredients = cocktail.ingredients.slice(0, 6);
  const remaining = cocktail.ingredients.length - visibleIngredients.length;

  return (
    <article className="cocktail-card">
      <div className="cocktail-card__media">
        {cocktail.image && !imageFailed ? (
          <img
            src={cocktail.image}
            alt={`Imagen de ${cocktail.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="cocktail-card__placeholder" aria-hidden="true">
            🍸
          </div>
        )}
        <span className="cocktail-card__category">{cocktail.category}</span>
        <span
          className={`alcohol-pill ${
            cocktail.alcoholic?.toLowerCase().includes("alcohol") ? "is-alcohol" : ""
          }`}
        >
          {cocktail.alcoholic || "No especificado"}
        </span>
      </div>

      <div className="cocktail-card__body">
        <span className="cocktail-card__glass">{cocktail.glass || "Cristalería libre"}</span>
        <h3>{cocktail.name}</h3>
        <p className="cocktail-card__instructions">
          {cocktail.instructions || "Sin instrucciones disponibles."}
        </p>

        <div className="ingredient-list" aria-label="Ingredientes">
          {visibleIngredients.map((ingredient) => (
            <span key={`${cocktail.id}-${ingredient.name}`}>
              {ingredient.measure ? `${ingredient.measure} · ` : ""}
              {ingredient.name}
            </span>
          ))}
          {remaining > 0 && <span className="ingredient-more">+{remaining} más</span>}
        </div>

        <footer className="cocktail-card__footer">
          <span>{cocktail.ingredients.length} ingredientes</span>
          {cocktail.tags?.length > 0 && (
            <span className="cocktail-card__tag">{cocktail.tags[0]}</span>
          )}
        </footer>
      </div>
    </article>
  );
}

function CocktailSkeleton() {
  return (
    <div className="cocktail-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton--media" />
      <div className="skeleton-card__body">
        <div className="skeleton skeleton--line skeleton--short" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--medium" />
        <div className="skeleton skeleton--line" />
      </div>
    </div>
  );
}

export default function Explore() {
  const [input, setInput] = useState("Margarita");
  const [query, setQuery] = useState("Margarita");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cached, setCached] = useState(false);
  const requestRef = useRef(0);
  const startedRef = useRef(false);

  const runSearch = async (term) => {
    const clean = term.trim();
    if (clean.length < 2) {
      setError("Escribe al menos 2 caracteres para buscar un cóctel.");
      return;
    }
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/external/cocktails/", { params: { q: clean } });
      if (requestId !== requestRef.current) return;
      setResults(data.results || []);
      setQuery(data.query);
      setCached(Boolean(data.cached));
      setInput(clean);
    } catch (requestError) {
      if (requestId !== requestRef.current) return;
      setError(getErrorMessage(requestError));
      setResults([]);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  const runRandom = async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/external/cocktails/random/");
      if (requestId !== requestRef.current) return;
      setResults(data.results || []);
      setQuery("Sorpréndeme");
      setCached(false);
      setInput("");
    } catch (requestError) {
      if (requestId !== requestRef.current) return;
      setError(getErrorMessage(requestError));
      setResults([]);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runSearch("Margarita");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(input);
  };

  const chooseSuggestion = (value) => {
    setInput(value);
    runSearch(value);
  };

  return (
    <div className="explore">
      <section className="explore-hero">
        <div className="explore-hero__blob" aria-hidden="true" />
        <div className="container">
          <div className="explore-hero__top">
            <div className="explore-hero__copy">
              <span className="eyebrow eyebrow--pill">
                <Cloud size={14} /> API externa · TheCocktailDB
              </span>
              <h1>
                El mundo entero, <em>en un vaso.</em>
              </h1>
              <p>
                Busca un cóctel y recibe al instante su receta, ingredientes y cristalería. Datos
                en vivo servidos por nuestro backend, con validación y caché.
              </p>
            </div>

            <div className="api-note">
              <span className="api-note__icon">
                <Database size={19} />
              </span>
              <div>
                <strong>Consumo desde el backend</strong>
                <p>
                  Proxy con timeout de 8 s, validación de parámetros y caché de 5 minutos. Sin
                  claves expuestas en el navegador.
                </p>
                <code>/api/external/cocktails/</code>
              </div>
            </div>
          </div>

          <form className="explore-search" onSubmit={handleSubmit}>
            <div className="explore-search__field">
              <Search size={20} aria-hidden="true" />
              <input
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Busca por nombre: margarita, mojito, negroni…"
                aria-label="Buscar cócteles por nombre"
              />
            </div>
            <button type="submit" className="button button--primary button--lg" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
              Buscar receta
            </button>
            <button
              type="button"
              className="button button--outline button--lg"
              onClick={runRandom}
              disabled={loading}
            >
              <Shuffle size={18} /> Sorpréndeme
            </button>
          </form>

          <div className="suggestions">
            <span>Prueba con:</span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={query.toLowerCase() === suggestion.toLowerCase() ? "is-active" : ""}
                onClick={() => chooseSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section explore-results">
        <div className="container">
          <div className="results-header">
            <div>
              <span className="eyebrow">Resultados</span>
              <h2>
                {loading
                  ? "Buscando en la barra…"
                  : query === "Sorpréndeme"
                    ? "Una sorpresa de la barra"
                    : `Recetas de “${query}”`}
              </h2>
            </div>
            {!loading && !error && (
              <div className="results-tools">
                {cached && (
                  <span className="cache-badge">
                    <Sparkles size={13} /> Servido desde caché
                  </span>
                )}
                <span className="count-badge">
                  {results.length} {results.length === 1 ? "resultado" : "resultados"}
                </span>
              </div>
            )}
          </div>

          {error ? (
            <div className="state-card state-card--error" role="alert">
              <AlertTriangle size={26} />
              <h3>La barra externa no respondió</h3>
              <p>{error}</p>
              <button
                type="button"
                className="button button--outline"
                onClick={() => (query === "Sorpréndeme" ? runRandom() : runSearch(query))}
              >
                <Search size={16} /> Reintentar
              </button>
            </div>
          ) : loading ? (
            <div className="cocktail-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <CocktailSkeleton key={index} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="state-card state-card--empty">
              <span className="state-card__emoji" aria-hidden="true">
                🥂
              </span>
              <h3>No encontramos ese cóctel</h3>
              <p>
                Prueba con otro nombre o deja que la suerte decida con el botón “Sorpréndeme”.
              </p>
              <button type="button" className="button button--primary" onClick={runRandom}>
                <Shuffle size={17} /> Sorpréndeme
              </button>
            </div>
          ) : (
            <div className="cocktail-grid">
              {results.map((cocktail, index) => (
                <CocktailCard key={`${cocktail.id}-${index}`} cocktail={cocktail} />
              ))}
            </div>
          )}

          <div className="source-strip">
            <div>
              <Cloud size={18} />
              <p>
                Datos proporcionados por{" "}
                <a href="https://www.thecocktaildb.com" target="_blank" rel="noreferrer">
                  TheCocktailDB <ExternalLink size={13} />
                </a>
                . Las imágenes y recetas pertenecen a sus autores.
              </p>
            </div>
            <a
              className="text-button"
              href="https://www.thecocktaildb.com/api.php"
              target="_blank"
              rel="noreferrer"
            >
              Documentación de la API <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
