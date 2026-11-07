// Módulo de pedidos: registro y seguimiento por estados.
import { siguienteId, fechaLocal } from "./util.js";

// Flujo de estados de un pedido.
export const ESTADOS = ["recibido", "en preparación", "listo", "entregado"];

export function crearPedido(db, { items, mesaId = null, usuarioId, observaciones = "" }) {
  if (!items?.length) throw new Error("El pedido no tiene platos");
  const lineas = items.map(({ platoId, cantidad }) => {
    const plato = db.platos.find((p) => p.id === platoId);
    if (!plato) throw new Error("Plato no encontrado");
    if (!plato.disponible) throw new Error(`«${plato.nombre}» no está disponible`);
    if (!(cantidad > 0)) throw new Error("Cantidad no válida");
    return { platoId, nombre: plato.nombre, precio: plato.precio, cantidad, subtotal: plato.precio * cantidad };
  });
  const ahora = new Date().toISOString();
  const pedido = {
    id: siguienteId(db, "pedido"),
    mesaId,
    usuarioId,
    lineas,
    total: lineas.reduce((s, l) => s + l.subtotal, 0),
    observaciones,
    estado: ESTADOS[0],
    historial: [{ estado: ESTADOS[0], fecha: ahora }],
    facturaId: null,
    creado: ahora,
    dia: fechaLocal(),
  };
  db.pedidos.push(pedido);
  return pedido;
}

export function avanzarEstado(db, pedidoId) {
  const p = db.pedidos.find((x) => x.id === pedidoId);
  if (!p) throw new Error("Pedido no encontrado");
  if (p.estado === "cancelado") throw new Error("El pedido está cancelado");
  const i = ESTADOS.indexOf(p.estado);
  if (i === ESTADOS.length - 1) throw new Error("El pedido ya fue entregado");
  p.estado = ESTADOS[i + 1];
  p.historial.push({ estado: p.estado, fecha: new Date().toISOString() });
  return p;
}

export function cancelarPedido(db, pedidoId) {
  const p = db.pedidos.find((x) => x.id === pedidoId);
  if (!p) throw new Error("Pedido no encontrado");
  if (p.estado === "entregado" || p.facturaId) throw new Error("No se puede cancelar un pedido entregado o facturado");
  p.estado = "cancelado";
  p.historial.push({ estado: "cancelado", fecha: new Date().toISOString() });
  return p;
}

export function pedidosVisibles(db, usuario) {
  const lista = usuario.rol === "cliente" ? db.pedidos.filter((p) => p.usuarioId === usuario.id) : db.pedidos;
  return [...lista].sort((a, b) => b.id - a.id);
}
