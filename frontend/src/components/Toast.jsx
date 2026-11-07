import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function Toast({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast toast--${toast.type || "info"}`}>
            <Icon size={19} />
            <p>{toast.message}</p>
            <button type="button" onClick={() => onClose(toast.id)} aria-label="Cerrar aviso">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
