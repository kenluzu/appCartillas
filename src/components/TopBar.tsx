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

export function TopBar({ nombre, apellido, cedula, canal, accion }: TopBarProps) {
  return (
    <div className="fixed top-3 left-0 right-0 z-20 flex justify-center px-4">
      <div
        className="w-full max-w-3xl flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        {/* Izquierda: avatar + nombre + cédula + badge */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-condensed font-bold text-base"
            style={{
              background: "linear-gradient(135deg, #f7c948 0%, #e6a817 100%)",
              color: "#1a1000",
            }}
          >
            {nombre.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="font-condensed font-bold text-[18px] leading-tight truncate" style={{ color: "rgba(0,0,0,0.85)" }}>
              {nombre} {apellido}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-mono shrink-0" style={{ color: "rgba(0,0,0,0.38)" }}>{cedula}</span>
              {canal && (
                <span
                  className="text-[9px] font-condensed font-bold tracking-wider px-1.5 py-0.5 rounded-full uppercase leading-none shrink-0"
                  style={
                    canal === "CORPORATIVO"
                      ? { background: "#f7c948", color: "#1a1000" }
                      : { background: "#1d9e75", color: "#fff" }
                  }
                >
                  {canal}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-px h-7 shrink-0" style={{ background: "rgba(0,0,0,0.07)" }} />

        {/* Derecha: botón acción */}
        <button
          onClick={accion.onClick}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 cursor-pointer shrink-0 transition-all"
          style={{
            border: "1px solid rgba(0,0,0,0.10)",
            color: "rgba(0,0,0,0.45)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,0,0,0.80)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,0,0,0.45)"; }}
        >
          {accion.icono === "salir" ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          )}
          <span className="text-xs font-barlow font-medium hidden sm:inline">{accion.label}</span>
        </button>
      </div>
    </div>
  );
}
