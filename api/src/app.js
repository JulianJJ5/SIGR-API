// API REST del SIGR (v1.2.0). Datos en memoria: se pierden al reiniciar el servidor.
// La lógica de negocio está en src/negocio (copia de las reglas del front), así la página y la API validan igual.
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { datosIniciales } from "./negocio/seed.js";
import * as menu from "./negocio/menu.js";
import { crearReserva, mesasDisponibles } from "./negocio/reservas.js";
import { crearPedido, avanzarEstado, cancelarPedido, ESTADOS } from "./negocio/pedidos.js";
import {
  validarPlato, validarCategoria, validarReserva, validarPedido, ESTADOS_PEDIDO, ESTADOS_RESERVA,
} from "./validacion.js";

// ---------- Respuestas de error con el formato { error, campos } ----------
class ErrorApi extends Error {
  constructor(status, mensaje, campos) {
    super(mensaje);
    this.status = status;
    this.campos = campos;
  }
}
const noValido = (campos) => new ErrorApi(400, "Los datos no son válidos", campos);
const noExiste = (que) => new ErrorApi(404, `${que} no existe`);
const conflicto = (mensaje, campos) => new ErrorApi(409, mensaje, campos);
const exigir = (campos) => { if (Object.keys(campos).length) throw noValido(campos); };
const idDe = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw noValido({ id: "El id debe ser un entero positivo" });
  return id;
};

export function crearApp() {
  let db = datosIniciales();
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ---------- Menú (platos y categorías) ----------
  app.get("/api/menu", (req, res) => {
    res.json({ categorias: db.categorias, platos: db.platos });
  });

  app.post("/api/menu", (req, res) => {
    exigir(validarPlato(req.body, db));
    res.status(201).json(menu.crearPlato(db, req.body));
  });

  app.put("/api/menu/:id", (req, res) => {
    const id = idDe(req);
    if (!db.platos.some((p) => p.id === id)) throw noExiste("El plato");
    exigir(validarPlato(req.body, db));
    res.json(menu.editarPlato(db, id, req.body));
  });

  app.delete("/api/menu/:id", (req, res) => {
    const id = idDe(req);
    const plato = db.platos.find((p) => p.id === id);
    if (!plato) throw noExiste("El plato");
    menu.eliminarPlato(db, id);
    res.json(plato);
  });

  app.post("/api/categorias", (req, res) => {
    exigir(validarCategoria(req.body));
    if (db.categorias.some((c) => c.nombre.toLowerCase() === req.body.nombre.trim().toLowerCase())) {
      throw conflicto("Ya existe una categoría con ese nombre", { nombre: "Nombre repetido" });
    }
    res.status(201).json(menu.crearCategoria(db, req.body.nombre));
  });

  app.put("/api/categorias/:id", (req, res) => {
    const id = idDe(req);
    if (!db.categorias.some((c) => c.id === id)) throw noExiste("La categoría");
    exigir(validarCategoria(req.body));
    res.json(menu.editarCategoria(db, id, req.body.nombre));
  });

  app.delete("/api/categorias/:id", (req, res) => {
    const id = idDe(req);
    const cat = db.categorias.find((c) => c.id === id);
    if (!cat) throw noExiste("La categoría");
    if (db.platos.some((p) => p.categoriaId === id)) throw conflicto("La categoría tiene platos; muévalos o elimínelos primero");
    menu.eliminarCategoria(db, id);
    res.json(cat);
  });

  // ---------- Reservas ----------
  app.get("/api/reservas", (req, res) => {
    const { fecha } = req.query;
    res.json(fecha ? db.reservas.filter((r) => r.fecha === fecha) : db.reservas);
  });

  app.post("/api/reservas", (req, res) => {
    exigir(validarReserva(req.body));
    if (!mesasDisponibles(db, req.body.fecha, req.body.hora, req.body.personas).length) {
      throw conflicto("No hay mesas disponibles para esa fecha, hora y número de personas", {
        hora: "Todas las mesas con esa capacidad están ocupadas en esa franja",
      });
    }
    res.status(201).json(crearReserva(db, req.body));
  });

  app.patch("/api/reservas/:id", (req, res) => {
    const id = idDe(req);
    const r = db.reservas.find((x) => x.id === id);
    if (!r) throw noExiste("La reserva");
    if (!ESTADOS_RESERVA.includes(req.body.estado)) exigir({ estado: `Debe ser uno de: ${ESTADOS_RESERVA.join(", ")}` });
    if (r.estado === "cancelada" && req.body.estado !== "cancelada") throw conflicto("La reserva está cancelada");
    r.estado = req.body.estado;
    res.json(r);
  });

  // ---------- Pedidos ----------
  app.get("/api/pedidos", (req, res) => {
    const { estado } = req.query;
    res.json(estado ? db.pedidos.filter((p) => p.estado === estado) : db.pedidos);
  });

  app.get("/api/pedidos/:id", (req, res) => {
    const p = db.pedidos.find((x) => x.id === idDe(req));
    if (!p) throw noExiste("El pedido");
    res.json(p);
  });

  app.post("/api/pedidos", (req, res) => {
    exigir(validarPedido(req.body, db));
    const agotado = req.body.items.map((it) => db.platos.find((p) => p.id === it.platoId)).find((p) => !p.disponible);
    if (agotado) throw conflicto(`«${agotado.nombre}» no está disponible`, { items: "Hay platos no disponibles" });
    res.status(201).json(crearPedido(db, {
      items: req.body.items,
      mesaId: req.body.mesaId ?? null,
      usuarioId: req.body.usuarioId ?? null,
      observaciones: req.body.observaciones ?? "",
    }));
  });

  // Cambia el estado: solo se permite el estado siguiente del flujo o «cancelado».
  app.patch("/api/pedidos/:id", (req, res) => {
    const id = idDe(req);
    const p = db.pedidos.find((x) => x.id === id);
    if (!p) throw noExiste("El pedido");
    const { estado } = req.body;
    if (!ESTADOS_PEDIDO.includes(estado)) exigir({ estado: `Debe ser uno de: ${ESTADOS_PEDIDO.join(", ")}` });
    if (estado === "cancelado") {
      if (p.estado === "entregado" || p.estado === "cancelado") throw conflicto(`No se puede cancelar un pedido ${p.estado}`);
      return res.json(cancelarPedido(db, id));
    }
    const siguiente = ESTADOS[ESTADOS.indexOf(p.estado) + 1];
    if (estado !== siguiente) {
      throw conflicto(`El pedido está «${p.estado}»; el siguiente estado permitido es «${siguiente ?? "ninguno"}»`, { estado: "Transición no permitida" });
    }
    res.json(avanzarEstado(db, id));
  });

  // ---------- Solo para pruebas ----------
  app.post("/api/reset", (req, res) => {
    db = datosIniciales();
    res.json({ mensaje: "Datos reiniciados", platos: db.platos.length, reservas: 0, pedidos: 0 });
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe`, campos: {} });
  });

  // La API también sirve el front compilado (cd frontend && npm run build) en http://localhost:3200.
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "frontend", "dist");
  if (fs.existsSync(dist)) app.use(express.static(dist));

  // Manejo central de errores: JSON malformado, errores de la API y errores inesperados.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "El cuerpo no es un JSON válido", campos: {} });
    }
    if (err instanceof ErrorApi) {
      return res.status(err.status).json({ error: err.message, campos: err.campos ?? {} });
    }
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor", campos: {} });
  });

  return app;
}
