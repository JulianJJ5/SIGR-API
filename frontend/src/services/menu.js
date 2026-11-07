// Módulo de menú digital: CRUD de categorías y platos.
import { siguienteId } from "../db/storage.js";

export function crearCategoria(db, nombre) {
  nombre = (nombre || "").trim();
  if (!nombre) throw new Error("El nombre de la categoría es obligatorio");
  if (db.categorias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) throw new Error("La categoría ya existe");
  const c = { id: siguienteId(db, "categoria"), nombre };
  db.categorias.push(c);
  return c;
}

export function editarCategoria(db, id, nombre) {
  const c = db.categorias.find((x) => x.id === id);
  if (!c) throw new Error("Categoría no encontrada");
  if (!nombre?.trim()) throw new Error("El nombre de la categoría es obligatorio");
  c.nombre = nombre.trim();
  return c;
}

export function eliminarCategoria(db, id) {
  if (db.platos.some((p) => p.categoriaId === id)) throw new Error("La categoría tiene platos; muévalos o elimínelos primero");
  db.categorias = db.categorias.filter((c) => c.id !== id);
}

function validarPlato({ nombre, precio, categoriaId }, db) {
  if (!nombre?.trim()) throw new Error("El nombre del plato es obligatorio");
  if (!(Number(precio) > 0)) throw new Error("El precio debe ser mayor que cero");
  if (!db.categorias.some((c) => c.id === Number(categoriaId))) throw new Error("Categoría no válida");
}

export function crearPlato(db, datos) {
  validarPlato(datos, db);
  const p = {
    id: siguienteId(db, "plato"),
    nombre: datos.nombre.trim(),
    descripcion: (datos.descripcion || "").trim(),
    precio: Number(datos.precio),
    categoriaId: Number(datos.categoriaId),
    disponible: datos.disponible !== false,
    imagen: (datos.imagen || "").trim(),
  };
  db.platos.push(p);
  return p;
}

export function editarPlato(db, id, datos) {
  const p = db.platos.find((x) => x.id === id);
  if (!p) throw new Error("Plato no encontrado");
  validarPlato(datos, db);
  Object.assign(p, {
    nombre: datos.nombre.trim(),
    descripcion: (datos.descripcion || "").trim(),
    precio: Number(datos.precio),
    categoriaId: Number(datos.categoriaId),
    disponible: datos.disponible !== false,
    imagen: (datos.imagen || "").trim(),
  });
  return p;
}

export function eliminarPlato(db, id) {
  db.platos = db.platos.filter((p) => p.id !== id);
}

export function menuPorCategoria(db, soloDisponibles = false) {
  return db.categorias.map((c) => ({
    ...c,
    platos: db.platos.filter((p) => p.categoriaId === c.id && (!soloDisponibles || p.disponible)),
  }));
}
