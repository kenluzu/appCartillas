import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const TOTAL_PUNTOS = 10;
const WHATSAPP_ADMIN = "593XXXXXXXXX"; // Reemplazar con el número real del administrador

export function Cartilla() {
  const { usuario, cartilla, setCartilla, clearUserSession } = useApp();
  const navigate = useNavigate();
  const [iniciandoNueva, setIniciandoNueva] = useState(false);
  const [errorNueva, setErrorNueva] = useState("");

  if (!usuario || !cartilla) return null;

  const puntos = cartilla.puntos ?? 0;
  const cerrada = cartilla.estado === "cerrada";
  const completa = !cerrada && (cartilla.estado === "completa" || puntos >= TOTAL_PUNTOS);

  const whatsappMsg = encodeURIComponent(
    `Hola! Completé mi cartilla *Ponte la 10* 🎉\nCédula: ${usuario.cedula}\nNombre: ${usuario.nombre} ${usuario.apellido}\nPuntos: ${puntos}/${TOTAL_PUNTOS}\nMe gustaría coordinar la entrega de mi premio.`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_ADMIN}?text=${whatsappMsg}`;

  async function iniciarNuevaCartilla() {
    setIniciandoNueva(true);
    setErrorNueva("");
    try {
      const res = await fetch("/api/usuarios/nueva-cartilla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: usuario!.id }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setErrorNueva((data.error as string) ?? "Error al crear nueva cartilla");
        return;
      }
      const nueva = data as { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
      setCartilla(nueva);
      navigate("/retos");
    } catch {
      setErrorNueva("Error de conexión");
    } finally {
      setIniciandoNueva(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Encabezado */}
        <div className="bg-green-600 text-white px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-xl">{usuario.nombre} {usuario.apellido}</h2>
              <p className="text-green-100 text-sm mt-0.5">CI: {usuario.cedula}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/retos")}
                className="text-green-200 hover:text-white text-sm transition-colors cursor-pointer"
              >
                Retos
              </button>
            </div>
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

        {/* Aviso */}
        <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">ℹ️</span>
          <p className="text-amber-700 text-xs">
            Cada reto registrado suma <strong>1 punto</strong> a tu cartilla. Al completar 10 puntos podrás coordinar tu premio.
          </p>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 space-y-3">
          {completa && (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors text-base cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Coordinar mi premio por WhatsApp
              </a>

              <button
                onClick={iniciarNuevaCartilla}
                disabled={iniciandoNueva}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer text-sm"
              >
                {iniciandoNueva ? "Creando..." : "Iniciar nueva cartilla (0/10)"}
              </button>

              {errorNueva && (
                <p className="text-red-600 text-sm text-center">{errorNueva}</p>
              )}
            </>
          )}

          <button
            onClick={() => navigate("/historial")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer text-sm"
          >
            Ver historial de cartillas
          </button>
        </div>
      </div>
    </div>
  );
}
