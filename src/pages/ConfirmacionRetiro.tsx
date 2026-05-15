import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function ConfirmacionRetiro() {
  const { usuario, retiro, clearUserSession } = useApp();
  const navigate = useNavigate();

  if (!retiro || !usuario) return null;

  const horaMostrar = retiro.hora_retiro?.slice(0, 5) ?? retiro.hora_retiro;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-green-600 text-white text-center px-6 py-8">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-bold">¡Retiro confirmado!</h2>
          <p className="text-green-100 text-sm mt-1">
            {usuario.nombre} {usuario.apellido}
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fecha y hora</p>
                <p className="font-semibold text-gray-800">
                  {retiro.fecha_retiro} a las {horaMostrar}
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="text-xl">👕</span>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Premio</p>
                <p className="font-semibold text-gray-800">1 camiseta de Ecuador </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-700 text-sm">
              Recuerda presentar tu <strong>cédula de identidad</strong> al momento del retiro.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => navigate("/planificacion")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Modificar
            </button>
            <button
              onClick={() => { clearUserSession(); navigate("/"); }}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
