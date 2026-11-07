// Utilidades de la lógica de negocio de la API (sin dependencias del navegador).

// Genera el siguiente id consecutivo de una entidad.
export function siguienteId(db, entidad) {
  db.contadores[entidad] = (db.contadores[entidad] || 0) + 1;
  return db.contadores[entidad];
}

// Fecha local AAAA-MM-DD (toISOString usa UTC y en Colombia cambiaría de día a las 7 p. m.).
export function fechaLocal(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
