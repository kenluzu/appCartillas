type TopBarProps = {
  nombre: string;
  apellido: string;
  cedula: string;
  canal: "CORPORATIVO" | "COMERCIAL" | null;
  puntos: number;
  accion: {
    label: string;
    icono: "salir" | "volver";
    onClick: () => void;
  };
};

export function TopBar({ nombre, apellido, cedula, canal, puntos, accion }: TopBarProps) {
  return (
    <div className="fixed top-3 left-0 right-0 z-20 flex justify-center px-4 sm:px-6">
      <div
        className="w-full max-w-3xl flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {/* Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {nombre.charAt(0).toUpperCase()}
        </div>

        {/* Nombre + cédula + canal */}
        <div className="min-w-0 flex-1">
          <p className="text-black/80 font-bold text-sm sm:text-base leading-tight truncate">
            {nombre} {apellido}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-black/40 text-[11px] font-mono">{cedula}</span>
            {canal && (
              <span className={`text-[9px] sm:text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${canal === "CORPORATIVO" ? "bg-indigo-500/80 text-indigo-800" : "bg-emerald-500/80 text-emerald-800"}`}>
                {canal}
              </span>
            )}
          </div>
        </div>

        {/* Divisor — solo visible cuando hay progreso */}
        <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

        
        <div className="w-px h-8 bg-white/10 shrink-0" />

        {/* Botón acción */}
        <button
          onClick={accion.onClick}
          className="flex items-center gap-1.5 bg-white hover:bg-gray-100 active:bg-gray-200 rounded-xl px-3 py-2 sm:px-4 text-gray-900 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
        >
          {accion.icono === "salir" ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          )}
          <span className="hidden sm:inline">{accion.label}</span>
        </button>
      </div>
    </div>
  );
}
