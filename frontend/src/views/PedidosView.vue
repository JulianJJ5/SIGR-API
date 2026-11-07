<script setup>
import { ref, computed } from "vue";
import { db, sesion, mutar } from "../store.js";
import { ESTADOS, avanzarEstado, cancelarPedido, pedidosVisibles } from "../services/pedidos.js";
import { facturarPedido, METODOS_PAGO, pesos } from "../services/caja.js";

const filtro = ref("activos");
const metodo = ref({});
const facturaVista = ref(null);
const personal = computed(() => sesion.value.rol !== "cliente");

const lista = computed(() => {
  const todos = pedidosVisibles(db, sesion.value);
  if (filtro.value === "activos") return todos.filter((p) => !["entregado", "cancelado"].includes(p.estado) || (p.estado === "entregado" && !p.facturaId));
  return todos;
});

const mesa = (id) => (id ? `Mesa ${db.mesas.find((m) => m.id === id)?.numero}` : "Para llevar / en línea");
const hora = (iso) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const siguiente = (estado) => ESTADOS[ESTADOS.indexOf(estado) + 1];

function facturar(p) {
  const f = mutar((d) => facturarPedido(d, p.id, metodo.value[p.id] || "efectivo"), "Factura generada");
  if (f) facturaVista.value = f;
}
const imprimir = () => window.print();
const verFactura = (p) => (facturaVista.value = db.facturas.find((f) => f.id === p.facturaId));
</script>

<template>
  <div class="fila entre">
    <h2>Pedidos</h2>
    <div class="fila">
      <button :class="{ secundario: filtro !== 'activos' }" @click="filtro = 'activos'">Activos</button>
      <button :class="{ secundario: filtro !== 'todos' }" @click="filtro = 'todos'">Todos</button>
    </div>
  </div>
  <p class="nota">La lista se actualiza sola si otro usuario cambia un pedido en otra pestaña.</p>
  <p v-if="!lista.length" class="tarjeta nota">No hay pedidos para mostrar.</p>

  <div class="rejilla-pedidos">
    <article v-for="p in lista" :key="p.id" class="tarjeta pedido">
      <div class="fila entre">
        <strong>Pedido #{{ p.id }}</strong>
        <span class="estado" :class="p.estado.replace(' ', '-')">{{ p.estado }}</span>
      </div>
      <div class="nota">{{ mesa(p.mesaId) }} · {{ hora(p.creado) }}</div>
      <ul>
        <li v-for="l in p.lineas" :key="l.platoId">{{ l.cantidad }} × {{ l.nombre }}</li>
      </ul>
      <div v-if="p.observaciones" class="nota">Obs.: {{ p.observaciones }}</div>
      <div class="fila entre total"><span>Total</span><span>{{ pesos(p.total) }}</span></div>

      <ol class="linea-tiempo">
        <li v-for="h in p.historial" :key="h.estado">{{ h.estado }} · {{ hora(h.fecha) }}</li>
      </ol>

      <div v-if="personal" class="fila">
        <button v-if="siguiente(p.estado)" @click="mutar((d) => avanzarEstado(d, p.id))">Pasar a «{{ siguiente(p.estado) }}»</button>
        <button v-if="!['entregado', 'cancelado'].includes(p.estado)" class="peligro" @click="mutar((d) => cancelarPedido(d, p.id), 'Pedido cancelado')">Cancelar</button>
        <template v-if="p.estado === 'entregado' && !p.facturaId">
          <select v-model="metodo[p.id]">
            <option v-for="m in METODOS_PAGO" :key="m" :value="m">{{ m }}</option>
          </select>
          <button @click="facturar(p)">Facturar</button>
        </template>
      </div>
      <button v-if="p.facturaId" class="secundario" @click="verFactura(p)">Ver factura</button>
    </article>
  </div>

  <div v-if="facturaVista" class="modal" @click.self="facturaVista = null">
    <div class="tarjeta factura">
      <h3>Factura de venta {{ facturaVista.numero }}</h3>
      <p class="nota">Restaurante SIGR · {{ new Date(facturaVista.fecha).toLocaleString("es-CO") }}</p>
      <table>
        <thead><tr><th>Cant.</th><th>Descripción</th><th>Valor</th></tr></thead>
        <tbody>
          <tr v-for="l in facturaVista.lineas" :key="l.platoId"><td>{{ l.cantidad }}</td><td>{{ l.nombre }}</td><td>{{ pesos(l.subtotal) }}</td></tr>
        </tbody>
      </table>
      <div class="fila entre"><span>Subtotal</span><span>{{ pesos(facturaVista.base) }}</span></div>
      <div class="fila entre"><span>Impuesto al consumo (8 %)</span><span>{{ pesos(facturaVista.impuesto) }}</span></div>
      <div class="fila entre total"><span>Total</span><span>{{ pesos(facturaVista.total) }}</span></div>
      <p class="nota">Pago: {{ facturaVista.metodoPago }}</p>
      <div class="fila"><button @click="imprimir">Imprimir</button><button class="secundario" @click="facturaVista = null">Cerrar</button></div>
    </div>
  </div>
</template>
