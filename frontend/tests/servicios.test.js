// Pruebas básicas de integración de los módulos de la línea base.
// Se ejecutan con: npm test  (usa el corredor de pruebas nativo de Node, sin dependencias).
import { test } from "node:test";
import assert from "node:assert/strict";
import { datosIniciales } from "../src/db/seed.js";
import { fechaLocal } from "../src/db/storage.js";
import { iniciarSesion, crearUsuario, cambiarEstadoUsuario, puedeVer } from "../src/services/auth.js";
import { crearCategoria, crearPlato, editarPlato, eliminarCategoria, menuPorCategoria } from "../src/services/menu.js";
import { crearPedido, avanzarEstado, cancelarPedido } from "../src/services/pedidos.js";
import { crearReserva, mesasDisponibles } from "../src/services/reservas.js";
import { facturarPedido, reporteDiario, cerrarCaja } from "../src/services/caja.js";

const manana = () => fechaLocal(new Date(Date.now() + 86400000));
const hoy = () => fechaLocal();

test("autenticación: credenciales válidas, inválidas y permisos por rol", () => {
  const db = datosIniciales();
  const admin = iniciarSesion(db, "admin", "admin123");
  assert.equal(admin.rol, "administrador");
  assert.equal(admin.clave, undefined, "la sesión no expone la contraseña");
  assert.throws(() => iniciarSesion(db, "admin", "mala"), /incorrectos/);
  assert.ok(puedeVer("administrador", "caja"));
  assert.ok(!puedeVer("cliente", "caja"));
  const u = crearUsuario(db, { nombre: "Ana", usuario: "ana", clave: "x", rol: "mesero" });
  cambiarEstadoUsuario(db, u.id, false);
  assert.throws(() => iniciarSesion(db, "ana", "x"), /inactivo/);
  assert.throws(() => cambiarEstadoUsuario(db, 1, false), /único administrador/);
});

test("menú: CRUD de categorías y platos", () => {
  const db = datosIniciales();
  const c = crearCategoria(db, "Sopas");
  const p = crearPlato(db, { nombre: "Sancocho", precio: 25000, categoriaId: c.id });
  editarPlato(db, p.id, { ...p, precio: 27000, disponible: false });
  assert.equal(db.platos.find((x) => x.id === p.id).precio, 27000);
  assert.throws(() => crearPlato(db, { nombre: "X", precio: 0, categoriaId: c.id }), /precio/);
  assert.throws(() => eliminarCategoria(db, c.id), /tiene platos/);
  const visibles = menuPorCategoria(db, true).find((x) => x.id === c.id).platos;
  assert.equal(visibles.length, 0, "los platos no disponibles no aparecen al cliente");
});

test("flujo completo: pedido → estados → factura → reporte → cierre de caja", () => {
  const db = datosIniciales();
  const pedido = crearPedido(db, { items: [{ platoId: 3, cantidad: 2 }, { platoId: 6, cantidad: 2 }], mesaId: 2, usuarioId: 2 });
  assert.equal(pedido.total, 2 * 32000 + 2 * 9500);
  assert.throws(() => facturarPedido(db, pedido.id, "efectivo"), /entregados/);
  avanzarEstado(db, pedido.id); avanzarEstado(db, pedido.id); avanzarEstado(db, pedido.id);
  assert.equal(pedido.estado, "entregado");
  assert.equal(pedido.historial.length, 4);
  const f = facturarPedido(db, pedido.id, "efectivo");
  assert.equal(f.impuesto, Math.round(83000 * 0.08));
  assert.equal(f.total, 83000 + 6640);
  assert.throws(() => facturarPedido(db, pedido.id, "efectivo"), /ya está facturado/);
  const otro = crearPedido(db, { items: [{ platoId: 1, cantidad: 1 }], usuarioId: 3 });
  cancelarPedido(db, otro.id);
  const r = reporteDiario(db, hoy());
  assert.equal(r.total, 89640);
  assert.equal(r.porMetodo.efectivo, 89640);
  assert.equal(r.pedidosCancelados, 1);
  const cierre = cerrarCaja(db, hoy(), 1, 90000);
  assert.equal(cierre.diferencia, 360);
  assert.throws(() => cerrarCaja(db, hoy(), 1, 0), /ya fue cerrada/);
});

test("reservas: asigna la mesa más pequeña que sirve y evita cruces de horario", () => {
  const db = datosIniciales();
  const f = manana();
  const r1 = crearReserva(db, { nombreCliente: "Pérez", fecha: f, hora: "19:00", personas: 4 });
  assert.equal(db.mesas.find((m) => m.id === r1.mesaId).capacidad, 4);
  const r2 = crearReserva(db, { nombreCliente: "Díaz", fecha: f, hora: "20:00", personas: 4 });
  assert.notEqual(r1.mesaId, r2.mesaId, "a las 20:00 la primera mesa sigue ocupada");
  assert.equal(mesasDisponibles(db, f, "19:30", 8).length, 1);
  assert.throws(() => crearReserva(db, { nombreCliente: "X", fecha: f, hora: "09:00", personas: 2 }), /Horario/);
  assert.throws(() => crearReserva(db, { nombreCliente: "X", fecha: f, hora: "19:00", personas: 20 }), /No hay mesas/);
});
