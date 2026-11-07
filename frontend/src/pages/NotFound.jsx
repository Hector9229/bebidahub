import { ArrowLeft, GlassWater } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="not-found__card">
        <span className="not-found__emoji" aria-hidden="true">
          🍹
        </span>
        <span className="eyebrow">Error 404</span>
        <h1>Esta mesa está vacía.</h1>
        <p>
          La página que buscas no existe o se fue con la última ronda. Regresemos a un lugar
          conocido.
        </p>
        <div className="not-found__actions">
          <Link to="/" className="button button--primary">
            <ArrowLeft size={17} /> Volver al inicio
          </Link>
          <Link to="/explorar" className="button button--outline">
            <GlassWater size={17} /> Explorar cócteles
          </Link>
        </div>
      </div>
    </section>
  );
}
