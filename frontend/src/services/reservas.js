// Módulo de reservas por fecha y hora.
import { siguienteId, fechaLocal } from "../db/storage.js";

export const DURACION_RESERVA_MIN = 120; // una reserva ocupa la mesa 2 horas
export const HORARIO = { apertura: "12:00", cierre: "22:00" };

const aMinutos = (hora) => { const [h, m] = hora.split(":").map(Number); return h * 60 + m; };

function seCruzan(horaA, horaB) {
  return Math.abs(aMinutos(horaA) - aMinutos(horaB)) < DURACION_RESERVA_MIN;
}

export function mesasDisponibles(db, fecha, hora, personas) {
  const ocupadas = db.reservas
    .filter((r) => r.estado !== "cancelada" && r.fecha === fecha && seCruzan(r.hora, hora))
    .map((r) => r.mesaId);
  return db.mesas.filter((m) => m.capacidad >= personas && !ocupadas.includes(m.id));
}

export function crearReserva(db, { nombreCliente, telefono = "", fecha, hora, personas, usuarioId = null }) {
  if (!nombreCliente?.trim()) throw new Error("El nombre es obligatorio");
  if (!fecha || !hora) throw new Error("Fecha y hora son obligatorias");
  personas = Number(personas);
  if (!(personas > 0)) throw new Error("Número de personas no válido");
  if (aMinutos(hora) < aMinutos(HORARIO.apertura) || aMinutos(hora) > aMinutos(HORARIO.cierre) - 60) {
    throw new Error(`Horario de reservas: ${HORARIO.apertura} a ${HORARIO.cierre} (última reserva una hora antes del cierre)`);
  }
  const hoy = fechaLocal();
  if (fecha < hoy) throw new Error("No se puede reservar en una fecha pasada");
  const libres = mesasDisponibles(db, fecha, hora, personas).sort((a, b) => a.capacidad - b.capacidad);
  if (!libres.length) throw new Error("No hay mesas disponibles para esa fecha, hora y número de personas");
  const reserva = {
    id: siguienteId(db, "reserva"),
    nombreCliente: nombreCliente.trim(),
    telefono,
    fecha,
    hora,
    personas,
    mesaId: libres[0].id,
    usuarioId,
    estado: "pendiente",
  };
  db.reservas.push(reserva);
  return reserva;
}

export function cambiarEstadoReserva(db, id, estado) {
  if (!["pendiente", "confirmada", "cancelada"].includes(estado)) throw new Error("Estado no válido");
  const r = db.reservas.find((x) => x.id === id);
  if (!r) throw new Error("Reserva no encontrada");
  r.estado = estado;
  return r;
}
