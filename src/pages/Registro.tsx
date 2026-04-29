import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";

export function Registro() {
  const { navigate, setUsuario, setCartilla, setRetiro, cedulaPendiente } = useApp();
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim() || !form.telefono.trim()) {
      setError("Todos los campos son requeridos");
      return;
    }

    setCargando(true);
    setError("");
    try {
      const res = await api.registrarUsuario({
        cedula: cedulaPendiente,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
      });
      setUsuario(res.usuario);
      setCartilla(res.cartilla);
      setRetiro(null);
      navigate("cartilla");
    } catch (e: any) {
      setError(e.message ?? "Error al registrar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <button
          onClick={() => navigate("ingreso")}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors cursor-pointer"
        >
          ← Volver
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📋</div>
          <h2 className="text-xl font-bold text-gray-800">Nuevo registro</h2>
          <p className="text-gray-500 text-sm mt-1">Cédula: <span className="font-mono font-semibold">{cedulaPendiente}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              type="text"
              placeholder="Tu nombre"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              type="text"
              placeholder="Tu apellido"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / Celular</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              type="tel"
              placeholder="0999999999"
              inputMode="tel"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
          >
            {cargando ? "Registrando..." : "Registrarme y ver mi cartilla"}
          </button>
        </form>
      </div>
    </div>
  );
}
