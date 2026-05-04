import { useState } from "react";
import { useApp } from "../context/AppContext";

export function Registro() {
  const { navigate, setUsuario, setCartilla, setRetiro, cedulaPendiente } = useApp();
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "" });
  const [erroresCampo, setErroresCampo] = useState({ nombre: "", apellido: "", telefono: "" });
  const [errorGlobal, setErrorGlobal] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (erroresCampo[name as keyof typeof erroresCampo]) {
      setErroresCampo(prev => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nuevosErrores = {
      nombre: form.nombre.trim() ? "" : "El nombre es requerido",
      apellido: form.apellido.trim() ? "" : "El apellido es requerido",
      telefono: form.telefono.trim() ? "" : "El teléfono es requerido",
    };
    setErroresCampo(nuevosErrores);
    if (nuevosErrores.nombre || nuevosErrores.apellido || nuevosErrores.telefono) return;

    setCargando(true);
    setErrorGlobal("");
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: cedulaPendiente,
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          telefono: form.telefono.trim(),
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        setUsuario(data);
        setCartilla(data.cartilla);
        setRetiro(null);
        navigate("cartilla");
      } else if (res.status === 409) {
        setErrorGlobal("Esta cédula ya está registrada");
      } else {
        setErrorGlobal("Ocurrió un error, intenta de nuevo");
      }
    } catch {
      setErrorGlobal("Ocurrió un error, intenta de nuevo");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
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
              disabled={cargando}
              type="text"
              placeholder="Tu nombre"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            />
            {erroresCampo.nombre && (
              <p className="text-red-600 text-xs mt-1">{erroresCampo.nombre}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              disabled={cargando}
              type="text"
              placeholder="Tu apellido"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            />
            {erroresCampo.apellido && (
              <p className="text-red-600 text-xs mt-1">{erroresCampo.apellido}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / Celular</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              disabled={cargando}
              type="tel"
              placeholder="0999999999"
              inputMode="tel"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            />
            {erroresCampo.telefono && (
              <p className="text-red-600 text-xs mt-1">{erroresCampo.telefono}</p>
            )}
          </div>

          {errorGlobal && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {errorGlobal}
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
