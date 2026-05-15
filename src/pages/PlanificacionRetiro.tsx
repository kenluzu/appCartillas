import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { crearPlan, actualizarPlan } from "../lib/retiros";

export function PlanificacionRetiro() {
  const { cartilla, retiro, setRetiro } = useApp();
  const navigate = useNavigate();

  const [fecha, setFecha] = useState(retiro?.fecha_retiro ?? "");
  const [hora, setHora] = useState(retiro?.hora_retiro?.slice(0, 5) ?? "");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const esModificacion = !!retiro;
  const hoy = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha) { setError("Selecciona una fecha"); return; }
    if (!hora) { setError("Selecciona una hora"); return; }

    setCargando(true);
    setError("");
    try {
      if (esModificacion && retiro) {
        const updated = await actualizarPlan(retiro.id, {
          fecha_retiro: fecha,
          hora_retiro: hora,
        });
        setRetiro(updated);
      } else {
        const nuevo = await crearPlan({
          cartilla_id: cartilla!.id,
          fecha_retiro: fecha,
          hora_retiro: hora,
        });
        setRetiro(nuevo);
      }
      navigate("/confirmacion");
    } catch (e: any) {
      setError(e.message ?? "Error al procesar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/retos")} className="text-white hover:text-gray-300 text-sm cursor-pointer">
            ← Volver
          </button>
          <h2 className="text-xl font-bold text-white">
            {esModificacion ? "Modificar retiro" : "Planificar retiro"}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Fecha y hora de retiro</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
              <input
                type="date"
                value={fecha}
                min={hoy}
                onChange={e => setFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hora</label>
              <input
                type="time"
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={cargando}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer"
        >
          {cargando
            ? "Procesando..."
            : esModificacion
            ? "Guardar cambios"
            : "Confirmar retiro"}
        </button>
      </div>
    </div>
  );
}
