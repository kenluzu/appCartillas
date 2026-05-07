import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function SelectorCanal() {
  const { setCanal } = useApp();
  const navigate = useNavigate();

  function seleccionar(canal: "CORPORATIVO" | "COMERCIAL") {
    setCanal(canal);
    navigate("/ingresar");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">

      <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            ¡Ponte la <span className="text-yellow-600">10</span>!
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium tracking-wide uppercase">
            Farmcorp · Programa de retos
          </p>
        </div>

        <p className="text-gray-500 text-center text-sm mb-5">
          Selecciona tu canal para continuar
        </p>

        <div className="space-y-3">
          <button
            onClick={() => seleccionar("CORPORATIVO")}
            className="w-full flex items-center gap-4 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl px-5 py-4 text-left transition-all duration-200 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-indigo-600">
              <span className="text-xl">🏢</span>
            </div>
            <div className="flex-1">
              <p className="text-indigo-800 font-bold text-base tracking-wide">CORPORATIVO</p>
              <p className="text-indigo-400 text-xs mt-0.5">Canal corporativo Farmcorp</p>
            </div>
            <svg className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => seleccionar("COMERCIAL")}
            className="w-full flex items-center gap-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-100 hover:border-emerald-300 rounded-2xl px-5 py-4 text-left transition-all duration-200 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-600">
              <span className="text-xl">🛒</span>
            </div>
            <div className="flex-1">
              <p className="text-emerald-800 font-bold text-base tracking-wide">COMERCIAL</p>
              <p className="text-emerald-400 text-xs mt-0.5">Canal comercial Farmcorp</p>
            </div>
            <svg className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/admin")}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
          >
            Administrador
          </button>
        </div>
      </div>
    </div>
  );
}
