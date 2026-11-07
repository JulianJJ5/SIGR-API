<script setup>
import { reactive } from "vue";
import { db, sesion, mutar, restaurarDatosDemo } from "../store.js";
import { crearUsuario, cambiarEstadoUsuario, ROLES } from "../services/auth.js";

const form = reactive({ nombre: "", usuario: "", clave: "", rol: "mesero" });
function crear() {
  if (mutar((d) => crearUsuario(d, form), "Usuario creado")) Object.assign(form, { nombre: "", usuario: "", clave: "", rol: "mesero" });
}
function restaurar() {
  if (confirm("Se borrarán pedidos, reservas, facturas y cierres, y se cargarán los datos iniciales. ¿Continuar?")) restaurarDatosDemo();
}
</script>

<template>
  <div class="dos-columnas">
    <section class="tarjeta">
      <h3>Nuevo usuario</h3>
      <form class="rejilla" @submit.prevent="crear">
        <label>Nombre <input v-model="form.nombre" required /></label>
        <label>Usuario <input v-model="form.usuario" required /></label>
        <label>Contraseña <input v-model="form.clave" type="password" required /></label>
        <label>Rol
          <select v-model="form.rol"><option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option></select>
        </label>
        <button type="submit">Crear usuario</button>
      </form>
      <h3>Datos de demostración</h3>
      <button class="peligro" @click="restaurar">Restaurar datos iniciales</button>
    </section>

    <section class="tarjeta">
      <h3>Usuarios</h3>
      <table>
        <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr v-for="u in db.usuarios" :key="u.id">
            <td>{{ u.nombre }}</td><td>{{ u.usuario }}</td><td>{{ u.rol }}</td>
            <td>{{ u.activo ? "activo" : "inactivo" }}</td>
            <td>
              <button v-if="u.id !== sesion.id" class="mini" :class="u.activo ? 'peligro' : ''"
                @click="mutar((d) => cambiarEstadoUsuario(d, u.id, !u.activo), 'Usuario actualizado')">
                {{ u.activo ? "Desactivar" : "Activar" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
