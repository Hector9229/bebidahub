import { useState } from "react";
import { AlertCircle, Loader2, Star } from "lucide-react";
import { getErrorMessage, getFieldErrors } from "../api/client.js";
import Modal from "./Modal.jsx";

const EMPTY_FORM = {
  name: "",
  category: "",
  description: "",
  price: "60.00",
  abv: "0",
  serving_ml: "300",
  rating: 5,
  is_alcoholic: false,
  is_favorite: false,
  image_url: "",
};

function toForm(beverage, categories) {
  if (!beverage) {
    return { ...EMPTY_FORM, category: categories[0]?.id || "" };
  }
  return {
    name: beverage.name,
    category: beverage.category,
    description: beverage.description || "",
    price: String(beverage.price),
    abv: String(beverage.abv),
    serving_ml: String(beverage.serving_ml),
    rating: beverage.rating,
    is_alcoholic: beverage.is_alcoholic,
    is_favorite: beverage.is_favorite,
    image_url: beverage.image_url || "",
  };
}

export default function BeverageModal({ categories, beverage, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toForm(beverage, categories));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const setValue = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = "Escribe un nombre de al menos 2 caracteres.";
    }
    if (!form.category) errors.category = "Selecciona una categoría.";
    if (form.price === "" || Number(form.price) < 0) {
      errors.price = "El precio debe ser mayor o igual a 0.";
    }
    if (form.abv === "" || Number(form.abv) < 0 || Number(form.abv) > 100) {
      errors.abv = "El ABV debe estar entre 0 y 100.";
    }
    if (
      form.serving_ml === "" ||
      Number(form.serving_ml) < 30 ||
      Number(form.serving_ml) > 2000
    ) {
      errors.serving_ml = "La porción debe estar entre 30 y 2000 ml.";
    }
    if (form.description.trim().length > 1000) {
      errors.description = "Máximo 1000 caracteres.";
    }
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        category: Number(form.category),
        description: form.description.trim(),
        price: Number(form.price).toFixed(2),
        abv: Number(form.abv).toFixed(2),
        serving_ml: Number(form.serving_ml),
        rating: Number(form.rating),
        is_alcoholic: Boolean(form.is_alcoholic),
        is_favorite: Boolean(form.is_favorite),
        image_url: form.image_url.trim(),
      });
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={beverage ? "Editar bebida" : "Nueva bebida"}
      subtitle={
        beverage
          ? "Ajusta los detalles de esta etiqueta de tu bar."
          : "Agrega una etiqueta más a tu colección personal."
      }
      onClose={saving ? () => {} : onClose}
      wide
    >
      <form className="beverage-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="form-alert" role="alert">
            <AlertCircle size={18} /> {formError}
          </div>
        )}

        <div className="form-grid">
          <div className="field field--span2">
            <label htmlFor="beverage-name">Nombre de la bebida *</label>
            <input
              id="beverage-name"
              value={form.name}
              onChange={(event) => setValue("name", event.target.value)}
              placeholder="Ej. Margarita de tamarindo"
              maxLength={100}
              autoFocus
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
          </div>

          <div className="field">
            <label htmlFor="beverage-category">Categoría *</label>
            <select
              id="beverage-category"
              value={form.category}
              onChange={(event) => setValue("category", event.target.value)}
              aria-invalid={Boolean(fieldErrors.category)}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <small className="field-error">{fieldErrors.category}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="beverage-price">Precio (MXN) *</label>
            <input
              id="beverage-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setValue("price", event.target.value)}
              aria-invalid={Boolean(fieldErrors.price)}
            />
            {fieldErrors.price && <small className="field-error">{fieldErrors.price}</small>}
          </div>

          <div className="field field--span2">
            <label htmlFor="beverage-description">Descripción</label>
            <textarea
              id="beverage-description"
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={(event) => setValue("description", event.target.value)}
              placeholder="Ingredientes, notas de cata, ese detalle que la hace tuya…"
              aria-invalid={Boolean(fieldErrors.description)}
            />
            <small className="field-hint">{form.description.length}/1000 caracteres</small>
            {fieldErrors.description && (
              <small className="field-error">{fieldErrors.description}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="beverage-abv">Graduación (% ABV)</label>
            <input
              id="beverage-abv"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.abv}
              onChange={(event) => setValue("abv", event.target.value)}
              aria-invalid={Boolean(fieldErrors.abv)}
            />
            {fieldErrors.abv && <small className="field-error">{fieldErrors.abv}</small>}
          </div>

          <div className="field">
            <label htmlFor="beverage-serving">Porción (ml)</label>
            <input
              id="beverage-serving"
              type="number"
              min="30"
              max="2000"
              step="10"
              value={form.serving_ml}
              onChange={(event) => setValue("serving_ml", event.target.value)}
              aria-invalid={Boolean(fieldErrors.serving_ml)}
            />
            {fieldErrors.serving_ml && (
              <small className="field-error">{fieldErrors.serving_ml}</small>
            )}
          </div>

          <div className="field">
            <label id="rating-label">Calificación</label>
            <div className="rating-picker" role="group" aria-labelledby="rating-label">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= form.rating ? "is-active" : ""}
                  onClick={() => setValue("rating", value)}
                  aria-label={`${value} de 5 estrellas`}
                  aria-pressed={value === form.rating}
                >
                  <Star size={22} fill={value <= form.rating ? "currentColor" : "none"} />
                </button>
              ))}
              <span>{form.rating}/5</span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="beverage-image">Imagen (URL)</label>
            <input
              id="beverage-image"
              type="url"
              value={form.image_url}
              onChange={(event) => setValue("image_url", event.target.value)}
              placeholder="https://…"
              aria-invalid={Boolean(fieldErrors.image_url)}
            />
            {fieldErrors.image_url && (
              <small className="field-error">{fieldErrors.image_url}</small>
            )}
          </div>

          <div className="switches field--span2">
            <label className="switch-row">
              <span>
                <strong>Contiene alcohol</strong>
                <small>Se muestra con su porcentaje ABV.</small>
              </span>
              <input
                type="checkbox"
                checked={form.is_alcoholic}
                onChange={(event) => setValue("is_alcoholic", event.target.checked)}
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
            <label className="switch-row">
              <span>
                <strong>Marcar como favorita</strong>
                <small>Aparecerá primero en tu colección.</small>
              </span>
              <input
                type="checkbox"
                checked={form.is_favorite}
                onChange={(event) => setValue("is_favorite", event.target.checked)}
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
          </div>
          {fieldErrors.is_alcoholic && (
            <p className="field-error field--span2">{fieldErrors.is_alcoholic}</p>
          )}
        </div>

        <footer className="modal-card__footer">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={17} className="spin" /> Guardando…
              </>
            ) : beverage ? (
              "Guardar cambios"
            ) : (
              "Agregar a mi bar"
            )}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
