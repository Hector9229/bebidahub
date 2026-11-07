import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GlassWater,
  Heart,
  LayoutGrid,
  Percent,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { api, getErrorMessage } from "../api/client.js";
import BeverageCard from "../components/BeverageCard.jsx";
import BeverageModal from "../components/BeverageModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function SkeletonCard() {
  return (
    <div className="beverage-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton--media" />
      <div className="skeleton-card__body">
        <div className="skeleton skeleton--line skeleton--short" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--medium" />
        <div className="skeleton skeleton--line skeleton--short" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const initialCategory = new URLSearchParams(location.search).get("category") || "";

  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [beverages, setBeverages] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [favoriteBusyId, setFavoriteBusyId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    api
      .get("/categories/")
      .then(({ data }) => setCategories(data))
      .catch(() => notify("error", "No se pudieron cargar las categorías."));
  }, [notify]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    api
      .get("/beverages/stats/")
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page, ordering };
    if (search) params.search = search;
    if (category) params.category = category;
    if (favoriteOnly) params.favorite = "true";

    setLoading(true);
    setError("");
    api
      .get("/beverages/", { params, signal: controller.signal })
      .then(({ data }) => {
        setBeverages(data.results || []);
        setPagination({
          count: data.count || 0,
          next: data.next,
          previous: data.previous,
        });
      })
      .catch((requestError) => {
        if (requestError.code === "ERR_CANCELED") return;
        setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, category, favoriteOnly, ordering, page, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setFavoriteOnly(false);
    setOrdering("-created_at");
    setPage(1);
  };

  const handleSave = async (payload) => {
    if (editing) {
      await api.patch(`/beverages/${editing.id}/`, payload);
      notify("success", `“${payload.name}” se actualizó correctamente.`);
    } else {
      await api.post("/beverages/", payload);
      notify("success", `“${payload.name}” se agregó a tu bar.`);
      setPage(1);
    }
    setModalOpen(false);
    setEditing(null);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/beverages/${deleting.id}/`);
      notify("success", `“${deleting.name}” salió de tu bar.`);
      setDeleting(null);
      if (beverages.length === 1 && page > 1) {
        setPage((value) => value - 1);
      } else {
        refresh();
      }
    } catch (requestError) {
      notify("error", getErrorMessage(requestError));
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleToggleFavorite = async (beverage) => {
    const nextValue = !beverage.is_favorite;
    setFavoriteBusyId(beverage.id);
    setBeverages((current) =>
      current.map((item) =>
        item.id === beverage.id ? { ...item, is_favorite: nextValue } : item
      )
    );
    try {
      await api.patch(`/beverages/${beverage.id}/`, { is_favorite: nextValue });
      refresh();
    } catch (requestError) {
      setBeverages((current) =>
        current.map((item) =>
          item.id === beverage.id ? { ...item, is_favorite: !nextValue } : item
        )
      );
      notify("error", getErrorMessage(requestError));
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (beverage) => {
    setEditing(beverage);
    setModalOpen(true);
  };

  const hasFilters = Boolean(search || category || favoriteOnly || ordering !== "-created_at");
  const totalPages = Math.max(1, Math.ceil(pagination.count / 12));
  const firstName = user?.first_name || "bebedor";

  return (
    <div className="dashboard">
      <div className="dashboard__wash" aria-hidden="true" />
      <div className="container">
        <header className="dashboard__header">
          <div>
            <span className="eyebrow">
              <Sparkles size={14} /> Mi bar
            </span>
            <h1>
              {greeting()}, <em>{firstName}.</em>
            </h1>
            <p>
              {stats
                ? `${stats.total} bebidas en tu colección · ${stats.favorites} favoritas`
                : "Tu colección personal de bebidas y recetas."}
            </p>
          </div>
          <button type="button" className="button button--primary button--lg" onClick={openCreate}>
            <Plus size={19} /> Nueva bebida
          </button>
        </header>

        <section className="stats-grid" aria-label="Estadísticas de mi bar">
          <article className="stat-card stat-card--amber">
            <span className="stat-card__icon">
              <GlassWater size={20} />
            </span>
            <div>
              <strong>{stats ? stats.total : "—"}</strong>
              <span>Bebidas guardadas</span>
            </div>
            <small>en tu colección</small>
          </article>
          <article className="stat-card stat-card--terra">
            <span className="stat-card__icon">
              <Heart size={20} />
            </span>
            <div>
              <strong>{stats ? stats.favorites : "—"}</strong>
              <span>Favoritas</span>
            </div>
            <small>las que más repites</small>
          </article>
          <article className="stat-card stat-card--sage">
            <span className="stat-card__icon">
              <LayoutGrid size={20} />
            </span>
            <div>
              <strong>{stats ? stats.categories : "—"}</strong>
              <span>Categorías</span>
            </div>
            <small>estilos en tu bar</small>
          </article>
          <article className="stat-card stat-card--plum">
            <span className="stat-card__icon">
              <Percent size={20} />
            </span>
            <div>
              <strong>{stats ? `${stats.avg_abv}%` : "—"}</strong>
              <span>ABV promedio</span>
            </div>
            <small>{stats ? `${stats.non_alcoholic} sin alcohol` : "graduación media"}</small>
          </article>
        </section>

        <section className="bar-toolbar" aria-label="Filtros de bebidas">
          <div className="searchbox">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por nombre o descripción…"
              aria-label="Buscar bebidas"
            />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput("")} aria-label="Limpiar búsqueda">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="toolbar-select">
            <SlidersHorizontal size={16} aria-hidden="true" />
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.icon} {item.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={`filter-toggle ${favoriteOnly ? "is-active" : ""}`}
            onClick={() => {
              setFavoriteOnly((value) => !value);
              setPage(1);
            }}
            aria-pressed={favoriteOnly}
          >
            <Heart size={16} fill={favoriteOnly ? "currentColor" : "none"} /> Favoritas
          </button>

          <select
            className="toolbar-select toolbar-select--plain"
            value={ordering}
            onChange={(event) => {
              setOrdering(event.target.value);
              setPage(1);
            }}
            aria-label="Ordenar bebidas"
          >
            <option value="-created_at">Más recientes</option>
            <option value="name">Nombre A–Z</option>
            <option value="-rating">Mejor calificadas</option>
            <option value="-price">Precio mayor</option>
            <option value="price">Precio menor</option>
            <option value="-abv">Mayor ABV</option>
          </select>
        </section>

        <div className="results-line">
          <p>
            {loading ? (
              "Cargando tu bar…"
            ) : (
              <>
                <strong>{pagination.count}</strong>{" "}
                {pagination.count === 1 ? "bebida encontrada" : "bebidas encontradas"}
                {hasFilters && " con los filtros actuales"}
              </>
            )}
          </p>
          {hasFilters && (
            <button type="button" className="text-button" onClick={resetFilters}>
              Limpiar filtros
            </button>
          )}
        </div>

        {error ? (
          <div className="state-card state-card--error" role="alert">
            <AlertTriangle size={26} />
            <h3>No pudimos cargar tu bar</h3>
            <p>{error}</p>
            <button type="button" className="button button--outline" onClick={refresh}>
              <RefreshCw size={16} /> Reintentar
            </button>
          </div>
        ) : loading ? (
          <div className="beverage-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : beverages.length === 0 ? (
          <div className="state-card state-card--empty">
            <span className="state-card__emoji" aria-hidden="true">
              {hasFilters ? "🔎" : "🍸"}
            </span>
            <h3>{hasFilters ? "Nada por aquí…" : "Tu bar está esperando su primera bebida"}</h3>
            <p>
              {hasFilters
                ? "Prueba con otros filtros o limpia la búsqueda para ver todo tu catálogo."
                : "Agrega esa receta que tanto te gusta y empieza a construir tu colección."}
            </p>
            {hasFilters ? (
              <button type="button" className="button button--outline" onClick={resetFilters}>
                Limpiar filtros
              </button>
            ) : (
              <button type="button" className="button button--primary" onClick={openCreate}>
                <Plus size={17} /> Agregar mi primera bebida
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`beverage-grid ${loading ? "is-loading" : ""}`}>
              {beverages.map((beverage) => (
                <BeverageCard
                  key={beverage.id}
                  beverage={beverage}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteBusy={favoriteBusyId === beverage.id}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="pagination" aria-label="Paginación de bebidas">
                <button
                  type="button"
                  className="button button--ghost button--sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={!pagination.previous}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span>
                  Página <strong>{page}</strong> de {totalPages}
                </span>
                <button
                  type="button"
                  className="button button--ghost button--sm"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={!pagination.next}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </>
        )}

        <p className="dashboard__footnote">
          <span className="live-dot" /> Datos propios · CRUD protegido con JWT ·{" "}
          <code>GET /api/beverages/</code>
        </p>
      </div>

      {modalOpen && (
        <BeverageModal
          categories={categories}
          beverage={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSave}
        />
      )}

      {deleting && (
        <ConfirmDialog
          beverage={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
          busy={deleteBusy}
        />
      )}

      <Toast toasts={toasts} onClose={dismissToast} />
    </div>
  );
}
