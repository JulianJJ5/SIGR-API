<script setup>
import { ref } from "vue";
import { db, entrar, mostrar } from "../store.js";
import { iniciarSesion } from "../services/auth.js";

const usuario = ref("");
const clave = ref("");

function ingresar() {
  try {
    entrar(iniciarSesion(db, usuario.value, clave.value));
  } catch (e) {
    mostrar(e.message, "error");
  }
}
function demo(u, c) { usuario.value = u; clave.value = c; ingresar(); }
</script>

<template>
  <div class="fondo-login">
  <section class="tarjeta login">
    <h2>Iniciar sesión</h2>
    <form @submit.prevent="ingresar">
      <label>Usuario <input v-model="usuario" autocomplete="username" required /></label>
      <label>Contraseña <input v-model="clave" type="password" autocomplete="current-password" required /></label>
      <button type="submit">Entrar</button>
    </form>
    <p class="nota">Usuarios de demostración:</p>
    <div class="fila">
      <button class="secundario" @click="demo('admin', 'admin123')">Administrador</button>
      <button class="secundario" @click="demo('mesero', 'mesero123')">Mesero</button>
      <button class="secundario" @click="demo('cliente', 'cliente123')">Cliente</button>
    </div>
  </section>
  </div>
</template>
