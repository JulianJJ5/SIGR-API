// Validaciones de la API. Cada función devuelve un objeto { campo: "mensaje" };
// si está vacío, los datos son válidos. Repiten las reglas de negocio del SIGR.
import { fechaLocal } from "./negocio/util.js";
import { HORARIO } from "./negocio/reservas.js";
import { ESTADOS } from "./negocio/pedidos.js";

const aMinutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};
const esTexto = (v) => typeof v === "string" && v.trim().length > 0;
const esEnteroPositivo = (v) => Number.isInteger(v) && v > 0;

export function validarPlato(datos, db) {
  const campos = {};
  if (!esTexto(datos.nombre)) campos.nombre = "El nombre es obligatorio";
  else if (datos.nombre.trim().length > 80) campos.nombre = "El nombre no puede pasar de 80 caracteres";
  if (typeof datos.precio !== "number" || !Number.isFinite(datos.precio)) campos.precio = "El precio debe ser un número";
  else if (datos.precio <= 0) campos.precio = "El precio debe ser mayor que 0";
  if (datos.categoriaId === undefined || datos.categoriaId === null || datos.categoriaId === "") campos.categoriaId = "La categoría es obligatoria";
  else if (!db.categorias.some((c) => c.id === Number(datos.categoriaId))) campos.categoriaId = "La categoría no existe";
  if (datos.descripcion !== undefined && typeof datos.descripcion !== "string") campos.descripcion = "La descripción debe ser texto";
  if (datos.disponible !== undefined && typeof datos.disponible !== "boolean") campos.disponible = "Disponible debe ser true o false";
  if (datos.imagen !== undefined && typeof datos.imagen !== "string") campos.imagen = "La imagen debe ser una ruta o URL";
  return campos;
}

export function validarCategoria(datos) {
  const campos = {};
  if (!esTexto(datos.nombre)) campos.nombre = "El nombre de la categoría es obligatorio";
  return campos;
}

export function validarReserva(datos) {
  const campos = {};
  if (!esTexto(datos.nombreCliente)) campos.nombreCliente = "El nombre es obligatorio";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha || "") || Number.isNaN(Date.parse(datos.fecha))) {
    campos.fecha = "La fecha debe tener el formato AAAA-MM-DD";
  } else if (datos.fecha < fechaLocal()) {
    campos.fecha = "No se puede reservar en una fecha pasada";
  }
  if (!/^\d{2}:\d{2}$/.test(datos.hora || "")) {
    campos.hora = "La hora debe tener el formato HH:MM";
  } else if (aMinutos(datos.hora) < aMinutos(HORARIO.apertura) || aMinutos(datos.hora) > aMinutos(HORARIO.cierre) - 60) {
    campos.hora = `El horario de reservas es de ${HORARIO.apertura} a ${HORARIO.cierre}; la última reserva es a las 21:00`;
  }
  if (!esEnteroPositivo(datos.personas)) campos.personas = "El número de personas debe ser un entero mayor que 0";
  if (datos.telefono !== undefined && typeof datos.telefono !== "string") campos.telefono = "El teléfono debe ser texto";
  return campos;
}

export function validarPedido(datos, db) {
  const campos = {};
  if (!Array.isArray(datos.items) || datos.items.length === 0) {
    campos.items = "El pedido debe tener al menos un plato";
  } else {
    for (const [i, it] of datos.items.entries()) {
      if (!esEnteroPositivo(it?.cantidad)) { campos[`items[${i}].cantidad`] = "La cantidad debe ser un entero mayor que 0"; }
      if (!db.platos.some((p) => p.id === it?.platoId)) { campos[`items[${i}].platoId`] = "El plato no existe"; }
    }
  }
  if (datos.mesaId !== undefined && datos.mesaId !== null && !db.mesas.some((m) => m.id === datos.mesaId)) {
    campos.mesaId = "La mesa no existe";
  }
  return campos;
}

export const ESTADOS_PEDIDO = [...ESTADOS, "cancelado"];
export const ESTADOS_RESERVA = ["pendiente", "confirmada", "cancelada"];
