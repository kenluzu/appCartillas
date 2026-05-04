type Props = {
  paginaActual: number;
  totalPaginas: number;
  total: number;
  limite: number;
  onChange: (pagina: number) => void;
};

function calcularVentana(paginaActual: number, totalPaginas: number): (number | "...")[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  const adyacentes = 2;
  const inicio = Math.max(2, paginaActual - adyacentes);
  const fin = Math.min(totalPaginas - 1, paginaActual + adyacentes);

  const items: (number | "...")[] = [1];

  if (inicio > 2) items.push("...");
  for (let i = inicio; i <= fin; i++) items.push(i);
  if (fin < totalPaginas - 1) items.push("...");

  items.push(totalPaginas);
  return items;
}

export function Paginacion({ paginaActual, totalPaginas, total, limite, onChange }: Props) {
  const desde = (paginaActual - 1) * limite + 1;
  const hasta = Math.min(paginaActual * limite, total);
  const ventana = calcularVentana(paginaActual, totalPaginas);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
      <div className="bg-white ring-1 ring-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-3 py-2 flex items-center gap-1">
        {/* Chevron anterior */}
        <button
          onClick={() => onChange(paginaActual - 1)}
          disabled={paginaActual <= 1}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Página anterior"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Números */}
        {ventana.map((item, i) =>
          item === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-9 h-9 flex items-center justify-center text-gray-300 text-sm select-none"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors cursor-pointer
                ${item === paginaActual
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {item}
            </button>
          )
        )}

        {/* Chevron siguiente */}
        <button
          onClick={() => onChange(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Página siguiente"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-400 whitespace-nowrap">
        Mostrando {total === 0 ? 0 : desde}–{hasta} de {total} usuarios
      </p>
    </div>
  );
}
