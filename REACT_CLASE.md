# Clase de React — Ponte la 10

Asumimos que ya entendés componentes y JavaScript. Esta clase cubre los patrones que aparecen en **este mismo proyecto**.

---

## 1. Estado local con `useState`

El estado es información que, cuando cambia, hace que el componente se vuelva a renderizar.

```tsx
const [cedula, setCedula] = useState("");
const [cargando, setCargando] = useState(false);
const [error, setError] = useState("");
```

**Regla:** `useState(valorInicial)` devuelve `[valorActual, funcionParaCambiarlo]`.

Nunca mutés el valor directamente:

```tsx
// MAL — React no se entera del cambio
cedula = "123";

// BIEN
setCedula("123");
```

En `IngresoCedula.tsx:23-25` usamos tres estados independientes para el formulario. Cada llamada a `set*` dispara un re-render.

---

## 2. Inputs controlados

Un input controlado es uno cuyo valor *siempre* refleja el estado:

```tsx
<input
  value={cedula}
  onChange={e => setCedula(e.target.value.replace(/\D/g, "").slice(0, 13))}
/>
```

El flujo es:
1. El usuario tipea → se dispara `onChange`
2. `onChange` llama a `setCedula` con el nuevo valor (limpiado)
3. React re-renderiza → el `input` muestra el nuevo estado

Si no ponés `onChange`, el input queda congelado en el valor inicial.

---

## 3. Manejo de eventos de formulario

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();   // evita que la página recargue
  setCargando(true);
  setError("");

  try {
    const res = await api.buscarUsuario(cedula);
    // ... actualizar estado global
  } catch (err: any) {
    setError(err.message ?? "Error al consultar");
  } finally {
    setCargando(false);  // always — aunque haya error
  }
}

<form onSubmit={handleSubmit}>
```

`finally` garantiza que `cargando` vuelve a `false` sin importar si la llamada tuvo éxito o falló.

---

## 4. Renderizado condicional

React acepta expresiones JavaScript dentro de JSX.

**Con operador `&&`** — renderiza solo si la condición es verdadera:

```tsx
{error && (
  <p className="text-red-600">{error}</p>
)}
```

**Con ternario** — elige entre dos opciones:

```tsx
{cargando ? "Consultando..." : "Ingresar"}
```

**Con `if` antes del return** — para casos más complejos:

```tsx
if (!usuario || !cartilla) return null;  // guarda: no renderiza nada si falta data
```

Esto último se llama *early return* y es patrón estándar en páginas que dependen de estado que puede ser nulo.

---

## 5. Pasar estado a un botón

```tsx
<button
  type="submit"
  disabled={cargando || cedula.trim().length === 0}
>
  {cargando ? "Consultando..." : "Ingresar"}
</button>
```

El atributo `disabled` acepta un booleano. Cuando `cargando === true` el botón se desactiva automáticamente — sin necesidad de manejarlo manualmente.

---

## 6. Context: estado global

Cuando varias páginas necesitan los mismos datos (usuario, cartilla, página actual), no conviene pasar props de componente en componente. Usamos Context.

### Cómo funciona

```tsx
// 1. Crear el contexto
const AppContext = createContext<AppState | undefined>(undefined);

// 2. Crear el proveedor — envuelve toda la app
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>("ingreso");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cartilla, setCartilla] = useState<Cartilla | null>(null);

  const navigate = (p: Page) => setPage(p);

  return (
    <AppContext.Provider value={{ page, usuario, cartilla, navigate, setUsuario, setCartilla }}>
      {children}
    </AppContext.Provider>
  );
}

// 3. Hook personalizado — para consumir el contexto fácil
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
```

### Cómo usarlo en cualquier componente

```tsx
function IngresoCedula() {
  const { navigate, setUsuario, setCartilla } = useApp();
  // ...
}
```

No importa qué tan anidado esté el componente — `useApp()` siempre accede al mismo estado.

### Dónde vive en el proyecto

- Definición: `src/context/AppContext.tsx`
- Proveedor montado en: `src/App.tsx` (envuelve todo)
- Consumido en: todas las páginas vía `useApp()`

---

## 7. Router sin librerías

En este proyecto el "router" es un simple `switch` sobre el estado `page`:

```tsx
function Router() {
  const { page } = useApp();

  switch (page) {
    case "ingreso":       return <IngresoCedula />;
    case "registro":      return <Registro />;
    case "cartilla":      return <Cartilla />;
    case "planificacion": return <PlanificacionRetiro />;
    case "confirmacion":  return <ConfirmacionRetiro />;
    default:              return <IngresoCedula />;
  }
}
```

Navegar es tan simple como:

```tsx
navigate("registro");  // cambia el estado → Router re-renderiza → nueva página aparece
```

---

## 8. `useEffect`

Se ejecuta *después* de que el componente se renderiza. Sirve para efectos secundarios: llamadas a la API, suscripciones, inicializar librerías externas.

### Sintaxis básica

```tsx
useEffect(() => {
  // código que se ejecuta después del render
}, [dependencias]);
```

| Dependencias      | Cuándo se ejecuta                    |
|-------------------|--------------------------------------|
| `[]`              | Solo una vez, al montar el componente |
| `[valor]`         | Cada vez que `valor` cambia          |
| (sin segundo arg) | En cada re-render — casi nunca querés esto |

### Ejemplo: cargar farmacias al abrir la página

```tsx
const [farmacias, setFarmacias] = useState<Farmacia[]>([]);

useEffect(() => {
  api.getFarmacias().then(setFarmacias);
}, []);  // [] = solo al montar
```

### Ejemplo: inicializar el mapa Leaflet

```tsx
useEffect(() => {
  const map = L.map("map").setView([-0.2, -78.5], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  return () => map.remove();  // limpieza al desmontar
}, []);
```

La función que retorna `useEffect` se llama *cleanup* — se ejecuta cuando el componente se desmonta o antes de que el efecto corra nuevamente.

---

## 9. Custom hooks

Un custom hook es una función que empieza con `use` y puede llamar a otros hooks. Permiten reutilizar lógica entre componentes.

```tsx
// Hook para manejar un formulario de texto simple
function useInput(inicial: string) {
  const [valor, setValor] = useState(inicial);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setValor(e.target.value);
  const reset = () => setValor(inicial);
  return { valor, onChange, reset };
}

// Uso
const cedula = useInput("");
<input value={cedula.valor} onChange={cedula.onChange} />
```

`useApp()` en este proyecto *es* un custom hook — encapsula `useContext(AppContext)` con validación.

---

## 10. TypeScript con React — lo mínimo

No necesitás saber TypeScript a fondo, pero estos tres patrones aparecen en todo el proyecto:

**Props tipadas:**
```tsx
function Boton({ texto, onClick }: { texto: string; onClick: () => void }) {
  return <button onClick={onClick}>{texto}</button>;
}
```

**Estado con tipo explícito:**
```tsx
const [usuario, setUsuario] = useState<Usuario | null>(null);
//                                     ^^^^^^^^^^^^^^^^
//                         puede ser un Usuario o null
```

**Eventos:**
```tsx
function handleChange(e: React.ChangeEvent<HTMLInputElement>) { ... }
function handleSubmit(e: React.FormEvent) { ... }
```

---

## Flujo completo: ejemplo de página

Tomando `IngresoCedula.tsx` como modelo mental de cualquier página:

```
1. Declarar estado local (inputs, loading, error)
2. Obtener estado global con useApp()
3. Escribir handler async (try/catch/finally)
4. Renderizar:
   - Formulario con inputs controlados
   - Botón disabled mientras carga
   - Mensaje de error condicional
   - Al éxito: navigate() a la siguiente página
```

---

## Resumen de hooks usados en el proyecto

| Hook         | Para qué                                  | Dónde                       |
|--------------|-------------------------------------------|-----------------------------|
| `useState`   | Estado local: inputs, loading, errores    | Todas las páginas           |
| `useContext` | Leer el contexto global                   | Dentro de `useApp()`        |
| `useEffect`  | Cargar datos, inicializar mapa Leaflet    | `PlanificacionRetiro.tsx`   |
| `useRef`     | Referencia al contenedor del mapa         | `PlanificacionRetiro.tsx`   |
| `useApp()`   | Custom hook — acceso al estado global     | Todas las páginas           |
