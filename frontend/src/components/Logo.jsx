import { Martini } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand--light" : ""}`}
      aria-label="BebidaHub, ir al inicio"
    >
      <span className="brand__mark" aria-hidden="true">
        <Martini size={21} strokeWidth={2.2} />
      </span>
      <span className="brand__text">
        Bebida<span>Hub</span>
      </span>
    </Link>
  );
}
