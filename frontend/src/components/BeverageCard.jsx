import { useEffect, useState } from "react";
import { Heart, Pencil, Star, Trash2 } from "lucide-react";

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export default function BeverageCard({ beverage, onEdit, onDelete, onToggleFavorite, favoriteBusy }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [beverage.image_url]);

  const rating = Number(beverage.rating) || 0;

  return (
    <article className="beverage-card">
      <div className="beverage-card__media">
        {beverage.image_url && !imageFailed ? (
          <img
            src={beverage.image_url}
            alt={`Imagen de ${beverage.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="beverage-card__placeholder" aria-hidden="true">
            <span>{beverage.category_icon || "🍹"}</span>
            <small>{beverage.name?.slice(0, 1).toUpperCase()}</small>
          </div>
        )}
        <span className="beverage-card__category">
          <span aria-hidden="true">{beverage.category_icon}</span> {beverage.category_name}
        </span>
        <button
          type="button"
          className={`heart-button ${beverage.is_favorite ? "is-active" : ""}`}
          onClick={() => onToggleFavorite(beverage)}
          disabled={favoriteBusy}
          aria-pressed={beverage.is_favorite}
          aria-label={
            beverage.is_favorite
              ? `Quitar ${beverage.name} de favoritas`
              : `Marcar ${beverage.name} como favorita`
          }
        >
          <Heart size={17} fill={beverage.is_favorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="beverage-card__body">
        <div className="beverage-card__top">
          <h3>{beverage.name}</h3>
          <span className={`alcohol-pill ${Number(beverage.abv) > 0 ? "is-alcohol" : ""}`}>
            {Number(beverage.abv) > 0 ? `${Number(beverage.abv)}% ABV` : "Sin alcohol"}
          </span>
        </div>

        {beverage.description ? (
          <p className="beverage-card__description">{beverage.description}</p>
        ) : (
          <p className="beverage-card__description is-empty">Sin descripción todavía.</p>
        )}

        <div className="beverage-card__meta">
          <span>{beverage.serving_ml} ml</span>
          <span className="dot" />
          <span>{priceFormatter.format(Number(beverage.price))}</span>
        </div>

        <div className="beverage-card__footer">
          <div className="stars" aria-label={`Calificación ${rating} de 5`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                size={14}
                fill={value <= rating ? "currentColor" : "none"}
                className={value <= rating ? "is-filled" : ""}
                aria-hidden="true"
              />
            ))}
            <span>{rating}</span>
          </div>
          <div className="card-actions">
            <button
              type="button"
              className="icon-button icon-button--soft"
              onClick={() => onEdit(beverage)}
              aria-label={`Editar ${beverage.name}`}
              title="Editar"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="icon-button icon-button--danger"
              onClick={() => onDelete(beverage)}
              aria-label={`Eliminar ${beverage.name}`}
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
