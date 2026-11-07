<script setup>
import { reactive, computed, ref, onMounted } from "vue";
import { db, sesion, mutar, apiDisponible, enviar, ponerEn } from "../store.js";
import { api } from "../api.js";
import { fechaLocal } from "../db/storage.js";
import { crearReserva, cambiarEstadoReserva, mesasDisponibles, HORARIO } from "../services/reservas.js";

const hoy = fechaLocal();
const form = reactive({ nombreCliente: sesion.value.rol === "cliente" ? sesion.value.nombre : "", telefono: "", fecha: hoy, hora: "19:00", personas: 2 });
const errores = ref({});
const personal = computed(() => sesion.value.rol !== "cliente");

const libres = computed(() => (form.fecha && form.hora && form.personas > 0 ? mesasDisponibles(db, form.fecha, form.hora, Number(form.personas)) : []));
const lista = computed(() =>
  db.reservas
    .filter((r) => personal.value || r.usuarioId === sesion.value.id)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
);
const mesa = (id) => db.mesas.find((m) => m.id === id)?.numero;

// Con la API activa, la lista se trae del servidor al abrir la vista.
onMounted(async () => {
  if (apiDisponible.value) await enviar(() => api("GET", "/reservas"), (d, rs) => { d.reservas = rs; });
});

async function reservar() {
  const datos = { ...form, personas: Number(form.personas), usuarioId: sesion.value.id };
  if (!apiDisponible.value) {
    const r = mutar((d) => crearReserva(d, datos), "Reserva registrada (modo local)");
    if (r && personal.value) Object.assign(form, { nombreCliente: "", telefono: "" });
    return;
  }
  const r = await enviar(() => api("POST", "/reservas", datos), (d, res) => ponerEn(d.reservas, res), "Reserva registrada");
  errores.value = r.campos;
  if (r.ok && personal.value) Object.assign(form, { nombreCliente: "", telefono: "" });
}

async function cambiarEstado(r, estado, mensaje) {
  if (!apiDisponible.value) return mutar((d) => cambiarEstadoReserva(d, r.id, estado), `${mensaje} (modo local)`);
  await enviar(() => api("PATCH", `/reservas/${r.id}`, { estado }), (d, res) => ponerEn(d.reservas, res), mensaje);
}
</script>

<template>
  <div class="dos-columnas">
    <section class="tarjeta">
      <h3>Nueva reserva</h3>
      <form class="rejilla" novalidate data-testid="form-reserva" @submit.prevent="reservar">
        <label>Nombre <input v-model="form.nombreCliente" name="nombreCliente" data-testid="reserva-nombre" required />
          <small v-if="errores.nombreCliente" class="error-campo" data-testid="error-nombreCliente">{{ errores.nombreCliente }}</small></label>
        <label>Teléfono <input v-model="form.telefono" name="telefono" data-testid="reserva-telefono" /></label>
        <label>Fecha <input v-model="form.fecha" name="fecha" type="date" :min="hoy" data-testid="reserva-fecha" required />
          <small v-if="errores.fecha" class="error-campo" data-testid="error-fecha">{{ errores.fecha }}</small></label>
        <label>Hora <input v-model="form.hora" name="hora" type="time" data-testid="reserva-hora" required />
          <small v-if="errores.hora" class="error-campo" data-testid="error-hora">{{ errores.hora }}</small></label>
        <label>Personas <input v-model.number="form.personas" name="personas" type="number" min="1" max="8" data-testid="reserva-personas" required />
          <small v-if="errores.personas" class="error-campo" data-testid="error-personas">{{ errores.personas }}</small></label>
        <button type="submit" data-testid="reserva-enviar">Reservar</button>
      </form>
      <p class="nota">Horario: {{ HORARIO.apertura }} a {{ HORARIO.cierre }}. Cada reserva ocupa la mesa 2 horas.
        Mesas libres para esa franja: <strong data-testid="mesas-libres">{{ libres.length ? libres.map((m) => m.numero).join(", ") : "ninguna" }}</strong></p>
    </section>

    <section class="tarjeta">
      <h3>{{ personal ? "Reservas" : "Mis reservas" }}</h3>
      <p v-if="!lista.length" class="nota">No hay reservas.</p>
      <table v-else data-testid="tabla-reservas">
        <thead><tr><th>Fecha</th><th>Hora</th><th>Nombre</th><th>Pers.</th><th>Mesa</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr v-for="r in lista" :key="r.id" :data-testid="`reserva-${r.id}`">
            <td>{{ r.fecha }}</td><td>{{ r.hora }}</td><td>{{ r.nombreCliente }}</td><td>{{ r.personas }}</td><td>{{ mesa(r.mesaId) }}</td>
            <td><span class="estado" :class="r.estado">{{ r.estado }}</span></td>
            <td class="fila">
              <button v-if="personal && r.estado === 'pendiente'" class="mini" @click="cambiarEstado(r, 'confirmada', 'Reserva confirmada')">Confirmar</button>
              <button v-if="r.estado !== 'cancelada'" class="mini peligro" @click="cambiarEstado(r, 'cancelada', 'Reserva cancelada')">Cancelar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
