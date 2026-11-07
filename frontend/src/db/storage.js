// Capa de persistencia: un único objeto JSON guardado en localStorage.
// En Node (pruebas) no hay localStorage, así que se usa memoria.
import { datosIniciales } from "./seed.js";

const CLAVE = "sigr_db_v1";
let memoria = null;

const hayLocalStorage = () => typeof localStorage !== "undefined";

export function cargar() {
  if (hayLocalStorage()) {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return completarImagenes(JSON.parse(crudo));
    const nuevo = datosIniciales();
    guardar(nuevo);
    return nuevo;
  }
  if (!memoria) memoria = datosIniciales();
  return memoria;
}

// Los datos guardados antes de v1.1.0 no traen imagen en los platos: se completan desde el seed.
function completarImagenes(db) {
  const base = datosIniciales().platos;
  for (const p of db.platos) {
    if (p.imagen === undefined) p.imagen = base.find((b) => b.id === p.id)?.imagen || "";
  }
  return db;
}

// Convierte las rutas de public/ ("/img/x.jpg") en rutas relativas a la base de la app,
// para que las imágenes carguen también en una subcarpeta como /SIGR/ de GitHub Pages.
export function rutaImagen(src) {
  if (!src || /^(https?:|data:)/.test(src)) return src;
  return import.meta.env.BASE_URL + src.replace(/^\/+/, "");
}

export function guardar(db) {
  if (hayLocalStorage()) localStorage.setItem(CLAVE, JSON.stringify(db));
  else memoria = db;
}

export function reiniciar() {
  const nuevo = datosIniciales();
  guardar(nuevo);
  return nuevo;
}

export function siguienteId(db, entidad) {
  db.contadores[entidad] = (db.contadores[entidad] || 0) + 1;
  return db.contadores[entidad];
}

// Sincronización entre pestañas: el evento "storage" avisa cuando otra pestaña guarda.
export function alCambiarEnOtraPestana(callback) {
  if (typeof window === "undefined") return () => {};
  const manejador = (e) => { if (e.key === CLAVE && e.newValue) callback(JSON.parse(e.newValue)); };
  window.addEventListener("storage", manejador);
  return () => window.removeEventListener("storage", manejador);
}

// Fecha local AAAA-MM-DD (toISOString usa UTC y en Colombia cambiaría de día a las 7 p. m.).
export function fechaLocal(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
