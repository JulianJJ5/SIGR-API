// Módulo de autenticación y usuarios (clientes, meseros, administrador).
import { siguienteId } from "../db/storage.js";

export const ROLES = ["cliente", "mesero", "administrador"];

// Qué secciones ve cada rol.
export const PERMISOS = {
  cliente: ["menu", "pedidos", "reservas"],
  mesero: ["menu", "pedidos", "reservas"],
  administrador: ["menu", "pedidos", "reservas", "caja", "usuarios"],
};

export function iniciarSesion(db, usuario, clave) {
  const u = db.usuarios.find((x) => x.usuario === usuario.trim() && x.clave === clave);
  if (!u) throw new Error("Usuario o contraseña incorrectos");
  if (!u.activo) throw new Error("El usuario está inactivo");
  const { clave: _omitida, ...publico } = u;
  return publico;
}

export function puedeVer(rol, seccion) {
  return (PERMISOS[rol] || []).includes(seccion);
}

export function crearUsuario(db, { nombre, usuario, clave, rol }) {
  if (!nombre || !usuario || !clave) throw new Error("Nombre, usuario y contraseña son obligatorios");
  if (!ROLES.includes(rol)) throw new Error("Rol no válido");
  if (db.usuarios.some((x) => x.usuario === usuario)) throw new Error("Ese nombre de usuario ya existe");
  const nuevo = { id: siguienteId(db, "usuario"), nombre, usuario, clave, rol, activo: true };
  db.usuarios.push(nuevo);
  return nuevo;
}

export function cambiarEstadoUsuario(db, id, activo) {
  const u = db.usuarios.find((x) => x.id === id);
  if (!u) throw new Error("Usuario no encontrado");
  if (u.rol === "administrador" && !activo && db.usuarios.filter((x) => x.rol === "administrador" && x.activo).length === 1) {
    throw new Error("No se puede desactivar al único administrador activo");
  }
  u.activo = activo;
  return u;
}
