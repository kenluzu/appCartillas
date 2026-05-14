import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export function AdminLogin() {
  const { setAdminNombre } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ cedula: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cedula || !form.password) { setError("Ingresa tus credenciales"); return; }

    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: form.cedula.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Credenciales inválidas");
      localStorage.setItem("admin_token", data.token);
      setAdminNombre(data.nombre);
      navigate("/admin/panel");
    } catch (e: any) {
      setError(e.message ?? "Credenciales inválidas");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-amber-50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm relative animate-fade-in-up">
        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="text-white hover:text-gray-200 text-sm mb-8 block transition-colors duration-200 group cursor-pointer"
        >
          <span className="group-hover:-translate-x-0.5 inline-block transition-transform duration-200">←</span> Volver al inicio
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06)] p-8 border border-gray-100/80">
          {/* Icon + Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-gray-900 tracking-tight">Panel Administrador</h2>
            <p className="text-gray-400 text-sm mt-1.5">Ponte la 10</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario</label>
              <input
                type="text"
                value={form.cedula}
                onChange={e => setForm(p => ({ ...p, cedula: e.target.value }))}
                placeholder="Usuario de administrador"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Contraseña"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 placeholder:text-gray-300"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3 animate-slide-in">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1 cursor-pointer"
            >
              ← Volver
            </button>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-[0_1px_2px_rgba(37,99,235,0.15)] hover:shadow-[0_2px_8px_rgba(37,99,235,0.2)] active:scale-[0.98] cursor-pointer"
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </span>
              ) : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
