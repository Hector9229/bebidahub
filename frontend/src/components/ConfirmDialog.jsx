import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "./Modal.jsx";

export default function ConfirmDialog({ beverage, onClose, onConfirm, busy }) {
  return (
    <Modal
      title="Eliminar bebida"
      subtitle="Esta acción no se puede deshacer."
      onClose={busy ? () => {} : onClose}
    >
      <div className="confirm-body">
        <span className="confirm-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </span>
        <p>
          ¿Seguro que quieres eliminar <strong>{beverage.name}</strong> de tu bar? Se perderán
          sus datos y calificación.
        </p>
      </div>
      <footer className="modal-card__footer">
        <button type="button" className="button button--ghost" onClick={onClose} disabled={busy}>
          Conservarla
        </button>
        <button
          type="button"
          className="button button--danger"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 size={17} className="spin" /> Eliminando…
            </>
          ) : (
            "Sí, eliminar"
          )}
        </button>
      </footer>
    </Modal>
  );
}
