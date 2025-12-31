import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-full grid place-items-center">
      <div className="text-center">
        <div className="text-2xl font-semibold">404</div>
        <div className="text-slate-600 mt-1">Page not found</div>
        <Link className="inline-block mt-3 underline" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
