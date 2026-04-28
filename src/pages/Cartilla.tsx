import { useApp } from "../context/AppContext";

const TOTAL_PUNTOS = 20;

export function Cartilla() {
  const { usuario, cartilla, retiro, navigate } = useApp();

  if (!usuario || !cartilla) return null;

  const puntos = cartilla.puntos ?? 0;
  const completa = cartilla.estado === "completa";
  const cerrada = cartilla.estado === "cerrada";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Encabezado */}
        <div className="bg-green-600 text-white px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-xl">{usuario.nombre} {usuario.apellido}</h2>
              <p className="text-green-100 text-sm mt-0.5">CI: {usuario.cedula}</p>
            </div>
            <button
              onClick={() => navigate("ingreso")}
              className="text-green-200 hover:text-white text-sm transition-colors"
            >
              Salir
            </button>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-extrabold">{puntos}</span>
            <span className="text-green-200 mb-1">/ {TOTAL_PUNTOS} puntos</span>
          </div>

          {completa ? (
            <span className="inline-block mt-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
              ¡Cartilla completa! 🎉
            </span>
          ) : cerrada ? (
            <span className="inline-block mt-2 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
              Cartilla cerrada
            </span>
          ) : (
            <span className="inline-block mt-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              En progreso
            </span>
          )}
        </div>

        {/* Grid cartilla */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tu cartilla</h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: TOTAL_PUNTOS }, (_, i) => {
              const lleno = i < puntos;
              return (
                <div
                  key={i}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-lg
                    ${lleno
                      ? "bg-green-500 shadow-sm"
                      : "bg-gray-100 border-2 border-dashed border-gray-200"}
                  `}
                >
                  {lleno ? "⭐" : <span className="text-xs text-gray-300 font-mono">{i + 1}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Aviso día caído */}
        <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">ℹ️</span>
          <p className="text-amber-700 text-xs">
            Las compras de <strong>hoy</strong> se reflejan en tu cartilla al <strong>día siguiente</strong>.
          </p>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 space-y-3">
          {completa && !retiro && (
            <button
              onClick={() => navigate("redencion")}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-colors text-base"
            >
              🎁 Redimir mi camiseta
            </button>
          )}

          {completa && retiro && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-semibold text-blue-800 text-sm">Retiro planificado</p>
              <p className="text-blue-700 text-sm mt-1">
                📍 {retiro.farmacia_nombre}<br />
                📅 {retiro.fecha_retiro} a las {retiro.hora_retiro.slice(0, 5)}
              </p>
              <button
                onClick={() => navigate("redencion")}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                Modificar retiro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
