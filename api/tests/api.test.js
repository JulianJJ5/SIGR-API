// Pruebas de integración de la API REST: levantan el servidor en un puerto libre y lo consultan con fetch.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { crearApp } from "../src/app.js";
import { fechaLocal } from "../src/negocio/util.js";

let servidor;
let base;
const manana = () => fechaLocal(new Date(Date.now() + 86400000));

async function llamar(metodo, ruta, cuerpo) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  servidor = crearApp().listen(0);
  await new Promise((r) => servidor.once("listening", r));
  base = `http://localhost:${servidor.address().port}/api`;
});
after(() => servidor.close());
beforeEach(() => llamar("POST", "/reset"));

test("GET /api/menu devuelve 200 con categorías y platos", async () => {
  const r = await llamar("GET", "/menu");
  assert.equal(r.status, 200);
  assert.equal(r.body.categorias.length, 4);
  assert.equal(r.body.platos.length, 8);
});

test("POST /api/menu crea un plato (201) y valida precio y categoría (400)", async () => {
  const ok = await llamar("POST", "/menu", { nombre: "Sancocho", precio: 25000, categoriaId: 2 });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.id, 9);
  const malo = await llamar("POST", "/menu", { nombre: "", precio: 0, categoriaId: 99 });
  assert.equal(malo.status, 400);
  assert.deepEqual(Object.keys(malo.body.campos).sort(), ["categoriaId", "nombre", "precio"]);
  assert.equal(malo.body.campos.precio, "El precio debe ser mayor que 0");
});

test("POST /api/reservas: 201, mesa más pequeña libre, 400 por horario y 409 por mesa ocupada", async () => {
  const f = manana();
  const r1 = await llamar("POST", "/reservas", { nombreCliente: "Pérez", fecha: f, hora: "19:00", personas: 8 });
  assert.equal(r1.status, 201);
  assert.equal(r1.body.mesaId, 5);
  const fuera = await llamar("POST", "/reservas", { nombreCliente: "X", fecha: f, hora: "23:00", personas: 2 });
  assert.equal(fuera.status, 400);
  assert.ok(fuera.body.campos.hora);
  const ocupada = await llamar("POST", "/reservas", { nombreCliente: "Díaz", fecha: f, hora: "20:00", personas: 8 });
  assert.equal(ocupada.status, 409);
  assert.match(ocupada.body.error, /No hay mesas/);
});

test("Pedidos: crear (201), avanzar estado (200), transición inválida (409) y pedido inexistente (404)", async () => {
  const p = await llamar("POST", "/pedidos", { items: [{ platoId: 3, cantidad: 2 }], mesaId: 2 });
  assert.equal(p.status, 201);
  assert.equal(p.body.total, 64000);
  const sig = await llamar("PATCH", `/pedidos/${p.body.id}`, { estado: "en preparación" });
  assert.equal(sig.status, 200);
  assert.equal(sig.body.estado, "en preparación");
  const salto = await llamar("PATCH", `/pedidos/${p.body.id}`, { estado: "entregado" });
  assert.equal(salto.status, 409);
  const nada = await llamar("PATCH", "/pedidos/999", { estado: "listo" });
  assert.equal(nada.status, 404);
});

test("Errores comunes: JSON malformado (400), ruta inexistente (404) y reset deja todo en cero", async () => {
  const malformado = await llamar("POST", "/menu", "{nombre:");
  assert.equal(malformado.status, 400);
  assert.equal(malformado.body.error, "El cuerpo no es un JSON válido");
  const ruta = await llamar("GET", "/no-existe");
  assert.equal(ruta.status, 404);
  await llamar("POST", "/pedidos", { items: [{ platoId: 1, cantidad: 1 }] });
  const reset = await llamar("POST", "/reset");
  assert.equal(reset.status, 200);
  assert.equal((await llamar("GET", "/pedidos")).body.length, 0);
});
