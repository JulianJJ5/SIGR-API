// Estado global de la app: la "base de datos" reactiva y la sesión.
import { reactive, ref } from "vue";
import { cargar, guardar, reiniciar, alCambiarEnOtraPestana } from "./db/storage.js";
import { api, apiResponde, ErrorApi } from "./api.js";

export const db = reactive(cargar());
export const sesion = ref(JSON.parse(sessionStorage.getItem("sigr_sesion") || "null"));
export const aviso = ref(null);

function reemplazar(nuevo) {
  for (const k of Object.keys(db)) delete db[k];
  Object.assign(db, nuevo);
}

// Ejecuta un cambio sobre la base de datos, lo guarda y muestra el resultado o el error.
export function mutar(fn, mensajeOk) {
  try {
    const r = fn(db);
    guardar(JSON.parse(JSON.stringify(db)));
    if (mensajeOk) mostrar(mensajeOk, "ok");
    return r;
  } catch (e) {
    mostrar(e.message, "error");
    return null;
  }
}

export function mostrar(texto, tipo = "ok") {
  aviso.value = { texto, tipo };
  clearTimeout(mostrar._t);
  mostrar._t = setTimeout(() => (aviso.value = null), 3500);
}

export function entrar(usuario) {
  sesion.value = usuario;
  sessionStorage.setItem("sigr_sesion", JSON.stringify(usuario));
}

export function salir() {
  sesion.value = null;
  sessionStorage.removeItem("sigr_sesion");
}

export function restaurarDatosDemo() {
  reemplazar(reiniciar());
  mostrar("Datos de demostración restaurados", "ok");
}

// "Tiempo real" entre pestañas: si otra pestaña cambia un pedido, esta se actualiza sola.
alCambiarEnOtraPestana((nuevo) => reemplazar(nuevo));

// ---------- Conexión con la API REST (v1.2.0) ----------
// null = comprobando, true = el menú y las reservas se guardan en la API, false = modo local.
export const apiDisponible = ref(null);

const persistir = () => guardar(JSON.parse(JSON.stringify(db)));

// Trae de la API el menú y las reservas, que son la fuente de verdad cuando la API está activa.
export async function sincronizarConApi() {
  apiDisponible.value = await apiResponde();
  if (!apiDisponible.value) return;
  try {
    const [m, reservas] = await Promise.all([api("GET", "/menu"), api("GET", "/reservas")]);
    db.categorias = m.categorias;
    db.platos = m.platos;
    db.reservas = reservas;
    persistir();
  } catch {
    apiDisponible.value = false;
  }
}

// Envía un cambio a la API; si responde bien, aplica el resultado en la copia local.
// Devuelve { ok, campos } para que el formulario pueda marcar los campos con error.
export async function enviar(peticion, aplicar, mensajeOk) {
  try {
    const datos = await peticion();
    aplicar(db, datos);
    persistir();
    if (mensajeOk) mostrar(mensajeOk, "ok");
    return { ok: true, datos, campos: {} };
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 0) {
      apiDisponible.value = false;
      mostrar("Se perdió la conexión con la API; la página pasa a modo local", "error");
      return { ok: false, campos: {} };
    }
    const detalle = Object.values(e.campos || {})[0];
    mostrar(detalle ? `${e.message}: ${detalle}` : e.message, "error");
    return { ok: false, campos: e.campos || {} };
  }
}

// Reemplaza o agrega un elemento por id en una colección local.
export function ponerEn(lista, elemento) {
  const i = lista.findIndex((x) => x.id === elemento.id);
  if (i >= 0) lista.splice(i, 1, elemento);
  else lista.push(elemento);
}

sincronizarConApi();
