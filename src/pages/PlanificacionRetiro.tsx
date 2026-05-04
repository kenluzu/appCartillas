import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api, haversine, type Farmacia } from "../lib/api";
import location1Svg from "../assets/location1.svg";

declare const L: any;

type FarmaciaConDistancia = Farmacia & { distancia?: number };

export function PlanificacionRetiro() {
  const { cartilla, retiro, setRetiro } = useApp();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [farmacias, setFarmacias] = useState<FarmaciaConDistancia[]>([]);
  const [cercanas, setCercanas] = useState<FarmaciaConDistancia[]>([]);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState<number | null>(retiro?.farmacia_id ?? null);
  const [fecha, setFecha] = useState(retiro?.fecha_retiro ?? "");
  const [hora, setHora] = useState(retiro?.hora_retiro?.slice(0, 5) ?? "");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [loadingFarmacias, setLoadingFarmacias] = useState(true);

  const esModificacion = !!retiro;
  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api.getFarmacias().then(data => {
      setFarmacias(data);
      setLoadingFarmacias(false);
    });
  }, []);

  useEffect(() => {
    if (!farmacias.length) return;

    if (!("geolocation" in navigator)) {
      setCercanas(farmacias.slice(0, 4));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setUbicacion({ lat: latitude, lng: longitude });
        const conDistancia = farmacias.map(f => ({
          ...f,
          distancia: haversine(latitude, longitude, f.latitud, f.longitud),
        }));
        conDistancia.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
        setCercanas(conDistancia.slice(0, 4));
      },
      () => {
        setCercanas(farmacias.slice(0, 4));
      },
      { timeout: 8000 }
    );
  }, [farmacias]);

  useEffect(() => {
    if (!mapRef.current || !cercanas.length || mapInstanceRef.current) return;

    const center = ubicacion
      ? [ubicacion.lat, ubicacion.lng]
      : [cercanas[0]!.latitud, cercanas[0]!.longitud];

    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(map);

    if (ubicacion) {
      L.circleMarker([ubicacion.lat, ubicacion.lng], {
        radius: 8, color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.8,
      }).addTo(map).bindPopup("Tu ubicación");
    }

    cercanas.forEach(f => {
      const sinStock = f.cantidad <= 0;
      const icon = L.divIcon({
        html: `<div style="background:${sinStock ? "#9ca3af" : "#16a34a"};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><img src="${location1Svg}" width="20" height="20" style="display:block"/></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "",
      });
      const marker = L.marker([f.latitud, f.longitud], { icon })
        .addTo(map)
        .bindPopup(
          `<b>${f.nombre}</b><br>${f.direccion}<br>${sinStock ? '<span style="color:red">Sin disponibilidad</span>' : `<span style="color:green">Stock: ${f.cantidad}</span>`}`
        );
      markersRef.current.push(marker);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [cercanas, ubicacion]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmaciaSeleccionada) { setError("Selecciona una farmacia"); return; }
    if (!fecha) { setError("Selecciona una fecha"); return; }
    if (!hora) { setError("Selecciona una hora"); return; }

    setCargando(true);
    setError("");
    try {
      if (esModificacion && retiro) {
        const updated = await api.updatePlan(retiro.id, {
          farmacia_id: farmaciaSeleccionada,
          fecha_retiro: fecha,
          hora_retiro: hora,
        });
        setRetiro(updated);
      } else {
        const nuevo = await api.createPlan({
          cartilla_id: cartilla!.id,
          farmacia_id: farmaciaSeleccionada,
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
          <button onClick={() => navigate("/cartilla")} className="text-white hover:text-gray-300 text-sm cursor-pointer">
            ← Volver
          </button>
          <h2 className="text-xl font-bold text-white">
            {esModificacion ? "Modificar retiro" : "Planificar retiro"}
          </h2>
        </div>

        {/* Mapa */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-700 text-sm">Farmacias cercanas</h3>
            {!ubicacion && !loadingFarmacias && (
              <p className="text-xs text-amber-600 mt-1">
                Habilita tu ubicación para ver las farmacias más cercanas
              </p>
            )}
          </div>
          <div ref={mapRef} className="w-full h-56" />
        </div>

        {/* Selección de farmacia */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Selecciona una farmacia</h3>
          {loadingFarmacias ? (
            <p className="text-gray-400 text-sm">Cargando farmacias...</p>
          ) : (
            <div className="space-y-2">
              {cercanas.map(f => {
                const sinStock = f.cantidad <= 0;
                const seleccionada = farmaciaSeleccionada === f.id;
                return (
                  <button
                    key={f.id}
                    disabled={sinStock}
                    onClick={() => !sinStock && setFarmaciaSeleccionada(f.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all
                      ${sinStock ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50" :
                        seleccionada ? "cursor-pointer border-green-500 bg-green-50" : "cursor-pointer border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{f.nombre}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{f.direccion}</p>
                        {f.distancia !== undefined && (
                          <p className="text-xs text-gray-400 mt-0.5">{f.distancia.toFixed(1)} km</p>
                        )}
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        {sinStock ? (
                          <span className="text-xs text-red-500 font-medium">Sin disponibilidad</span>
                        ) : (
                          <>
                            <span className="text-xs text-green-600 font-medium">Disponible</span>
                            {seleccionada && <span className="ml-2 text-green-500">✓</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fecha y hora */}
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
