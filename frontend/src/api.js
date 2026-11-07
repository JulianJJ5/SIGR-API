// Cliente de la API REST del SIGR.
// La dirección de la API está en esta única constante: cámbiela aquí si el servidor corre en otro lugar.
export const API_URL = "http://localhost:3200/api";

export class ErrorApi extends Error {
  constructor(status, mensaje, campos = {}) {
    super(mensaje);
    this.status = status; // 0 = sin conexión con la API
    this.campos = campos;
  }
}

export async function api(metodo, ruta, cuerpo) {
  let res;
  try {
    res = await fetch(API_URL + ruta, {
      method: metodo,
      headers: cuerpo === undefined ? {} : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(0, "No hay conexión con la API");
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorApi(res.status, datos.error || `Error ${res.status}`, datos.campos || {});
  return datos;
}

// Comprueba si la API responde (con un tiempo límite corto para no demorar la carga de la página).
export async function apiResponde() {
  try {
    const control = new AbortController();
    const t = setTimeout(() => control.abort(), 1500);
    const res = await fetch(API_URL + "/menu", { signal: control.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
